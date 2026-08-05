from backend.extensions import db
from datetime import datetime

class AIMemory(db.Model):
    __tablename__ = 'ai_memory'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    context_summary = db.Column(db.Text)
    preference_data = db.Column(db.JSON)
    last_interaction_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ChatHistory(db.Model):
    __tablename__ = 'chat_history'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    sender = db.Column(db.Enum('user', 'ai'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
