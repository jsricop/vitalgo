#!/bin/bash

# VitalGo - AWS Infrastructure Discovery & Mapping Tool
# CRITICAL: Maps existing infrastructure BEFORE making any changes
# Prevents accidental infrastructure recreation

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

print_header() {
    echo -e "${CYAN}$1${NC}"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_found() {
    echo -e "${GREEN}[FOUND]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_critical() {
    echo -e "${RED}[CRITICAL]${NC} $1"
}

# Generate infrastructure report
generate_report() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local report_file="aws-infrastructure-report-$timestamp.json"
    
    print_info "Generating comprehensive infrastructure report..."
    
    cat > "$report_file" << 'EOF'
{
  "vitalgo_infrastructure": {
    "discovery_date": "",
    "ec2_instances": [],
    "rds_instances": [],
    "s3_buckets": [],
    "cloudformation_stacks": [],
    "security_groups": [],
    "key_pairs": [],
    "load_balancers": [],
    "route53_zones": []
  }
}
EOF

    # Update discovery date
    sed -i '' "s/\"discovery_date\": \"\"/\"discovery_date\": \"$(date)\"/" "$report_file"
    
    echo "$report_file"
}

# Show banner
show_banner() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║                                                          ║"
    echo "║     🗺️  VitalGo Infrastructure Discovery Tool          ║"
    echo "║     🛡️  Prevents Accidental Infrastructure Changes     ║"
    echo "║                                                          ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Discover EC2 instances
discover_ec2() {
    print_header "🖥️  EC2 INSTANCES"
    echo "=================================================="
    
    local instances=$(aws ec2 describe-instances \
        --filters "Name=instance-state-name,Values=running,stopped" \
        --query 'Reservations[].Instances[].[InstanceId,PublicIpAddress,PrivateIpAddress,State.Name,Tags[?Key==`Name`].Value|[0],InstanceType]' \
        --output text)
    
    if [ -n "$instances" ]; then
        echo "$instances" | while read -r instance_id public_ip private_ip state name instance_type; do
            print_found "Instance: $name ($instance_id)"
            echo "  └─ Type: $instance_type"
            echo "  └─ State: $state"
            echo "  └─ Public IP: ${public_ip:-"None"}"
            echo "  └─ Private IP: $private_ip"
            echo ""
        done
    else
        print_warning "No EC2 instances found"
    fi
}

