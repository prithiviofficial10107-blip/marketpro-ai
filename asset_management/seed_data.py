from backend.app import create_app
from backend.extensions import db
from backend.api.models.asset import Asset, AssetCategory
from datetime import datetime, date

app = create_app()
with app.app_context():
    # 1. Add Categories
    categories = [
        {'name': 'Laptops', 'prefix': 'LAP', 'description': 'Office laptops'},
        {'name': 'Mobile Phones', 'prefix': 'MOB', 'description': 'Company mobile devices'},
        {'name': 'Furniture', 'prefix': 'FUR', 'description': 'Office chairs and desks'},
        {'name': 'Network Devices', 'prefix': 'NET', 'description': 'Routers, switches, etc.'}
    ]

    for cat_data in categories:
        if not AssetCategory.query.filter_by(name=cat_data['name']).first():
            cat = AssetCategory(**cat_data)
            db.session.add(cat)

    db.session.commit()
    print("Categories seeded.")

    # 2. Add Assets
    lap_cat = AssetCategory.query.filter_by(name='Laptops').first()
    mob_cat = AssetCategory.query.filter_by(name='Mobile Phones').first()

    assets = [
        {
            'asset_tag': 'LAP-001',
            'name': 'Dell XPS 15',
            'category_id': lap_cat.id,
            'serial_number': 'SN-DELL-XPS-001',
            'model': 'XPS 15 9500',
            'brand': 'Dell',
            'purchase_date': date(2025, 1, 15),
            'purchase_cost': 1500.00,
            'status': 'available'
        },
        {
            'asset_tag': 'LAP-002',
            'name': 'MacBook Pro M2',
            'category_id': lap_cat.id,
            'serial_number': 'SN-APPLE-MBP-002',
            'model': 'Pro 14-inch',
            'brand': 'Apple',
            'purchase_date': date(2025, 2, 20),
            'purchase_cost': 2000.00,
            'status': 'assigned'
        },
        {
            'asset_tag': 'MOB-001',
            'name': 'iPhone 15',
            'category_id': mob_cat.id,
            'serial_number': 'SN-APPLE-IPH-001',
            'model': 'iPhone 15 128GB',
            'brand': 'Apple',
            'purchase_date': date(2025, 3, 10),
            'purchase_cost': 999.00,
            'status': 'available'
        },
        {
            'asset_tag': 'MOB-002',
            'name': 'Samsung S24',
            'category_id': mob_cat.id,
            'serial_number': 'SN-SAMS-S24-002',
            'model': 'S24 Ultra',
            'brand': 'Samsung',
            'purchase_date': date(2025, 3, 15),
            'purchase_cost': 1199.00,
            'status': 'damaged'
        }
    ]

    for asset_data in assets:
        if not Asset.query.filter_by(asset_tag=asset_data['asset_tag']).first():
            asset = Asset(**asset_data)
            db.session.add(asset)

    db.session.commit()
    print("Assets seeded.")
