import random
from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from backend.api.services.employee_service import EmployeeService
from backend.api.utils.responses import success_response, error_response
from backend.api.utils.schemas import employee_schema, employees_schema
from backend.api.auth.decorators import role_required, log_activity
from backend.api.models.employee import Employee

employees_bp = Blueprint('employees', __name__)
employees_bp.strict_slashes = False

@employees_bp.route('/', methods=['GET'])
@jwt_required()
def get_employees():
    employees = EmployeeService.get_all()
    return success_response(employees_schema.dump(employees))

@employees_bp.route('/', methods=['POST'])
@jwt_required()
@role_required(['admin', 'manager'])
@log_activity('Employees', 'Create Employee')
def create_employee():
    data = request.get_json()
    try:
        # Auto-generate employee_code if missing
        if not data.get('employee_code'):
            data['employee_code'] = f"EMP{random.randint(100, 999)}"
            # Ensure uniqueness
            while Employee.query.filter_by(employee_code=data['employee_code']).first():
                data['employee_code'] = f"EMP{random.randint(100, 999)}"

        # Validate data
        errors = employee_schema.validate(data)
        if errors:
            return error_response("Validation Error", 400, errors)

        new_employee = EmployeeService.create(**data)

        # Log audit
        from backend.api.utils.audit import log_audit
        log_audit("Staff", "Created", f"New staff member authorized: {new_employee.first_name} {new_employee.last_name}", target_id=new_employee.id)

        return success_response(employee_schema.dump(new_employee), "Employee created", 201)
    except Exception as e:
        return error_response(str(e))

@employees_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
@role_required(['admin'])
@log_activity('Employees', 'Delete Employee')
def delete_employee(id):
    emp = EmployeeService.get_by_id(id)
    name = f"{emp.first_name} {emp.last_name}" if emp else "Unknown"
    if EmployeeService.delete(id):
        # Log audit
        from backend.api.utils.audit import log_audit
        log_audit("Staff", "Deleted", f"Revoked access for {name}", target_id=id)
        return success_response(message="Employee deleted")
    return error_response("Employee not found", 404)
