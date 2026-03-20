# Frontend Vercel Deployment

Deploy the `Frontend` directory as the Vercel project root.

## Project Settings

- Framework Preset: `Next.js`
- Root Directory: `Frontend`
- Install Command: `npm install --legacy-peer-deps`
- Build Command: `npm run build`
- Output Directory: leave blank

Vercel will use Next.js output automatically from `.next`, so you should not set `build` or `dist`.

## Required Environment Variables

Set these in the Vercel project before deploying:

- `REACT_APP_API_URL=https://your-backend-url.onrender.com/api`
- `NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com/api`

The frontend runtime reads `REACT_APP_API_URL`, and `NEXT_PUBLIC_API_URL` is kept for compatibility with existing Next.js config.

## Notes

- The chat socket connects to the same backend origin by stripping `/api` from the configured API URL.
- If your Render backend is protected by CORS, make sure the Vercel frontend domain is added to `FRONTEND_URL` or `FRONTEND_URLS` on Render.
