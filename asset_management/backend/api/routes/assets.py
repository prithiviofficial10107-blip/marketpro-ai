from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.api.services.asset_service import AssetService, update_asset_status
from backend.api.utils.responses import success_response, error_response
from backend.api.utils.schemas import asset_schema, assets_schema
from backend.api.auth.decorators import role_required, log_activity

assets_bp = Blueprint('assets', __name__)
assets_bp.strict_slashes = False

@assets_bp.route('/categories', methods=['GET'])
@jwt_required()
def get_categories():
    categories = AssetCategory.query.filter_by(status='active').all()
    return success_response([{"id": c.id, "name": c.name} for c in categories])

@assets_bp.route('/', methods=['GET'])
@jwt_required()
def get_assets():
    search = request.args.get('search', '')
    query = AssetService.model.query
    if search:
        query = query.filter(
            AssetService.model.name.ilike(f'%{search}%') |
            AssetService.model.serial_number.ilike(f'%{search}%')
        )
    assets = query.all()
    return success_response(assets_schema.dump(assets))

@assets_bp.route('/', methods=['POST'])
@jwt_required()
@role_required(['admin', 'manager'])
@log_activity('Assets', 'Create Asset')
def create_asset():
    data = request.get_json()
    errors = asset_schema.validate(data)
    if errors:
        return error_response("Validation Error", 400, errors)

    new_asset = AssetService.create(**data)

    # Log audit
    from backend.api.utils.audit import log_audit
    log_audit("Product Stock", "Created", f"New product registered: {new_asset.name}", target_id=new_asset.id)

    return success_response(asset_schema.dump(new_asset), "Asset created", 201)

@assets_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_asset(id):
    asset = AssetService.get_by_id(id)
    if not asset:
        return error_response("Asset not found", 404)
    return success_response(asset_schema.dump(asset))

@assets_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
@role_required(['admin', 'manager'])
@log_activity('Assets', 'Update Asset')
def update_asset(id):
    data = request.get_json()
    updated_asset = AssetService.update(id, **data)
    if not updated_asset:
        return error_response("Asset not found", 404)

    # Log audit
    from backend.api.utils.audit import log_audit
    log_audit("Product Stock", "Updated", f"Updated details for {updated_asset.name}", target_id=updated_asset.id)

    return success_response(asset_schema.dump(updated_asset), "Asset updated")

@assets_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
@role_required(['admin'])
@log_activity('Assets', 'Delete Asset')
def delete_asset(id):
    asset = AssetService.get_by_id(id)
    name = asset.name if asset else "Unknown"
    if AssetService.delete(id):
        # Log audit
        from backend.api.utils.audit import log_audit
        log_audit("Product Stock", "Deleted", f"Deleted product: {name}", target_id=id)
        return success_response(message="Asset deleted")
    return error_response("Asset not found", 404)

@assets_bp.route('/<int:id>/status', methods=['POST'])
@jwt_required()
@log_activity('Assets', 'Update Status')
def change_asset_status(id):
    data = request.get_json()
    new_status = data.get('status')
    notes = data.get('notes')
    user_id = get_jwt_identity()

    asset, error = update_asset_status(id, new_status, user_id, notes)
    if error:
        return error_response(error, 404)

    return success_response(asset_schema.dump(asset), "Status updated")

@assets_bp.route('/<int:id>/movement', methods=['POST'])
@jwt_required()
def stock_movement(id):
    try:
        data = request.get_json()
        move_type = data.get('type') # PURCHASE, ADJUSTMENT, WASTAGE
        qty = int(data.get('quantity', 0))
        notes = data.get('notes', '')

        asset = db.session.get(Asset, id)
        if not asset:
            return error_response("Asset not found", 404)

        if qty == 0:
            return error_response("Quantity cannot be zero")

        # Update stock
        asset.stock_quantity += qty
        if asset.stock_quantity < 0:
            return error_response("Stock cannot be negative")

        if asset.stock_quantity == 0:
            asset.status = 'retired'
        else:
            asset.status = 'available'

        move = StockMovement(
            asset_id=id,
            type=move_type,
            quantity=qty,
            reference_id="MANUAL",
            notes=notes
        )
        db.session.add(move)
        db.session.commit()

        # Log audit
        from backend.api.utils.audit import log_audit
        log_audit("Product Stock", "Restock" if qty > 0 else "Adjustment", f"Manual stock update for {asset.name} ({qty:+d} units)", target_id=asset.id)

        return success_response(asset.to_dict(), "Stock updated successfully")
    except Exception as e:
        db.session.rollback()
        return error_response(str(e))

@assets_bp.route('/<int:id>/history', methods=['GET'])
@jwt_required()
def get_asset_history(id):
    movements = StockMovement.query.filter_by(asset_id=id).order_by(StockMovement.created_at.desc()).all()
    return success_response([m.to_dict() for m in movements])
