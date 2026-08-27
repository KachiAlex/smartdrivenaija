#!/bin/bash
set -e

# SmartDrive Naija — VPS Backend Deployment Script
# Run on the VPS after cloning the repo

echo "=== SmartDrive Naija Backend Deployment ==="

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "Docker not found. Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

# Check Docker Compose
if ! docker compose version &> /dev/null; then
    echo "Docker Compose not available. Installing plugin..."
    apt-get update -qq && apt-get install -y -qq docker-compose-plugin
fi

# Copy env file
if [ -f env.docker ]; then
    cp env.docker .env
    echo "Environment file copied."
else
    echo "WARNING: env.docker not found. Using defaults from docker-compose.yml."
fi

# Build and start
echo "Building and starting containers..."
docker compose -p smartdrive build
docker compose -p smartdrive up -d

# Wait for DB to be healthy
echo "Waiting for database to be ready..."
sleep 10

# Check health
echo "Checking backend health..."
curl -s http://localhost:8080/health || echo "Health check failed — check logs with: docker compose -p smartdrive logs"

echo ""
echo "=== Deployment complete ==="
echo "Backend API: http://$(hostname -I | awk '{print $1}'):8080/api/"
echo "Health check: http://$(hostname -I | awk '{print $1}'):8080/health"
echo ""
echo "Useful commands:"
echo "  docker compose -p smartdrive logs -f backend"
echo "  docker compose -p smartdrive restart backend"
echo "  docker compose -p smartdrive down"
