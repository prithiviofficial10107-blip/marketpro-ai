import os
import random
import string
from datetime import datetime, date, timedelta
from backend.app import create_app
from backend.extensions import db
from backend.api.models import User, Role, Employee, Asset, AssetCategory, Supplier, Customer, Sale, SaleDetail, StockMovement, WastageRecord, PurchaseOrder, PurchaseOrderItem, ActivityLog
from werkzeug.security import generate_password_hash

app = create_app()

def generate_bill_number():
    return 'B' + ''.join(random.choices(string.digits, k=8))

def seed():
    with app.app_context():
        print("🚀 Starting Master Supermarket Seeding...")

        # 1. Roles & Staff
        print("Seeding Roles & Staff...")
        roles = ['admin', 'manager', 'cashier', 'stock_manager', 'staff']
        role_objs = {}
        for rname in roles:
            role = Role.query.filter_by(name=rname).first()
            if not role:
                role = Role(name=rname)
                db.session.add(role)
                db.session.flush()
            role_objs[rname] = role

        staff_data = [
            ("Ramesh", "Kumar", "ramesh@supermarket.in", "9840012345", "Management", "Store Manager", "manager"),
            ("Priya", "Dharshini", "priya@supermarket.in", "9840054321", "Billing", "Senior Cashier", "cashier"),
            ("Selvam", "M", "selvam@supermarket.in", "9940011223", "Warehouse", "Stock Supervisor", "stock_manager"),
            ("Anita", "S", "anita@supermarket.in", "9740033445", "Billing", "Cashier", "cashier"),
            ("Karthik", "R", "karthik@supermarket.in", "9640022334", "Logistics", "Delivery Lead", "stock_manager"),
            ("Sneha", "V", "sneha@supermarket.in", "9540055667", "Sales", "Sales Assistant", "staff"),
            ("Manoj", "T", "manoj@supermarket.in", "9440077889", "Warehouse", "Stock Assistant", "stock_manager"),
            ("Divya", "K", "divya@supermarket.in", "9340099001", "Billing", "Cashier", "cashier"),
            ("Arjun", "P", "arjun@supermarket.in", "9240011222", "Management", "Operations Lead", "manager"),
            ("Bhavani", "L", "bhavani@supermarket.in", "9140033444", "Sales", "Customer Relations", "staff")
        ]

        staff_users = []
        codes_used = set()
        for fn, ln, email, ph, dept, desig, rname in staff_data:
            emp = Employee.query.filter_by(email=email).first()
            if not emp:
                code = f"EMP{random.randint(100, 999)}"
                while code in codes_used:
                    code = f"EMP{random.randint(100, 999)}"
                codes_used.add(code)

                emp = Employee(
                    employee_code=code,
                    first_name=fn, last_name=ln, email=email,
                    phone=ph, department=dept, designation=desig
                )
                db.session.add(emp)
                db.session.flush()

            user = User.query.filter_by(email=email).first()
            if not user:
                user = User(
                    username=fn.lower(),
                    email=email,
                    first_name=fn,
                    last_name=ln,
                    password_hash=generate_password_hash('password123'),
                    role_id=role_objs[rname].id,
                    employee_id=emp.id,
                    is_verified=True
                )
                db.session.add(user)
                db.session.flush()
            staff_users.append(user)

        # 2. Categories
        print("Seeding Categories...")
        categories_data = [
            ("Groceries", "Grains, pulses, and cooking essentials", "GRO"),
            ("Dairy & Eggs", "Milk, butter, curd, and farm eggs", "DAI"),
            ("Beverages", "Tea, coffee, juices, and soft drinks", "BEV"),
            ("Snacks", "Biscuits, chips, chocolates, and namkeen", "SNA"),
            ("Personal Care", "Soap, shampoo, toothpaste, and hygiene", "PER"),
            ("Household", "Detergents, cleaners, and kitchen tools", "HOU"),
            ("Bakery", "Fresh bread, buns, cakes, and cookies", "BAK"),
            ("Fruits & Vegetables", "Fresh local produce", "FRU"),
            ("Frozen Foods", "Ready-to-eat and frozen snacks", "FRO"),
            ("Stationery", "Notebooks, pens, and office supplies", "STA")
        ]

        category_objs = {}
        for name, desc, pref in categories_data:
            cat = AssetCategory.query.filter_by(name=name).first()
            if not cat:
                cat = AssetCategory(name=name, description=desc, prefix=pref, status='active')
                db.session.add(cat)
                db.session.flush()
            category_objs[name] = cat

        # 3. Suppliers
        print("Seeding Suppliers...")
        suppliers_data = [
            ("Reliance Wholesale", "Rajesh V", "9876543210", "rajesh@reliance.com", "Industrial Estate, Chennai"),
            ("Amul Dairy Corp", "Mehta Ji", "9123456780", "orders@amul.co.in", "Anand, Gujarat"),
            ("Hindustan Unilever", "Anita S", "9000123456", "supply@hul.com", "Andheri, Mumbai"),
            ("Britannia Distributors", "Suresh G", "9840123456", "sales@britannia.in", "Padi, Chennai"),
            ("Local Farmers Co-op", "Selvam", "9940112233", "selvam@localfarm.in", "Kanchipuram")
        ]

        supplier_objs = []
        for name, contact, phone, email, addr in suppliers_data:
            sup = Supplier.query.filter_by(name=name).first()
            if not sup:
                sup = Supplier(name=name, contact_person=contact, phone=phone, email=email, address=addr)
                db.session.add(sup)
                db.session.flush()
            supplier_objs.append(sup)

        # 4. Products (Assets) - Detailed Indian Inventory
        print("Seeding Products (60+ items)...")
        products_raw = [
            # (Name, Category, Brand, Cost, Price, Stock, UOM)
            ("Aashirvaad Atta 5kg", "Groceries", "ITC", 250.00, 285.00, 40, "pkt"),
            ("India Gate Basmati 1kg", "Groceries", "India Gate", 95.00, 115.00, 100, "pkt"),
            ("Toor Dal 1kg", "Groceries", "Tata Sampann", 140.00, 165.00, 60, "pkt"),
            ("Amul Butter 100g", "Dairy & Eggs", "Amul", 48.00, 56.00, 50, "pc"),
            ("Amul Gold Milk 500ml", "Dairy & Eggs", "Amul", 30.00, 33.00, 120, "pkt"),
            ("Nandini Curd 500g", "Dairy & Eggs", "Nandini", 24.00, 28.00, 80, "pkt"),
            ("Tata Tea Premium 250g", "Beverages", "Tata", 120.00, 145.00, 45, "pkt"),
            ("Bru Instant Coffee 50g", "Beverages", "HUL", 95.00, 115.00, 30, "pkt"),
            ("Thums Up 750ml", "Beverages", "Coca-Cola", 38.00, 45.00, 60, "pc"),
            ("Maggi Masala 280g", "Snacks", "Nestle", 42.00, 50.00, 90, "pkt"),
            ("Parle-G Gold 1kg", "Snacks", "Parle", 105.00, 120.00, 50, "pkt"),
            ("Lays Magic Masala", "Snacks", "Pepsico", 16.00, 20.00, 100, "pkt"),
            ("Dettol Soap 125g", "Personal Care", "Reckitt", 38.00, 48.00, 4, "pc"), # LOW STOCK
            ("Colgate MaxFresh 150g", "Personal Care", "Colgate", 85.00, 105.00, 35, "pc"),
            ("Dove Shampoo 180ml", "Personal Care", "HUL", 160.00, 195.00, 15, "pc"),
            ("Vim Bar 300g", "Household", "HUL", 25.00, 32.00, 45, "pc"),
            ("Ariel Matic 1kg", "Household", "P&G", 190.00, 230.00, 25, "pkt"),
            ("Lizol Floor Cleaner 500ml", "Household", "Reckitt", 85.00, 110.00, 20, "pc"),
            ("Modern Brown Bread", "Bakery", "Modern", 38.00, 45.00, 12, "pkt"),
            ("Britannia Bourbon 120g", "Bakery", "Britannia", 24.00, 30.00, 35, "pkt"),
            ("Onion 1kg", "Fruits & Vegetables", "Local", 32.00, 45.00, 200, "kg"),
            ("Potato 1kg", "Fruits & Vegetables", "Local", 28.00, 38.00, 150, "kg"),
            ("Tomato 1kg", "Fruits & Vegetables", "Local", 40.00, 55.00, 80, "kg"),
            ("McCain French Fries", "Frozen Foods", "McCain", 115.00, 145.00, 20, "pkt"),
            ("Classmate Notebook A4", "Stationery", "ITC", 50.00, 65.00, 40, "pc"),
            ("Reynolds Trimax", "Stationery", "Reynolds", 40.00, 55.00, 2, "pc"), # LOW STOCK
        ]

        # Extend with sample items to reach 80
        for i in range(54):
            cat_name = random.choice(list(category_objs.keys()))
            brand = random.choice(["Dabur", "Marico", "Godrej", "Haldiram", "MTR", "Saffola"])
            p_name = f"{brand} {cat_name} Item {i+1}"
            cost = random.randint(20, 400)
            price = cost * 1.25
            stock = random.randint(0, 100)
            products_raw.append((p_name, cat_name, brand, cost, price, stock, "pc"))

        product_objs = []
        for idx, (name, cat, brand, cost, price, stock, uom) in enumerate(products_raw):
            tag = f"BAR{random.randint(10000000, 99999999)}"
            asset = Asset(
                name=name,
                asset_tag=tag,
                category_id=category_objs[cat].id,
                brand=brand,
                purchase_cost=cost,
                unit_price=price,
                stock_quantity=stock,
                unit_of_measure=uom,
                low_stock_threshold=10,
                reorder_level=15,
                supplier_id=random.choice(supplier_objs).id,
                status='assigned' if idx < 5 else ('available' if stock > 0 else 'retired'),
                purchase_date=date.today() - timedelta(days=random.randint(30, 365)),
                expiry_date=date.today() + timedelta(days=random.randint(-5, 30)) if cat in ["Dairy & Eggs", "Bakery", "Fruits & Vegetables"] else None
            )
            db.session.add(asset)
            db.session.flush()

            # Stock movement for initial stock
            move = StockMovement(
                asset_id=asset.id,
                type='PURCHASE',
                quantity=stock,
                reference_id="SEED-INIT",
                notes="Initial stock seeding"
            )
            db.session.add(move)
            product_objs.append(asset)

        # 5. Customers
        print("Seeding Customers...")
        admin = User.query.filter_by(username='admin').first()
        customers_data = [
            ("Kumar", "9000123456", "kumar@gmail.com"),
            ("Deepika", "9100123456", "deepi@yahoo.com"),
            ("Rahul", "9200123456", "rahul.v@outlook.com"),
            ("Lakshmi", "9300123456", "lakshmi@gmail.com"),
            ("Vignesh", "9400123456", "vicky@gmail.com"),
            ("Anjali", "9500123456", "anjali@gmail.com"),
            ("Manoj", "9600123456", "manoj@gmail.com"),
            ("Sangeetha", "9700123456", "sangeetha@gmail.com"),
            ("Rajesh", "9800123456", "rajesh@gmail.com"),
            ("Priya", "9900123456", "priya@gmail.com")
        ]
        # Add 10 more random customers
        for i in range(10):
            customers_data.append((f"Customer {i+1}", f"988{random.randint(1000000, 9999999)}", f"cust{i+1}@example.com"))

        customer_objs = []
        for n, p, e in customers_data:
            cust = Customer(name=n, phone=p, email=e, loyalty_points=random.randint(10, 500))
            db.session.add(cust)
            db.session.flush()
            customer_objs.append(cust)

        # 6. Historical Bills (50 spread across 30 days)
        print("Generating Historical Bills (30-day timeline)...")
        for i in range(50):
            bill_date = datetime.now() - timedelta(days=random.randint(0, 30), hours=random.randint(0, 12))
            cust = random.choice(customer_objs)
            cashier = random.choice(staff_users)

            # Select 2-6 unique random items
            cart_items = random.sample(product_objs, random.randint(2, 6))

            subtotal = 0
            tax_rate = 0.18 # 18% GST

            # Track items for detail creation
            sale_details_batch = []
            for item in cart_items:
                qty = random.randint(1, 4)
                line_total = float(item.unit_price) * qty
                subtotal += line_total
                sale_details_batch.append((item, qty, line_total))

            tax_amt = subtotal * tax_rate
            total = subtotal + tax_amt

            bill_no = f"B{20260000 + i}"
            sale = Sale(
                bill_number=bill_no,
                customer_id=cust.id,
                employee_id=cashier.id,
                subtotal=subtotal,
                tax_amount=tax_amt,
                total_amount=total,
                payment_method=random.choice(['CASH', 'UPI', 'CARD']),
                sale_date=bill_date
            )
            db.session.add(sale)
            db.session.flush()

            for item, qty, ltotal in sale_details_batch:
                detail = SaleDetail(
                    sale_id=sale.id,
                    asset_id=item.id,
                    quantity=qty,
                    unit_price_at_sale=item.unit_price,
                    total_price=ltotal
                )
                db.session.add(detail)

                # Stock movement for historical sale
                move = StockMovement(
                    asset_id=item.id,
                    type='SALE',
                    quantity=-qty,
                    reference_id=bill_no,
                    notes=f"Historical checkout {bill_no}"
                )
                db.session.add(move)

        # 7. Wastage Records
        print("Generating Wastage Logs...")
        reasons = ['Expired', 'Damaged in Transit', 'Spoiled/Perished', 'Customer Return', 'Quality Issue']

        for i in range(15):
            prod = random.choice(product_objs)
            reason = random.choice(reasons)
            qty = random.randint(1, 5)
            impact = float(prod.purchase_cost) * qty
            report_date = datetime.now() - timedelta(days=random.randint(0, 25))

            wst = WastageRecord(
                product_id=prod.id,
                quantity_wasted=qty,
                reason=reason,
                cost_impact=impact,
                reported_by=admin.id,
                notes=f"Seeded historical wastage for {prod.name}",
                created_at=report_date
            )
            db.session.add(wst)
            db.session.flush()

            # Record Stock Movement
            move = StockMovement(
                asset_id=prod.id,
                type='WASTAGE',
                quantity=-qty,
                reference_id="SEED-WST",
                notes=f"Wastage: {reason}",
                created_at=report_date
            )
            db.session.add(move)

        # 8. Purchase Orders
        print("Generating Purchase Orders...")
        statuses = ['Pending', 'Ordered', 'Shipped', 'Received']

        for i in range(15):
            supplier = random.choice(supplier_objs)
            status = random.choice(statuses)
            report_date = datetime.now() - timedelta(days=random.randint(0, 35))

            po_number = f"PO-2026-{100+i}"

            new_po = PurchaseOrder(
                po_number=po_number,
                supplier_id=supplier.id,
                status=status,
                order_date=report_date.date(),
                expected_delivery_date=(report_date + timedelta(days=7)).date(),
                created_by=admin.id,
                total_cost=0
            )
            if status == 'Received':
                new_po.received_date = report_date + timedelta(days=5)

            db.session.add(new_po)
            db.session.flush()

            # Add 2-4 items per PO
            po_total = 0
            po_items = random.sample(product_objs, random.randint(2, 4))
            for prod in po_items:
                qty = random.randint(20, 100)
                cost = float(prod.purchase_cost)
                line_total = cost * qty
                po_total += line_total

                item = PurchaseOrderItem(
                    purchase_order_id=new_po.id,
                    product_id=prod.id,
                    quantity_ordered=qty,
                    unit_cost=cost,
                    line_total=line_total
                )
                db.session.add(item)

                # If received, increase stock and log movement
                if status == 'Received':
                    prod.stock_quantity += qty
                    move = StockMovement(
                        asset_id=prod.id,
                        type='PURCHASE',
                        quantity=qty,
                        reference_id=po_number,
                        notes=f"Initial seed restock from {supplier.name}",
                        created_at=new_po.received_date
                    )
                    db.session.add(move)

            new_po.total_cost = po_total

        # 9. Audit Logs Backfill
        print("Generating Historical Audit Logs...")
        audit_templates = [
            ("Auth", "Login", "User logged into the system"),
            ("Billing", "Created", "Bill B83726451 completed for 1250.00"),
            ("Product Stock", "Created", "New product registered: Britannia Milk Bikis"),
            ("Staff", "Created", "New staff member authorized: Ramesh Kumar"),
            ("Wastage", "Created", "Logged wastage for Amul Milk: 5 units (Expired)"),
            ("Procurement", "Received", "Marked Purchase Order PO-2026-104 as Received"),
            ("Settings", "Updated", "Updated system notification preferences")
        ]

        for i in range(30):
            module, action, base_desc = random.choice(audit_templates)
            report_date = datetime.now() - timedelta(days=random.randint(0, 25))
            user = random.choice(staff_users)

            log = ActivityLog(
                user_id=user.id,
                module=module,
                action=action,
                description=f"{user.first_name} {user.last_name}: {base_desc}",
                ip_address=f"192.168.1.{random.randint(10, 100)}",
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
                created_at=report_date
            )
            db.session.add(log)

        db.session.commit()
        print("✅ Supermarket Seeding COMPLETE!")

        # Row Counts
        print("\n📊 Database Summary:")
        print(f"Categories: {AssetCategory.query.count()}")
        print(f"Products: {Asset.query.count()}")
        print(f"Suppliers: {Supplier.query.count()}")
        print(f"Staff Users: {User.query.count()}")
        print(f"Customers: {Customer.query.count()}")
        print(f"Total Bills: {Sale.query.count()}")
        print(f"Wastage Logs: {WastageRecord.query.count()}")
        print(f"Purchase Orders: {PurchaseOrder.query.count()}")
        print(f"Audit Logs: {ActivityLog.query.count()}")
        print(f"Stock Movements: {StockMovement.query.count()}")

if __name__ == '__main__':
    seed()
