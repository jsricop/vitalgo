#!/bin/bash

# VitalGo AWS Free Tier Deployment Script
# This script deploys VitalGo using only AWS Free Tier services

set -e  # Exit on any error

# Configuration
PROJECT_NAME="vitalgo"
AWS_REGION="us-east-1"
ENVIRONMENT="development"
STACK_NAME="${PROJECT_NAME}-free-tier"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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

print_free_tier() {
    echo -e "${CYAN}[FREE TIER]${NC} $1"
}

# ASCII Art Banner
show_banner() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║                                                          ║"
    echo "║     VitalGo - AWS Free Tier Deployment                  ║"
    echo "║     Medical Platform for Testing & Development          ║"
    echo "║                                                          ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI not found. Please install AWS CLI first."
        echo "Run: brew install awscli"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker not found. Please install Docker first."
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials not configured."
        echo ""
        print_status "Please run: aws configure"
        echo "You'll need:"
        echo "  • AWS Access Key ID"
        echo "  • AWS Secret Access Key"
        echo "  • Default region: us-east-1 (recommended)"
        echo "  • Default output format: json"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Show Free Tier information
show_free_tier_info() {
    echo ""
    print_free_tier "AWS Free Tier Resources to be used:"
    echo "  ✓ EC2: t2.micro instance (750 hours/month)"
    echo "  ✓ RDS: db.t3.micro PostgreSQL (750 hours/month + 20GB storage)"
    echo "  ✓ S3: 5GB storage for static files"
    echo "  ✓ Elastic IP: 1 (free when attached to running instance)"
    echo "  ✓ CloudWatch: 5GB log ingestion"
    echo "  ✓ Data Transfer: 15GB/month outbound"
    echo ""
    print_warning "IMPORTANT: This covers 24/7 operation for 1 month!"
    print_warning "Monitor your AWS Billing Dashboard regularly"
    echo ""
}

# Get deployment configuration
get_deployment_config() {
    print_status "Gathering deployment configuration..."
    echo ""
    
    # Get or create EC2 Key Pair name
    read -p "Enter EC2 Key Pair name (will be created if doesn't exist) [vitalgo-key]: " KEY_NAME
    KEY_NAME=${KEY_NAME:-vitalgo-key}
    
    # Check if key pair exists
    if aws ec2 describe-key-pairs --key-names "$KEY_NAME" --region $AWS_REGION &> /dev/null; then
        print_warning "Key pair '$KEY_NAME' already exists"
    else
        print_status "Creating new key pair '$KEY_NAME'..."
        aws ec2 create-key-pair \
            --key-name "$KEY_NAME" \
            --query 'KeyMaterial' \
            --output text \
            --region $AWS_REGION > ~/.ssh/${KEY_NAME}.pem
        chmod 400 ~/.ssh/${KEY_NAME}.pem
        print_success "Key pair created and saved to ~/.ssh/${KEY_NAME}.pem"
    fi
    
    # Get database password
    echo ""
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
    echo ""
}

# Deploy CloudFormation stack
deploy_infrastructure() {
    print_status "Deploying AWS Free Tier infrastructure..."
    echo ""
    
    # Validate template first
    print_status "Validating CloudFormation template..."
    aws cloudformation validate-template \
        --template-body file://aws/cloudformation-free-tier.yml \
        --region $AWS_REGION > /dev/null
    print_success "Template validation passed"
    
    # Deploy stack
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
}

# Get stack outputs
get_stack_outputs() {
    print_status "Getting deployment information..."
    echo ""
    
    # Get all outputs
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
}

