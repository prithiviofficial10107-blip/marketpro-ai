import sys
sys.path.insert(0, r'C:\Users\acer\Pictures\supermarket_ai')
from database import init_db, get_products, create_sale
from ai import get_ai_answer

init_db()
print('OK init_db')
print('PRODUCTS COUNT', len(get_products()))
print('AI MILK PRICE', get_ai_answer('milk price'))
try:
    result = create_sale({'customer_id': 1, 'employee_id': 1, 'items': [{'product_id': 2, 'quantity': 1}]})
    print('SALE OK', result)
except Exception as exc:
    print('SALE ERROR', exc)
