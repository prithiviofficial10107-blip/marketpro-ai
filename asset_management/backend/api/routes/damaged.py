from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.extensions import db
from backend.api.models.operations import WastageRecord, StockMovement
from backend.api.models.asset import Asset, AssetCategory
from backend.api.utils.responses import success_response, error_response
from sqlalchemy import func, and_
from datetime import datetime, timezone, timedelta

damaged_bp = Blueprint('damaged', __name__)
damaged_bp.strict_slashes = False

@damaged_bp.route('/', methods=['GET'])
@jwt_required()
def get_wastage_logs():
    records = WastageRecord.query.order_by(WastageRecord.created_at.desc()).all()
    return success_response([r.to_dict() for r in records])

@damaged_bp.route('/summary', methods=['GET'])
@jwt_required()
def get_wastage_summary():
    try:
        now = datetime.now(timezone.utc)
        first_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        # 1. Total Items Wasted (This Month)
        total_items = db.session.query(func.sum(WastageRecord.quantity_wasted)).filter(
            WastageRecord.created_at >= first_of_month
        ).scalar() or 0

        # 2. Total Cost Impact (This Month)
        total_cost = db.session.query(func.sum(WastageRecord.cost_impact)).filter(
            WastageRecord.created_at >= first_of_month
        ).scalar() or 0

        # 3. Items Expiring Soon (Next 7 days)
        expiry_threshold = (now + timedelta(days=7)).date()
        expiring_count = Asset.query.filter(
            and_(Asset.expiry_date != None, Asset.expiry_date <= expiry_threshold, Asset.expiry_date >= now.date(), Asset.stock_quantity > 0)
        ).count()

        # 4. Most Wasted Category
        most_wasted_cat = db.session.query(
            AssetCategory.name, func.sum(WastageRecord.cost_impact)
        ).join(Asset, WastageRecord.product_id == Asset.id).join(AssetCategory).group_by(AssetCategory.name).order_by(
            func.sum(WastageRecord.cost_impact).desc()
        ).first()

        # 5. Wastage by Category for Chart
        chart_data = db.session.query(
            AssetCategory.name, func.sum(WastageRecord.cost_impact)
        ).join(Asset, WastageRecord.product_id == Asset.id).join(AssetCategory).group_by(AssetCategory.name).all()

        return success_response({
            "total_items": int(total_items),
            "total_cost": float(total_cost),
            "expiring_soon": expiring_count,
            "most_wasted_category": most_wasted_cat[0] if most_wasted_cat else "N/A",
            "category_distribution": [{"name": c[0], "value": float(c[1])} for c in chart_data]
        })
    except Exception as e:
        return error_response(str(e))

@damaged_bp.route('/expiring-soon', methods=['GET'])
@jwt_required()
def get_expiring_soon():
    now_date = datetime.now(timezone.utc).date()
    threshold = now_date + timedelta(days=7)
    items = Asset.query.filter(
        and_(Asset.expiry_date != None, Asset.expiry_date <= threshold, Asset.stock_quantity > 0)
    ).order_by(Asset.expiry_date.asc()).all()
    return success_response([item.to_dict() for item in items])

@damaged_bp.route('/', methods=['POST'])
@jwt_required()
def log_wastage():
    try:
        data = request.get_json()
        product_id = data.get('product_id')
        qty = int(data.get('quantity_wasted', 0))
        reason = data.get('reason')
        user_id = get_jwt_identity()

        product = db.session.get(Asset, product_id)
        if not product:
            return error_response("Product not found")

        if product.stock_quantity < qty:
            return error_response(f"Only {product.stock_quantity} in stock. Cannot waste {qty}.")

        cost_impact = product.purchase_cost * qty

        # 1. Create Wastage Record
        new_record = WastageRecord(
            product_id=product_id,
            quantity_wasted=qty,
            reason=reason,
            cost_impact=cost_impact,
            reported_by=user_id,
            notes=data.get('notes')
        )
        db.session.add(new_record)

        # 2. Decrease Stock
        product.stock_quantity -= qty
        if product.stock_quantity == 0:
            product.status = 'retired'

        # 3. Log Stock Movement
        move = StockMovement(
            asset_id=product_id,
            type='WASTAGE',
            quantity=-qty,
            reference_id=f"WST-{datetime.now().strftime('%y%m%d%H%M')}",
            notes=f"Wastage: {reason}. {data.get('notes', '')}"
        )
        db.session.add(move)

        db.session.commit()

        # Log audit
        from backend.api.utils.audit import log_audit
        log_audit("Wastage", "Created", f"Logged wastage for {product.name}: {qty} units ({reason})", target_id=new_record.id)

        return success_response(new_record.to_dict(), "Wastage logged and stock adjusted.")
    except Exception as e:
        db.session.rollback()
        return error_response(str(e))

@damaged_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_wastage_record(id):
    try:
        record = db.session.get(WastageRecord, id)
        if not record:
            return error_response("Wastage record not found", 404)

        prod_name = record.product.name if record.product else "Unknown"
        db.session.delete(record)
        db.session.commit()

        # Log audit
        from backend.api.utils.audit import log_audit
        log_audit("Wastage", "Deleted", f"Deleted wastage log entry for {prod_name}", target_id=id)

        return success_response(message="Wastage record deleted successfully")
    except Exception as e:
        db.session.rollback()
        return error_response(str(e))