# Setup application on EC2
setup_application() {
    print_status "Setting up application on EC2 instance..."
    echo ""
    print_warning "Waiting for EC2 instance to be ready (30 seconds)..."
    sleep 30
    
    # Create setup script
    cat > /tmp/setup-vitalgo.sh <<EOF
#!/bin/bash
# Update and install dependencies
sudo yum update -y
sudo yum install -y docker git
sudo service docker start
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone repository
cd /home/ec2-user
git clone https://github.com/jsricop/vitalgo.git
cd vitalgo

# Create environment file
cat > .env <<EOL
DATABASE_URL=postgresql://vitalgo_user:${DB_PASSWORD}@${DB_ENDPOINT}:5432/vitalgo_db
DATABASE_USER=vitalgo_user
DATABASE_PASSWORD=${DB_PASSWORD}
SECRET_KEY=${JWT_SECRET}
ENVIRONMENT=production
NEXT_PUBLIC_API_URL=http://${PUBLIC_IP}:8000
CORS_ORIGINS=http://${PUBLIC_IP}:3000,http://${PUBLIC_IP}
EOL

# Build and run with Docker Compose
sudo /usr/local/bin/docker-compose -f docker-compose.prod.yml up -d

# Setup database
sudo docker exec -i vitalgo-postgres-1 psql -U vitalgo_user -d vitalgo_db < backend/init.sql || true

echo "Setup completed!"
EOF
    
    # Copy and execute setup script
    print_status "Copying setup script to EC2..."
    scp -o StrictHostKeyChecking=no -i ~/.ssh/${KEY_NAME}.pem /tmp/setup-vitalgo.sh ec2-user@${PUBLIC_IP}:/tmp/
    
    print_status "Executing setup on EC2 (this may take 5-10 minutes)..."
    ssh -o StrictHostKeyChecking=no -i ~/.ssh/${KEY_NAME}.pem ec2-user@${PUBLIC_IP} "bash /tmp/setup-vitalgo.sh"
    
    print_success "Application setup completed!"
}

# Print deployment summary
print_deployment_summary() {
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    print_success "🎉 VitalGo deployed successfully on AWS Free Tier!"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
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
    
    print_free_tier "Free Tier Usage:"
    echo "  • EC2: 1 x t2.micro (750 hrs/month)"
    echo "  • RDS: 1 x db.t3.micro (750 hrs/month)"
    echo "  • Storage: 20GB RDS + 5GB S3"
    echo "  • Data Transfer: Up to 15GB/month"
    echo ""
    
    print_warning "Important Reminders:"
    echo "  1. Monitor AWS Billing Dashboard daily"
    echo "  2. Set up billing alerts at \$1, \$5, and \$10"
    echo "  3. Stop instances when not in use to save hours"
    echo "  4. Delete stack when done testing: aws cloudformation delete-stack --stack-name $STACK_NAME"
    echo ""
    
    print_status "Useful Commands:"
    echo "  • Check logs: ssh -i ~/.ssh/${KEY_NAME}.pem ec2-user@${PUBLIC_IP} 'docker-compose logs -f'"
    echo "  • Restart app: ssh -i ~/.ssh/${KEY_NAME}.pem ec2-user@${PUBLIC_IP} 'docker-compose restart'"
    echo "  • Stop app: ssh -i ~/.ssh/${KEY_NAME}.pem ec2-user@${PUBLIC_IP} 'docker-compose down'"
    echo ""
}

# Setup billing alerts
setup_billing_alerts() {
    print_status "Setting up billing alerts..."
    
    # Create SNS topic for billing alerts
    SNS_TOPIC_ARN=$(aws sns create-topic --name vitalgo-billing-alerts --region us-east-1 --output text --query TopicArn)
    
    # Subscribe email to topic
    read -p "Enter email for billing alerts: " ALERT_EMAIL
    aws sns subscribe \
        --topic-arn $SNS_TOPIC_ARN \
        --protocol email \
        --notification-endpoint $ALERT_EMAIL \
        --region us-east-1
    
    print_success "Billing alert subscription sent to $ALERT_EMAIL (check email to confirm)"
    
    # Create billing alarms
    for threshold in 1 5 10; do
        aws cloudwatch put-metric-alarm \
            --alarm-name "vitalgo-billing-${threshold}usd" \
            --alarm-description "Alert when AWS charges exceed \$${threshold}" \
            --metric-name EstimatedCharges \
            --namespace AWS/Billing \
            --statistic Maximum \
            --period 86400 \
            --threshold $threshold \
            --comparison-operator GreaterThanThreshold \
            --evaluation-periods 1 \
            --alarm-actions $SNS_TOPIC_ARN \
            --dimensions Name=Currency,Value=USD \
            --region us-east-1
    done
    
    print_success "Billing alerts created for \$1, \$5, and \$10"
}

# Main deployment function
main() {
    show_banner
    show_free_tier_info
    
    read -p "Do you want to proceed with Free Tier deployment? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Deployment cancelled"
        exit 0
    fi
    
    echo ""
    check_prerequisites
    get_deployment_config
    deploy_infrastructure
    get_stack_outputs
    setup_application
    setup_billing_alerts
    print_deployment_summary
    
    print_success "Deployment script completed! 🚀"
    print_warning "Don't forget to confirm the billing alert email subscription!"
}

# Run main function
main "$@"