# Discover RDS instances
discover_rds() {
    print_header "🗄️  RDS DATABASES"
    echo "=================================================="
    
    local dbs=$(aws rds describe-db-instances \
        --query 'DBInstances[].[DBInstanceIdentifier,DBName,Endpoint.Address,DBInstanceStatus,Engine,DBInstanceClass]' \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$dbs" ]; then
        echo "$dbs" | while read -r db_id db_name endpoint status engine class; do
            print_found "Database: $db_id"
            echo "  └─ DB Name: ${db_name:-"None"}"
            echo "  └─ Engine: $engine"
            echo "  └─ Class: $class"
            echo "  └─ Status: $status"
            echo "  └─ Endpoint: $endpoint"
            echo ""
        done
    else
        print_warning "No RDS instances found"
    fi
}

# Discover S3 buckets
discover_s3() {
    print_header "🪣  S3 BUCKETS"
    echo "=================================================="
    
    local buckets=$(aws s3api list-buckets --query 'Buckets[?contains(Name, `vitalgo`)].Name' --output text 2>/dev/null || echo "")
    
    if [ -n "$buckets" ]; then
        echo "$buckets" | while read -r bucket; do
            print_found "Bucket: $bucket"
            
            # Get bucket region
            local region=$(aws s3api get-bucket-location --bucket "$bucket" --query 'LocationConstraint' --output text 2>/dev/null || echo "us-east-1")
            [ "$region" = "None" ] && region="us-east-1"
            echo "  └─ Region: $region"
            
            # Get bucket size (approximation)
            local size=$(aws s3api list-objects-v2 --bucket "$bucket" --query 'length(Contents)' --output text 2>/dev/null || echo "0")
            echo "  └─ Objects: $size"
            echo ""
        done
    else
        print_warning "No VitalGo S3 buckets found"
    fi
}

# Discover CloudFormation stacks
discover_cloudformation() {
    print_header "📚 CLOUDFORMATION STACKS"
    echo "=================================================="
    
    local stacks=$(aws cloudformation list-stacks \
        --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE \
        --query 'StackSummaries[?contains(StackName, `vitalgo`)].[StackName,StackStatus,CreationTime]' \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$stacks" ]; then
        echo "$stacks" | while read -r stack_name status creation_time; do
            print_found "Stack: $stack_name"
            echo "  └─ Status: $status"
            echo "  └─ Created: $creation_time"
            
            # Get stack outputs
            local outputs=$(aws cloudformation describe-stacks \
                --stack-name "$stack_name" \
                --query 'Stacks[0].Outputs[].[OutputKey,OutputValue]' \
                --output text 2>/dev/null || echo "")
            
            if [ -n "$outputs" ]; then
                echo "  └─ Outputs:"
                echo "$outputs" | while read -r key value; do
                    echo "     • $key: $value"
                done
            fi
            echo ""
        done
    else
        print_warning "No VitalGo CloudFormation stacks found"
    fi
}

# Discover Security Groups
discover_security_groups() {
    print_header "🛡️  SECURITY GROUPS"
    echo "=================================================="
    
    local sgs=$(aws ec2 describe-security-groups \
        --filters "Name=group-name,Values=*vitalgo*" \
        --query 'SecurityGroups[].[GroupId,GroupName,Description]' \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$sgs" ]; then
        echo "$sgs" | while read -r group_id group_name description; do
            print_found "Security Group: $group_name ($group_id)"
            echo "  └─ Description: $description"
            echo ""
        done
    else
        print_warning "No VitalGo security groups found"
    fi
}

# Discover Key Pairs
discover_key_pairs() {
    print_header "🔑 KEY PAIRS"
    echo "=================================================="
    
    local keys=$(aws ec2 describe-key-pairs \
        --query 'KeyPairs[?contains(KeyName, `vitalgo`)].[KeyName,KeyFingerprint]' \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$keys" ]; then
        echo "$keys" | while read -r key_name fingerprint; do
            print_found "Key Pair: $key_name"
            echo "  └─ Fingerprint: $fingerprint"
            echo ""
        done
    else
        print_warning "No VitalGo key pairs found"
    fi
}

# Generate change recommendations
generate_recommendations() {
    print_header "💡 CHANGE STRATEGY RECOMMENDATIONS"
    echo "=================================================="
    
    print_info "Based on discovered infrastructure:"
    echo ""
    
    # Check if we have existing infrastructure
    local has_ec2=$(aws ec2 describe-instances --filters "Name=instance-state-name,Values=running" --query 'length(Reservations[].Instances[])' --output text)
    local has_rds=$(aws rds describe-db-instances --query 'length(DBInstances[])' --output text 2>/dev/null || echo "0")
    
    if [ "$has_ec2" -gt 0 ] || [ "$has_rds" -gt 0 ]; then
        print_found "✅ EXISTING INFRASTRUCTURE DETECTED"
        echo ""
        echo "🎯 RECOMMENDED ACTIONS:"
        echo "  • Use IN-PLACE updates only"
        echo "  • Update code via Docker container replacement"
        echo "  • Update configurations via SSH/docker-compose"
        echo "  • NEVER recreate infrastructure"
        echo ""
        echo "🚫 FORBIDDEN ACTIONS:"
        echo "  • CloudFormation deploy (creates new resources)"
        echo "  • EC2 instance termination/recreation"
        echo "  • RDS instance replacement"
        echo "  • VPC/networking changes"
        echo ""
        echo "✅ SAFE COMMANDS:"
        echo "  • ./update-vitalgo-safe.sh"
        echo "  • docker-compose up --force-recreate (containers only)"
        echo "  • SSH-based configuration updates"
        echo ""
    else
        print_warning "⚠️  NO EXISTING INFRASTRUCTURE FOUND"
        echo ""
        echo "🎯 RECOMMENDED ACTIONS:"
        echo "  • Create infrastructure from scratch"
        echo "  • Use CloudFormation deployment"
        echo "  • Run ./deploy-auto.sh"
        echo ""
    fi
}

# Main execution
main() {
    show_banner
    
    print_info "Discovering VitalGo infrastructure in AWS..."
    print_info "Region: $(aws configure get region)"
    print_info "Account: $(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo "Unknown")"
    echo ""
    
    # Generate report file
    local report_file
    report_file=$(generate_report)
    
    # Discovery phases
    discover_ec2
    discover_rds
    discover_s3
    discover_cloudformation
    discover_security_groups
    discover_key_pairs
    
    # Generate recommendations
    generate_recommendations
    
    # Final summary
    print_header "📋 INFRASTRUCTURE DISCOVERY COMPLETE"
    echo "=================================================="
    print_info "Report saved to: $report_file"
    print_info "Use this information to plan changes safely"
    
    echo ""
    print_critical "🚨 REMEMBER: Always check infrastructure before making changes"
    print_critical "🛡️  Use IN-PLACE updates when infrastructure exists"
    print_critical "📝 Document any infrastructure changes"
}

# Error handling
trap 'print_critical "Discovery failed - check AWS credentials and permissions"; exit 1' ERR

# Execute main function
main "$@"