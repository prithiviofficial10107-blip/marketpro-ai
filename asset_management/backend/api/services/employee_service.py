from backend.api.services.base_service import BaseService
from backend.api.models.employee import Employee

class EmployeeService(BaseService):
    model = Employee
