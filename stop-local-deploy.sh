#!/bin/bash

# =============================================================================
# VitalGO Local Development Stop Script
# =============================================================================
# Este script detiene todos los servicios de desarrollo local de manera segura:
# - Frontend Next.js
# - Backend FastAPI
# - Servicios Docker (PostgreSQL + Redis)
# - Limpia procesos y archivos temporales
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project paths
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_PATH="$PROJECT_ROOT/backend"
FRONTEND_PATH="$PROJECT_ROOT/frontend"

echo -e "${BLUE}🛑 VitalGO Local Development Stop${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

print_step() {
    echo -e "${BLUE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

stop_process_by_pid() {
    local pid_file=$1
    local service_name=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            print_step "Stopping $service_name (PID: $pid)..."
            kill -TERM "$pid" 2>/dev/null || true
            
            # Wait for graceful shutdown
            local count=0
            while kill -0 "$pid" 2>/dev/null && [ $count -lt 10 ]; do
                sleep 1
                count=$((count + 1))
            done
            
            # Force kill if still running
            if kill -0 "$pid" 2>/dev/null; then
                print_warning "Force killing $service_name..."
                kill -KILL "$pid" 2>/dev/null || true
            fi
            
            print_success "$service_name stopped successfully"
        else
            print_warning "$service_name was not running (stale PID file)"
        fi
        
        rm -f "$pid_file"
    else
        print_step "No PID file found for $service_name"
    fi
}

stop_processes_by_name() {
    local process_pattern=$1
    local service_name=$2
    
    print_step "Stopping all $service_name processes..."
    
    local pids=$(pgrep -f "$process_pattern" 2>/dev/null || true)
    
    if [ -n "$pids" ]; then
        echo "$pids" | while read -r pid; do
            if [ -n "$pid" ]; then
                print_step "Stopping $service_name process (PID: $pid)..."
                kill -TERM "$pid" 2>/dev/null || true
            fi
        done
        
        # Wait for graceful shutdown
        sleep 3
        
        # Force kill any remaining processes
        local remaining_pids=$(pgrep -f "$process_pattern" 2>/dev/null || true)
        if [ -n "$remaining_pids" ]; then
            print_warning "Force killing remaining $service_name processes..."
            echo "$remaining_pids" | while read -r pid; do
                if [ -n "$pid" ]; then
                    kill -KILL "$pid" 2>/dev/null || true
                fi
            done
        fi
        
        print_success "All $service_name processes stopped"
    else
        print_success "No $service_name processes were running"
    fi
}

# =============================================================================
# STOP FRONTEND SERVICES
# =============================================================================

print_step "🎨 Stopping Frontend services..."

# Stop by saved PID first
stop_process_by_pid "$PROJECT_ROOT/.frontend_pid" "Frontend (Next.js)"

# Stop any remaining Next.js processes
stop_processes_by_name "next dev" "Next.js"

# Stop any npm/node processes related to our project
if [ -d "$FRONTEND_PATH" ]; then
    cd "$FRONTEND_PATH"
    
    # Check for any running npm processes in this directory
    npm_pids=$(lsof -ti:3000 2>/dev/null || true)
    if [ -n "$npm_pids" ]; then
        print_step "Stopping processes on port 3000..."
        echo "$npm_pids" | while read -r pid; do
            kill -TERM "$pid" 2>/dev/null || true
        done
        sleep 2
        
        # Force kill if still running
        remaining_pids=$(lsof -ti:3000 2>/dev/null || true)
        if [ -n "$remaining_pids" ]; then
            print_warning "Force killing processes on port 3000..."
            echo "$remaining_pids" | while read -r pid; do
                kill -KILL "$pid" 2>/dev/null || true
            done
        fi
    fi
fi

# =============================================================================
# STOP BACKEND SERVICES
# =============================================================================

print_step "🔧 Stopping Backend services..."

# Stop by saved PID first
stop_process_by_pid "$PROJECT_ROOT/.backend_pid" "Backend (FastAPI)"

# Stop any remaining FastAPI/uvicorn processes
stop_processes_by_name "uvicorn slices.main:app" "FastAPI"
stop_processes_by_name "uvicorn.*slices" "FastAPI (alternative pattern)"

# Stop any processes on port 8000
backend_pids=$(lsof -ti:8000 2>/dev/null || true)
if [ -n "$backend_pids" ]; then
    print_step "Stopping processes on port 8000..."
    echo "$backend_pids" | while read -r pid; do
        kill -TERM "$pid" 2>/dev/null || true
    done
    sleep 2
    
    # Force kill if still running
    remaining_pids=$(lsof -ti:8000 2>/dev/null || true)
    if [ -n "$remaining_pids" ]; then
        print_warning "Force killing processes on port 8000..."
        echo "$remaining_pids" | while read -r pid; do
            kill -KILL "$pid" 2>/dev/null || true
        done
    fi
fi

# =============================================================================
# STOP DOCKER SERVICES
# =============================================================================

print_step "🐳 Stopping Docker services..."

if [ -d "$BACKEND_PATH" ]; then
    cd "$BACKEND_PATH"
    
    if [ -f "docker-compose.yml" ]; then
        # Stop and remove containers
        print_step "Stopping Docker Compose services..."
        docker-compose down --remove-orphans 2>/dev/null || print_warning "Docker Compose stop had issues"
        
        # Optional: Remove volumes (uncomment if you want to clear data)
        # print_step "Removing Docker volumes..."
        # docker-compose down -v --remove-orphans 2>/dev/null || true
        
        print_success "Docker services stopped"
    else
        print_warning "docker-compose.yml not found, skipping Docker cleanup"
    fi
else
    print_warning "Backend directory not found, skipping Docker cleanup"
fi

# Stop any remaining containers that might be related to our project
running_containers=$(docker ps -q --filter "name=backend_" 2>/dev/null || true)
if [ -n "$running_containers" ]; then
    print_step "Stopping remaining backend containers..."
    echo "$running_containers" | while read -r container; do
        docker stop "$container" 2>/dev/null || true
    done
    print_success "Remaining containers stopped"
fi

# =============================================================================
# CLEANUP TEMPORARY FILES
# =============================================================================

print_step "🧹 Cleaning up temporary files..."

# Remove PID files
rm -f "$PROJECT_ROOT/.backend_pid"
rm -f "$PROJECT_ROOT/.frontend_pid"

# Clean log files (optional - uncomment if you want to remove logs)
# rm -f "$BACKEND_PATH/backend.log"
# rm -f "$FRONTEND_PATH/frontend.log"

# Clean Next.js cache (optional)
if [ -d "$FRONTEND_PATH/.next" ]; then
    print_step "Cleaning Next.js cache..."
    rm -rf "$FRONTEND_PATH/.next"
    print_success "Next.js cache cleared"
fi

# Clean Python cache (optional)
if [ -d "$BACKEND_PATH" ]; then
    cd "$BACKEND_PATH"
    find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
    find . -name "*.pyc" -delete 2>/dev/null || true
    print_success "Python cache cleared"
fi

print_success "Cleanup completed"

# =============================================================================
# VERIFICATION
# =============================================================================

print_step "🔍 Verifying services are stopped..."

# Check ports are free
port_check_failed=0

if lsof -ti:3000 >/dev/null 2>&1; then
    print_warning "Port 3000 is still in use"
    port_check_failed=1
fi

if lsof -ti:8000 >/dev/null 2>&1; then
    print_warning "Port 8000 is still in use"
    port_check_failed=1
fi

if [ $port_check_failed -eq 0 ]; then
    print_success "All ports are free (3000, 8000)"
fi

# Check for any remaining processes
remaining_frontend=$(pgrep -f "next dev" 2>/dev/null || true)
remaining_backend=$(pgrep -f "uvicorn.*slices" 2>/dev/null || true)

if [ -n "$remaining_frontend" ] || [ -n "$remaining_backend" ]; then
    print_warning "Some processes may still be running:"
    [ -n "$remaining_frontend" ] && echo "  Frontend PIDs: $remaining_frontend"
    [ -n "$remaining_backend" ] && echo "  Backend PIDs: $remaining_backend"
else
    print_success "No remaining development processes found"
fi

# Check Docker status
if [ -d "$BACKEND_PATH" ]; then
    cd "$BACKEND_PATH"
    running_compose=$(docker-compose ps --services --filter "status=running" 2>/dev/null || true)
    if [ -n "$running_compose" ]; then
        print_warning "Some Docker Compose services may still be running:"
        echo "$running_compose"
    else
        print_success "No Docker Compose services running"
    fi
fi

# =============================================================================
# COMPLETION SUMMARY
# =============================================================================

echo ""
echo -e "${GREEN}🏁 STOP DEPLOYMENT COMPLETE! 🏁${NC}"
echo -e "${GREEN}===============================${NC}"
echo ""
echo -e "${BLUE}📊 Services Stopped:${NC}"
echo -e "   🛑 Frontend (Next.js) on port 3000"
echo -e "   🛑 Backend (FastAPI) on port 8000"
echo -e "   🛑 PostgreSQL Docker container"
echo -e "   🛑 Redis Docker container"
echo ""
echo -e "${BLUE}🧹 Cleanup Actions:${NC}"
echo -e "   ✅ Process ID files removed"
echo -e "   ✅ Cache directories cleaned"
echo -e "   ✅ Docker containers stopped"
echo ""

if [ $port_check_failed -eq 0 ]; then
    echo -e "${GREEN}💡 All services stopped cleanly! Safe to start development again.${NC}"
    echo -e "${GREEN}   Run './start-local-deploy.sh' when ready to restart${NC}"
else
    echo -e "${YELLOW}⚠️  Some ports may still be in use. You might need to:${NC}"
    echo -e "${YELLOW}   • Restart your terminal${NC}"
    echo -e "${YELLOW}   • Manually kill remaining processes${NC}"
    echo -e "${YELLOW}   • Restart Docker if needed${NC}"
fi

echo ""
echo -e "${BLUE}🚀 Development environment safely stopped! 🚀${NC}"