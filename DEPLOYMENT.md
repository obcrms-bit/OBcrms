# Auto Deployment

This project is set up so that GitHub is the source of truth.

If you push to the production branch, both hosting platforms should deploy automatically:

- Backend -> Render
- Frontend -> Vercel

## Production Branch

Use this branch for production deployments:

```bash
main
```

## Project Folders

- `Backend/` = Render backend service
- `Frontend/` = Vercel frontend project

## Normal Push Flow

From the project root:

```bash
git add .
git commit -m "update"
git push origin main
```

What happens next:

1. GitHub receives the new commit on `main`
2. Render detects the backend change and deploys the `Backend/` service
3. Vercel detects the frontend change and deploys the `Frontend/` app
4. The latest code becomes live after both builds finish

## Render Settings

Service type:

- Web Service

Connect this repo to Render and make sure these settings are used:

- Branch: `main`
- Root Directory: `Backend`
- Build Command: `npm install --legacy-peer-deps`
- Start Command: `npm start`
- Health Check Path: `/health`
- Auto-Deploy: `On`

Environment variables to set manually in the Render dashboard:

- `MONGO_URI`
- `JWT_SECRET`
- `FRONTEND_URL`
- `FRONTEND_URLS`
- `BACKEND_URL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `EMAIL_FROM`
- `FOLLOWUP_REMINDER_ENABLED`
- `FOLLOWUP_REMINDER_INTERVAL_MINUTES`
- `FOLLOWUP_REMINDER_FREQUENCY_MINUTES`
- `FOLLOWUP_DAILY_SUMMARY_ENABLED`
- `LOG_LEVEL`

Important note:

- `render.yaml` in this repo already defines the backend blueprint and now pins deployment to `main`

## Vercel Settings

Connect this repo to Vercel and make sure these settings are used:

- Framework Preset: `Next.js`
- Production Branch: `main`
- Root Directory: `Frontend`
- Install Command: `npm install --legacy-peer-deps`
- Build Command: `npm run build`
- Output Directory: leave blank
- Auto-Deploy: enabled for Production

Environment variables to set manually in the Vercel dashboard:

- `NEXT_PUBLIC_API_URL=https://obcrms-backend.onrender.com/api`
- `REACT_APP_API_URL=https://obcrms-backend.onrender.com/api`
- `NEXT_PUBLIC_APP_NAME=Trust Education CRM`

Important note:

- `Frontend/vercel.json` is already correct for this repo
- The production branch is controlled in the Vercel dashboard, not in `vercel.json`

## Why This Works

- The backend already listens on `process.env.PORT`
- The backend already exposes `/health`
- CORS already supports configured frontend URLs and `*.vercel.app`
- The frontend already uses env-based API routing
- GitHub Actions in `.github/workflows/` already validate backend and frontend changes on `main`

## How To Test Auto Deployment

1. Make a very small safe change, like editing a text line in the frontend
2. Run:

```bash
git add .
git commit -m "test auto deploy"
git push origin main
```

3. Open GitHub and confirm the push reached `main`
4. Open Render and confirm a new deploy started for the backend
5. Open Vercel and confirm a new production deployment started for the frontend
6. After both finish, open the live site and verify the change is visible
7. Optionally test a backend-only change and confirm the Render deploy updates successfully

## Beginner Summary

You do not need to redeploy manually after every code change.

Once Render and Vercel are both connected to this GitHub repo and both are pointed at `main`, this is the only workflow you need:

```bash
git add .
git commit -m "update"
git push origin main
```

That push is the trigger for production deployment.
