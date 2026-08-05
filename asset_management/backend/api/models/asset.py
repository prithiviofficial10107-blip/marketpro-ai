from backend.api.models.base import BaseModel
from backend.extensions import db

class AssetCategory(BaseModel):
    __tablename__ = 'asset_categories'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    prefix = db.Column(db.String(10))
    description = db.Column(db.Text)
    status = db.Column(db.Enum('active', 'inactive'), default='active')

class Asset(BaseModel):
    __tablename__ = 'assets'

    id = db.Column(db.Integer, primary_key=True)
    asset_tag = db.Column(db.String(50), unique=True, nullable=False) # Functioning as Barcode/SKU
    name = db.Column(db.String(100), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('asset_categories.id'), nullable=False)
    supplier_id = db.Column(db.Integer, db.ForeignKey('suppliers.id'))
    serial_number = db.Column(db.String(100), unique=True)
    model = db.Column(db.String(100))
    brand = db.Column(db.String(100))

    # Financials
    purchase_date = db.Column(db.Date)
    purchase_cost = db.Column(db.Numeric(15, 2), default=0.00) # This remains as the COST PRICE
    unit_price = db.Column(db.Numeric(15, 2), default=0.00)     # This is the SELLING PRICE

    # Stock Management
    unit_of_measure = db.Column(db.String(20), default='pc') # kg, pkt, pc, ltr
    stock_quantity = db.Column(db.Integer, default=0)
    low_stock_threshold = db.Column(db.Integer, default=5)
    reorder_level = db.Column(db.Integer, default=10)
    expiry_date = db.Column(db.Date)

    status = db.Column(db.Enum('available', 'assigned', 'in_repair', 'damaged', 'retired', 'disposed'), default='available')
    specifications = db.Column(db.JSON)
    warranty_expiry = db.Column(db.Date)

    category = db.relationship('AssetCategory', backref='assets')
    supplier = db.relationship('Supplier', backref='assets')

    def to_dict(self):
        return {
            'id': self.id,
            'asset_tag': self.asset_tag,
            'name': self.name,
            'category_id': self.category_id,
            'category_name': self.category.name if self.category else None,
            'supplier_id': self.supplier_id,
            'supplier_name': self.supplier.name if self.supplier else None,
            'serial_number': self.serial_number,
            'model': self.model,
            'brand': self.brand,
            'purchase_date': self.purchase_date.isoformat() if self.purchase_date else None,
            'cost_price': float(self.purchase_cost) if self.purchase_cost else 0,
            'unit_price': float(self.unit_price) if self.unit_price else 0,
            'unit_of_measure': self.unit_of_measure,
            'stock_quantity': self.stock_quantity,
            'low_stock_threshold': self.low_stock_threshold,
            'reorder_level': self.reorder_level,
            'expiry_date': self.expiry_date.isoformat() if self.expiry_date else None,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Location(BaseModel):
    __tablename__ = 'locations'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    address = db.Column(db.Text)
