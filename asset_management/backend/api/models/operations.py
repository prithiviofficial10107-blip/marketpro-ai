from backend.api.models.base import BaseModel
from backend.extensions import db

class Assignment(BaseModel):
    __tablename__ = 'assignments'

    id = db.Column(db.Integer, primary_key=True)
    asset_id = db.Column(db.Integer, db.ForeignKey('assets.id'), nullable=False)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    assigned_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    assigned_date = db.Column(db.DateTime, default=db.func.current_timestamp())
    return_due_date = db.Column(db.Date)
    actual_return_date = db.Column(db.DateTime)
    status = db.Column(db.Enum('active', 'returned', 'overdue'), default='active')
    notes = db.Column(db.Text)

    def to_dict(self):
        return {
            'id': self.id,
            'asset_id': self.asset_id,
            'employee_id': self.employee_id,
            'assigned_date': self.assigned_date.isoformat() if self.assigned_date else None,
            'status': self.status
        }

class DamageReport(BaseModel):
    __tablename__ = 'damage_reports'

    id = db.Column(db.Integer, primary_key=True)
    asset_id = db.Column(db.Integer, db.ForeignKey('assets.id'), nullable=False)
    reported_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    damage_date = db.Column(db.Date, nullable=False)
    description = db.Column(db.Text, nullable=False)
    severity = db.Column(db.Enum('minor', 'major', 'critical'), default='minor')
    status = db.Column(db.Enum('pending', 'under_review', 'resolved', 'dismissed'), default='pending')

    def to_dict(self):
        return {
            'id': self.id,
            'asset_id': self.asset_id,
            'damage_date': self.damage_date.isoformat() if self.damage_date else None,
            'description': self.description,
            'severity': self.severity,
            'status': self.status
        }

class ServiceRecord(BaseModel):
    __tablename__ = 'service_records'

    id = db.Column(db.Integer, primary_key=True)
    asset_id = db.Column(db.Integer, db.ForeignKey('assets.id'), nullable=False)
    service_type = db.Column(db.String(100), nullable=False)
    provider = db.Column(db.String(255))
    service_date = db.Column(db.Date, nullable=False)
    completion_date = db.Column(db.Date)
    cost = db.Column(db.Numeric(15, 2), default=0.00)
    status = db.Column(db.Enum('scheduled', 'in_progress', 'completed', 'cancelled'), default='scheduled')

    def to_dict(self):
        return {
            'id': self.id,
            'asset_id': self.asset_id,
            'service_type': self.service_type,
            'provider': self.provider,
            'service_date': self.service_date.isoformat() if self.service_date else None,
            'completion_date': self.completion_date.isoformat() if self.completion_date else None,
            'cost': float(self.cost or 0),
            'status': self.status
        }

class Sale(BaseModel):
    __tablename__ = 'sales'
    id = db.Column(db.Integer, primary_key=True)
    bill_number = db.Column(db.String(20), unique=True, nullable=False)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'))
    employee_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    subtotal = db.Column(db.Numeric(15, 2), nullable=False)
    tax_amount = db.Column(db.Numeric(15, 2), default=0.00)
    discount_amount = db.Column(db.Numeric(15, 2), default=0.00)
    total_amount = db.Column(db.Numeric(15, 2), nullable=False)

    payment_method = db.Column(db.Enum('CASH', 'CARD', 'UPI', 'OTHERS'), default='CASH')
    sale_date = db.Column(db.DateTime, default=db.func.current_timestamp())

    details = db.relationship('SaleDetail', backref='sale', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'bill_number': self.bill_number,
            'customer_id': self.customer_id,
            'employee_id': self.employee_id,
            'subtotal': float(self.subtotal),
            'tax_amount': float(self.tax_amount),
            'discount_amount': float(self.discount_amount),
            'total_amount': float(self.total_amount),
            'payment_method': self.payment_method,
            'sale_date': self.sale_date.isoformat(),
            'details': [d.to_dict() for d in self.details]
        }

