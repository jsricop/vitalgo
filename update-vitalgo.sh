#!/bin/bash

# VitalGo - Script de actualización automática
# Compila local → Docker Hub → Deploy AWS

set -e

# Configuración
EC2_IP="35.169.20.114"
DOCKER_USERNAME="gruporq"
PROJECT_NAME="vitalgo"

# Colors para output
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

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Función principal
main() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║                                                          ║"
    echo "║     VitalGo - Actualización Automática                  ║"
    echo "║     Local → Docker Hub → AWS EC2                        ║"
    echo "║                                                          ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    print_status "Paso 1: Compilando imágenes para AMD64..."
    
    # Build Backend AMD64
    print_status "Building backend..."
    docker build --platform linux/amd64 -t ${DOCKER_USERNAME}/${PROJECT_NAME}-backend:amd64 ./backend
    if [ $? -eq 0 ]; then
        print_success "Backend build exitoso"
    else
        print_error "Backend build falló"
    fi

    # Build Frontend AMD64
    print_status "Building frontend..."
    docker build --platform linux/amd64 -t ${DOCKER_USERNAME}/${PROJECT_NAME}-frontend:amd64 ./frontend \
        --build-arg NEXT_PUBLIC_API_URL=http://${EC2_IP}:8000
    if [ $? -eq 0 ]; then
        print_success "Frontend build exitoso"
    else
        print_error "Frontend build falló"
    fi

    print_status "Paso 2: Subiendo a Docker Hub..."
    
    # Push Backend
    print_status "Pushing backend..."
    docker push ${DOCKER_USERNAME}/${PROJECT_NAME}-backend:amd64
    if [ $? -eq 0 ]; then
        print_success "Backend push exitoso"
    else
        print_error "Backend push falló"
    fi

    # Push Frontend
    print_status "Pushing frontend..."
    docker push ${DOCKER_USERNAME}/${PROJECT_NAME}-frontend:amd64
    if [ $? -eq 0 ]; then
        print_success "Frontend push exitoso"
    else
        print_error "Frontend push falló"
    fi

    print_status "Paso 3: Desplegando en AWS EC2..."
    
    # Deploy en EC2
    print_status "Conectando a EC2 y actualizando servicios..."
    ssh -i ~/.ssh/vitalgo-key.pem ec2-user@${EC2_IP} << 'ENDSSH'
        cd vitalgo
        echo "Descargando nuevas imágenes..."
        sudo docker-compose -f docker-compose.prod.yml pull
        
        echo "Deteniendo servicios..."
        sudo docker-compose -f docker-compose.prod.yml down
        
        echo "Iniciando servicios con nuevas imágenes..."
        sudo docker-compose -f docker-compose.prod.yml up -d
        
        echo "Verificando estado..."
        sudo docker ps
        
        echo "Esperando que los servicios estén listos..."
        sleep 30
        
        echo "Estado final de contenedores:"
        sudo docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
ENDSSH

    if [ $? -eq 0 ]; then
        print_success "Despliegue en AWS completado exitosamente"
    else
        print_error "Despliegue en AWS falló"
    fi

    # Verificaciones finales
    print_status "Paso 4: Verificaciones finales..."
    
    print_status "Verificando frontend..."
    HTTP_STATUS=$(curl -o /dev/null -s -w "%{http_code}\n" http://${EC2_IP}:3000)
    if [ "$HTTP_STATUS" -eq 200 ]; then
        print_success "Frontend accesible (HTTP $HTTP_STATUS)"
    else
        print_warning "Frontend no accesible (HTTP $HTTP_STATUS)"
    fi

    print_status "Verificando backend..."
    HTTP_STATUS=$(curl -o /dev/null -s -w "%{http_code}\n" http://${EC2_IP}:8000/health)
    if [ "$HTTP_STATUS" -eq 200 ]; then
        print_success "Backend API accesible (HTTP $HTTP_STATUS)"
    else
        print_warning "Backend API no accesible (HTTP $HTTP_STATUS)"
    fi

    echo ""
    print_success "🎉 Actualización completada!"
    echo ""
    print_status "URLs de la aplicación:"
    echo "  🌐 Frontend: http://${EC2_IP}:3000"
    echo "  🔗 API: http://${EC2_IP}:8000"
    echo "  🔐 SSH: ssh -i ~/.ssh/vitalgo-key.pem ec2-user@${EC2_IP}"
    echo ""
}

# Ejecutar función principal
main "$@"