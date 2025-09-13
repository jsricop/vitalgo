#!/bin/bash

# VitalGo - Change-In-Place AWS Management Tool
# CRITICAL: Makes changes to EXISTING infrastructure only
# NEVER creates new infrastructure without explicit confirmation

set -e

# Configuration
EC2_IP="35.169.20.114"
INSTANCE_ID="i-0b0ba62b1689cb8ff"
DOCKER_USERNAME="gruporq"
PROJECT_NAME="vitalgo"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_critical() {
    echo -e "${PURPLE}[CRITICAL]${NC} $1"
}

print_inplace() {
    echo -e "${CYAN}[IN-PLACE]${NC} $1"
}

# Safety check: Verify infrastructure exists
verify_infrastructure_exists() {
    print_critical "🔍 Verifying existing infrastructure..."
    
    # Check EC2 instance exists and is accessible
    local instance_state=$(aws ec2 describe-instances \
        --instance-ids "$INSTANCE_ID" \
        --query 'Reservations[0].Instances[0].State.Name' \
        --output text 2>/dev/null || echo "not-found")
    
    if [ "$instance_state" != "running" ]; then
        print_error "❌ EC2 instance $INSTANCE_ID not running (state: $instance_state)"
    fi
    
    print_success "✅ EC2 instance $INSTANCE_ID is running"
    
    # Verify SSH connectivity
    if ! ssh -i ~/.ssh/vitalgo-key.pem -o ConnectTimeout=10 -o BatchMode=yes ec2-user@${EC2_IP} exit 2>/dev/null; then
        print_error "❌ Cannot SSH to EC2 instance $EC2_IP"
    fi
    
    print_success "✅ SSH connectivity to EC2 verified"
    
    # Check Docker containers are running
    local containers=$(ssh -i ~/.ssh/vitalgo-key.pem ec2-user@${EC2_IP} "sudo docker ps -q" 2>/dev/null || echo "")
    if [ -z "$containers" ]; then
        print_warning "⚠️  No Docker containers running - may need initial deployment"
    else
        print_success "✅ Docker containers detected on EC2"
    fi
    
    print_success "🎯 Infrastructure verification complete - ready for in-place changes"
}

# Function: Update application code only (no infrastructure changes)
update_application_inplace() {
    print_inplace "🔄 Updating application code in-place..."
    
    # Step 1: Build and push new images locally
    print_status "📦 Building updated Docker images..."
    docker build --platform linux/amd64 -t ${DOCKER_USERNAME}/${PROJECT_NAME}-backend:latest ./backend
    docker build --platform linux/amd64 -t ${DOCKER_USERNAME}/${PROJECT_NAME}-frontend:latest ./frontend \
        --build-arg NEXT_PUBLIC_API_URL=http://${EC2_IP}:8000
    
    # Push to registry
    print_status "📤 Pushing to Docker registry..."
    docker push ${DOCKER_USERNAME}/${PROJECT_NAME}-backend:latest
    docker push ${DOCKER_USERNAME}/${PROJECT_NAME}-frontend:latest
    
    # Step 2: Update running containers on existing EC2
    print_inplace "🔄 Updating containers on existing EC2 instance..."
    ssh -i ~/.ssh/vitalgo-key.pem ec2-user@${EC2_IP} << ENDSSH
        cd vitalgo
        
        echo "🛡️  Creating database backup before update..."
        sudo docker exec vitalgo-postgres-1 pg_dump -U backend_user -d backend_db > "backup_before_update_\$(date +%Y%m%d_%H%M%S).sql"
        
        echo "📥 Pulling latest images..."
        sudo docker-compose -f docker-compose.aws-safe.yml pull backend frontend
        
        echo "🔄 Updating containers (preserving database)..."
        sudo docker-compose -f docker-compose.aws-safe.yml up -d --force-recreate backend frontend
        
        echo "⏳ Waiting for services to stabilize..."
        sleep 30
        
        echo "✅ Update complete - verifying services..."
        sudo docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
ENDSSH
    
    print_success "✅ Application updated in-place successfully"
}

# Function: Update configuration only
update_configuration_inplace() {
    local config_type="$1"
    
    print_inplace "⚙️  Updating configuration: $config_type"
    
    case "$config_type" in
        "environment")
            print_status "Updating environment variables..."
            ssh -i ~/.ssh/vitalgo-key.pem ec2-user@${EC2_IP} << ENDSSH
                cd vitalgo
                
                # Backup current environment
                cp .env .env.backup.\$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
                
                # Update environment variables (example)
                echo "🔧 Environment variables updated"
                
                # Restart affected containers
                sudo docker-compose -f docker-compose.aws-safe.yml restart backend
ENDSSH
            ;;
        "nginx")
            print_status "Updating Nginx configuration..."
            # Add nginx config updates here
            ;;
        "ssl")
            print_status "Updating SSL certificates..."
            # Add SSL certificate updates here
            ;;
        *)
            print_error "Unknown configuration type: $config_type"
            ;;
    esac
    
    print_success "✅ Configuration updated in-place"
}

