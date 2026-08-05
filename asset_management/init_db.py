from backend.app import create_app
from backend.extensions import db
import os

# Import all models to ensure they are registered with SQLAlchemy
from backend.api import models

app = create_app()
with app.app_context():
    db.create_all()
    print("Database tables created successfully.")

    # Create a default admin user if none exists
    from backend.api.models.user import User, Role
    from werkzeug.security import generate_password_hash

    admin_role = Role.query.filter_by(name='admin').first()
    if not admin_role:
        admin_role = Role(name='admin')
        db.session.add(admin_role)
        db.session.commit()

    if not User.query.filter_by(username='admin').first():
        admin_user = User(
            username='admin',
            email='admin@example.com',
            password_hash=generate_password_hash('admin123'),
            role_id=admin_role.id,
            is_verified=True
        )
        db.session.add(admin_user)
        db.session.commit()
        print("Default admin user created: admin / admin123")
