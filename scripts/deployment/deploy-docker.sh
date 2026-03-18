#!/bin/bash

# Trust Education CRM - Docker Deployment Script
# Usage: ./deploy-docker.sh [dev|staging|prod]

set -e

ENVIRONMENT=${1:-dev}
DOCKER_COMPOSE_FILE="docker-compose.yml"

if [ "$ENVIRONMENT" = "prod" ]; then
    DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
fi

echo "🚀 Deploying Trust Education CRM ($ENVIRONMENT environment)"
echo "Using: $DOCKER_COMPOSE_FILE"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "⚠️  docker-compose not found. Using 'docker compose' instead."
    DOCKER_CMD="docker compose"
else
    DOCKER_CMD="docker-compose"
fi

# Load environment variables
if [ -f ".env" ]; then
    echo "📝 Loading .env file"
    set -a
    source .env
    set +a
else
    echo "⚠️  .env file not found. Using defaults."
fi

# Build and start services
echo "🔨 Building images..."
$DOCKER_CMD -f $DOCKER_COMPOSE_FILE build

echo "🏃 Starting services..."
$DOCKER_CMD -f $DOCKER_COMPOSE_FILE up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check backend health
echo "🏥 Checking backend health..."
if curl -s http://localhost:5000/health > /dev/null; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
    exit 1
fi

# Check frontend
echo "🏥 Checking frontend..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend is running"
else
    echo "⚠️  Frontend may still be starting..."
fi

echo ""
echo "✅ Deployment successful!"
echo ""
echo "📍 Application URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:5000"
echo "   Health Check: http://localhost:5000/health"
echo ""
echo "📋 Useful commands:"
echo "   View logs: $DOCKER_CMD -f $DOCKER_COMPOSE_FILE logs -f"
echo "   Stop: $DOCKER_CMD -f $DOCKER_COMPOSE_FILE down"
echo "   Restart: $DOCKER_CMD -f $DOCKER_COMPOSE_FILE restart"