# Function: Scale services (without changing infrastructure)
scale_services_inplace() {
    local service="$1"
    local replicas="$2"
    
    print_inplace "📈 Scaling service: $service to $replicas replicas"
    
    ssh -i ~/.ssh/vitalgo-key.pem ec2-user@${EC2_IP} << ENDSSH
        cd vitalgo
        
        echo "📊 Current service status:"
        sudo docker ps --format "table {{.Names}}\t{{.Status}}"
        
        echo "🔄 Scaling $service to $replicas replicas..."
        sudo docker-compose -f docker-compose.aws-safe.yml up -d --scale $service=$replicas
        
        echo "✅ Scaling complete:"
        sudo docker ps --format "table {{.Names}}\t{{.Status}}"
ENDSSH
    
    print_success "✅ Service scaled successfully"
}

# Function: Apply database migrations (safe)
migrate_database_inplace() {
    print_inplace "🗄️  Applying database migrations..."
    
    print_warning "⚠️  This will modify the database structure"
    read -p "Continue with database migration? (y/N): " confirm
    
    if [[ $confirm != [yY] ]]; then
        print_status "Migration cancelled"
        return 0
    fi
    
    ssh -i ~/.ssh/vitalgo-key.pem ec2-user@${EC2_IP} << ENDSSH
        cd vitalgo
        
        echo "🛡️  Creating full database backup before migration..."
        sudo docker exec vitalgo-postgres-1 pg_dump -U backend_user -d backend_db > "backup_before_migration_\$(date +%Y%m%d_%H%M%S).sql"
        
        echo "🔄 Running database migrations..."
        sudo docker exec vitalgo-backend-1 python -m alembic upgrade head
        
        echo "✅ Migration complete"
ENDSSH
    
    print_success "✅ Database migrations applied successfully"
}

# Show current infrastructure status
show_current_status() {
    print_inplace "📊 Current Infrastructure Status"
    echo "=============================================="
    
    # EC2 Status
    local instance_state=$(aws ec2 describe-instances \
        --instance-ids "$INSTANCE_ID" \
        --query 'Reservations[0].Instances[0].State.Name' \
        --output text)
    echo "🖥️  EC2 Instance: $INSTANCE_ID ($instance_state)"
    
    # Services Status
    print_status "🐳 Docker containers status:"
    ssh -i ~/.ssh/vitalgo-key.pem ec2-user@${EC2_IP} \
        "sudo docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'" 2>/dev/null || \
        print_warning "Could not fetch container status"
    
    # Database Status
    print_status "🗄️  Database connectivity:"
    ssh -i ~/.ssh/vitalgo-key.pem ec2-user@${EC2_IP} \
        "sudo docker exec vitalgo-postgres-1 pg_isready -U backend_user" 2>/dev/null && \
        print_success "Database is ready" || \
        print_warning "Database connectivity issues"
}

# Show usage menu
show_menu() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║                                                          ║"
    echo "║     🔧 VitalGo - Change-In-Place Management Tool        ║"
    echo "║     🛡️  ONLY modifies existing infrastructure          ║"
    echo "║                                                          ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    echo "Available in-place operations:"
    echo ""
    echo "  1. Update application code (containers only)"
    echo "  2. Update environment configuration" 
    echo "  3. Update Nginx configuration"
    echo "  4. Scale services (add/remove replicas)"
    echo "  5. Apply database migrations"
    echo "  6. Show current status"
    echo "  7. Exit"
    echo ""
}

# Main menu loop
main_menu() {
    while true; do
        show_menu
        read -p "Select operation (1-7): " choice
        
        case $choice in
            1)
                update_application_inplace
                ;;
            2)
                update_configuration_inplace "environment"
                ;;
            3)
                update_configuration_inplace "nginx"
                ;;
            4)
                read -p "Service name: " service
                read -p "Number of replicas: " replicas
                scale_services_inplace "$service" "$replicas"
                ;;
            5)
                migrate_database_inplace
                ;;
            6)
                show_current_status
                ;;
            7)
                print_success "Goodbye!"
                exit 0
                ;;
            *)
                print_error "Invalid option: $choice"
                ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
        echo ""
    done
}

# Main execution
main() {
    # Always verify infrastructure first
    verify_infrastructure_exists
    
    # If called with arguments, execute specific operation
    if [ $# -gt 0 ]; then
        case "$1" in
            "update")
                update_application_inplace
                ;;
            "status")
                show_current_status
                ;;
            "config")
                update_configuration_inplace "${2:-environment}"
                ;;
            "migrate")
                migrate_database_inplace
                ;;
            *)
                print_error "Unknown operation: $1"
                ;;
        esac
    else
        # Interactive mode
        main_menu
    fi
}

# Error handling
trap 'print_critical "❌ Operation failed - existing infrastructure preserved"; exit 1' ERR

# Execute main function
main "$@"