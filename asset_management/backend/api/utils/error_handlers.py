import traceback
from flask import current_app
from backend.api.utils.responses import error_response
from sqlalchemy.exc import SQLAlchemyError

def register_error_handlers(app):
    @app.errorhandler(404)
    def not_found(e):
        return error_response("Resource not found", 404)

    @app.errorhandler(403)
    def forbidden(e):
        return error_response("Access forbidden", 403)

    @app.errorhandler(429)
    def rate_limit_handler(e):
        return error_response("Too many requests. Please try again later.", 429)

    @app.errorhandler(SQLAlchemyError)
    def handle_db_error(e):
        current_app.logger.error(f"Database Error: {str(e)}\n{traceback.format_exc()}")
        return error_response(f"Database error occurred", 500)

    @app.errorhandler(Exception)
    def handle_generic_error(e):
        current_app.logger.error(f"Unhandled Exception: {str(e)}\n{traceback.format_exc()}")
        return error_response(f"An unexpected server error occurred", 500)
