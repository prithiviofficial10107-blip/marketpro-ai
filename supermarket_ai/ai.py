import json
import os
import re

from dotenv import load_dotenv
import openai

from database import _cursor, _fetch_all, get_connection

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_API_BASE = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1").strip()
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "google/gemma-3-12b-it:free").strip()

client = None
if OPENAI_API_KEY:
    client = openai.OpenAI(
        api_key=OPENAI_API_KEY,
        base_url=OPENAI_API_BASE.rstrip("/")
    )

TAMIL_UNICODE_RE = re.compile(r"[\u0B80-\u0BFF]")


def rule_based_answer(question):
    q = question.lower().strip()
    conn, backend = get_connection()
    try:
        cursor = _cursor(conn, backend)

        if "how many" in q and "product" in q:
            cursor.execute("SELECT COUNT(*) AS total FROM products")
            row = _fetch_all(cursor, backend)[0]
            return f"There are {row['total']} products."

        if "rice" in q and "stock" in q:
            cursor.execute(
                "SELECT COALESCE(st.quantity, 0) AS stock FROM stock st "
                "JOIN products p ON p.id = st.product_id "
                "WHERE LOWER(p.name) = 'rice'"
            )
            rows = _fetch_all(cursor, backend)
            return f"Rice stock is {rows[0]['stock']} units." if rows else "Data not available."

        if "milk" in q and "price" in q:
            cursor.execute("SELECT price FROM products WHERE LOWER(name) = 'milk'")
            rows = _fetch_all(cursor, backend)
            return f"Milk price is {rows[0]['price']}." if rows else "Data not available."

        if "price" in q and "milk" not in q and "rice" not in q:
            cursor.execute("SELECT name, price FROM products")
            rows = _fetch_all(cursor, backend)
            if not rows:
                return "Data not available."
            return ", ".join(f"{r['name']}: {r['price']}" for r in rows)

        if "stock" in q and "rice" not in q:
            cursor.execute(
                "SELECT p.name, COALESCE(st.quantity, 0) AS quantity FROM products p "
                "LEFT JOIN stock st ON st.product_id = p.id"
            )
            rows = _fetch_all(cursor, backend)
            if not rows:
                return "Data not available."
            return ", ".join(f"{r['name']}: {r['quantity']}" for r in rows)

        if "low stock" in q or "low stock products" in q or "low stock items" in q:
            cursor.execute(
                "SELECT p.name, st.quantity FROM products p "
                "JOIN stock st ON st.product_id = p.id "
                "WHERE st.quantity <= st.low_stock_threshold"
            )
            rows = _fetch_all(cursor, backend)
            if not rows:
                return "Data not available."
            return "Low stock products: " + ", ".join(f"{r['name']} ({r['quantity']})" for r in rows)

        if ("today" in q and "sale" in q) or "today's sales" in q or "sales today" in q:
            cursor.execute("SELECT COUNT(*) AS total FROM sales WHERE DATE(sale_date) = CURRENT_DATE")
            row = _fetch_all(cursor, backend)[0]
            return f"Today's sales count is {row['total']}."

        if "revenue" in q or "total revenue" in q or "sales total" in q:
            cursor.execute("SELECT COALESCE(SUM(total_amount), 0) AS total FROM sales")
            row = _fetch_all(cursor, backend)[0]
            return f"Total revenue is {row['total']}."

        if "beverage" in q or "beverages" in q or "drink" in q:
            cursor.execute(
                "SELECT p.name FROM products p "
                "JOIN categories c ON c.id = p.category_id "
                "WHERE LOWER(c.name) = 'beverages'"
            )
            rows = _fetch_all(cursor, backend)
            return ", ".join(r['name'] for r in rows) if rows else "Data not available."

        if "supplier" in q or "suppliers" in q or "show suppliers" in q:
            cursor.execute("SELECT name FROM suppliers")
            rows = _fetch_all(cursor, backend)
            return ", ".join(r['name'] for r in rows) if rows else "Data not available."

        if "customer" in q or "customers" in q or "show customers" in q:
            cursor.execute("SELECT name FROM customers")
            rows = _fetch_all(cursor, backend)
            return ", ".join(r['name'] for r in rows) if rows else "Data not available."

        if "bill" in q or "bills" in q or "show bills" in q:
            cursor.execute("SELECT id, total_amount, sale_date FROM sales ORDER BY sale_date DESC LIMIT 10")
            rows = _fetch_all(cursor, backend)
            return ", ".join(f"Bill #{r['id']} - {r['total_amount']} ({r['sale_date']})" for r in rows) if rows else "Data not available."

        if "top selling" in q or "top products" in q or "top sellers" in q:
            cursor.execute(
                "SELECT p.name, COALESCE(SUM(sd.quantity), 0) AS total_units FROM products p "
                "LEFT JOIN sales_details sd ON sd.product_id = p.id "
                "GROUP BY p.id, p.name ORDER BY total_units DESC LIMIT 5"
            )
            rows = _fetch_all(cursor, backend)
            return ", ".join(f"{r['name']} ({r['total_units']})" for r in rows) if rows else "Data not available."

        if "out of stock" in q or "out of stock items" in q or "no stock" in q:
            cursor.execute("SELECT p.name FROM products p JOIN stock st ON st.product_id = p.id WHERE st.quantity = 0")
            rows = _fetch_all(cursor, backend)
            return ", ".join(r['name'] for r in rows) if rows else "Data not available."

        if "recent sales" in q or "recent bills" in q or "latest sales" in q:
            cursor.execute("SELECT id, total_amount, sale_date FROM sales ORDER BY sale_date DESC LIMIT 5")
            rows = _fetch_all(cursor, backend)
            return ", ".join(f"Bill #{r['id']} - {r['total_amount']} ({r['sale_date']})" for r in rows) if rows else "Data not available."

        return None
    finally:
        conn.close()


def build_openai_prompt(question):
    return [
        {"role": "system", "content": (
            "You are a helpful conversational AI assistant for a supermarket management system. "
            "Answer clearly and naturally in the same language or style as the user: English, Tamil, or Tanglish. "
            "If the user asks about supermarket products, stock, sales, revenue, suppliers, or bills, provide helpful information. "
            "If the question is general or unrelated to the supermarket, reply naturally like ChatGPT. "
            "Be friendly, concise, and professional."
        )},
        {"role": "user", "content": question}
    ]


def call_openai(question):
    if not client:
        raise RuntimeError("AI Client not configured.")

    messages = build_openai_prompt(question)
    response = client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=messages,
        temperature=0.7,
        max_tokens=500,
    )

    if response.choices and len(response.choices) > 0:
        return response.choices[0].message.content.strip()

    return str(response)


def get_ai_answer(question):
    question = question.strip()
    if not question:
        return "Please ask a question."

    # Try rule-based first for specific data points
    local_answer = rule_based_answer(question)
    if local_answer is not None:
        return local_answer

    # Fallback to LLM for conversational or complex queries
    if client:
        try:
            return call_openai(question)
        except Exception as exc:
            return (
                "Sorry, I could not reach the AI service. "
                "Check your API key and connection in the .env file. "
                f"Error: {str(exc)}"
            )

    return (
        "I can answer many supermarket-related questions, but the AI is not configured. "
        "Please set OPENAI_API_KEY in the .env file to enable full chat capabilities."
    )
