from flask import jsonify

def success_response(data=None, message="Success", status_code=200):
    response = {
        "status": "success",
        "message": message
    }
    if data is not None:
        response["data"] = data
    return response, status_code

def error_response(message="An error occurred", status_code=400, errors=None):
    response = {
        "status": "error",
        "message": message
    }
    if errors:
        response["errors"] = errors
    return response, status_code
