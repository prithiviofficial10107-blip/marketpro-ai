# Installation Guide

## 1. Prerequisites
- Python 3.9+
- Node.js 18+
- MySQL 8.0+

## 2. Database Setup
1. Create a MySQL database named `asset_management`.
2. Run the schema located at `database/schema.sql`.

## 3. Backend Setup
1. Navigate to `backend/`.
2. Create a virtual environment: `python -m venv venv`.
3. Activate venv: `venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Mac/Linux).
4. Install dependencies: `pip install -r requirements.txt`.
5. Create a `.env` file based on `config.py` needs:
   ```env
   DATABASE_URL=mysql+mysqlconnector://root:password@localhost/asset_management
   SECRET_KEY=your-secret
   JWT_SECRET_KEY=your-jwt-secret
   OPENROUTER_API_KEY=your-openrouter-key
   ```
6. Start server: `python app.py`.

## 4. Frontend Setup
1. Navigate to `frontend/`.
2. Install dependencies: `npm install`.
3. Start development server: `npm run dev`.
4. Open `http://localhost:5173`.
