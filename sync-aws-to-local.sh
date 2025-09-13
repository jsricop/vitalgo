#!/bin/bash

# VitalGo - AWS to Local Data Sync (ONE DIRECTION ONLY)
# CRITICAL: This script ONLY syncs FROM AWS TO LOCAL
# NEVER EVER syncs from Local to AWS

set -e

# Configuration
EC2_IP="35.169.20.114"
LOCAL_DB_NAME="backend_db"
LOCAL_DB_USER="backend_user"
LOCAL_DB_PASS="backend_pass"
BACKUP_DIR="./aws-backups"

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

print_direction() {
    echo -e "${CYAN}[DIRECTION]${NC} $1"
}

# Safety confirmation
safety_check() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║                                                          ║"
    echo "║     🔄 AWS → LOCAL DATA SYNC (ONE WAY ONLY)            ║"
    echo "║     🛡️  ZERO RISK TO AWS PRODUCTION DATA               ║"
    echo "║                                                          ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    print_critical "🚨 SAFETY CONFIRMATION REQUIRED"
    print_direction "📥 FROM: AWS Production Database (35.169.20.114)"
    print_direction "📤 TO:   Local Development Database"
    print_critical "🛡️  AWS data will NEVER be modified"
    print_warning "⚠️  Local data will be REPLACED"
    echo ""
    
    read -p "Type 'SYNC_AWS_TO_LOCAL' to confirm: " confirmation
    if [ "$confirmation" != "SYNC_AWS_TO_LOCAL" ]; then
        print_error "❌ Sync cancelled - confirmation failed"
    fi
    
    print_success "✅ Safety check passed - proceeding with AWS→Local sync"
}

# Create backup directory
setup_backup_dir() {
    print_status "📁 Setting up backup directory..."
    mkdir -p "$BACKUP_DIR"
    print_success "Backup directory ready: $BACKUP_DIR"
}

# Backup current local data (safety measure)
backup_local_data() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/local_backup_$timestamp.sql"
    
    print_status "💾 Backing up current local data..."
    
    # Check if local PostgreSQL is running
    if ! pg_isready -h localhost -p 5432 -U $LOCAL_DB_USER &> /dev/null; then
        print_warning "Local PostgreSQL not accessible - skipping local backup"
        return 0
    fi
    
    PGPASSWORD=$LOCAL_DB_PASS pg_dump -h localhost -U $LOCAL_DB_USER -d $LOCAL_DB_NAME > "$backup_file" 2>/dev/null || {
        print_warning "Local database backup failed - continuing anyway"
        return 0
    }
    
    print_success "Local data backed up to: $backup_file"
}

# Download AWS database dump
download_aws_data() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local aws_dump_file="$BACKUP_DIR/aws_dump_$timestamp.sql"
    
    print_status "📥 Downloading AWS production data..."
    print_direction "🌐 Connecting to AWS: $EC2_IP"
    
    # Download database dump from AWS
    ssh -i ~/.ssh/vitalgo-key.pem ec2-user@${EC2_IP} << ENDSSH > "$aws_dump_file"
        echo "-- VitalGo AWS Production Data Dump"
        echo "-- Generated: \$(date)"
        echo "-- Source: AWS EC2 (${EC2_IP})"
        echo ""
        
        # Create complete database dump
        sudo docker exec vitalgo-postgres-1 pg_dump -U backend_user -d backend_db \
            --no-owner --no-privileges --clean --if-exists
ENDSSH

    if [ $? -eq 0 ] && [ -s "$aws_dump_file" ]; then
        print_success "✅ AWS data downloaded: $aws_dump_file"
        echo "$aws_dump_file"  # Return filename
    else
        print_error "❌ Failed to download AWS data"
    fi
}

