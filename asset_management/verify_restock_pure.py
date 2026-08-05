import sys
import os
from datetime import datetime, timezone

# Setup path
sys.path.append(os.path.dirname(__file__))

from backend.app import create_app
from backend.api.models import Asset, PurchaseOrder, StockMovement
from backend.extensions import db

def verify():
    app = create_app()
    with app.app_context():
        # 1. Get ANY PO and reset it to Ordered for test
        po = PurchaseOrder.query.first()
        if not po:
            print("No PO found.")
            return

        po.status = 'Ordered'
        db.session.commit()

        test_item = po.items[0]
        product = test_item.product
        initial_stock = product.stock_quantity
        ordered_qty = test_item.quantity_ordered

        print(f"Testing with PO: {po.po_number}")
        print(f"Product: {product.name} | Initial Stock: {initial_stock} | Ordered: {ordered_qty}")

        # 2. Simulate the 'receive' logic
        po.status = 'Received'
        po.received_date = datetime.now(timezone.utc)

        for item in po.items:
            item.product.stock_quantity += item.quantity_ordered

        db.session.commit()

        # 3. Verify
        final_stock = Asset.query.get(product.id).stock_quantity
        print(f"Final Stock: {final_stock}")

        if final_stock == (initial_stock + ordered_qty):
            print("✅ VERIFICATION SUCCESS: Stock increased correctly!")
        else:
            print("❌ VERIFICATION FAILED.")

if __name__ == "__main__":
    verify()
