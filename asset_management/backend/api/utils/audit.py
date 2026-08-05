from flask import request
from flask_jwt_extended import get_jwt_identity
from backend.extensions import db
from backend.api.models.activity_log import ActivityLog

def log_audit(module, action, description, target_id=None, old_values=None, new_values=None):
    """
    Standardized utility for recording system audit logs.
    """
    try:
        user_id = None
        try:
            # Try to get user identity from JWT
            identity = get_jwt_identity()
            if identity:
                user_id = int(identity)
        except:
            pass # No active JWT session (e.g., during login failure or system tasks)

        log = ActivityLog(
            user_id=user_id,
            module=module,
            action=action,
            description=description,
            target_id=target_id,
            old_values=old_values,
            new_values=new_values,
            ip_address=request.remote_addr if request else '127.0.0.1',
            user_agent=request.user_agent.string if request else 'System'
        )
        db.session.add(log)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"FAILED TO LOG AUDIT: {str(e)}")
