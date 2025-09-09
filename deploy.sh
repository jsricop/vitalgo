#!/bin/bash

# VitalGo AWS Deployment Script
# This script deploys the complete VitalGo medical platform to AWS

set -e  # Exit on any error

# Configuration
PROJECT_NAME="vitalgo"
AWS_REGION="us-east-1"
ENVIRONMENT="production"
STACK_NAME="${PROJECT_NAME}-${ENVIRONMENT}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
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

# Check if required tools are installed
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI not found. Please install AWS CLI first."
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker not found. Please install Docker first."
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Get user input for deployment configuration
get_deployment_config() {
    print_status "Gathering deployment configuration..."
    
    # Get domain name
    read -p "Enter your domain name (e.g., vitalgo.app): " DOMAIN_NAME
    if [[ -z "$DOMAIN_NAME" ]]; then
        print_error "Domain name is required"
        exit 1
    fi
    
    # Get certificate ARN
    read -p "Enter your SSL certificate ARN (from AWS Certificate Manager): " CERT_ARN
    if [[ -z "$CERT_ARN" ]]; then
        print_error "SSL certificate ARN is required"
        exit 1
    fi
    
    # Get database password
    read -s -p "Enter database password (minimum 8 characters): " DB_PASSWORD
    echo
    if [[ ${#DB_PASSWORD} -lt 8 ]]; then
        print_error "Database password must be at least 8 characters"
        exit 1
    fi
    
    # Generate JWT secret key
    JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
    print_success "Generated JWT secret key"
    
    # Get AWS account ID
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    print_status "Using AWS Account ID: $AWS_ACCOUNT_ID"
}

# Create ECR repositories
create_ecr_repositories() {
    print_status "Creating ECR repositories..."
    
    # Create backend repository
    if ! aws ecr describe-repositories --repository-names "${PROJECT_NAME}-backend" --region $AWS_REGION &> /dev/null; then
        aws ecr create-repository \
            --repository-name "${PROJECT_NAME}-backend" \
            --region $AWS_REGION \
            --image-scanning-configuration scanOnPush=true
        print_success "Created backend ECR repository"
    else
        print_warning "Backend ECR repository already exists"
    fi
    
    # Create frontend repository
    if ! aws ecr describe-repositories --repository-names "${PROJECT_NAME}-frontend" --region $AWS_REGION &> /dev/null; then
        aws ecr create-repository \
            --repository-name "${PROJECT_NAME}-frontend" \
            --region $AWS_REGION \
            --image-scanning-configuration scanOnPush=true
        print_success "Created frontend ECR repository"
    else
        print_warning "Frontend ECR repository already exists"
    fi
}

# Build and push Docker images
build_and_push_images() {
    print_status "Building and pushing Docker images..."
    
    # Login to ECR
    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
    
    # Build and push backend image
    print_status "Building backend image..."
    docker build -t ${PROJECT_NAME}-backend ./backend
    docker tag ${PROJECT_NAME}-backend:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/${PROJECT_NAME}-backend:latest
    docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/${PROJECT_NAME}-backend:latest
    print_success "Backend image pushed to ECR"
    
    # Build and push frontend image
    print_status "Building frontend image..."
    docker build -t ${PROJECT_NAME}-frontend \
        --build-arg NEXT_PUBLIC_API_URL=https://api.${DOMAIN_NAME} \
        ./frontend
    docker tag ${PROJECT_NAME}-frontend:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/${PROJECT_NAME}-frontend:latest
    docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/${PROJECT_NAME}-frontend:latest
    print_success "Frontend image pushed to ECR"
}

# Deploy CloudFormation stack
deploy_infrastructure() {
    print_status "Deploying AWS infrastructure..."
    
    aws cloudformation deploy \
        --template-file aws/cloudformation-template.yml \
        --stack-name $STACK_NAME \
        --parameter-overrides \
            ProjectName=$PROJECT_NAME \
            Environment=$ENVIRONMENT \
            DomainName=$DOMAIN_NAME \
            CertificateArn=$CERT_ARN \
            DatabasePassword=$DB_PASSWORD \
            JWTSecretKey=$JWT_SECRET \
        --capabilities CAPABILITY_IAM \
        --region $AWS_REGION
    
    print_success "Infrastructure deployed successfully"
}

# Get stack outputs
get_stack_outputs() {
    print_status "Getting deployment information..."
    
    ALB_DNS=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
        --output text \
        --region $AWS_REGION)
    
    DB_ENDPOINT=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --query 'Stacks[0].Outputs[?OutputKey==`DatabaseEndpoint`].OutputValue' \
        --output text \
        --region $AWS_REGION)
    
    print_success "Load Balancer DNS: $ALB_DNS"
    print_success "Database Endpoint: $DB_ENDPOINT"
}

# Setup database schema
setup_database() {
    print_status "Setting up database schema..."
    print_warning "Please manually run database migrations on the RDS instance"
    print_warning "Connect to: $DB_ENDPOINT"
    print_warning "Run the SQL files in backend/create_*.sql to set up the schema"
}

# Print deployment summary
print_deployment_summary() {
    print_success "🎉 VitalGo deployment completed successfully!"
    echo
    print_status "Deployment Summary:"
    echo "  • Project: $PROJECT_NAME"
    echo "  • Environment: $ENVIRONMENT"
    echo "  • AWS Region: $AWS_REGION"
    echo "  • Domain: $DOMAIN_NAME"
    echo "  • API Domain: api.$DOMAIN_NAME"
    echo "  • Load Balancer: $ALB_DNS"
    echo "  • Database: $DB_ENDPOINT"
    echo
    print_status "Next Steps:"
    echo "  1. Update your DNS records:"
    echo "     • $DOMAIN_NAME -> $ALB_DNS"
    echo "     • api.$DOMAIN_NAME -> $ALB_DNS"
    echo "  2. Set up database schema (see setup_database output above)"
    echo "  3. Test your deployment at https://$DOMAIN_NAME"
    echo
    print_warning "Don't forget to securely store your database password and JWT secret!"
}

# Main deployment function
main() {
    print_status "Starting VitalGo AWS deployment..."
    echo
    
    check_prerequisites
    get_deployment_config
    create_ecr_repositories
    build_and_push_images
    deploy_infrastructure
    get_stack_outputs
    setup_database
    print_deployment_summary
    
    print_success "Deployment script completed!"
}

# Run main function
main "$@"