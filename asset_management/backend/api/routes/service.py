from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.extensions import db
from backend.api.models.operations import PurchaseOrder, PurchaseOrderItem, StockMovement
from backend.api.models.asset import Asset
from backend.api.models.supplier import Supplier
from backend.api.utils.responses import success_response, error_response
from sqlalchemy import func, and_
from datetime import datetime, timezone, timedelta
from decimal import Decimal

service_bp = Blueprint('service', __name__)
service_bp.strict_slashes = False

@service_bp.route('/', methods=['GET'])
@jwt_required()
def get_purchase_orders():
    pos = PurchaseOrder.query.order_by(PurchaseOrder.order_date.desc()).all()
    return success_response([p.to_dict() for p in pos])

@service_bp.route('/summary', methods=['GET'])
@jwt_required()
def get_procurement_summary():
    try:
        now = datetime.now(timezone.utc)
        one_month_ago = now - timedelta(days=30)

        # 1. Pending Orders
        pending_count = PurchaseOrder.query.filter(PurchaseOrder.status.in_(['Pending', 'Ordered', 'Shipped'])).count()

        # 2. Monthly Spend (from Received orders)
        monthly_spend = db.session.query(func.sum(PurchaseOrder.total_cost)).filter(
            and_(PurchaseOrder.status == 'Received', PurchaseOrder.received_date >= one_month_ago)
        ).scalar() or 0

        # 3. Active Suppliers
        active_suppliers = db.session.query(func.count(func.distinct(PurchaseOrder.supplier_id))).filter(
            PurchaseOrder.order_date >= one_month_ago
        ).scalar() or 0

        # 4. Items Awaiting Delivery
        items_awaiting = db.session.query(func.sum(PurchaseOrderItem.quantity_ordered)).join(PurchaseOrder).filter(
            PurchaseOrder.status.in_(['Ordered', 'Shipped'])
        ).scalar() or 0

        # 5. Spend by Supplier for chart
        supplier_spend = db.session.query(
            Supplier.name, func.sum(PurchaseOrder.total_cost)
        ).join(PurchaseOrder).filter(
            and_(PurchaseOrder.status == 'Received', PurchaseOrder.received_date >= one_month_ago)
        ).group_by(Supplier.name).all()

        return success_response({
            "pending_orders": pending_count,
            "monthly_spend": float(monthly_spend),
            "active_suppliers": active_suppliers,
            "items_awaiting": int(items_awaiting),
            "supplier_distribution": [{"name": s[0], "value": float(s[1])} for s in supplier_spend]
        })
    except Exception as e:
        return error_response(str(e))

@service_bp.route('/suggested-reorders', methods=['GET'])
@jwt_required()
def get_suggested_reorders():
    # Items below reorder level
    low_stock = Asset.query.filter(
        and_(Asset.stock_quantity <= Asset.reorder_level, Asset.status != 'retired')
    ).all()

    suggestions = []
    for item in low_stock:
        suggestions.append({
            "id": item.id,
            "name": item.name,
            "stock_quantity": item.stock_quantity,
            "reorder_level": item.reorder_level,
            "suggested_qty": (item.reorder_level * 2) - item.stock_quantity,
            "supplier_id": item.supplier_id,
            "supplier_name": item.supplier.name if item.supplier else "N/A"
        })
    return success_response(suggestions)

@service_bp.route('/', methods=['POST'])
@jwt_required()
def create_purchase_order():
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        items = data.get('items', [])

        if not items:
            return error_response("PO must have at least one item")

        po_number = f"PO-{datetime.now().strftime('%y%m%d%H%M')}"

        total_cost = Decimal('0.00')
        po_items = []

        for item in items:
            qty = int(item.get('quantity', 0))
            asset_id = item.get('product_id')
            asset = db.session.get(Asset, asset_id)

            if not asset or qty <= 0:
                continue

            unit_cost = Decimal(str(asset.purchase_cost))
            line_total = unit_cost * qty
            total_cost += line_total

            po_items.append(PurchaseOrderItem(
                product_id=asset_id,
                quantity_ordered=qty,
                unit_cost=unit_cost,
                line_total=line_total
            ))

        new_po = PurchaseOrder(
            po_number=po_number,
            supplier_id=data.get('supplier_id'),
            expected_delivery_date=datetime.strptime(data.get('expected_date'), '%Y-%m-%d').date() if data.get('expected_date') else None,
            total_cost=total_cost,
            created_by=user_id,
            status='Ordered'
        )

        db.session.add(new_po)
        db.session.flush()

        for p_item in po_items:
            p_item.purchase_order_id = new_po.id
            db.session.add(p_item)

        db.session.commit()

        # Log audit
        from backend.api.utils.audit import log_audit
        log_audit("Procurement", "Created", f"Created Purchase Order {po_number} for {total_cost:.2f}", target_id=new_po.id)

        return success_response(new_po.to_dict(), "Purchase Order created successfully")
    except Exception as e:
        db.session.rollback()
        return error_response(str(e))

@service_bp.route('/<int:id>/receive', methods=['PUT'])
@jwt_required()
def receive_purchase_order(id):
    try:
        po = db.session.get(PurchaseOrder, id)
        if not po:
            return error_response("Order not found")

        if po.status == 'Received':
            return error_response("Order already received")

        po.status = 'Received'
        po.received_date = datetime.now(timezone.utc)

        # Increase stock for each item
        for item in po.items:
            product = item.product
            product.stock_quantity += item.quantity_ordered
            product.status = 'available'

            # Log movement
            move = StockMovement(
                asset_id=product.id,
                type='PURCHASE',
                quantity=item.quantity_ordered,
                reference_id=po.po_number,
                notes=f"PO Received from {po.supplier.name}"
            )
            db.session.add(move)

        db.session.commit()

        # Log audit
        from backend.api.utils.audit import log_audit
        log_audit("Procurement", "Received", f"Marked Purchase Order {po.po_number} as Received (Restocked {len(po.items)} SKUs)", target_id=po.id)

        return success_response(po.to_dict(), "Inventory restocked successfully")
    except Exception as e:
        db.session.rollback()
        return error_response(str(e))
