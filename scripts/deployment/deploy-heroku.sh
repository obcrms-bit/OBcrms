#!/bin/bash

# Trust Education CRM - Heroku Deployment Script
# Requires: Heroku CLI installed

set -e

echo "🚀 Deploying to Heroku..."

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo "❌ Heroku CLI not found. Install from: https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Login to Heroku
echo "🔐 Logging in to Heroku..."
heroku login

# Create or select backend app
BACKEND_APP="trust-crm-backend"
echo "📦 Setting up backend app ($BACKEND_APP)..."
heroku create $BACKEND_APP --remote heroku-backend 2>/dev/null || echo "App already exists"

# Create or select frontend app
FRONTEND_APP="trust-crm-frontend"
echo "📦 Setting up frontend app ($FRONTEND_APP)..."
heroku create $FRONTEND_APP --remote heroku-frontend 2>/dev/null || echo "App already exists"

# Deploy backend
echo "🏗️  Deploying backend..."
git subtree push --prefix Backend heroku-backend main

# Set backend environment variables
echo "🔑 Setting backend environment variables..."
heroku config:set NODE_ENV=production --remote heroku-backend
heroku config:set PORT=5000 --remote heroku-backend
echo "⚠️  Please set MONGO_URI and JWT_SECRET:"
echo "   heroku config:set MONGO_URI='...' --remote heroku-backend"
echo "   heroku config:set JWT_SECRET='...' --remote heroku-backend"

# Deploy frontend
echo "🏗️  Deploying frontend..."
git subtree push --prefix Frontend heroku-frontend main

# Set frontend environment variables
echo "🔑 Setting frontend environment variables..."
heroku config:set NODE_ENV=production --remote heroku-frontend
BACKEND_URL=$(heroku apps:info --remote heroku-backend | grep "Web URL" | awk '{print $NF}')
heroku config:set NEXT_PUBLIC_API_URL="$BACKEND_URL/api" --remote heroku-frontend

echo ""
echo "✅ Deployment to Heroku complete!"
echo ""
echo "📍 Application URLs:"
echo "   Backend: $BACKEND_URL"
FRONTEND_URL=$(heroku apps:info --remote heroku-frontend | grep "Web URL" | awk '{print $NF}')
echo "   Frontend: $FRONTEND_URL"
