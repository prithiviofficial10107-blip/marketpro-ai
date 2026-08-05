import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'backend', 'assets.db')

if not os.path.exists(db_path):
    print(f"DB not found at {db_path}")
else:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM assets LIMIT 1")
    row = cursor.fetchone()
    if row:
        print("Asset Row Data:")
        for key in row.keys():
            print(f"{key}: {row[key]}")
    else:
        print("No assets found in DB.")

    cursor.execute("SELECT * FROM asset_categories")
    categories = cursor.fetchall()
    print("\nAll Categories:")
    for cat in categories:
        print(f"ID: {cat['id']}, Name: {cat['name']}")

    conn.close()
