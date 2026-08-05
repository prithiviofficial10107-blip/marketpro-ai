from backend.api.models.base import BaseModel
from backend.extensions import db

class Customer(BaseModel):
    __tablename__ = 'customers'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), unique=True)
    email = db.Column(db.String(100))
    loyalty_points = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'phone': self.phone,
            'email': self.email,
            'loyalty_points': self.loyalty_points,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
