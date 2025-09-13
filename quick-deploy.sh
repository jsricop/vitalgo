#!/bin/bash

# VitalGo - One-Command Build and Deploy
# This script: builds locally → pushes to registry → deploys to AWS
# Total time: ~3-5 minutes vs 15-20 minutes building on t2.micro

set -e

# Configuration
DOCKER_USERNAME=${DOCKER_USERNAME:-"gruporq"}
AWS_HOST=${AWS_HOST:-"13.222.51.140"}

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

print_phase() {
    echo -e "${CYAN}[PHASE]${NC} $1"
}

# Show banner
show_banner() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║                                                          ║"
    echo "║     VitalGo - Quick Deploy (Build + Push + Deploy)      ║"
    echo "║     One command for complete deployment                  ║"
    echo "║                                                          ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_status "Pre-flight checks..."
    
    # Check required tools
    for cmd in docker ssh; do
        if ! command -v $cmd &> /dev/null; then
            print_error "$cmd not found. Please install it first."
            exit 1
        fi
    done
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        print_error "Docker daemon not running. Please start Docker."
        exit 1
    fi
    
    # Check DockerHub username
    if [ "$DOCKER_USERNAME" = "your-dockerhub-username" ]; then
        print_error "Please set your DockerHub username:"
        echo "  export DOCKER_USERNAME=your-actual-username"
        echo "  OR edit this script and change DOCKER_USERNAME"
        exit 1
    fi
    
    print_success "Pre-flight checks passed ✈️"
}

# Phase 1: Build and Push
build_and_push() {
    print_phase "📦 PHASE 1: Building and pushing images..."
    
    # Run the build script
    if [ -f "./build-and-push.sh" ]; then
        ./build-and-push.sh
    else
        print_error "build-and-push.sh not found!"
        exit 1
    fi
    
    print_success "Phase 1 completed - Images ready in registry! 📦✅"
}

# Phase 2: Deploy to AWS
deploy_to_aws() {
    print_phase "🚀 PHASE 2: Deploying to AWS..."
    
    # Run the deploy script
    if [ -f "./deploy-to-aws.sh" ]; then
        ./deploy-to-aws.sh
    else
        print_error "deploy-to-aws.sh not found!"
        exit 1
    fi
    
    print_success "Phase 2 completed - Application deployed! 🚀✅"
}

# Show final summary
show_final_summary() {
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    print_success "🎉 QUICK DEPLOY COMPLETED SUCCESSFULLY!"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    
    print_status "🌍 Your application is now live:"
    echo "  📱 Frontend: http://${AWS_HOST}:3000"
    echo "  🔧 Backend API: http://${AWS_HOST}:8000"  
    echo "  📚 API Documentation: http://${AWS_HOST}:8000/docs"
    echo ""
    
    print_status "⚡ Performance comparison:"
    echo "  🐌 Old method (build on EC2): 15-20 minutes"
    echo "  🚀 New method (this script): 3-5 minutes"
    echo "  💰 AWS cost: $0/month (Free Tier)"
    echo ""
    
    print_status "🔧 Useful commands for next deployments:"
    echo "  🎯 Quick redeploy: ./quick-deploy.sh"
    echo "  📦 Just build: ./build-and-push.sh" 
    echo "  🚀 Just deploy: ./deploy-to-aws.sh"
    echo "  📊 Check status: ssh -i ~/.ssh/vitalgo-key.pem ec2-user@${AWS_HOST} 'sudo docker ps'"
    echo ""
    
    print_success "Ready for development! Make changes and run ./quick-deploy.sh again 🔥"
}

# Main execution
main() {
    local start_time=$(date +%s)
    
    show_banner
    
    print_status "Starting quick deployment process..."
    print_status "Docker Hub user: $DOCKER_USERNAME"
    print_status "AWS target: $AWS_HOST"
    echo ""
    
    check_prerequisites
    build_and_push
    deploy_to_aws
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local minutes=$((duration / 60))
    local seconds=$((duration % 60))
    
    show_final_summary
    print_success "Total deployment time: ${minutes}m ${seconds}s ⚡"
}

# Error handling
trap 'print_error "Quick deploy failed! Check the error above."; exit 1' ERR

# Run main function
main "$@"