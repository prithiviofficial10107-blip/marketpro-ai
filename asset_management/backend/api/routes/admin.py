from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from backend.api.models.activity_log import ActivityLog
from backend.api.auth.decorators import role_required
from backend.api.utils.responses import success_response

admin_bp = Blueprint('admin', __name__)
admin_bp.strict_slashes = False

@admin_bp.route('/activity-logs', methods=['GET'])
@jwt_required()
@role_required(['admin'])
def get_activity_logs():
    logs = ActivityLog.query.order_by(ActivityLog.created_at.desc()).limit(100).all()
    return success_response([log.to_dict() for log in logs])

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
@role_required(['admin'])
def get_all_users():
    from backend.api.models.user import User
    users = User.query.all()
    return success_response([u.to_dict() for u in users])

@admin_bp.route('/suppliers', methods=['GET'])
@jwt_required()
def get_suppliers():
    from backend.api.models.supplier import Supplier
    suppliers = Supplier.query.all()
    return success_response([s.to_dict() for s in suppliers])
