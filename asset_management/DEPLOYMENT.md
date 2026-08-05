# Deployment Guide (Production)

## 1. Backend (Gunicorn/Nginx)
1. Use Gunicorn as the WSGI server: `gunicorn -w 4 -b 0.0.0.0:5001 "backend.app:create_app()"`.
2. Configure Nginx as a reverse proxy for port 5001.
3. Ensure `Config.DEBUG = False` in production.

## 2. Frontend (Vite Build)
1. Run `npm run build` in the `frontend/` directory.
2. Serve the generated `dist/` folder using Nginx or a static host like Vercel/Netlify.
3. Ensure the `axios` base URL points to your production API.

## 3. Database
- Use a managed MySQL instance (AWS RDS, DigitalOcean, etc.).
- Ensure proper backup strategies are in place.

## 4. Environment Variables
- Set all keys (`SECRET_KEY`, `OPENROUTER_API_KEY`, etc.) as secure environment variables on your host.
