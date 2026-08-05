import requests
import json

# Setup
BASE_URL = "http://127.0.0.1:5001/api"
login_payload = {"username": "admin", "password": "admin123"}

def verify():
    # 1. Login
    res = requests.post(f"{BASE_URL}/auth/login", json=login_payload)
    token = res.json()['data']['access_token']
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get an Ordered PO
    pos_res = requests.get(f"{BASE_URL}/service/", headers=headers)
    ordered_po = next((p for p in pos_res.json()['data'] if p['status'] == 'Ordered'), None)

    if not ordered_po:
        print("No 'Ordered' PO found to test with.")
        return

    po_id = ordered_po['id']
    print(f"Testing with PO: {ordered_po['po_number']}")

    # 3. Get first product stock from DB directly (simulating backend check)
    from backend.app import create_app
    from backend.api.models import Asset, PurchaseOrder
    from backend.extensions import db

    app = create_app()
    with app.app_context():
        po_obj = db.session.get(PurchaseOrder, po_id)
        test_item = po_obj.items[0]
        product_id = test_item.product_id
        ordered_qty = test_item.quantity_ordered

        initial_stock = db.session.get(Asset, product_id).stock_quantity
        print(f"Initial Stock for {test_item.product.name}: {initial_stock}")

        # 4. API Call to Receive PO
        recv_res = requests.put(f"{BASE_URL}/service/{po_id}/receive", headers=headers)
        if recv_res.status_code == 200:
            print("Successfully received PO via API.")
        else:
            print(f"Failed to receive PO: {recv_res.text}")
            return

        # 5. Verify final stock
        db.session.expire_all() # Refresh session
        final_stock = db.session.get(Asset, product_id).stock_quantity
        print(f"Final Stock: {final_stock}")

        if final_stock == (initial_stock + ordered_qty):
            print("✅ VERIFICATION SUCCESS: Stock increased correctly!")
        else:
            print(f"❌ VERIFICATION FAILED: Expected {initial_stock + ordered_qty}")

if __name__ == "__main__":
    verify()
