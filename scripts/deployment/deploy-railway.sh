#!/bin/bash

# Trust Education CRM - Railway Deployment Script
# Requires: Railway CLI installed (npm install -g @railway/cli)

set -e

echo "🚀 Deploying to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Install with: npm install -g @railway/cli"
    exit 1
fi

# Login to Railway
echo "🔐 Logging in to Railway..."
railway login

# Select/create project
echo "📦 Setting up Railway project..."
railway init

# Deploy backend
echo "🏗️  Deploying backend..."
cd Backend
railway service add nodejs
railway variables set NODE_ENV=production
railway variables set PORT=5000
# Set MONGO_URI and JWT_SECRET separately
echo "⚠️  Please set MONGO_URI and JWT_SECRET in Railway dashboard"
railway up

# Deploy frontend
cd ../Frontend
echo "🏗️  Deploying frontend..."
railway service add nodejs
railway variables set NODE_ENV=production
railway variables set NEXT_PUBLIC_API_URL=https://your-backend-url/api
railway up

echo ""
echo "✅ Deployment to Railway complete!"
echo ""
echo "📍 Next steps:"
echo "   1. Visit railway.app to configure domains"
echo "   2. Set MONGO_URI and JWT_SECRET in environment variables"
echo "   3. Configure custom domains for both services"
echo "   4. Set up database backups"
