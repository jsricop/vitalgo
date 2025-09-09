#!/bin/bash

# =============================================================================
# VitalGO Local Development Deployment Script
# =============================================================================
# Este script levanta todos los servicios necesarios para desarrollo local:
# - Backend FastAPI + PostgreSQL + Redis
# - Frontend Next.js
# - Validaciones y correcciones automáticas
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
SHARED_AGENTS_PATH="/Users/jsricop/dev-rq/shared/agents/init"

echo -e "${BLUE}🚀 VitalGO Local Development Deployment${NC}"
echo -e "${BLUE}=======================================${NC}"
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

check_command() {
    if command -v "$1" >/dev/null 2>&1; then
        print_success "$1 is available"
        return 0
    else
        print_error "$1 is not available"
        return 1
    fi
}

wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=${3:-30}
    local attempt=0

    print_step "Waiting for $service_name to be ready..."
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s -f "$url" >/dev/null 2>&1; then
            print_success "$service_name is ready!"
            return 0
        fi
        
        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done
    
    print_error "$service_name failed to start after $((max_attempts * 2)) seconds"
    return 1
}

# =============================================================================
# PRE-FLIGHT CHECKS
# =============================================================================

print_step "🔍 Running pre-flight checks..."

# Check if we're in the right directory
if [ ! -d "$BACKEND_PATH" ] || [ ! -d "$FRONTEND_PATH" ]; then
    print_error "Backend or Frontend directories not found!"
    print_error "Expected: $BACKEND_PATH and $FRONTEND_PATH"
    exit 1
fi

# Check system requirements
MISSING_DEPS=0

if ! check_command "docker"; then
    print_error "Docker is required but not installed"
    print_error "Install from: https://docs.docker.com/get-docker/"
    MISSING_DEPS=1
fi

if ! check_command "node"; then
    print_error "Node.js is required but not installed"
    print_error "Install from: https://nodejs.org/ (version 18+)"
    MISSING_DEPS=1
fi

if ! check_command "python3"; then
    print_error "Python 3 is required but not installed"
    print_error "Install Python 3.13.7+ from: https://python.org/"
    MISSING_DEPS=1
fi

# Check if Poetry is available in PATH
if ! command -v poetry >/dev/null 2>&1 && ! test -f "$HOME/.local/bin/poetry"; then
    print_error "Poetry is required but not installed"
    print_error "Install with: curl -sSL https://install.python-poetry.org | python3 -"
    MISSING_DEPS=1
fi

if [ $MISSING_DEPS -eq 1 ]; then
    print_error "Please install missing dependencies and try again"
    exit 1
fi

print_success "All system requirements met!"

# =============================================================================
# VERSION VALIDATION AND UPDATES
# =============================================================================

print_step "📦 Validating tool versions..."

# Python version check
PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d'.' -f1)
PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d'.' -f2)

if [ "$PYTHON_MAJOR" -lt 3 ] || ([ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 13 ]); then
    print_warning "Python $PYTHON_VERSION detected. Recommended: Python 3.13.7+"
else
    print_success "Python $PYTHON_VERSION ✓"
fi

# Node.js version check
NODE_VERSION=$(node --version | cut -d'v' -f2)
NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1)

if [ "$NODE_MAJOR" -lt 18 ]; then
    print_warning "Node.js $NODE_VERSION detected. Recommended: Node.js 18+"
else
    print_success "Node.js v$NODE_VERSION ✓"
fi

# Docker version check
DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
print_success "Docker $DOCKER_VERSION ✓"

# Poetry setup
if command -v poetry >/dev/null 2>&1; then
    POETRY_CMD="poetry"
    POETRY_VERSION=$(poetry --version | cut -d' ' -f3)
else
    POETRY_CMD="$HOME/.local/bin/poetry"
    POETRY_VERSION=$($POETRY_CMD --version 2>/dev/null | cut -d' ' -f3 || echo "unknown")
fi
print_success "Poetry $POETRY_VERSION ✓"

# =============================================================================
# STOP ANY EXISTING SERVICES
# =============================================================================

print_step "🛑 Stopping any existing services..."

# Kill any running FastAPI processes
pkill -f "uvicorn slices.main:app" >/dev/null 2>&1 || true

# Kill any running Next.js processes
pkill -f "next dev" >/dev/null 2>&1 || true

# Stop any running containers
cd "$BACKEND_PATH"
docker-compose down >/dev/null 2>&1 || true

print_success "Existing services stopped"

# =============================================================================
# BACKEND SETUP AND DEPLOYMENT
# =============================================================================

print_step "🔧 Setting up Backend (FastAPI + PostgreSQL + Redis)..."

cd "$BACKEND_PATH"

# Install/update backend dependencies
if [ ! -f "poetry.lock" ]; then
    print_step "Installing backend dependencies..."
    export PATH="$HOME/.local/bin:$PATH"
    $POETRY_CMD install
else
    print_step "Updating backend dependencies..."
    export PATH="$HOME/.local/bin:$PATH"
    $POETRY_CMD install --sync
fi

# Start infrastructure services (PostgreSQL + Redis)
print_step "Starting database and cache services..."
docker-compose up -d postgres redis

# Wait for services to be healthy
print_step "Waiting for infrastructure services..."
sleep 10

