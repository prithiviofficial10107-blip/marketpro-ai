import json
import re
from backend.ai.openrouter_client import OpenRouterClient
from backend.extensions import db
from sqlalchemy import text
from backend.api.models.ai_memory import ChatHistory

SCHEMA_CONTEXT = """
Database: supermarket_inventory
Tables:
1. employees (id, name, role, email) - Staff members.
2. assets (id, asset_tag, name, category_id, purchase_cost, status) - These are Supermarket Products.
   - 'purchase_cost' is the PRODUCT PRICE.
   - 'asset_tag' is the BARCODE.
3. asset_categories (id, name, description) - Supermarket Categories (Beverages, Grains, etc).
4. assignments (id, asset_id, employee_id, status) - Current stock assignments (not heavily used for supermarket).
5. damage_reports (id, asset_id, description) - Damaged items.

Relationships:
- assets.category_id -> asset_categories.id

Instructions for SQL Generation:
- Use SQLite syntax.
- When asked for price, use 'purchase_cost'.
- When asked for items/products, query the 'assets' table.
- Always use JOINs with 'asset_categories' to show category names.
"""

from backend.api.services.guardrail import SQLGuardrail

class AISQLAgent:
    def __init__(self):
        self.client = OpenRouterClient()

    def get_system_prompt(self):
        return (
            "You are a Supermarket AI Manager (GPT-5). "
            "You behave exactly like ChatGPT or Gemini but you have direct access to the supermarket's live inventory database. "
            "IMPORTANT: In this system, 'Assets' refers to 'Products' (like Rice, Milk, Soap). "
            "You must respond in the same language or dialect as the user: English, Tamil, or Tanglish. "
            f"Inventory Context:\n{SCHEMA_CONTEXT}\n"
            "RULES:\n"
            "1. Detection: If they ask in Tamil, answer in Tamil. If Tanglish, answer in Tanglish. "
            "2. Data: For counts, lists, or prices, generate SQL wrapped in [SQL]...[/SQL]. "
            "   Example: 'Rice price enna?' -> [SQL]SELECT purchase_cost FROM assets WHERE name='Rice'[/SQL]\n"
            "3. Explanations: After showing data, explain it naturally in their language. "
            "4. Character: Be professional, warm, and accurate."
        )

    def process_request(self, user_id, user_message):
        try:
            # Fetch history
            history_objs = ChatHistory.query.filter_by(user_id=user_id).order_by(ChatHistory.created_at.desc()).limit(10).all()
            messages = [{"role": "system", "content": self.get_system_prompt()}]

            for msg in reversed(history_objs):
                messages.append({"role": "user" if msg.sender == "user" else "assistant", "content": msg.message})

            messages.append({"role": "user", "content": user_message})

            # Call AI
            ai_response = self.client.get_completion(messages)

            # Check for SQL
            sql_match = re.search(r"\[SQL\](.*?)\[/SQL\]", ai_response, re.DOTALL | re.IGNORECASE)
            execution_results = None
            needs_confirmation = False
            generated_sql = None

            if sql_match:
                generated_sql = sql_match.group(1).strip()

                # Use Guardrail for Read-only standard chat
                is_valid, msg = SQLGuardrail.validate_query(generated_sql, allow_write=False)

                if not is_valid:
                    if any(cmd in generated_sql.upper() for cmd in ["UPDATE", "DELETE", "INSERT"]):
                        needs_confirmation = True
                    else:
                        execution_results = f"Query Blocked: {msg}"
                else:
                    # Execute Read-only SQL
                    try:
                        result = db.session.execute(text(generated_sql))
                        if result.returns_rows:
                            columns = result.keys()
                            execution_results = [dict(zip(columns, row)) for row in result.fetchall()]
                    except Exception as e:
                        db.session.rollback()
                        execution_results = f"Query Error: {str(e)}"

            # Save to history
            db.session.add(ChatHistory(user_id=user_id, message=user_message, sender='user'))
            db.session.add(ChatHistory(user_id=user_id, message=ai_response, sender='ai'))
            db.session.commit()

            return {
                "answer": ai_response,
                "sql": generated_sql,
                "data": execution_results,
                "needs_confirmation": needs_confirmation
            }
        except Exception as e:
            db.session.rollback()
            return {
                "answer": f"Database Error: {str(e)}",
                "sql": None,
                "data": None,
                "needs_confirmation": False
            }

    def execute_confirmed_sql(self, sql):
        is_valid, msg = SQLGuardrail.validate_query(sql, allow_write=True)
        if not is_valid:
            return {"error": f"Blocked: {msg}"}
        try:
            result = db.session.execute(text(sql))
            db.session.commit()
            return {"success": True, "message": "Done."}
        except Exception as e:
            db.session.rollback()
            return {"success": False, "error": str(e)}
