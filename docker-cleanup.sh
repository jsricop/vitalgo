#!/bin/bash

# VitalGo Docker Cleanup Script
# Removes unnecessary Docker images and resources to maintain only essential ones

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

show_banner() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║                                                          ║"
    echo "║                VitalGo Docker Cleanup                    ║"
    echo "║           Keep only necessary Docker images              ║"
    echo "║                                                          ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Function to show disk usage before cleanup
show_disk_usage_before() {
    print_status "Docker disk usage BEFORE cleanup:"
    docker system df
    echo ""
}

# Function to show disk usage after cleanup
show_disk_usage_after() {
    print_status "Docker disk usage AFTER cleanup:"
    docker system df
    echo ""
}

# Conservative cleanup - removes unused resources but keeps recent images
conservative_cleanup() {
    print_status "Performing conservative cleanup..."

    # Remove stopped containers older than 1 hour
    print_status "Removing stopped containers older than 1 hour..."
    docker container prune -f --filter "until=1h" || true

    # Remove unused networks
    print_status "Removing unused networks..."
    docker network prune -f || true

    # Remove unused volumes
    print_status "Removing unused volumes..."
    docker volume prune -f || true

    # Remove dangling images (untagged intermediate images)
    print_status "Removing dangling images..."
    docker image prune -f || true

    # Remove build cache older than 24 hours
    print_status "Removing build cache older than 24 hours..."
    docker builder prune -f --filter "until=24h" || true

    print_success "Conservative cleanup completed"
}

# Aggressive cleanup - removes all unused resources
aggressive_cleanup() {
    print_warning "Performing aggressive cleanup..."
    print_warning "This will remove ALL unused Docker resources!"

    # Remove all unused containers, networks, images (both dangling and unreferenced), and build cache
    docker system prune -a -f --volumes

    print_success "Aggressive cleanup completed"
}

# Keep only VitalGo images and essential base images
keep_essential_only() {
    print_status "Removing all non-essential images..."

    # List of essential images to keep
    KEEP_IMAGES=(
        "gruporq/vitalgo-backend"
        "gruporq/vitalgo-frontend"
        "vitalgoapp/vitalgo-backend"
        "vitalgoapp/vitalgo-frontend"
        "postgres"
        "redis"
        "node"
        "python"
    )

    # Get all image IDs except the ones we want to keep
    print_status "Identifying images to remove..."

    # Create a filter to keep essential images
    FILTER_CMD=""
    for img in "${KEEP_IMAGES[@]}"; do
        FILTER_CMD="$FILTER_CMD --filter reference!=${img}:*"
    done

    # Remove images that don't match our keep list
    if docker images --format "table {{.Repository}}:{{.Tag}}" | grep -v -E "(gruporq/vitalgo-|vitalgoapp/vitalgo-|postgres|redis|node|python|REPOSITORY)" | grep -v "<none>"; then
        print_warning "The following images will be removed:"
        docker images --format "table {{.Repository}}:{{.Tag}}" | grep -v -E "(gruporq/vitalgo-|vitalgoapp/vitalgo-|postgres|redis|node|python|REPOSITORY)" | grep -v "<none>"

        # Remove the images
        docker images --format "{{.Repository}}:{{.Tag}}" | grep -v -E "(gruporq/vitalgo-|vitalgoapp/vitalgo-|postgres|redis|node|python)" | grep -v "<none>" | xargs -r docker rmi -f
    else
        print_success "No non-essential images found to remove"
    fi
}

# Show current images
show_current_images() {
    print_status "Current Docker images:"
    docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}" | head -20
    echo ""
}

# Main cleanup function
main_cleanup() {
    local cleanup_type=${1:-"conservative"}

    show_banner
    show_disk_usage_before
    show_current_images

    case $cleanup_type in
        "conservative")
            conservative_cleanup
            ;;
        "aggressive")
            aggressive_cleanup
            ;;
        "essential")
            conservative_cleanup
            keep_essential_only
            ;;
        *)
            print_warning "Unknown cleanup type: $cleanup_type"
            print_status "Available options: conservative, aggressive, essential"
            exit 1
            ;;
    esac

    show_disk_usage_after
    show_current_images

    print_success "Cleanup completed successfully!"
}

# Check if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    CLEANUP_TYPE=${1:-"conservative"}

    echo "Usage: $0 [conservative|aggressive|essential]"
    echo "  conservative: Remove unused containers, networks, volumes, dangling images"
    echo "  aggressive:   Remove ALL unused Docker resources"
    echo "  essential:    Keep only VitalGo and essential base images"
    echo ""

    if [[ "$CLEANUP_TYPE" == "aggressive" ]] || [[ "$CLEANUP_TYPE" == "essential" ]]; then
        print_warning "You selected '$CLEANUP_TYPE' cleanup"
        print_warning "This will remove significant Docker resources!"
        read -p "Are you sure? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Cleanup cancelled"
            exit 0
        fi
    fi

    main_cleanup "$CLEANUP_TYPE"
fi