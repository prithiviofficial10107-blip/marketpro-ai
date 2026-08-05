from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.extensions import db
from backend.api.models.asset import Asset
from backend.api.models.operations import Sale, SaleDetail, StockMovement
from backend.api.utils.responses import success_response, error_response
from decimal import Decimal
import random
import string

billing_bp = Blueprint('billing', __name__)
billing_bp.strict_slashes = False

def generate_bill_number():
    return 'B' + ''.join(random.choices(string.digits, k=8))

@billing_bp.route('/checkout', methods=['POST'])
@jwt_required()
def checkout():
    try:
        data = request.get_json()
        items = data.get('items', [])
        payment_method = data.get('payment_method', 'CASH').upper()
        user_id = get_jwt_identity()

        if not items:
            return error_response("Cart is empty")

        subtotal = Decimal('0.00')
        tax_rate = Decimal('0.18') # Standard 18% GST
        processed_items = []

        # 1. Validation & Calculation
        for item in items:
            asset_id = item.get('asset_id')
            qty = int(item.get('quantity', 0))

            if qty <= 0:
                return error_response(f"Invalid quantity for item {asset_id}")

            asset = db.session.get(Asset, asset_id)
            if not asset:
                return error_response(f"Product {asset_id} not found")

            if asset.stock_quantity < qty:
                return error_response(f"Insufficient stock for {asset.name}. Available: {asset.stock_quantity}")

            # Use selling price (unit_price) for calculation
            line_total = Decimal(str(asset.unit_price)) * qty
            subtotal += line_total

            processed_items.append({
                'asset': asset,
                'quantity': qty,
                'unit_price': asset.unit_price,
                'total_price': line_total
            })

        tax_amount = subtotal * tax_rate
        total_amount = subtotal + tax_amount

        # 2. Create Sale Record
        new_sale = Sale(
            bill_number=generate_bill_number(),
            employee_id=user_id,
            subtotal=subtotal,
            tax_amount=tax_amount,
            total_amount=total_amount,
            payment_method=payment_method
        )
        db.session.add(new_sale)
        db.session.flush() # Get sale ID

        # 3. Process Details & Deduct Stock
        for detail in processed_items:
            asset = detail['asset']

            # Deduct stock
            asset.stock_quantity -= detail['quantity']
            if asset.stock_quantity <= 0:
                asset.status = 'retired' # Out of stock

            # Create Detail
            sd = SaleDetail(
                sale_id=new_sale.id,
                asset_id=asset.id,
                quantity=detail['quantity'],
                unit_price_at_sale=detail['unit_price'],
                total_price=detail['total_price']
            )
            db.session.add(sd)

            # Record Stock Movement
            move = StockMovement(
                asset_id=asset.id,
                type='SALE',
                quantity=-detail['quantity'],
                reference_id=new_sale.bill_number,
                notes=f"Retail sale {new_sale.bill_number}"
            )
            db.session.add(move)

        db.session.commit()

        # Log audit
        from backend.api.utils.audit import log_audit
        log_audit("Billing", "Created", f"Bill {new_sale.bill_number} completed for {total_amount:.2f}", target_id=new_sale.id)

        return success_response(new_sale.to_dict(), "Checkout successful")

    except Exception as e:
        db.session.rollback()
        from flask import current_app
        current_app.logger.error(f"Checkout Error: {str(e)}")
        return error_response(str(e), 500)

@billing_bp.route('/history', methods=['GET'])
@jwt_required()
def get_history():
    sales = Sale.query.order_by(Sale.sale_date.desc()).all()
    return success_response([s.to_dict() for s in sales])
