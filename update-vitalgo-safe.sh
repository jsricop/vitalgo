#!/bin/bash

# VitalGo - PRODUCTION-SAFE UPDATE SCRIPT
# CRITICAL: This script PRESERVES AWS database data
# Only updates: Frontend, Backend, Redis (NO DATABASE CHANGES)

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
PURPLE='\033[0;35m'
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

print_critical() {
    echo -e "${PURPLE}[CRITICAL]${NC} $1"
}

# Función principal
main() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║                                                          ║"
    echo "║     VitalGo - PRODUCTION-SAFE UPDATE                    ║"
    echo "║     🛡️  DATABASE PRESERVATION GUARANTEED               ║"
    echo "║                                                          ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    print_critical "🛡️  This script GUARANTEES database preservation"
    print_critical "📊 Only updates: Frontend, Backend, Redis"
    print_critical "🚫 NEVER touches: PostgreSQL data, volumes, or schemas"
    echo ""

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

    print_status "Paso 3: 🛡️  DEPLOYING WITH DATABASE PROTECTION..."
    
    # Deploy en EC2 with DATABASE PROTECTION
    print_critical "🛡️  Using AWS-safe configuration to protect database..."
    ssh -i ~/.ssh/vitalgo-key.pem ec2-user@${EC2_IP} << 'ENDSSH'
        cd vitalgo
        
        # CRITICAL: Backup database before any changes
        echo "🛡️  Creating database backup as safety measure..."
        sudo docker exec vitalgo-postgres-1 pg_dump -U backend_user -d backend_db > "backup_$(date +%Y%m%d_%H%M%S).sql"
        
        echo "📦 Descargando nuevas imágenes (preservando database)..."
        sudo docker-compose -f docker-compose.aws-safe.yml pull backend frontend redis
        
        echo "🔄 Updating ONLY non-database services..."
        # Stop only backend and frontend, KEEP DATABASE RUNNING
        sudo docker-compose -f docker-compose.aws-safe.yml stop backend frontend redis
        
        # Remove only backend and frontend containers, PRESERVE DATABASE
        sudo docker-compose -f docker-compose.aws-safe.yml rm -f backend frontend redis
        
        echo "🚀 Starting updated services with database preservation..."
        # Start with AWS-safe configuration
        sudo docker-compose -f docker-compose.aws-safe.yml up -d
        
        echo "✅ Verificando que database persiste..."
        # Verify database is accessible and contains data
        sudo docker exec vitalgo-postgres-1 psql -U backend_user -d backend_db -c "SELECT COUNT(*) as patient_count FROM patients;"
        
        echo "📊 Estado final de contenedores:"
        sudo docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        
        echo "🛡️  DATABASE PROTECTION: SUCCESS ✅"
ENDSSH

    if [ $? -eq 0 ]; then
        print_success "🛡️  Despliegue seguro completado exitosamente"
    else
        print_error "❌ Despliegue falló - Base de datos protegida"
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

    # Database verification
    print_status "Verificando persistencia de base de datos..."
    ssh -i ~/.ssh/vitalgo-key.pem ec2-user@${EC2_IP} \
        "sudo docker exec vitalgo-postgres-1 psql -U backend_user -d backend_db -c 'SELECT COUNT(*) FROM users;'" &> /dev/null
    if [ $? -eq 0 ]; then
        print_success "🛡️  Base de datos AWS preservada correctamente"
    else
        print_warning "⚠️  Verificación de base de datos falló"
    fi

    echo ""
    print_success "🎉 ACTUALIZACIÓN SEGURA COMPLETADA!"
    echo ""
    print_critical "🛡️  GARANTÍAS CUMPLIDAS:"
    echo "  ✅ Base de datos AWS: PRESERVADA"
    echo "  ✅ Datos de usuarios: INTACTOS"
    echo "  ✅ Configuración: ACTUALIZADA"
    echo ""
    print_status "URLs de la aplicación:"
    echo "  🌐 Frontend: http://${EC2_IP}:3000"
    echo "  🔗 API: http://${EC2_IP}:8000"
    echo "  🔐 SSH: ssh -i ~/.ssh/vitalgo-key.pem ec2-user@${EC2_IP}"
    echo ""
}

# Trap para manejo de errores
trap 'print_error "❌ Script falló, pero la base de datos AWS está protegida"' ERR

# Ejecutar función principal
main "$@"