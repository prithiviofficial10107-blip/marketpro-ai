from backend.extensions import db
from datetime import datetime

class ActivityLog(db.Model):
    __tablename__ = 'activity_logs'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    action = db.Column(db.String(100), nullable=False)
    module = db.Column(db.String(50), nullable=False)
    target_id = db.Column(db.Integer)
    description = db.Column(db.Text)
    old_values = db.Column(db.JSON)
    new_values = db.Column(db.JSON)
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref='activities')

    def to_dict(self):
        return {
            'id': self.id,
            'user': self.user.username if self.user else 'System',
            'user_full_name': f"{self.user.first_name} {self.user.last_name}" if self.user and self.user.first_name else (self.user.username if self.user else 'System'),
            'action': self.action,
            'module': self.module,
            'description': self.description,
            'created_at': self.created_at.isoformat()
        }
