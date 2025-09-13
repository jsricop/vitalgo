#!/bin/bash

# VitalGo - Deploy to AWS using pre-built Docker images
# This script deploys images from DockerHub to AWS EC2 in seconds

set -e

# Configuration
AWS_HOST=${AWS_HOST:-"13.222.51.140"}
AWS_KEY=${AWS_KEY:-"~/.ssh/vitalgo-key.pem"}
DOCKER_USERNAME=${DOCKER_USERNAME:-"gruporq"}
PROJECT_NAME="vitalgo"
VERSION=${VERSION:-"latest"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Show banner
show_banner() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║                                                          ║"
    echo "║     VitalGo - Fast Deploy to AWS                        ║"
    echo "║     Using pre-built Docker images                       ║"
    echo "║                                                          ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if SSH key exists
    if [ ! -f "${AWS_KEY/\~/$HOME}" ]; then
        print_error "SSH key not found at ${AWS_KEY}"
        print_status "Make sure the AWS key exists or update AWS_KEY variable"
        exit 1
    fi
    
    # Test SSH connection
    if ! ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i "${AWS_KEY/\~/$HOME}" ec2-user@$AWS_HOST 'echo "Connection test"' &>/dev/null; then
        print_error "Cannot connect to AWS instance at $AWS_HOST"
        print_status "Check if instance is running and key is correct"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Deploy to AWS
deploy_to_aws() {
    print_status "Deploying to AWS EC2 instance: $AWS_HOST"
    
    # Create deploy script for remote execution
    local REMOTE_SCRIPT=$(cat <<'EOF'
#!/bin/bash
set -e

DOCKER_USERNAME=$1
PROJECT_NAME=$2
VERSION=$3
AWS_HOST=$4

echo "🔄 Starting deployment process..."

# Stop existing containers
echo "📦 Stopping existing containers..."
sudo docker-compose -f vitalgo/docker-compose.registry.yml down --remove-orphans 2>/dev/null || true

# Pull latest images
echo "📥 Pulling latest images from registry..."
sudo docker pull ${DOCKER_USERNAME}/${PROJECT_NAME}-backend:${VERSION}
sudo docker pull ${DOCKER_USERNAME}/${PROJECT_NAME}-frontend:${VERSION}

# Set environment variables for deployment
cd vitalgo
export DOCKER_USERNAME=$DOCKER_USERNAME
export IMAGE_VERSION=$VERSION
export NEXT_PUBLIC_API_URL=http://$AWS_HOST:8000

# Source existing .env for other variables
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

# Start new containers
echo "🚀 Starting new containers..."
sudo docker-compose -f docker-compose.registry.yml up -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Health check
echo "🏥 Checking service health..."
for i in {1..30}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "✅ Backend is healthy"
        break
    fi
    echo "⏳ Waiting for backend... (attempt $i/30)"
    sleep 2
done

for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ Frontend is healthy"
        break
    fi
    echo "⏳ Waiting for frontend... (attempt $i/30)"
    sleep 2
done

echo "🎉 Deployment completed successfully!"
echo "📱 Frontend: http://$AWS_HOST:3000"
echo "🔧 Backend API: http://$AWS_HOST:8000"
echo "📚 API Docs: http://$AWS_HOST:8000/docs"
EOF
)
    
    # Execute deployment on remote server
    echo "$REMOTE_SCRIPT" | ssh -o StrictHostKeyChecking=no -i "${AWS_KEY/\~/$HOME}" ec2-user@$AWS_HOST "bash -s $DOCKER_USERNAME $PROJECT_NAME $VERSION $AWS_HOST"
}

# Rollback function
rollback() {
    print_warning "Rolling back to previous deployment..."
    ssh -o StrictHostKeyChecking=no -i "${AWS_KEY/\~/$HOME}" ec2-user@$AWS_HOST "
        cd vitalgo
        sudo docker-compose -f docker-compose.registry.yml down
        sudo docker-compose -f docker-compose.registry.yml up -d
    "
    print_success "Rollback completed"
}

# Show deployment summary
show_summary() {
    echo ""
    print_success "🎉 Deployment to AWS completed!"
    echo ""
    print_status "Application URLs:"
    echo "  📱 Frontend: http://${AWS_HOST}:3000"
    echo "  🔧 Backend API: http://${AWS_HOST}:8000"
    echo "  📚 API Docs: http://${AWS_HOST}:8000/docs"
    echo "  🔐 SSH: ssh -i ${AWS_KEY} ec2-user@${AWS_HOST}"
    echo ""
    print_status "Useful commands:"
    echo "  🔍 View logs: ssh -i ${AWS_KEY} ec2-user@${AWS_HOST} 'sudo docker-compose -f vitalgo/docker-compose.registry.yml logs -f'"
    echo "  🔄 Restart: ./deploy-to-aws.sh"
    echo "  📊 Status: ssh -i ${AWS_KEY} ec2-user@${AWS_HOST} 'sudo docker ps'"
    echo ""
}

# Main function
main() {
    show_banner
    
    # Check if username is set
    if [ "$DOCKER_USERNAME" = "your-dockerhub-username" ]; then
        print_error "Please set your DockerHub username:"
        echo "  export DOCKER_USERNAME=your-actual-username"
        echo "  OR edit the script and change DOCKER_USERNAME"
        exit 1
    fi
    
    # Load last build version if available
    if [ -f ".last-build-version" ]; then
        VERSION=$(cat .last-build-version)
        print_status "Using build version: $VERSION"
    fi
    
    print_status "Deploying version: $VERSION"
    print_status "Docker Hub user: $DOCKER_USERNAME"
    print_status "AWS Host: $AWS_HOST"
    
    check_prerequisites
    deploy_to_aws
    show_summary
    
    print_success "Fast AWS deployment completed! 🚀"
}

# Trap errors and provide rollback option
trap 'print_error "Deployment failed!"; read -p "Rollback? (y/n): " -n 1 -r; echo; [[ $REPLY =~ ^[Yy]$ ]] && rollback' ERR

# Run main function
main "$@"