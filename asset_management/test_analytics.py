from backend.app import create_app
from backend.api.routes.dashboard import get_analytics
from flask import Flask
from flask_jwt_extended import JWTManager, create_access_token

app = create_app()
with app.app_context():
    # Mock a request context for get_analytics
    with app.test_request_context():
        try:
            # We don't actually need to call it via route, just call the logic
            # But let's see if the logic inside get_analytics fails
            from backend.api.routes.dashboard import get_analytics
            # Since get_analytics is a route function, we might need a dummy token if we called it via test_client
            # But we can just run the logic here.

            from backend.extensions import db
            from backend.api.models.asset import Asset, AssetCategory
            from backend.api.models.employee import Employee
            from backend.api.models.operations import Assignment, ServiceRecord, DamageReport, StockMovement
            from sqlalchemy import func, and_
            from datetime import datetime, timezone, timedelta

            now_dt = datetime.now(timezone.utc)
            now_date = now_dt.date()
            one_month_ago = now_date - timedelta(days=30)

            print("Checking Total Inventory Value...")
            total_inventory_value = db.session.query(
                func.sum(Asset.purchase_cost * Asset.stock_quantity)
            ).scalar()
            print(f"Total Inventory Value: {total_inventory_value}")

            print("Checking Monthly Procurement...")
            monthly_procurement_cost = db.session.query(
                func.sum(Asset.purchase_cost * StockMovement.quantity)
            ).select_from(StockMovement).join(Asset, StockMovement.asset_id == Asset.id).filter(
                and_(StockMovement.type == 'PURCHASE', StockMovement.created_at >= one_month_ago)
            ).scalar()
            print(f"Monthly Procurement: {monthly_procurement_cost}")

            print("Checking Status Counts...")
            status_counts = Asset.query.with_entities(Asset.status, func.count(Asset.id)).group_by(Asset.status).all()
            print(f"Status Counts: {status_counts}")

            print("Checking critical alerts...")
            low_stock_items = Asset.query.filter(
                and_(Asset.stock_quantity > 0, Asset.stock_quantity <= Asset.reorder_level)
            ).all()
            print(f"Low Stock Items found: {len(low_stock_items)}")

        except Exception as e:
            import traceback
            print(f"ERROR: {str(e)}")
            traceback.print_exc()
