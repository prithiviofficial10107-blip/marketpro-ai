from flask import Blueprint
from flask_jwt_extended import jwt_required
from backend.api.models.activity_log import ActivityLog
from backend.api.utils.responses import success_response

audit_bp = Blueprint('audit', __name__)
audit_bp.strict_slashes = False

@audit_bp.route('/', methods=['GET'])
@jwt_required()
def get_audit_trail():
    logs = ActivityLog.query.order_by(ActivityLog.created_at.desc()).limit(100).all()
    return success_response([l.to_dict() for l in logs])
