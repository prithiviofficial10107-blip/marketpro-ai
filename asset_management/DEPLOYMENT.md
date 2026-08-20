# Deployment Guide (Production)

## 1. Backend (Render/Gunicorn)
For a Render web service, use these settings:

- **Root Directory:** `asset_management`
- **Build Command:** `pip install -r backend/requirements.txt`
- **Start Command:** `gunicorn --bind 0.0.0.0:$PORT backend.app:app`
- **Health Check Path:** `/api/health`

The root directory is important because `backend/app.py` uses imports such as
`from backend.config import Config`. Running `app:app` from `backend/` makes
Python look for a top-level `backend` package that is not on its import path.

For a local/server environment where the port is fixed, use:
`gunicorn -w 4 -b 0.0.0.0:5001 backend.app:app` from `asset_management/`.

Ensure `Config.DEBUG = False` in production.

## 2. Frontend (Vite Build)
1. Run `npm run build` in the `frontend/` directory.
2. Serve the generated `dist/` folder using Nginx or a static host like Vercel/Netlify.
3. Ensure the `axios` base URL points to your production API.

## 3. Database
- Use a managed MySQL instance (AWS RDS, DigitalOcean, etc.).
- Ensure proper backup strategies are in place.

## 4. Environment Variables
- Set all keys (`SECRET_KEY`, `OPENROUTER_API_KEY`, etc.) as secure environment variables on your host.
- Set `CORS_ORIGINS=https://marketpro-ai-k36n-two.vercel.app` on Render.
- Set `FRONTEND_URL=https://marketpro-ai-k36n-two.vercel.app` on Render.

The backend already reads `CORS_ORIGINS` and passes it to Flask-CORS. Do not
include the frontend route `/login` in the origin value.
