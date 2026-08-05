from backend.app import create_app
from backend.extensions import db
from backend.api.models.user import User
from werkzeug.security import check_password_hash
import json

app = create_app()
with app.app_context():
    username = 'admin'
    password = 'admin123'

    user = User.query.filter_by(username=username).first()
    if not user:
        print("User not found")
    else:
        print(f"User found: {user.username}")
        if check_password_hash(user.password_hash, password):
            print("Password check passed")
            try:
                data = user.to_dict()
                print("to_dict result:", json.dumps(data, indent=2))
            except Exception as e:
                print(f"Error in to_dict: {str(e)}")
        else:
            print("Password check failed")
