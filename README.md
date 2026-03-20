# Trust Education CRM/ERP

Monorepo for an education CRM/ERP with:

- `Backend/`: Node.js + Express + MongoDB API, Socket.IO, reminders, email services
- `Frontend/`: Next.js 14 frontend for Vercel

## Project Layout

```text
Backend/    Express API for Render
Frontend/   Next.js app for Vercel
render.yaml Render blueprint for the backend
```

## Local Setup

1. Install dependencies from the repo root:

```bash
npm install
```

2. Create environment files:

- Copy `Backend/.env.example` to `Backend/.env`
- Copy `Frontend/.env.example` to `Frontend/.env.local`

3. Set the minimum required values:

Backend:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
FRONTEND_URL=http://localhost:3000
```

Frontend:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

4. Run the apps:

```bash
npm run dev:backend
npm run dev:frontend
```

## Environment Variables

Backend uses environment variables only. The main production variables are:

- `MONGO_URI`
- `JWT_SECRET`
- `PORT`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `EMAIL_FROM`
- `FRONTEND_URL`
- `FRONTEND_URLS`
- `BACKEND_URL`

Frontend is a Next.js app, so the public API base URL must use:

- `NEXT_PUBLIC_API_URL`

The code still accepts `REACT_APP_API_URL` as a compatibility alias, but `NEXT_PUBLIC_API_URL` is the deployment standard for this repo.

## Render Deployment

Create a Render Web Service from this repo with:

- Root Directory: `Backend`
- Build Command: `npm install --legacy-peer-deps`
- Start Command: `npm start`
- Health Check Path: `/health`
- Runtime: `Node`

Required backend environment variables:

- `MONGO_URI`
- `JWT_SECRET`
- `FRONTEND_URL`

Recommended additional backend variables:

- `FRONTEND_URLS`
- `BACKEND_URL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `EMAIL_FROM`
- `FOLLOWUP_REMINDER_ENABLED=true`
- `FOLLOWUP_REMINDER_INTERVAL_MINUTES=15`
- `FOLLOWUP_REMINDER_FREQUENCY_MINUTES=180`
- `FOLLOWUP_DAILY_SUMMARY_ENABLED=false`
- `LOG_LEVEL=info`

Notes:

- The backend listens on `process.env.PORT` with a local fallback to `5000`
- CORS and Socket.IO origins are controlled by `FRONTEND_URL`, `FRONTEND_URLS`, and optional `SOCKET_ORIGIN`
- Health checks are available at `/health`

## Vercel Deployment

Import the same repo into Vercel with:

- Framework Preset: `Next.js`
- Root Directory: `Frontend`
- Install Command: `npm install --legacy-peer-deps`
- Build Command: `npm run build`
- Output Directory: leave blank

Required frontend environment variables:

- `NEXT_PUBLIC_API_URL=https://your-render-service.onrender.com/api`

Notes:

- Do not deploy the repo root as a Vercel app
- The frontend uses the deployed backend URL for both HTTP and Socket.IO
- Next.js rewrites `/api/*` to the configured backend when `NEXT_PUBLIC_API_URL` is set

## Verification Commands

From the repo root:

```bash
npm run build
```

Backend only:

```bash
cd Backend
npm start
```

Frontend only:

```bash
cd Frontend
npm run build
```

## GitHub Readiness

Before pushing:

- Keep `.env` and `.env.local` files out of git
- Do not commit generated logs or test artifacts
- Set production secrets only in Render/Vercel dashboards

This repository is configured to ignore local environment files, build artifacts, node modules, and generated deployment/test logs.
