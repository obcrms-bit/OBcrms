# Frontend Vercel Deployment

Deploy the `Frontend` directory as the Vercel project root.

## Project Settings

- Framework Preset: `Next.js`
- Root Directory: `Frontend`
- Install Command: `npm install --legacy-peer-deps`
- Build Command: `npm run build`
- Output Directory: leave blank

## Required Environment Variables

Set these in the Vercel project before deploying:

- `NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com/api`

Optional:

- `NEXT_PUBLIC_APP_NAME=Trust Education CRM`
- `REACT_APP_API_URL=https://your-backend-url.onrender.com/api`

`NEXT_PUBLIC_API_URL` is the deployment standard for this Next.js app. `REACT_APP_API_URL` is only kept as a compatibility alias.

## Notes

- The frontend uses the configured backend origin for both Axios requests and Socket.IO.
- Socket.IO connects by stripping `/api` from `NEXT_PUBLIC_API_URL`.
- If your Render backend is protected by CORS, add the Vercel domain to `FRONTEND_URL` or `FRONTEND_URLS` on Render.
- Do not expose backend-only secrets such as `JWT_SECRET` to Vercel.
