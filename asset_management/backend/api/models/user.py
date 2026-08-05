from backend.api.models.base import BaseModel
from backend.extensions import db

class Role(BaseModel):
    __tablename__ = 'roles'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    permissions = db.Column(db.JSON)
    status = db.Column(db.Enum('active', 'inactive'), default='active')

class User(BaseModel):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'))
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'), nullable=False)
    status = db.Column(db.Enum('active', 'locked', 'inactive'), default='active')

    # Profile Fields
    first_name = db.Column(db.String(50))
    last_name = db.Column(db.String(50))
    avatar_url = db.Column(db.String(255))

    # Preferences
    email_notifications = db.Column(db.Boolean, default=True)
    push_notifications = db.Column(db.Boolean, default=True)
    language = db.Column(db.String(10), default='English')

    # Auth & Verification
    is_verified = db.Column(db.Boolean, default=False)
    two_factor_enabled = db.Column(db.Boolean, default=False)
    verification_token = db.Column(db.String(100), unique=True)
    reset_token = db.Column(db.String(100), unique=True)
    reset_token_expiry = db.Column(db.DateTime)

    # Analytics
    last_login_at = db.Column(db.DateTime)
    login_count = db.Column(db.Integer, default=0)

    role = db.relationship('Role', backref='users')
    employee = db.relationship('Employee', backref='user', uselist=False)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'first_name': self.first_name or '',
            'last_name': self.last_name or '',
            'avatar_url': self.avatar_url or '',
            'role': self.role.name if self.role else 'staff',
            'is_verified': self.is_verified,
            'email_notifications': self.email_notifications,
            'push_notifications': self.push_notifications,
            'two_factor_enabled': self.two_factor_enabled,
            'language': self.language,
            'last_login': self.last_login_at.isoformat() if self.last_login_at else None,
            'created_at': self.created_at.isoformat()
        }
