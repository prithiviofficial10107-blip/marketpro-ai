from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from backend.extensions import db
from backend.api.models.asset import Asset, AssetCategory
from backend.api.models.operations import ServiceRecord, DamageReport, Sale, SaleDetail, WastageRecord, PurchaseOrder
from backend.api.utils.responses import success_response, error_response
from sqlalchemy import func, and_
from datetime import datetime, timezone, timedelta

reports_bp = Blueprint('reports', __name__)
reports_bp.strict_slashes = False

@reports_bp.route('/inventory-summary', methods=['GET'])
@jwt_required()
def inventory_summary():
    try:
        total_assets = Asset.query.count()

        # Breakdown by status
        by_status = db.session.query(Asset.status, func.count(Asset.id)).group_by(Asset.status).all()

        # Breakdown by category
        by_category = db.session.query(AssetCategory.name, func.count(Asset.id)).join(Asset).group_by(AssetCategory.name).all()

        # Total inventory value
        total_value = db.session.query(func.sum(Asset.purchase_cost * Asset.stock_quantity)).scalar() or 0

        # Stock status breakdown
        well_stocked = Asset.query.filter(Asset.stock_quantity > Asset.reorder_level).count()
        low_stock = Asset.query.filter(and_(Asset.stock_quantity <= Asset.reorder_level, Asset.stock_quantity > 0)).count()
        out_of_stock = Asset.query.filter(Asset.stock_quantity == 0).count()

        return success_response({
            "total_assets": total_assets,
            "status_breakdown": {str(s): c for s, c in by_status},
            "category_breakdown": {n: c for n, c in by_category},
            "total_inventory_value": float(total_value),
            "stock_alerts": {
                "well_stocked": well_stocked,
                "low_stock": low_stock,
                "out_of_stock": out_of_stock
            }
        })
    except Exception as e:
        return error_response(str(e))

@reports_bp.route('/sales', methods=['GET'])
@jwt_required()
def sales_report():
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')

        query = Sale.query
        if start_date:
            query = query.filter(Sale.sale_date >= datetime.strptime(start_date, '%Y-%m-%d'))
        if end_date:
            # End of the day
            end_dt = datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1) - timedelta(seconds=1)
            query = query.filter(Sale.sale_date <= end_dt)

        sales = query.all()

        total_revenue = sum(s.total_amount for s in sales)
        total_bills = len(sales)
        avg_bill_value = total_revenue / total_bills if total_bills > 0 else 0

        # Top 5 products by quantity
        top_products = db.session.query(
            Asset.name, func.sum(SaleDetail.quantity).label('total_qty')
        ).join(SaleDetail, Asset.id == SaleDetail.asset_id).join(Sale, SaleDetail.sale_id == Sale.id)

        if start_date:
            top_products = top_products.filter(Sale.sale_date >= start_date)
        if end_date:
            top_products = top_products.filter(Sale.sale_date <= end_dt)

        top_products = top_products.group_by(Asset.name).order_by(func.sum(SaleDetail.quantity).desc()).limit(5).all()

        return success_response({
            "total_revenue": float(total_revenue),
            "total_bills": total_bills,
            "average_bill_value": float(avg_bill_value),
            "top_products": [{"name": p[0], "quantity": int(p[1])} for p in top_products]
        })
    except Exception as e:
        return error_response(str(e))

@reports_bp.route('/wastage-procurement', methods=['GET'])
@jwt_required()
def wastage_procurement_report():
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')

        # Wastage
        wastage_query = db.session.query(func.sum(WastageRecord.cost_impact))
        if start_date:
            wastage_query = wastage_query.filter(WastageRecord.created_at >= start_date)
        if end_date:
            end_dt = datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1) - timedelta(seconds=1)
            wastage_query = wastage_query.filter(WastageRecord.created_at <= end_dt)
        total_wastage = wastage_query.scalar() or 0

        # Procurement
        proc_query = db.session.query(func.sum(PurchaseOrder.total_cost)).filter(PurchaseOrder.status == 'Received')
        if start_date:
            proc_query = proc_query.filter(PurchaseOrder.received_date >= start_date)
        if end_date:
            proc_query = proc_query.filter(PurchaseOrder.received_date <= end_dt)
        total_procurement = proc_query.scalar() or 0

        # Category-wise wastage
        wastage_by_cat = db.session.query(
            AssetCategory.name, func.sum(WastageRecord.cost_impact)
        ).join(Asset, WastageRecord.product_id == Asset.id).join(AssetCategory)

        if start_date:
            wastage_by_cat = wastage_by_cat.filter(WastageRecord.created_at >= start_date)
        if end_date:
            wastage_by_cat = wastage_by_cat.filter(WastageRecord.created_at <= end_dt)

        wastage_by_cat = wastage_by_cat.group_by(AssetCategory.name).all()

        return success_response({
            "total_wastage": float(total_wastage),
            "total_procurement": float(total_procurement),
            "wastage_by_category": [{"name": w[0], "value": float(w[1])} for w in wastage_by_cat]
        })
    except Exception as e:
        return error_response(str(e))

@reports_bp.route('/export', methods=['GET'])
@jwt_required()
def export_data():
    try:
        assets = Asset.query.all()
        data = [a.to_dict() for a in assets]
        return success_response(data, "Data exported successfully")
    except Exception as e:
        return error_response(str(e))
