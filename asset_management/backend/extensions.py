from flask import request
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_migrate import Migrate
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_marshmallow import Marshmallow

db = SQLAlchemy()
jwt = JWTManager()
cors = CORS()
migrate = Migrate()
ma = Marshmallow()
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["1000 per day", "200 per hour"],
    storage_uri="memory://",
    default_limits_exempt_when=lambda: request.method == "OPTIONS"
)
