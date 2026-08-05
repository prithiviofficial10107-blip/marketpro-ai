import os
from dotenv import load_dotenv
from backend.app import create_app
from backend.api.services.ai_agent import AISQLAgent
from backend.api.models.user import User
from backend.extensions import db

load_dotenv()

app = create_app()
with app.app_context():
    agent = AISQLAgent()
    user = User.query.first()
    if not user:
        print("No users found to test with.")
    else:
        questions = [
            "Hi, who are you?",
            "எத்தனை சொத்துக்கள் உள்ளன?", # How many assets are there?
            "Available assets list pannu",
            "What is the total cost of all assets?"
        ]

        for q in questions:
            print(f"\nUser: {q}")
            try:
                result = agent.process_request(user.id, q)
                print(f"AI Answer: {result['answer']}")
                if result['sql']:
                    print(f"Generated SQL: {result['sql']}")
                if result['data']:
                    print(f"Execution Data: {result['data']}")
            except Exception as e:
                print(f"Error: {str(e)}")
