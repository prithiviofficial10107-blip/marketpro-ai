import os
from datetime import timedelta, timezone
from dotenv import load_dotenv

load_dotenv()

# Pre-calculate DB URL to avoid scoping issues in Config class
_db_url = os.environ.get('DATABASE_URL')
_placeholders = ['password', 'your_password', 'root:root', 'localhost/asset_management']

if not _db_url or any(p in _db_url.lower() for p in _placeholders):
    _basedir = os.path.abspath(os.path.dirname(__file__))
    DATABASE_URL_FINAL = 'sqlite:///' + os.path.join(_basedir, 'assets.db')
else:
    DATABASE_URL_FINAL = _db_url

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key')
    SQLALCHEMY_DATABASE_URI = DATABASE_URL_FINAL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-dev-secret')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=2)

    # OpenRouter Config (Synced with root .env)
    OPENROUTER_API_KEY = os.environ.get('OPENAI_API_KEY')
    OPENROUTER_API_BASE = os.environ.get('OPENAI_API_BASE', 'https://openrouter.ai/api/v1')
    OPENROUTER_MODEL = os.environ.get('OPENAI_MODEL', 'google/gemma-3-12b-it:free')