# Check service health
MAX_RETRIES=15
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    HEALTHY_COUNT=$(docker-compose ps --format "table {{.Service}}\t{{.Status}}" | grep -c "healthy" || echo "0")
    if [ "$HEALTHY_COUNT" -ge 2 ]; then
        print_success "Infrastructure services are healthy!"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        print_warning "Infrastructure services may not be fully healthy, but continuing..."
        docker-compose ps
        break
    fi
    
    echo -n "."
    sleep 2
done

# Run database migrations
print_step "Running database migrations..."
export PATH="$HOME/.local/bin:$PATH"
$POETRY_CMD run alembic upgrade head

# Validate backend setup with tests
print_step "Validating backend setup..."
if $POETRY_CMD run pytest tests/ -v --tb=short >/dev/null 2>&1; then
    print_success "Backend tests passed!"
else
    print_warning "Some backend tests failed, but continuing deployment..."
fi

# Start FastAPI server
print_step "Starting FastAPI backend server..."
export PATH="$HOME/.local/bin:$PATH"
nohup $POETRY_CMD run uvicorn slices.main:app --reload --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to be ready
wait_for_service "http://localhost:8000/health" "Backend API" 15

# =============================================================================
# FRONTEND SETUP AND DEPLOYMENT
# =============================================================================

print_step "🎨 Setting up Frontend (Next.js + TypeScript)..."

cd "$FRONTEND_PATH"

# Check if node_modules exists and is up to date
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    print_step "Installing/updating frontend dependencies..."
    npm install
else
    print_step "Frontend dependencies are up to date"
fi

# Validate frontend setup
print_step "Validating frontend setup..."

# Type check
if npm run type-check >/dev/null 2>&1; then
    print_success "TypeScript compilation successful!"
else
    print_warning "TypeScript issues found, but continuing deployment..."
fi

# Lint check (non-blocking)
if npm run lint >/dev/null 2>&1; then
    print_success "ESLint validation passed!"
else
    print_warning "ESLint issues found, but continuing deployment..."
fi

# Start Next.js development server
print_step "Starting Next.js frontend server..."
nohup npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to be ready
wait_for_service "http://localhost:3000" "Frontend" 30

# =============================================================================
# HEALTH VALIDATION
# =============================================================================

print_step "🏥 Running comprehensive health checks..."

# Backend health check
if curl -s -f "http://localhost:8000/health/detailed" >/dev/null; then
    BACKEND_HEALTH=$(curl -s "http://localhost:8000/health/detailed" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    if [ "$BACKEND_HEALTH" = "healthy" ]; then
        print_success "Backend health: All services healthy ✓"
    else
        print_warning "Backend health: Some services unhealthy"
    fi
else
    print_error "Backend health check failed"
fi

# Frontend health check
if curl -s -f "http://localhost:3000" >/dev/null; then
    print_success "Frontend health: Server responding ✓"
else
    print_error "Frontend health check failed"
fi

# Database connectivity
cd "$BACKEND_PATH"
if docker-compose exec -T postgres psql -U backend_user -d backend_db -c "SELECT 1;" >/dev/null 2>&1; then
    print_success "Database connectivity: OK ✓"
else
    print_warning "Database connectivity: Issues detected"
fi

# Redis connectivity
if docker-compose exec -T redis redis-cli ping >/dev/null 2>&1; then
    print_success "Redis connectivity: OK ✓"
else
    print_warning "Redis connectivity: Issues detected"
fi

# =============================================================================
# DEPLOYMENT SUMMARY
# =============================================================================

echo ""
echo -e "${GREEN}🎉 LOCAL DEPLOYMENT COMPLETE! 🎉${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "${BLUE}📍 Service URLs:${NC}"
echo -e "   🔗 Frontend:        http://localhost:3000"
echo -e "   🔗 Backend API:     http://localhost:8000"
echo -e "   🔗 API Docs:        http://localhost:8000/docs"
echo -e "   🔗 Alternative Docs: http://localhost:8000/redoc"
echo ""
echo -e "${BLUE}🗄️  Database Access:${NC}"
echo -e "   🔗 PostgreSQL:      localhost:5432 (backend_db/backend_user)"
echo -e "   🔗 Redis:           localhost:6379"
echo ""
echo -e "${BLUE}📊 Process IDs:${NC}"
echo -e "   🆔 Backend PID:     $BACKEND_PID"
echo -e "   🆔 Frontend PID:    $FRONTEND_PID"
echo ""
echo -e "${BLUE}📝 Log Files:${NC}"
echo -e "   📄 Backend logs:    $BACKEND_PATH/backend.log"
echo -e "   📄 Frontend logs:   $FRONTEND_PATH/frontend.log"
echo ""
echo -e "${YELLOW}💡 Development Tips:${NC}"
echo -e "   • Code changes will auto-reload in both services"
echo -e "   • Use 'docker-compose logs -f postgres redis' for DB logs"
echo -e "   • Run './stop-local-deploy.sh' to stop all services cleanly"
echo -e "   • Backend tests: cd backend && poetry run pytest"
echo -e "   • Frontend tests: cd frontend && npm test"
echo ""
echo -e "${GREEN}🚀 Ready for development! Happy coding! 🚀${NC}"

# Save PIDs for cleanup script
echo "$BACKEND_PID" > "$PROJECT_ROOT/.backend_pid"
echo "$FRONTEND_PID" > "$PROJECT_ROOT/.frontend_pid"