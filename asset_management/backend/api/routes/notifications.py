from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.extensions import db
from backend.api.models.notification import Notification
from backend.api.models.asset import Asset
from backend.api.models.operations import PurchaseOrder, WastageRecord
from backend.api.utils.responses import success_response, error_response
from sqlalchemy import func, and_
from datetime import datetime, timezone, timedelta

notifications_bp = Blueprint('notifications', __name__)
notifications_bp.strict_slashes = False

def generate_automatic_notifications(user_id):
    """
    Logic to scan database and generate notifications based on conditions.
    Avoids duplicates by checking for existing unread notifications of the same type/entity.
    """
    now = datetime.now(timezone.utc)
    today = now.date()

    # 1. STOCK ALERTS
    low_stock_items = Asset.query.filter(
        and_(Asset.stock_quantity <= Asset.reorder_level, Asset.status != 'retired')
    ).all()

    for item in low_stock_items:
        n_type = 'out_of_stock' if item.stock_quantity == 0 else 'low_stock'
        severity = 'critical' if item.stock_quantity == 0 else 'warning'
        title = "Out of Stock" if item.stock_quantity == 0 else "Low Stock Alert"
        message = f"CRITICAL: {item.name} is out of stock!" if item.stock_quantity == 0 else f"{item.name} has only {item.stock_quantity} left (Reorder at {item.reorder_level})"

        # Check if an unread notification already exists for this product
        existing = Notification.query.filter_by(
            user_id=user_id,
            type=n_type,
            related_entity_id=item.id,
            is_read=False
        ).first()

        if not existing:
            new_notif = Notification(
                user_id=user_id,
                type=n_type,
                title=title,
                message=message,
                severity=severity,
                related_entity_type='product',
                related_entity_id=item.id
            )
            db.session.add(new_notif)

    # 2. EXPIRY ALERTS (Next 7 days)
    expiry_threshold = today + timedelta(days=7)
    expiring_items = Asset.query.filter(
        and_(Asset.expiry_date != None, Asset.expiry_date <= expiry_threshold, Asset.stock_quantity > 0)
    ).all()

    for item in expiring_items:
        days_left = (item.expiry_date - today).days
        severity = 'critical' if days_left <= 2 else 'warning'
        title = "Product Expiring Soon"
        message = f"{item.name} expires on {item.expiry_date.strftime('%d %b')} ({days_left} days left)"

        existing = Notification.query.filter_by(
            user_id=user_id,
            type='expiring_soon',
            related_entity_id=item.id,
            is_read=False
        ).first()

        if not existing:
            new_notif = Notification(
                user_id=user_id,
                type='expiring_soon',
                title=title,
                message=message,
                severity=severity,
                related_entity_type='product',
                related_entity_id=item.id
            )
            db.session.add(new_notif)

    # 3. PROCUREMENT UPDATES (Recent received orders)
    recent_received = PurchaseOrder.query.filter_by(status='Received').order_by(PurchaseOrder.received_date.desc()).limit(5).all()
    for po in recent_received:
        existing = Notification.query.filter_by(
            user_id=user_id,
            type='po_received',
            related_entity_id=po.id
        ).first()

        if not existing:
            new_notif = Notification(
                user_id=user_id,
                type='po_received',
                title="Inventory Restocked",
                message=f"Purchase Order {po.po_number} received. {po.supplier.name if po.supplier else 'Supplier'} delivery processed.",
                severity='info',
                related_entity_type='purchase_order',
                related_entity_id=po.id
            )
            db.session.add(new_notif)

    db.session.commit()

@notifications_bp.route('/', methods=['GET'])
@jwt_required()
def get_notifications():
    user_id = int(get_jwt_identity())

    # Auto-generate before returning
    generate_automatic_notifications(user_id)

    notifications = Notification.query.filter_by(user_id=user_id).order_by(Notification.created_at.desc()).all()
    return success_response([n.to_dict() for n in notifications])

@notifications_bp.route('/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count():
    user_id = get_jwt_identity()
    count = Notification.query.filter_by(user_id=int(user_id), is_read=False).count()
    return success_response({"count": count})

@notifications_bp.route('/mark-all-read', methods=['PUT'])
@jwt_required()
def mark_all_as_read():
    user_id = get_jwt_identity()
    Notification.query.filter_by(user_id=int(user_id), is_read=False).update({Notification.is_read: True})
    db.session.commit()
    return success_response(message="All notifications marked as read")

@notifications_bp.route('/<int:notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_as_read(notification_id):
    notification = db.session.get(Notification, notification_id)
    if notification:
        notification.is_read = True
        db.session.commit()
    return success_response(message="Marked as read")

@notifications_bp.route('/<int:notification_id>', methods=['DELETE'])
@jwt_required()
def delete_notification(notification_id):
    try:
        notification = db.session.get(Notification, notification_id)
        if not notification:
            return error_response("Notification not found", 404)

        db.session.delete(notification)
        db.session.commit()
        return success_response(message="Notification deleted")
    except Exception as e:
        db.session.rollback()
        return error_response(str(e))
