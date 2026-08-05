from backend.extensions import db
from datetime import datetime

class Notification(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Categories of notifications
    type = db.Column(db.Enum(
        'low_stock', 'out_of_stock', 'expiring_soon',
        'po_shipped', 'po_received', 'wastage_threshold',
        'staff_added', 'staff_inactive', 'system'
    ), default='system')

    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)

    # Priority for UI coloring
    severity = db.Column(db.Enum('info', 'warning', 'critical'), default='info')

    # Link to the specific item for navigation
    related_entity_type = db.Column(db.String(50)) # 'product', 'purchase_order', 'staff'
    related_entity_id = db.Column(db.Integer)

    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'type': self.type,
            'title': self.title,
            'message': self.message,
            'severity': self.severity,
            'related_entity_type': self.related_entity_type,
            'related_entity_id': self.related_entity_id,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat()
        }
