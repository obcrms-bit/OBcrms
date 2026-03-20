Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Section($title) {
    Write-Host ""
    Write-Host "=== $title ===" -ForegroundColor Cyan
}

function Test-Tool($name) {
    if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
        throw "Required tool not found in PATH: $name"
    }
}

function Invoke-Step($label, $scriptBlock) {
    Write-Host "-> $label" -ForegroundColor Yellow
    & $scriptBlock
}

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repoRoot

Write-Section "Preflight"
Test-Tool git
Test-Tool npm

if (-not (Test-Path ".git")) {
    throw "This script must be run inside an existing git repository."
}

$backendDir = Join-Path $repoRoot "Backend"
$frontendDir = Join-Path $repoRoot "Frontend"

if (-not (Test-Path $backendDir) -or -not (Test-Path $frontendDir)) {
    throw "Expected Backend/ and Frontend/ directories were not found."
}

Write-Section "Install And Build"
Invoke-Step "Install root dependencies" { npm install }
Invoke-Step "Build backend + frontend from repo root" { npm run build }

Write-Section "Git Status"
$currentBranch = (git branch --show-current).Trim()
$remoteInfo = git remote -v

Write-Host "Current branch: $currentBranch"
if ($remoteInfo) {
    Write-Host "Configured remotes:"
    $remoteInfo
} else {
    Write-Host "No git remote is configured yet."
}

$targetBranch = if ($currentBranch) { $currentBranch } else { "main" }
if ($targetBranch -ne "main") {
    $switchToMain = Read-Host "Switch current branch to main before push? (y/N)"
    if ($switchToMain -match '^(y|yes)$') {
        git branch -M main
        $targetBranch = "main"
    }
}

if (-not $remoteInfo) {
    $githubRemote = Read-Host "Enter GitHub remote URL to add as origin (leave blank to skip push)"
    if ($githubRemote) {
        git remote add origin $githubRemote
        $remoteInfo = git remote -v
    }
}

Write-Section "Commit"
$status = git status --short
if ($status) {
    $commitMessage = Read-Host "Enter commit message for deployment readiness changes"
    if (-not $commitMessage) {
        $commitMessage = "Prepare repo for Render and Vercel deployment"
    }

    git add .
    git commit -m $commitMessage
} else {
    Write-Host "No uncommitted changes detected."
}

if ($remoteInfo) {
    Write-Section "Push"
    $pushNow = Read-Host "Push $targetBranch to origin now? (y/N)"
    if ($pushNow -match '^(y|yes)$') {
        git push -u origin $targetBranch
    } else {
        Write-Host "Skipping push."
    }
}

Write-Section "Render Settings"
Write-Host "Root Directory : Backend"
Write-Host "Build Command  : npm install --legacy-peer-deps"
Write-Host "Start Command  : npm start"
Write-Host "Health Check   : /health"
Write-Host "Required envs  : MONGO_URI, JWT_SECRET, FRONTEND_URL"
Write-Host "Recommended    : FRONTEND_URLS, BACKEND_URL, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM"

Write-Section "Vercel Settings"
Write-Host "Framework      : Next.js"
Write-Host "Root Directory : Frontend"
Write-Host "Install Command: npm install --legacy-peer-deps"
Write-Host "Build Command  : npm run build"
Write-Host "Output Dir     : leave blank"
Write-Host "Required envs  : NEXT_PUBLIC_API_URL"
Write-Host ""
Write-Host "Do not expose backend-only secrets such as JWT_SECRET to Vercel."

Write-Section "Done"
Write-Host "Repository preflight completed successfully."
