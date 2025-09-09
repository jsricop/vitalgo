#!/bin/bash

# Build Docker images for VitalGo
set -e

# Configuration
PROJECT_NAME="vitalgo"
TAG=${1:-latest}

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_status "Building VitalGo Docker images..."

# Build backend image
print_status "Building backend image..."
docker build -t ${PROJECT_NAME}-backend:${TAG} ./backend
print_success "Backend image built: ${PROJECT_NAME}-backend:${TAG}"

# Build frontend image
print_status "Building frontend image..."
docker build -t ${PROJECT_NAME}-frontend:${TAG} \
    --build-arg NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:8000} \
    ./frontend
print_success "Frontend image built: ${PROJECT_NAME}-frontend:${TAG}"

print_success "All images built successfully!"
echo
echo "Available images:"
docker images | grep ${PROJECT_NAME}