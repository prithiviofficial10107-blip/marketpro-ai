from backend.app import create_app
from backend.extensions import db
from backend.api.models.user import User

app = create_app()
with app.app_context():
    try:
        user_count = User.query.count()
        print(f"Connection successful. User count: {user_count}")
    except Exception as e:
        print(f"Connection failed: {str(e)}")
