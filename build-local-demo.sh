#!/bin/bash

# VitalGo - Local Build Demo (sin DockerHub)
# Este script demuestra el build local rápido

set -e

# Configuration
DOCKER_USERNAME="gruporq"
PROJECT_NAME="vitalgo"
VERSION=$(date +%Y%m%d-%H%M%S)

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

print_demo() {
    echo -e "${CYAN}[DEMO]${NC} $1"
}

# Show banner
show_banner() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║                                                          ║"
    echo "║     VitalGo - Fast Build Demo                            ║"
    echo "║     Demostrando build local súper rápido                ║"
    echo "║                                                          ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_status "Verificando prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker not found. Please install Docker first."
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker daemon not running. Please start Docker."
        exit 1
    fi
    
    print_success "Prerequisites OK ✅"
}

# Build images locally
build_images_demo() {
    print_demo "Iniciando build paralelo de imágenes..."
    local start_time=$(date +%s)
    
    # Backend image
    print_status "🔨 Building backend image..."
    docker build -t ${DOCKER_USERNAME}/${PROJECT_NAME}-backend:${VERSION} \
                 -t ${DOCKER_USERNAME}/${PROJECT_NAME}-backend:demo \
                 ./backend &
    
    BACKEND_PID=$!
    
    # Frontend image  
    print_status "🔨 Building frontend image..."
    docker build -t ${DOCKER_USERNAME}/${PROJECT_NAME}-frontend:${VERSION} \
                 -t ${DOCKER_USERNAME}/${PROJECT_NAME}-frontend:demo \
                 ./frontend &
    
    FRONTEND_PID=$!
    
    # Wait for both builds
    print_status "⏳ Esperando builds paralelos..."
    
    wait $BACKEND_PID
    if [ $? -eq 0 ]; then
        print_success "✅ Backend build completado"
    else
        print_error "❌ Backend build falló"
        exit 1
    fi
    
    wait $FRONTEND_PID
    if [ $? -eq 0 ]; then
        print_success "✅ Frontend build completado"
    else
        print_error "❌ Frontend build falló"
        exit 1
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local minutes=$((duration / 60))
    local seconds=$((duration % 60))
    
    print_success "🎉 Builds completados en ${minutes}m ${seconds}s!"
}

# Show images created
show_images() {
    print_status "📦 Imágenes creadas:"
    docker images | grep "${DOCKER_USERNAME}/${PROJECT_NAME}"
}

# Demo summary
show_demo_summary() {
    echo ""
    print_demo "🎯 DEMO COMPLETADO!"
    echo ""
    print_status "✨ Lo que acabamos de demostrar:"
    echo "  🚀 Build paralelo backend + frontend"
    echo "  ⚡ Ejecución en tu máquina potente (no t2.micro)"
    echo "  🏷️  Imágenes tagged con versión: $VERSION"
    echo "  📦 Listo para deploy rápido a AWS"
    echo ""
    
    print_status "🔄 Próximos pasos (en producción):"
    echo "  1️⃣  docker login (para DockerHub)"
    echo "  2️⃣  ./build-and-push.sh (push a registry)"
    echo "  3️⃣  ./deploy-to-aws.sh (deploy desde registry)"
    echo ""
    
    print_demo "💡 Ventaja: ${CYAN}3-5 min vs 15-20 min${NC} build en EC2!"
}

# Main function
main() {
    show_banner
    
    print_demo "Ejecutando build local demo..."
    print_status "Versión: $VERSION"
    echo ""
    
    check_prerequisites
    build_images_demo
    show_images
    show_demo_summary
    
    # Save version for reference
    echo $VERSION > .last-demo-version
    
    print_success "Demo completado! Las imágenes están listas localmente 🎉"
}

# Run main function
main "$@"