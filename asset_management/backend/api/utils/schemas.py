from backend.extensions import ma
from backend.api.models.asset import Asset, AssetCategory
from backend.api.models.employee import Employee
from backend.api.models.user import User

from marshmallow import fields

class AssetSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Asset
        load_instance = True
        include_fk = True
        # Exclude to avoid collision with manual mapping below
        exclude = ("purchase_cost",)

    # Map purchase_cost to cost_price for the frontend
    cost_price = fields.Float(attribute="purchase_cost")
    category_name = fields.Method("get_category_name")

    def get_category_name(self, obj):
        return obj.category.name if obj.category else None

class EmployeeSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Employee
        load_instance = True

class UserSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = User
        load_instance = True
        exclude = ("password_hash", "verification_token", "reset_token")

asset_schema = AssetSchema()
assets_schema = AssetSchema(many=True)
employee_schema = EmployeeSchema()
employees_schema = EmployeeSchema(many=True)
user_schema = UserSchema()