class SaleDetail(BaseModel):
    __tablename__ = 'sale_details'
    id = db.Column(db.Integer, primary_key=True)
    sale_id = db.Column(db.Integer, db.ForeignKey('sales.id'), nullable=False)
    asset_id = db.Column(db.Integer, db.ForeignKey('assets.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price_at_sale = db.Column(db.Numeric(15, 2), nullable=False)
    total_price = db.Column(db.Numeric(15, 2), nullable=False)

    asset = db.relationship('Asset')

    def to_dict(self):
        return {
            'id': self.id,
            'asset_id': self.asset_id,
            'asset_name': self.asset.name if self.asset else 'Unknown',
            'quantity': self.quantity,
            'unit_price': float(self.unit_price_at_sale),
            'total_price': float(self.total_price)
        }

class StockMovement(BaseModel):
    __tablename__ = 'stock_movements'
    id = db.Column(db.Integer, primary_key=True)
    asset_id = db.Column(db.Integer, db.ForeignKey('assets.id'), nullable=False)
    type = db.Column(db.Enum('PURCHASE', 'SALE', 'ADJUSTMENT', 'WASTAGE'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False) # Positive for stock in, Negative for stock out
    reference_id = db.Column(db.String(50)) # Sale ID, Purchase ID, etc
    notes = db.Column(db.Text)

    asset = db.relationship('Asset', backref='movements')

    def to_dict(self):
        return {
            'id': self.id,
            'asset_id': self.asset_id,
            'asset_name': self.asset.name if self.asset else 'Unknown',
            'type': self.type,
            'quantity': self.quantity,
            'reference_id': self.reference_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class WastageRecord(BaseModel):
    __tablename__ = 'wastage_records'
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('assets.id'), nullable=False)
    quantity_wasted = db.Column(db.Integer, nullable=False)
    reason = db.Column(db.Enum('Expired', 'Damaged in Transit', 'Spoiled/Perished', 'Customer Return', 'Quality Issue'), nullable=False)
    cost_impact = db.Column(db.Numeric(15, 2), nullable=False)
    reported_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    notes = db.Column(db.Text)

    product = db.relationship('Asset')
    user = db.relationship('User')

    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'product_name': self.product.name if self.product else 'Unknown',
            'category_name': self.product.category.name if self.product and self.product.category else 'Unknown',
            'quantity_wasted': self.quantity_wasted,
            'reason': self.reason,
            'cost_impact': float(self.cost_impact),
            'reported_by_name': self.user.username if self.user else 'Unknown',
            'reported_date': self.created_at.isoformat() if self.created_at else None,
            'notes': self.notes
        }

class PurchaseOrder(BaseModel):
    __tablename__ = 'purchase_orders'
    id = db.Column(db.Integer, primary_key=True)
    po_number = db.Column(db.String(20), unique=True, nullable=False)
    supplier_id = db.Column(db.Integer, db.ForeignKey('suppliers.id'), nullable=False)
    status = db.Column(db.Enum('Pending', 'Ordered', 'Shipped', 'Received', 'Cancelled'), default='Pending')
    order_date = db.Column(db.Date, default=db.func.current_date())
    expected_delivery_date = db.Column(db.Date)
    received_date = db.Column(db.DateTime)
    total_cost = db.Column(db.Numeric(15, 2), default=0.00)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    supplier = db.relationship('Supplier')
    items = db.relationship('PurchaseOrderItem', backref='purchase_order', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'po_number': self.po_number,
            'supplier_name': self.supplier.name if self.supplier else 'Unknown',
            'status': self.status,
            'order_date': self.order_date.isoformat() if self.order_date else None,
            'expected_delivery_date': self.expected_delivery_date.isoformat() if self.expected_delivery_date else None,
            'received_date': self.received_date.isoformat() if self.received_date else None,
            'total_cost': float(self.total_cost),
            'items_count': len(self.items)
        }

class PurchaseOrderItem(BaseModel):
    __tablename__ = 'purchase_order_items'
    id = db.Column(db.Integer, primary_key=True)
    purchase_order_id = db.Column(db.Integer, db.ForeignKey('purchase_orders.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('assets.id'), nullable=False)
    quantity_ordered = db.Column(db.Integer, nullable=False)
    unit_cost = db.Column(db.Numeric(15, 2), nullable=False)
    line_total = db.Column(db.Numeric(15, 2), nullable=False)

    product = db.relationship('Asset')

    def to_dict(self):
        return {
            'id': self.id,
            'product_name': self.product.name if self.product else 'Unknown',
            'quantity_ordered': self.quantity_ordered,
            'unit_cost': float(self.unit_cost),
            'line_total': float(self.line_total)
        }
