from backend.extensions import db
from datetime import datetime, timezone

class BaseModel(db.Model):
    __abstract__ = True

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    deleted_at = db.Column(db.DateTime, nullable=True)

    def soft_delete(self):
        self.deleted_at = datetime.now(timezone.utc)
        db.session.add(self)
        db.session.commit()
