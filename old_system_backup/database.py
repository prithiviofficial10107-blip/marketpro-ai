import os
import sqlite3
from datetime import datetime

import mysql.connector
from mysql.connector import Error

HOST = os.getenv("MYSQL_HOST", "localhost")
PORT = int(os.getenv("MYSQL_PORT", "3306"))
USER = os.getenv("MYSQL_USER", "root")
PASSWORD = os.getenv("MYSQL_PASSWORD", "your_password")
DATABASE = os.getenv("MYSQL_DATABASE", "supermarket")
DB_FILE = os.path.join(os.path.dirname(__file__), "supermarket.db")


def get_connection():
    try:
        conn = mysql.connector.connect(
            host=HOST,
            port=PORT,
            user=USER,
            password=PASSWORD,
            database=DATABASE,
            autocommit=False,
        )
        return conn, "mysql"
    except Error:
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        return conn, "sqlite"


def _quote(value):
    if value is None:
        return "NULL"
    if isinstance(value, (int, float, bool)):
        return str(value)
    return "'" + str(value).replace("'", "''") + "'"


def _cursor(conn, backend):
    if backend == "mysql":
        return conn.cursor(dictionary=True)
    return conn.cursor()


def _fetch_all(cursor, backend):
    rows = cursor.fetchall()
    if backend == "sqlite":
        return [dict(row) for row in rows]
    return rows


