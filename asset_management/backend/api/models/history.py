from backend.extensions import db
from datetime import datetime

class AssetStatusHistory(db.Model):
    __tablename__ = 'asset_status_history'

    id = db.Column(db.Integer, primary_key=True)
    asset_id = db.Column(db.Integer, db.ForeignKey('assets.id'), nullable=False)
    old_status = db.Column(db.String(20))
    new_status = db.Column(db.String(20))
    changed_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    change_date = db.Column(db.DateTime, default=datetime.utcnow)
    notes = db.Column(db.Text)

    def to_dict(self):
        return {
            'id': self.id,
            'asset_id': self.asset_id,
            'old_status': self.old_status,
            'new_status': self.new_status,
            'changed_by': self.changed_by,
            'change_date': self.change_date.isoformat(),
            'notes': self.notes
        }
