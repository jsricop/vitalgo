#!/bin/bash

# Update existing AWS deployment with new Docker images
set -e

# Configuration
PROJECT_NAME="vitalgo"
AWS_REGION=${AWS_REGION:-us-east-1}
ENVIRONMENT=${ENVIRONMENT:-production}
TAG=${1:-latest}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

print_status "Updating VitalGo deployment..."
print_status "Account ID: $AWS_ACCOUNT_ID"
print_status "Region: $AWS_REGION"
print_status "Tag: $TAG"

# Login to ECR
print_status "Logging in to ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build and push images
print_status "Building and pushing images..."

# Backend
print_status "Building backend image..."
docker build -t ${PROJECT_NAME}-backend:${TAG} ./backend
docker tag ${PROJECT_NAME}-backend:${TAG} $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/${PROJECT_NAME}-backend:${TAG}
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/${PROJECT_NAME}-backend:${TAG}
print_success "Backend image pushed"

# Frontend
print_status "Building frontend image..."
# Get API URL from current deployment
API_URL=$(aws elbv2 describe-load-balancers --names ${PROJECT_NAME}-alb --query 'LoadBalancers[0].DNSName' --output text 2>/dev/null || echo "api.${PROJECT_NAME}.app")
docker build -t ${PROJECT_NAME}-frontend:${TAG} \
    --build-arg NEXT_PUBLIC_API_URL=https://${API_URL} \
    ./frontend
docker tag ${PROJECT_NAME}-frontend:${TAG} $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/${PROJECT_NAME}-frontend:${TAG}
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/${PROJECT_NAME}-frontend:${TAG}
print_success "Frontend image pushed"

# Update ECS services
print_status "Updating ECS services..."

# Force new deployment for backend service
aws ecs update-service \
    --cluster ${PROJECT_NAME}-cluster \
    --service ${PROJECT_NAME}-backend \
    --force-new-deployment \
    --region $AWS_REGION > /dev/null

print_success "Backend service update initiated"

# Force new deployment for frontend service  
aws ecs update-service \
    --cluster ${PROJECT_NAME}-cluster \
    --service ${PROJECT_NAME}-frontend \
    --force-new-deployment \
    --region $AWS_REGION > /dev/null

print_success "Frontend service update initiated"

# Wait for services to stabilize
print_status "Waiting for services to stabilize (this may take a few minutes)..."

aws ecs wait services-stable \
    --cluster ${PROJECT_NAME}-cluster \
    --services ${PROJECT_NAME}-backend ${PROJECT_NAME}-frontend \
    --region $AWS_REGION

print_success "All services are stable!"

# Show deployment status
print_status "Current deployment status:"
aws ecs describe-services \
    --cluster ${PROJECT_NAME}-cluster \
    --services ${PROJECT_NAME}-backend ${PROJECT_NAME}-frontend \
    --query 'services[*].[serviceName,status,taskDefinition,desiredCount,runningCount]' \
    --output table \
    --region $AWS_REGION

print_success "Deployment update completed successfully!"
print_warning "It may take a few minutes for the load balancer to route traffic to the new tasks."