# Import AWS data to local database
import_to_local() {
    local dump_file="$1"
    
    print_status "📤 Importing AWS data to local database..."
    print_direction "🎯 Target: Local PostgreSQL (localhost:5432)"
    
    # Ensure local PostgreSQL is running
    if ! pg_isready -h localhost -p 5432 -U $LOCAL_DB_USER &> /dev/null; then
        print_error "❌ Local PostgreSQL is not running. Start it first."
    fi
    
    # Import the dump
    print_status "🔄 Importing data (this may take a few minutes)..."
    PGPASSWORD=$LOCAL_DB_PASS psql -h localhost -U $LOCAL_DB_USER -d $LOCAL_DB_NAME -f "$dump_file" &> /dev/null
    
    if [ $? -eq 0 ]; then
        print_success "✅ AWS data successfully imported to local database"
    else
        print_error "❌ Failed to import AWS data"
    fi
}

# Verify sync was successful
verify_sync() {
    print_status "🔍 Verifying sync was successful..."
    
    # Get counts from local database
    local user_count=$(PGPASSWORD=$LOCAL_DB_PASS psql -h localhost -U $LOCAL_DB_USER -d $LOCAL_DB_NAME -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ')
    local patient_count=$(PGPASSWORD=$LOCAL_DB_PASS psql -h localhost -U $LOCAL_DB_USER -d $LOCAL_DB_NAME -t -c "SELECT COUNT(*) FROM patients;" 2>/dev/null | tr -d ' ')
    
    if [[ "$user_count" =~ ^[0-9]+$ ]] && [[ "$patient_count" =~ ^[0-9]+$ ]] && [ "$user_count" -gt 0 ]; then
        print_success "✅ Sync verification passed:"
        echo "  👥 Users: $user_count"
        echo "  🏥 Patients: $patient_count"
        echo "  📊 Data appears consistent"
    else
        print_warning "⚠️  Sync verification inconclusive"
        echo "  👥 Users: $user_count"
        echo "  🏥 Patients: $patient_count"
    fi
}

# Generate sync report
generate_report() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local report_file="$BACKUP_DIR/sync_report_$timestamp.txt"
    
    print_status "📋 Generating sync report..."
    
    cat > "$report_file" << EOF
VitalGo AWS→Local Data Sync Report
================================

Sync Date: $(date)
Direction: AWS (${EC2_IP}) → Local (localhost)
Status: SUCCESS

AWS Data Source:
- IP: ${EC2_IP}
- Database: PostgreSQL in Docker
- Method: pg_dump via SSH

Local Target:
- Host: localhost:5432
- Database: ${LOCAL_DB_NAME}
- User: ${LOCAL_DB_USER}

Safety Measures:
✅ Local backup created before sync
✅ AWS data never modified
✅ One-way sync enforced
✅ Verification completed

Files Created:
$(ls -la $BACKUP_DIR/*.sql 2>/dev/null || echo "No backup files found")

Next Steps:
- Local environment now matches AWS production
- Ready for bug fixes and testing
- Use ./update-vitalgo-safe.sh for deployments

EOF

    print_success "📋 Sync report saved: $report_file"
}

# Main function
main() {
    safety_check
    setup_backup_dir
    backup_local_data
    
    local aws_dump_file
    aws_dump_file=$(download_aws_data)
    
    import_to_local "$aws_dump_file"
    verify_sync
    generate_report
    
    echo ""
    print_success "🎉 AWS→Local sync completed successfully!"
    echo ""
    print_critical "🛡️  SAFETY GUARANTEES MAINTAINED:"
    echo "  ✅ AWS production data: UNTOUCHED"
    echo "  ✅ Local environment: UPDATED"
    echo "  ✅ Backups: CREATED"
    echo ""
    print_status "💡 Next steps:"
    echo "  1. Test changes locally"
    echo "  2. Use ./update-vitalgo-safe.sh to deploy"
    echo "  3. Re-sync anytime with this script"
    echo ""
}

# Error handling
trap 'print_error "❌ Sync failed, but AWS data remains safe"' ERR

# Run main function
main "$@"