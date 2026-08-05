from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.extensions import db
from backend.api.models.asset import Asset
from backend.api.models.operations import Assignment
from backend.api.utils.responses import success_response, error_response
from backend.api.services.asset_service import update_asset_status

assignments_bp = Blueprint('assignments', __name__)
assignments_bp.strict_slashes = False

@assignments_bp.route('/assign', methods=['POST'])
@jwt_required()
def assign_asset():
    data = request.get_json()
    asset_id = data.get('asset_id')
    employee_id = data.get('employee_id')
    user_id = get_jwt_identity()

    asset = Asset.query.get(asset_id)
    if not asset or asset.status != 'available':
        return error_response("Asset not available for assignment")

    # Create Assignment
    new_assignment = Assignment(
        asset_id=asset_id,
        employee_id=employee_id,
        assigned_by=user_id,
        return_due_date=data.get('return_due_date'),
        notes=data.get('notes')
    )

    # Update Asset Status
    update_asset_status(asset_id, 'assigned', user_id, "Assigned to employee")

    db.session.add(new_assignment)
    db.session.commit()

    return success_response(new_assignment.to_dict(), "Asset assigned successfully")

@assignments_bp.route('/return/<int:asset_id>', methods=['POST'])
@jwt_required()
def return_asset(asset_id):
    user_id = get_jwt_identity()
    assignment = Assignment.query.filter_by(asset_id=asset_id, status='active').first()

    if not assignment:
        return error_response("No active assignment found for this asset")

    assignment.status = 'returned'
    assignment.actual_return_date = db.func.now()

    update_asset_status(asset_id, 'available', user_id, "Returned by employee")

    db.session.commit()
    return success_response(message="Asset returned successfully")
