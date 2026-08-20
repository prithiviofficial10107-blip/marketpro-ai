import os
from datetime import timedelta
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

_frontend_origins = os.environ.get('CORS_ORIGINS') or os.environ.get('FRONTEND_URL') or 'https://marketpro-ai-k36n-two.vercel.app,http://localhost:5173,http://127.0.0.1:5173'
CORS_ORIGINS = [origin.strip() for origin in _frontend_origins.split(',') if origin.strip()]

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key')
    SQLALCHEMY_DATABASE_URI = DATABASE_URL_FINAL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-dev-secret')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=2)
    CORS_ORIGINS = CORS_ORIGINS
    FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')

    # OpenRouter Config (Synced with root .env)
    OPENROUTER_API_KEY = os.environ.get('OPENROUTER_API_KEY') or os.environ.get('OPENAI_API_KEY')
    OPENROUTER_API_BASE = os.environ.get('OPENROUTER_API_BASE') or os.environ.get('OPENAI_API_BASE', 'https://openrouter.ai/api/v1')
    OPENROUTER_MODEL = os.environ.get('OPENROUTER_MODEL') or os.environ.get('OPENAI_MODEL', 'google/gemma-3-12b-it:free')
