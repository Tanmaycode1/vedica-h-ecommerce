#!/bin/bash

# This script builds and deploys the BigDeal backend Docker container

# Exit on error
set -e

echo "🚀 Building and deploying BigDeal backend..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Error: Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down 2>/dev/null || true

# Build and start the container
echo "🏗️ Building and starting container..."
docker-compose up --build -d

# Check if the container is running
if [ "$(docker ps -q -f name=bigdeal-backend)" ]; then
    echo "✅ Container started successfully!"
    echo "📊 API is available at http://localhost:3002/api"
    echo "🔍 Health check: http://localhost:3002/health"
    echo "📝 View logs with: docker-compose logs -f"
else
    echo "❌ Error: Container failed to start."
    echo "Check logs with: docker-compose logs"
    exit 1
fi 