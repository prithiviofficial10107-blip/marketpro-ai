from backend.app import create_app
from backend.api.models.user import User
from werkzeug.security import check_password_hash

app = create_app()
with app.app_context():
    user = User.query.filter_by(username='admin').first()
    if user:
        print(f"User found: {user.username}")
        print(f"Status: {user.status}")
        print(f"Is Verified: {user.is_verified}")
        print(f"Password Match: {check_password_hash(user.password_hash, 'admin123')}")
    else:
        print("User admin not found")
