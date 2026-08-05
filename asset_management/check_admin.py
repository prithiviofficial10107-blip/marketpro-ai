from backend.app import create_app
from backend.extensions import db
from backend.api.models.user import User, Role

app = create_app()
with app.app_context():
    user = User.query.filter_by(username='admin').first()
    if user:
        print(f"User ID: {user.id}")
        print(f"Username: {user.username}")
        print(f"Role ID: {user.role_id}")
        if user.role:
            print(f"Role Name: {user.role.name}")
        else:
            print("Role relationship not loading!")
    else:
        print("Admin user not found!")

    roles = Role.query.all()
    print("Available Roles:")
    for r in roles:
        print(f"- {r.name} (ID: {r.id})")
