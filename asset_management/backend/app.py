import os
from flask import Flask, request
from backend.config import Config
from backend.extensions import db, jwt, cors, migrate, ma, limiter
from datetime import datetime, timezone

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Disable strict slashes globally
    app.url_map.strict_slashes = False

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    allowed_origins = getattr(app.config, 'CORS_ORIGINS', ['http://localhost:5173'])
    cors.init_app(app, resources={r"/api/*": {
        "origins": allowed_origins,
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }})

    migrate.init_app(app, db)
    ma.init_app(app)
    limiter.init_app(app)

    # Register Blueprints
    from backend.api.routes.auth import auth_bp
    from backend.api.routes.assets import assets_bp
    from backend.api.routes.ai_agent_routes import ai_agent_bp
    from backend.api.routes.employees import employees_bp
    from backend.api.routes.dashboard import dashboard_bp
    from backend.api.routes.assignments import assignments_bp
    from backend.api.routes.admin import admin_bp
    from backend.api.routes.damaged import damaged_bp
    from backend.api.routes.service import service_bp
    from backend.api.routes.notifications import notifications_bp
    from backend.api.routes.reports import reports_bp
    from backend.api.routes.audit import audit_bp
    from backend.api.routes.billing import billing_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(assets_bp, url_prefix='/api/assets')
    app.register_blueprint(ai_agent_bp, url_prefix='/api/ai')
    app.register_blueprint(employees_bp, url_prefix='/api/employees')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(assignments_bp, url_prefix='/api/assignments')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(damaged_bp, url_prefix='/api/damaged')
    app.register_blueprint(service_bp, url_prefix='/api/service')
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')
    app.register_blueprint(audit_bp, url_prefix='/api/audit')
    app.register_blueprint(billing_bp, url_prefix='/api/billing')

    # Register Error Handlers
    from backend.api.utils.error_handlers import register_error_handlers
    register_error_handlers(app)

    @app.route('/')
    def root_redirect():
        """Smart Redirect: Automatically send browser users to the configured frontend."""
        from flask import redirect
        frontend_url = app.config.get('FRONTEND_URL', 'http://localhost:5173')
        return redirect(frontend_url)

    @app.route('/api/health')
    def health_check():
        return {'status': 'healthy', 'timestamp': datetime.now(timezone.utc).isoformat()}, 200

    @app.errorhandler(500)
    def handle_500(error):
        app.logger.error(f"Server Error: {error}")
        return {'status': 'error', 'message': 'Internal Server Error'}, 500

    @app.after_request
    def log_response_info(response):
        app.logger.info(f"Response: {response.status} for {request.url}")
        return response

    return app

if __name__ == '__main__':
    app = create_app()
    # Listen on 0.0.0.0 to allow access from local machine and Android emulator
    app.run(debug=True, host='0.0.0.0', port=5001)
