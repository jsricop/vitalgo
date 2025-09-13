#!/bin/bash

# VitalGo - Build and Push to Docker Registry
# This script builds images locally and pushes to DockerHub for fast AWS deployment

set -e

# Configuration
DOCKER_USERNAME=${DOCKER_USERNAME:-"gruporq"}  # GrupoRQ username
PROJECT_NAME="vitalgo"
VERSION=${VERSION:-$(date +%Y%m%d-%H%M%S)}
LATEST_TAG="latest"

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
    echo "║     VitalGo - Local Build & Push to Registry            ║"
    echo "║     Fast deployment to AWS                               ║"
    echo "║                                                          ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker not found. Please install Docker first."
        exit 1
    fi
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        print_error "Docker daemon not running. Please start Docker."
        exit 1
    fi
    
    # Check if logged in to DockerHub
    if ! docker info | grep -q "Username:" 2>/dev/null; then
        print_warning "Not logged in to DockerHub"
        print_status "Please run: docker login"
        echo "Enter your DockerHub credentials:"
        docker login
    fi
    
    print_success "Prerequisites check passed"
}

# Pre-build cleanup
pre_build_cleanup() {
    print_status "Performing pre-build cleanup..."

    # Clean up dangling images and build cache to free space
    docker image prune -f || true
    docker builder prune -f --filter "until=1h" || true

    print_success "Pre-build cleanup completed"
}

# Build images locally
build_images() {
    print_status "Building images locally (parallel build)..."

    # Backend image
    print_status "Building backend image..."
    docker build -t ${DOCKER_USERNAME}/${PROJECT_NAME}-backend:${VERSION} \
                 -t ${DOCKER_USERNAME}/${PROJECT_NAME}-backend:${LATEST_TAG} \
                 ./backend &

    BACKEND_PID=$!

    # Frontend image
    print_status "Building frontend image..."
    docker build -t ${DOCKER_USERNAME}/${PROJECT_NAME}-frontend:${VERSION} \
                 -t ${DOCKER_USERNAME}/${PROJECT_NAME}-frontend:${LATEST_TAG} \
                 ./frontend &

    FRONTEND_PID=$!

    # Wait for both builds to complete
    print_status "Waiting for backend build to complete..."
    wait $BACKEND_PID
    if [ $? -eq 0 ]; then
        print_success "Backend build completed"
    else
        print_error "Backend build failed"
        exit 1
    fi

    print_status "Waiting for frontend build to complete..."
    wait $FRONTEND_PID
    if [ $? -eq 0 ]; then
        print_success "Frontend build completed"
    else
        print_error "Frontend build failed"
        exit 1
    fi

    print_success "All images built successfully!"
}

# Post-build cleanup
post_build_cleanup() {
    print_status "Performing post-build cleanup..."

    # Remove intermediate/dangling images created during build
    docker image prune -f || true

    # Remove old versions of VitalGo images (keep only latest 2 versions)
    print_status "Cleaning up old image versions..."

    # Keep only the 2 most recent backend images
    docker images ${DOCKER_USERNAME}/${PROJECT_NAME}-backend --format "{{.ID}} {{.CreatedAt}}" | \
        sort -k2 -r | tail -n +3 | awk '{print $1}' | xargs -r docker rmi -f || true

    # Keep only the 2 most recent frontend images
    docker images ${DOCKER_USERNAME}/${PROJECT_NAME}-frontend --format "{{.ID}} {{.CreatedAt}}" | \
        sort -k2 -r | tail -n +3 | awk '{print $1}' | xargs -r docker rmi -f || true

    print_success "Post-build cleanup completed"
}

# Push images to registry
push_images() {
    print_status "Pushing images to DockerHub..."
    
    # Push backend
    print_status "Pushing backend images..."
    docker push ${DOCKER_USERNAME}/${PROJECT_NAME}-backend:${VERSION} &
    docker push ${DOCKER_USERNAME}/${PROJECT_NAME}-backend:${LATEST_TAG} &
    
    # Push frontend
    print_status "Pushing frontend images..."
    docker push ${DOCKER_USERNAME}/${PROJECT_NAME}-frontend:${VERSION} &
    docker push ${DOCKER_USERNAME}/${PROJECT_NAME}-frontend:${LATEST_TAG} &
    
    # Wait for all pushes
    wait
    print_success "All images pushed to registry!"
}

# Show build summary
show_summary() {
    echo ""
    print_success "🎉 Build and Push completed successfully!"
    echo ""
    print_status "Images created:"
    echo "  📦 Backend: ${DOCKER_USERNAME}/${PROJECT_NAME}-backend:${VERSION}"
    echo "  📦 Frontend: ${DOCKER_USERNAME}/${PROJECT_NAME}-frontend:${VERSION}"
    echo "  📦 Latest tags also pushed"
    echo ""
    print_status "Next steps:"
    echo "  🚀 Run: ./deploy-to-aws.sh"
    echo "  🌐 Or manually deploy with version: ${VERSION}"
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
    
    check_prerequisites
    pre_build_cleanup
    build_images
    post_build_cleanup
    push_images
    show_summary
    
    # Save version for deploy script
    echo $VERSION > .last-build-version
    
    print_success "Ready for AWS deployment! 🚀"
}

# Run main function
main "$@"