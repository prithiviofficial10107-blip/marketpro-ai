from functools import wraps
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from flask import jsonify, request
from backend.api.models.user import User
from backend.api.models.activity_log import ActivityLog
from backend.extensions import db

def role_required(allowed_roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = db.session.get(User, int(user_id))

            if not user or not user.role or user.role.name not in allowed_roles:
                return jsonify({'message': 'Access forbidden: Insufficient permissions'}), 403

            return f(*args, **kwargs)
        return decorated_function
    return decorator

def log_activity(module, action):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            response = f(*args, **kwargs)

            # Extract status code robustly
            status_code = 200
            if isinstance(response, tuple):
                status_code = response[1]
            elif hasattr(response, 'status_code'):
                status_code = response.status_code

            # Log only successful or created responses (200, 201)
            if status_code in [200, 201]:
                try:
                    user_id = get_jwt_identity()
                    log = ActivityLog(
                        user_id=int(user_id),
                        module=module,
                        action=action,
                        ip_address=request.remote_addr,
                        user_agent=request.user_agent.string
                    )
                    db.session.add(log)
                    db.session.commit()
                except Exception as e:
                    db.session.rollback()
                    print(f"Activity Log Error: {str(e)}")

            return response
        return decorated_function
    return decorator
