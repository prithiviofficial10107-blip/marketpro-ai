from flask import Blueprint
from flask_jwt_extended import jwt_required
from backend.extensions import db
from backend.api.models.asset import Asset, AssetCategory
from backend.api.models.employee import Employee
from backend.api.models.operations import Assignment, ServiceRecord, DamageReport, StockMovement, Sale
from backend.api.utils.responses import success_response
from sqlalchemy import func, and_, or_
from datetime import datetime, timezone, timedelta

dashboard_bp = Blueprint('dashboard', __name__)
dashboard_bp.strict_slashes = False

@dashboard_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    total_assets = Asset.query.count()
    total_employees = Employee.query.count()

    status_counts = Asset.query.with_entities(Asset.status, func.count(Asset.id)).group_by(Asset.status).all()
    status_map = {status: count for status, count in status_counts}

    return success_response({
        "total_assets": total_assets,
        "total_employees": total_employees,
        "status_distribution": status_map
    })

@dashboard_bp.route('/analytics', methods=['GET'])
@jwt_required()
def get_analytics():
    try:
        now_dt = datetime.now(timezone.utc)
        now_date = now_dt.date()
        six_months_ago = now_date - timedelta(days=180)
        one_month_ago = now_date - timedelta(days=30)

        # 1. Financial Snapshots
        total_inventory_value = db.session.query(
            func.sum(Asset.purchase_cost * Asset.stock_quantity)
        ).scalar() or 0

        monthly_procurement_cost = db.session.query(
            func.sum(Asset.purchase_cost * StockMovement.quantity)
        ).select_from(StockMovement).join(Asset, StockMovement.asset_id == Asset.id).filter(
            and_(StockMovement.type == 'PURCHASE', StockMovement.created_at >= one_month_ago)
        ).scalar() or 0

        total_sales_revenue = db.session.query(
            func.sum(Sale.total_amount)
        ).filter(Sale.sale_date >= one_month_ago).scalar() or 0

        # 2. Trends (Last 6 months)
        # 2a. Sales Trend
        sales_trend = db.session.query(
            func.strftime('%Y-%m', Sale.sale_date).label('month'),
            func.sum(Sale.total_amount).label('revenue')
        ).filter(Sale.sale_date >= six_months_ago).group_by('month').all()

        # 2b. Procurement Trend
        proc_trend = db.session.query(
            func.strftime('%Y-%m', StockMovement.created_at).label('month'),
            func.sum(Asset.purchase_cost * StockMovement.quantity).label('spend')
        ).select_from(StockMovement).join(Asset, StockMovement.asset_id == Asset.id).filter(
            and_(StockMovement.type == 'PURCHASE', StockMovement.created_at >= six_months_ago)
        ).group_by('month').all()

        # 2c. Wastage Trend
        wastage_trend = db.session.query(
            func.strftime('%Y-%m', StockMovement.created_at).label('month'),
            func.sum(Asset.purchase_cost * func.abs(StockMovement.quantity)).label('loss')
        ).select_from(StockMovement).join(Asset, StockMovement.asset_id == Asset.id).filter(
            and_(StockMovement.type == 'WASTAGE', StockMovement.created_at >= six_months_ago)
        ).group_by('month').all()

        # Merge trends by month
        trend_map = {}
        for m, r in sales_trend: trend_map[m] = {"month": m, "revenue": float(r or 0), "expense": 0, "loss": 0}
        for m, s in proc_trend:
            if m not in trend_map: trend_map[m] = {"month": m, "revenue": 0, "expense": 0, "loss": 0}
            trend_map[m]["expense"] = float(s or 0)
        for m, l in wastage_trend:
            if m not in trend_map: trend_map[m] = {"month": m, "revenue": 0, "expense": 0, "loss": 0}
            trend_map[m]["loss"] = float(l or 0)

        final_trends = sorted(trend_map.values(), key=lambda x: x['month'])

        # 3. Status Distribution
        status_counts = Asset.query.with_entities(Asset.status, func.count(Asset.id)).group_by(Asset.status).all()
        detailed_stats = {s: 0 for s in ['available', 'assigned', 'in_repair', 'damaged', 'retired']}
        for status, count in status_counts:
            status_val = status.name if hasattr(status, 'name') else str(status)
            if status_val in detailed_stats:
                detailed_stats[status_val] = count

        # 4. Category Value Distribution
        category_value_dist = db.session.query(
            AssetCategory.name, func.sum(Asset.purchase_cost * Asset.stock_quantity)
        ).outerjoin(Asset).group_by(AssetCategory.name).all()

        staff_count = Employee.query.count()

        # 5. Critical Alerts Engine
        critical_alerts = []
        oos_items = Asset.query.filter(Asset.stock_quantity == 0).limit(5).all()
        for item in oos_items:
            critical_alerts.append({"type": "danger", "label": "OUT OF STOCK", "message": f"CRITICAL: {item.name} is completely out of stock!", "link": f"/assets?search={item.name}"})

        expiry_threshold = now_date + timedelta(days=7)
        expiring_items = Asset.query.filter(and_(Asset.expiry_date != None, Asset.expiry_date <= expiry_threshold, Asset.expiry_date >= now_date)).limit(5).all()
        for item in expiring_items:
            critical_alerts.append({"type": "warning", "label": "EXPIRING SOON", "message": f"{item.name} expires on {item.expiry_date.strftime('%d %b')}.", "link": f"/assets?search={item.name}"})

        low_stock_items = Asset.query.filter(and_(Asset.stock_quantity > 0, Asset.stock_quantity <= Asset.reorder_level)).limit(5).all()
        for item in low_stock_items:
            if not any(a['message'].startswith(item.name) for a in critical_alerts):
                critical_alerts.append({"type": "warning", "label": "LOW STOCK", "message": f"{item.name} is below reorder level ({item.stock_quantity} left).", "link": f"/assets?search={item.name}"})

        return success_response({
            "status_counts": detailed_stats,
            "total_assets": Asset.query.count(),
            "total_employees": staff_count,
            "financials": {
                "total_inventory_value": float(total_inventory_value),
                "monthly_procurement": float(monthly_procurement_cost),
                "monthly_revenue": float(total_sales_revenue)
            },
            "distributions": {
                "categories": [{"name": c[0], "value": float(c[1] or 0)} for c in category_value_dist if c[0]],
            },
            "trends": {
                "performance": final_trends
            },
            "critical_alerts": critical_alerts[:10]
        })
    except Exception as e:
        import traceback
        from flask import current_app
        current_app.logger.error(f"Dashboard Analytics Error: {str(e)}\n{traceback.format_exc()}")
        return success_response({
            "status_counts": {s: 0 for s in ['available', 'assigned', 'in_repair', 'damaged', 'retired']},
            "total_assets": 0, "total_employees": 0,
            "financials": {"total_inventory_value": 0, "monthly_procurement": 0, "monthly_revenue": 0},
            "distributions": {"categories": []},
            "trends": {"performance": []},
            "critical_alerts": []
        }, "Error fetching analytics data")
