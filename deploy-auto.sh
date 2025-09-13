#!/bin/bash

# VitalGo AWS Free Tier Deployment Script - Automated Version
set -e

# Configuration
PROJECT_NAME="vitalgo"
AWS_REGION="us-east-1"
ENVIRONMENT="development"
STACK_NAME="${PROJECT_NAME}-free-tier"
KEY_NAME="vitalgo-key"
DB_PASSWORD="VitalGo2024!"  # Default password
EMAIL_ALERT="user@example.com"  # Will be set later

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

# Show banner
echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║     VitalGo - AWS Free Tier Deployment (AUTO)           ║"
echo "║     Medical Platform for Testing & Development          ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

print_status "Starting automated deployment..."

# Generate JWT secret key
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
print_success "Generated JWT secret key"

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
print_status "Using AWS Account ID: $AWS_ACCOUNT_ID"

# Validate CloudFormation template
print_status "Validating CloudFormation template..."
aws cloudformation validate-template \
    --template-body file://aws/cloudformation-free-tier.yml \
    --region $AWS_REGION > /dev/null
print_success "Template validation passed"

# Deploy CloudFormation stack
print_status "Creating CloudFormation stack (this may take 10-15 minutes)..."
aws cloudformation deploy \
    --template-file aws/cloudformation-free-tier.yml \
    --stack-name $STACK_NAME \
    --parameter-overrides \
        ProjectName=$PROJECT_NAME \
        Environment=$ENVIRONMENT \
        KeyPairName=$KEY_NAME \
        DatabasePassword=$DB_PASSWORD \
        JWTSecretKey=$JWT_SECRET \
    --capabilities CAPABILITY_IAM \
    --region $AWS_REGION

print_success "Infrastructure deployed successfully!"

# Get stack outputs
print_status "Getting deployment information..."

PUBLIC_IP=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`PublicIP`].OutputValue' \
    --output text \
    --region $AWS_REGION)

DB_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`DatabaseEndpoint`].OutputValue' \
    --output text \
    --region $AWS_REGION)

S3_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`StaticAssetsBucket`].OutputValue' \
    --output text \
    --region $AWS_REGION)

print_success "Deployment Information:"
echo "  • Public IP: $PUBLIC_IP"
echo "  • Database: $DB_ENDPOINT"
echo "  • S3 Bucket: $S3_BUCKET"
echo ""

print_success "🎉 VitalGo deployed successfully on AWS Free Tier!"
echo ""
print_status "Access Information:"
echo "  📱 Frontend: http://${PUBLIC_IP}:3000"
echo "  🔧 Backend API: http://${PUBLIC_IP}:8000"
echo "  📚 API Docs: http://${PUBLIC_IP}:8000/docs"
echo "  🔐 SSH: ssh -i ~/.ssh/${KEY_NAME}.pem ec2-user@${PUBLIC_IP}"
echo ""
print_status "Default Credentials:"
echo "  Admin: admin@vitalgo.app / VitalGo2024!"
echo "  Patient: paciente@example.com / (register new)"
echo "  Paramedic: paramedico@vitalgo.com / Param2024!"
echo ""

print_success "Deployment completed! 🚀"