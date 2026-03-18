# =============================
# Full-Stack Deployment Script
# Backend → Render, Frontend → Vercel
# =============================

# Helper: Generate secure JWT_SECRET
function New-RandomSecret([int]$length=32) {
    [System.Convert]::ToBase64String((1..$length | ForEach-Object { [byte](Get-Random -Minimum 0 -Maximum 256) }))
}

# -----------------------------
# 1️⃣ Prepare Backend
# -----------------------------
Write-Host "Installing dependencies and fixing ESLint..."
npm uninstall @eslint/js
npm install @eslint/js@^9 --save-dev
npm install --legacy-peer-deps
npx eslint . --ext .js,.ts,.jsx,.tsx --fix

Write-Host "Updating package.json scripts..."
$pkg = Get-Content package.json | ConvertFrom-Json
if (-not $pkg.scripts) { $pkg.scripts = @{} }
$pkg.scripts.start = "node server.js"
$pkg.scripts.build = "next build"
$pkg.scripts.lint = "eslint . --ext .js,.ts,.jsx,.tsx"
$pkg | ConvertTo-Json -Depth 5 | Set-Content package.json

Remove-Item -Recurse -Force node_modules, package-lock.json
npm install --legacy-peer-deps

Write-Host "Building backend locally..."
npm run build
Start-Process npm -ArgumentList "start"
Start-Sleep -Seconds 5
Get-Process node | Stop-Process -Force

# -----------------------------
# 2️⃣ Commit to GitHub
# -----------------------------
git init
git add .
git commit -m "Prepare backend for Render deployment"
$GH_REPO = Read-Host "Enter GitHub repo (username/repo)"
git remote add origin https://github.com/$GH_REPO.git
git branch -M main
git push -u origin main

# -----------------------------
# 3️⃣ Deploy Backend to Render
# -----------------------------
$RENDER_NAME = Read-Host "Enter Render backend service name"
$RENDER_TEAM = Read-Host "Enter Render team (leave blank for personal account)"

Write-Host "Deploying backend to Render..."
$renderArgs = @(
    "services","create","web",
    "--name",$RENDER_NAME,
    "--repo","https://github.com/$GH_REPO",
    "--branch","main",
    "--build-command","npm install && npm run build",
    "--start-command","npm start"
)
if ($RENDER_TEAM) { $renderArgs += @("--team",$RENDER_TEAM) }
$backendDeploy = render @renderArgs

# Wait a few seconds for Render to initialize and return the URL
Start-Sleep -Seconds 15

# -----------------------------
# 4️⃣ Set backend URL as Vercel secret
# -----------------------------
$BACKEND_URL = Read-Host "Enter your backend URL from Render (e.g., https://<service>.onrender.com)"
vercel secrets add api_url $BACKEND_URL

# -----------------------------
# 5️⃣ Generate other Vercel environment variables
# -----------------------------
$JWT_SECRET = New-RandomSecret 32
$APP_NAME = Read-Host "Enter your frontend app name (e.g., TrustCRM)"
vercel secrets add jwt_secret $JWT_SECRET
vercel secrets add app_name $APP_NAME

# -----------------------------
# 6️⃣ Deploy frontend to Vercel
# -----------------------------
$VERCEL_PROJECT = Read-Host "Enter Vercel project name"
$VERCEL_TEAM = Read-Host "Enter Vercel team (leave blank for personal)"
$vercelArgs = @("--prod", "--name", $VERCEL_PROJECT)
if ($VERCEL_TEAM) { $vercelArgs += @("--team", $VERCEL_TEAM) }
$vercelArgs += @("--env", "NEXT_PUBLIC_API_URL=api_url")
$vercelArgs += @("--env", "JWT_SECRET=jwt_secret")
$vercelArgs += @("--env", "NEXT_PUBLIC_APP_NAME=app_name")

Write-Host "Deploying frontend to Vercel..."
vercel @vercelArgs

Write-Host "========================================"
Write-Host "✅ Full-stack deployment complete!"
Write-Host "Backend URL: $BACKEND_URL"
Write-Host "Frontend deployed at Vercel project: $VERCEL_PROJECT"
Write-Host "Generated JWT_SECRET: $JWT_SECRET"
Write-Host "========================================"