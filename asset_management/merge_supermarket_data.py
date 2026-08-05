import sqlite3
import os
from backend.app import create_app
from backend.extensions import db
from backend.api.models.asset import Asset, AssetCategory

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SUPERMARKET_DB = os.path.join(os.path.dirname(BASE_DIR), 'supermarket.db')
ASSETS_DB = os.path.join(BASE_DIR, 'backend', 'assets.db')

app = create_app()

def merge():
    if not os.path.exists(SUPERMARKET_DB):
        print(f"Error: {SUPERMARKET_DB} not found.")
        return

    # Connect to Supermarket DB
    s_conn = sqlite3.connect(SUPERMARKET_DB)
    s_conn.row_factory = sqlite3.Row
    s_cur = s_conn.cursor()

    with app.app_context():
        # 1. Clear existing data to avoid conflicts if needed, or just append
        # For now, we clear to make it exactly what they requested
        db.session.query(Asset).delete()
        db.session.query(AssetCategory).delete()
        db.session.commit()
        print("Cleared old asset data.")

        # 2. Transfer Categories
        s_cur.execute("SELECT * FROM categories")
        for row in s_cur.fetchall():
            cat = AssetCategory(
                id=row['id'],
                name=row['name'],
                description=row['description'],
                status='active'
            )
            db.session.add(cat)
        db.session.commit()
        print(f"Transferred {AssetCategory.query.count()} categories.")

        # 3. Transfer Products as Assets
        s_cur.execute("SELECT p.*, s.quantity FROM products p LEFT JOIN stock s ON p.id = s.product_id")
        for row in s_cur.fetchall():
            asset = Asset(
                name=row['name'],
                asset_tag=row['barcode'] or f"SKU-{row['id']}",
                category_id=row['category_id'],
                serial_number=row['barcode'] or f"SN-{row['id']}",
                model='Standard',
                brand='Generic',
                purchase_cost=row['price'],
                status='available' if row['quantity'] > 0 else 'retired',
                stock_quantity=row['quantity'] or 0,
                low_stock_threshold=5
            )
            db.session.add(asset)
        db.session.commit()
        print(f"Transferred {Asset.query.count()} products as assets.")

    s_conn.close()

if __name__ == '__main__':
    merge()
