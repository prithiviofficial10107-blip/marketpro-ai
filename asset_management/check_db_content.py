from backend.app import create_app
from backend.extensions import db
from backend.api.models.asset import Asset, AssetCategory

app = create_app()
with app.app_context():
    assets = Asset.query.all()
    categories = AssetCategory.query.all()
    print(f"Total Assets: {len(assets)}")
    print(f"Total Categories: {len(categories)}")

    if len(assets) > 0:
        print("\nSample Assets:")
        for a in assets[:5]:
            print(f"- {a.name} ({a.asset_tag}): {a.status}")

    if len(categories) > 0:
        print("\nSample Categories:")
        for c in categories[:5]:
            print(f"- {c.name}")