def init_db():
    conn, backend = get_connection()
    try:
        cursor = _cursor(conn, backend)
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                description TEXT
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS suppliers (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                contact_person TEXT,
                phone TEXT,
                email TEXT,
                address TEXT
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                category_id INTEGER,
                supplier_id INTEGER,
                price REAL NOT NULL,
                barcode TEXT,
                description TEXT,
                created_at TEXT
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS stock (
                id INTEGER PRIMARY KEY,
                product_id INTEGER NOT NULL UNIQUE,
                quantity INTEGER NOT NULL DEFAULT 0,
                low_stock_threshold INTEGER DEFAULT 5,
                updated_at TEXT
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS customers (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                phone TEXT,
                email TEXT,
                address TEXT,
                created_at TEXT
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS employees (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                role TEXT,
                phone TEXT,
                email TEXT,
                created_at TEXT
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS sales (
                id INTEGER PRIMARY KEY,
                customer_id INTEGER,
                employee_id INTEGER,
                total_amount REAL NOT NULL,
                sale_date TEXT NOT NULL
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS sales_details (
                id INTEGER PRIMARY KEY,
                sale_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL,
                unit_price REAL NOT NULL,
                total_price REAL NOT NULL
            )
            """
        )
        conn.commit()
        _seed_data(conn, backend)
    finally:
        conn.close()


def _seed_data(conn, backend):
    cursor = _cursor(conn, backend)
    cursor.execute("SELECT COUNT(*) AS count FROM categories")
    if _fetch_all(cursor, backend)[0]["count"] > 0:
        return

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    category_rows = [
        (1, "Beverages", "Soft drinks, juices, tea"),
        (2, "Grains", "Rice, flour, pulses"),
        (3, "Dairy", "Milk, yogurt, butter"),
        (4, "Cleaning", "Soap, detergent, sanitizer"),
        (5, "Produce", "Vegetables and fruits"),
    ]
    supplier_rows = [
        (1, "Fresh Farms", "Mina", "9876543210", "fresh@example.com", "North Street"),
        (2, "Daily Dairy", "Ravi", "9123456780", "daily@example.com", "West Avenue"),
        (3, "Golden Foods", "Anu", "9988776655", "golden@example.com", "Main Road"),
        (4, "CleanCo", "Bharat", "9034567890", "clean@example.com", "East Lane"),
        (5, "Market Link", "Suresh", "9090909090", "market@example.com", "Central Market"),
    ]
    product_rows = [
        (1, "Rice", 2, 3, 65.0, "RICE100", "Premium basmati rice", now),
        (2, "Milk", 3, 2, 45.0, "MILK200", "Fresh toned milk", now),
        (3, "Bread", 5, 1, 35.0, "BRD300", "Whole wheat bread", now),
        (4, "Soap", 4, 4, 25.0, "SOAP400", "Antibacterial soap", now),
        (5, "Juice", 1, 3, 80.0, "JUI500", "Orange juice", now),
        (6, "Tea", 1, 3, 60.0, "TEA600", "Green tea", now),
        (7, "Eggs", 3, 1, 12.0, "EGG700", "Farm eggs", now),
        (8, "Flour", 2, 3, 55.0, "FLOUR800", "Refined flour", now),
    ]
    stock_rows = [
        (1, 1, 120, 20, now),
        (2, 2, 50, 10, now),
        (3, 3, 15, 5, now),
        (4, 4, 0, 5, now),
        (5, 5, 30, 10, now),
        (6, 6, 25, 8, now),
        (7, 7, 10, 5, now),
        (8, 8, 40, 10, now),
    ]
    customer_rows = [
        (1, "Arun Kumar", "9000000001", "arun@example.com", "Mylapore", now),
        (2, "Neha Rao", "9000000002", "neha@example.com", "Anna Nagar", now),
        (3, "Karthik", "9000000003", "karthik@example.com", "T Nagar", now),
    ]
    employee_rows = [
        (1, "Priya", "Cashier", "9100000001", "priya@example.com", now),
        (2, "Rajan", "Store Manager", "9100000002", "rajan@example.com", now),
    ]

    for row in category_rows:
        cursor.execute(
            f"INSERT INTO categories (id, name, description) VALUES ({row[0]}, {_quote(row[1])}, {_quote(row[2])})"
        )
    for row in supplier_rows:
        cursor.execute(
            f"INSERT INTO suppliers (id, name, contact_person, phone, email, address) VALUES ({row[0]}, {_quote(row[1])}, {_quote(row[2])}, {_quote(row[3])}, {_quote(row[4])}, {_quote(row[5])})"
        )
    for row in product_rows:
        cursor.execute(
            f"INSERT INTO products (id, name, category_id, supplier_id, price, barcode, description, created_at) VALUES ({row[0]}, {_quote(row[1])}, {row[2]}, {row[3]}, {row[4]}, {_quote(row[5])}, {_quote(row[6])}, {_quote(row[7])})"
        )
    for row in stock_rows:
        cursor.execute(
            f"INSERT INTO stock (id, product_id, quantity, low_stock_threshold, updated_at) VALUES ({row[0]}, {row[1]}, {row[2]}, {row[3]}, {_quote(row[4])})"
        )
    for row in customer_rows:
        cursor.execute(
            f"INSERT INTO customers (id, name, phone, email, address, created_at) VALUES ({row[0]}, {_quote(row[1])}, {_quote(row[2])}, {_quote(row[3])}, {_quote(row[4])}, {_quote(row[5])})"
        )
    for row in employee_rows:
        cursor.execute(
            f"INSERT INTO employees (id, name, role, phone, email, created_at) VALUES ({row[0]}, {_quote(row[1])}, {_quote(row[2])}, {_quote(row[3])}, {_quote(row[4])}, {_quote(row[5])})"
        )
    conn.commit()


def get_dashboard_stats():
    conn, backend = get_connection()
    try:
        cursor = _cursor(conn, backend)
        cursor.execute("SELECT COUNT(*) AS count FROM products")
        total_products = _fetch_all(cursor, backend)[0]["count"]

        cursor.execute("SELECT COUNT(*) AS count FROM categories")
        total_categories = _fetch_all(cursor, backend)[0]["count"]

        cursor.execute("SELECT COALESCE(SUM(quantity), 0) AS count FROM stock")
        total_stock = _fetch_all(cursor, backend)[0]["count"]

        cursor.execute("SELECT COUNT(*) AS count FROM stock WHERE quantity <= low_stock_threshold")
        low_stock_products = _fetch_all(cursor, backend)[0]["count"]

        cursor.execute("SELECT COUNT(*) AS count FROM sales WHERE DATE(sale_date) = CURRENT_DATE")
        todays_sales = _fetch_all(cursor, backend)[0]["count"]

        cursor.execute("SELECT COALESCE(SUM(total_amount), 0) AS total FROM sales")
        total_revenue = _fetch_all(cursor, backend)[0]["total"]

        return {
            "total_products": total_products,
            "total_categories": total_categories,
            "total_stock": total_stock,
            "low_stock_products": low_stock_products,
            "todays_sales": todays_sales,
            "total_revenue": round(float(total_revenue), 2),
        }
    finally:
        conn.close()


def get_meta_data():
    conn, backend = get_connection()
    try:
        cursor = _cursor(conn, backend)
        cursor.execute("SELECT id, name FROM categories ORDER BY name")
        categories = _fetch_all(cursor, backend)
        cursor.execute("SELECT id, name FROM suppliers ORDER BY name")
        suppliers = _fetch_all(cursor, backend)
        cursor.execute("SELECT id, name FROM customers ORDER BY name")
        customers = _fetch_all(cursor, backend)
        cursor.execute("SELECT id, name FROM employees ORDER BY name")
        employees = _fetch_all(cursor, backend)
        return {"categories": categories, "suppliers": suppliers, "customers": customers, "employees": employees}
    finally:
        conn.close()


def get_products(search=""):
    conn, backend = get_connection()
    try:
        cursor = _cursor(conn, backend)
        query = (
            "SELECT p.id, p.name, p.category_id, p.supplier_id, p.price, p.description, p.barcode, "
            "c.name AS category_name, s.name AS supplier_name, COALESCE(st.quantity, 0) AS stock_quantity "
            "FROM products p "
            "LEFT JOIN categories c ON c.id = p.category_id "
            "LEFT JOIN suppliers s ON s.id = p.supplier_id "
            "LEFT JOIN stock st ON st.product_id = p.id"
        )
        if search:
            term = search.replace("'", "''")
            query += (
                " WHERE LOWER(p.name) LIKE '%" + term.lower() + "%' "
                "OR LOWER(COALESCE(c.name, '')) LIKE '%" + term.lower() + "%' "
                "OR LOWER(COALESCE(s.name, '')) LIKE '%" + term.lower() + "%'"
            )
        query += " ORDER BY p.name"
        cursor.execute(query)
        return _fetch_all(cursor, backend)
    finally:
        conn.close()


def add_product(payload):
    conn, backend = get_connection()
    try:
        cursor = _cursor(conn, backend)
        product_id = 1
        cursor.execute("SELECT MAX(id) AS max_id FROM products")
        max_id_row = _fetch_all(cursor, backend)
        if max_id_row and max_id_row[0].get("max_id"):
            product_id = int(max_id_row[0]["max_id"]) + 1

        name = payload.get("name", "")
        category_id = payload.get("category_id", 1)
        supplier_id = payload.get("supplier_id", 1)
        price = float(payload.get("price", 0))
        barcode = payload.get("barcode", "")
        description = payload.get("description", "")
        stock_quantity = int(payload.get("stock_quantity", 0))

        cursor.execute(
            "INSERT INTO products (id, name, category_id, supplier_id, price, barcode, description, created_at) "
            f"VALUES ({product_id}, { _quote(name) }, { _quote(category_id) }, { _quote(supplier_id) }, { _quote(price) }, { _quote(barcode) }, { _quote(description) }, { _quote(datetime.now().strftime('%Y-%m-%d %H:%M:%S')) })"
        )
        cursor.execute(
            "INSERT INTO stock (id, product_id, quantity, low_stock_threshold, updated_at) "
            f"VALUES ({product_id}, {product_id}, { _quote(stock_quantity) }, 5, { _quote(datetime.now().strftime('%Y-%m-%d %H:%M:%S')) })"
        )
        conn.commit()
        return product_id
    finally:
        conn.close()


def update_product(product_id, payload):
    conn, backend = get_connection()
    try:
        cursor = _cursor(conn, backend)
        if not payload:
            return False
        sql_parts = []
        if "name" in payload:
            sql_parts.append(f"name = {_quote(payload['name'])}")
        if "category_id" in payload:
            sql_parts.append(f"category_id = {_quote(payload['category_id'])}")
        if "supplier_id" in payload:
            sql_parts.append(f"supplier_id = {_quote(payload['supplier_id'])}")
        if "price" in payload:
            sql_parts.append(f"price = {_quote(float(payload['price']))}")
        if "barcode" in payload:
            sql_parts.append(f"barcode = {_quote(payload['barcode'])}")
        if "description" in payload:
            sql_parts.append(f"description = {_quote(payload['description'])}")
        if not sql_parts:
            return False
        cursor.execute(f"UPDATE products SET {', '.join(sql_parts)} WHERE id = {product_id}")
        conn.commit()
        return True
    finally:
        conn.close()


def delete_product(product_id):
    conn, backend = get_connection()
    try:
        cursor = _cursor(conn, backend)
        cursor.execute(f"DELETE FROM stock WHERE product_id = {product_id}")
        cursor.execute(f"DELETE FROM products WHERE id = {product_id}")
        conn.commit()
        return True
    except Exception:
        return False
    finally:
        conn.close()


def update_stock(payload):
    conn, backend = get_connection()
    try:
        cursor = _cursor(conn, backend)
        product_id = payload.get("product_id")
        action = payload.get("action", "increase")
        quantity = int(payload.get("quantity", 0))
        if not product_id:
            return False
        cursor.execute(f"SELECT quantity FROM stock WHERE product_id = {product_id}")
        row = _fetch_all(cursor, backend)
        if not row:
            return False
        current_quantity = int(row[0]["quantity"])
        if action == "decrease":
            if current_quantity < quantity:
                return False
            new_quantity = current_quantity - quantity
        else:
            new_quantity = current_quantity + quantity
        cursor.execute(
            f"UPDATE stock SET quantity = {new_quantity}, updated_at = {_quote(datetime.now().strftime('%Y-%m-%d %H:%M:%S'))} WHERE product_id = {product_id}"
        )
        conn.commit()
        return True
    finally:
        conn.close()


def create_sale(payload):
    conn, backend = get_connection()
    try:
        cursor = _cursor(conn, backend)
        items = payload.get("items", [])
        if not items:
            raise ValueError("Please add at least one item.")

        customer_id = payload.get("customer_id", 1)
        employee_id = payload.get("employee_id", 1)
        sale_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        total_amount = 0.0

        for item in items:
            product_id = item.get("product_id")
            quantity = int(item.get("quantity", 0))
            if not product_id or quantity <= 0:
                raise ValueError("Each item must have a valid product and quantity.")
            cursor.execute(f"SELECT quantity FROM stock WHERE product_id = {product_id}")
            stock_rows = _fetch_all(cursor, backend)
            if not stock_rows:
                raise ValueError("Product not found in stock.")
            current_stock = int(stock_rows[0]["quantity"])
            if current_stock < quantity:
                raise ValueError("Stock is insufficient for one or more items.")
            cursor.execute(f"SELECT price FROM products WHERE id = {product_id}")
            price_rows = _fetch_all(cursor, backend)
            if not price_rows:
                raise ValueError("Product not found.")
            unit_price = float(price_rows[0]["price"])
            total_amount += unit_price * quantity

        cursor.execute(
            "INSERT INTO sales (customer_id, employee_id, total_amount, sale_date) "
            f"VALUES ({customer_id}, {employee_id}, {total_amount}, {_quote(sale_date)})"
        )
        sale_id = cursor.lastrowid

        for item in items:
            product_id = item.get("product_id")
            quantity = int(item.get("quantity", 0))
            cursor.execute(f"SELECT price FROM products WHERE id = {product_id}")
            price_rows = _fetch_all(cursor, backend)
            unit_price = float(price_rows[0]["price"])
            total_price = round(unit_price * quantity, 2)
            cursor.execute(
                "INSERT INTO sales_details (sale_id, product_id, quantity, unit_price, total_price) "
                f"VALUES ({sale_id}, {product_id}, {quantity}, {unit_price}, {total_price})"
            )
            cursor.execute(
                f"UPDATE stock SET quantity = quantity - {quantity}, updated_at = {_quote(sale_date)} WHERE product_id = {product_id}"
            )

        conn.commit()
        return {"sale_id": sale_id, "total_amount": round(total_amount, 2)}
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def get_chart_data():
    conn, backend = get_connection()
    try:
        cursor = _cursor(conn, backend)
        cursor.execute(
            "SELECT c.name AS category, COALESCE(SUM(st.quantity), 0) AS stock "
            "FROM categories c LEFT JOIN products p ON p.category_id = c.id "
            "LEFT JOIN stock st ON st.product_id = p.id "
            "GROUP BY c.name ORDER BY stock DESC"
        )
        stock_by_category = _fetch_all(cursor, backend)

        cursor.execute(
            "SELECT SUBSTR(sale_date, 1, 7) AS month, COALESCE(SUM(total_amount), 0) AS revenue "
            "FROM sales GROUP BY SUBSTR(sale_date, 1, 7) ORDER BY month"
        )
        monthly_sales = _fetch_all(cursor, backend)

        cursor.execute(
            "SELECT p.name AS product, COALESCE(SUM(sd.quantity), 0) AS total_units "
            "FROM products p LEFT JOIN sales_details sd ON sd.product_id = p.id "
            "GROUP BY p.id, p.name ORDER BY total_units DESC LIMIT 5"
        )
        top_products = _fetch_all(cursor, backend)

        return {
            "stock_by_category": stock_by_category,
            "monthly_sales": monthly_sales,
            "top_products": top_products,
        }
    finally:
        conn.close()


