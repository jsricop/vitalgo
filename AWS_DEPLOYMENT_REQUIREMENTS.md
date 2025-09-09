# AWS Deployment Requirements - VitalGo (FREE TIER)

## 📋 Requisitos para Despliegue en AWS Free Tier

### ⚠️ Límites del Free Tier
- **12 meses** de uso gratuito desde la creación de la cuenta AWS
- **750 horas/mes** de EC2 t2.micro o t3.micro
- **30 GB** de almacenamiento EBS
- **15 GB** de transferencia de datos saliente

### 1. Infraestructura AWS Requerida (FREE TIER)

#### EC2 Instance
- **Tipo de instancia**: t2.micro (Free Tier)
  - 1 vCPU
  - 1 GB RAM
  - 8 GB almacenamiento SSD (gp2/gp3)
- **Sistema Operativo**: Ubuntu 22.04 LTS (AMI gratuita)
- **Región**: us-east-1 (Virginia) - generalmente más económica

#### Networking (FREE)
- **VPC**: Default VPC (gratis)
- **Subnet**: Pública con auto-assign public IP (gratis)
- **Security Group** (gratis) con las siguientes reglas:
  ```
  Inbound Rules:
  - SSH (22): Tu IP específica
  - HTTP (80): 0.0.0.0/0
  - HTTPS (443): 0.0.0.0/0
  
  Outbound Rules:
  - All traffic: 0.0.0.0/0
  ```

#### IP Pública
- **Usar IP pública dinámica** de la instancia (gratis mientras esté en ejecución)
- NO usar Elastic IP para evitar cargos cuando la instancia esté detenida

#### DNS (Alternativas Gratuitas)
- Usar servicios gratuitos como:
  - **DuckDNS**: Subdominio gratuito (ej: vitalgo.duckdns.org)
  - **No-IP**: DNS dinámico gratuito
  - **Freenom**: Dominios .tk, .ml gratuitos

### 2. Optimización para t2.micro (1GB RAM)

#### Configuración de SWAP (Importante!)
```bash
# Crear archivo swap de 2GB para compensar la RAM limitada
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Optimizar swappiness
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
```

#### Software Optimizado para Low Memory

```bash
# Sistema base (mínimo)
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git

# Python 3.10 (ya incluido en Ubuntu 22.04)
sudo apt install -y python3-pip python3-venv
pip3 install poetry

# Node.js 18 LTS (más estable para producción)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# PostgreSQL 14 (local, optimizado)
sudo apt install -y postgresql-14
sudo systemctl enable postgresql

# Redis (configuración ligera)
sudo apt install -y redis-server
sudo systemctl enable redis-server

# Nginx (reverse proxy ligero)
sudo apt install -y nginx

# PM2 (gestión de procesos)
sudo npm install -g pm2
```

### 3. Configuración Optimizada de PostgreSQL y Redis

#### PostgreSQL (postgresql.conf)
```bash
# Editar: /etc/postgresql/14/main/postgresql.conf
shared_buffers = 128MB          # 25% de RAM
effective_cache_size = 256MB    # 50% de RAM  
maintenance_work_mem = 32MB
work_mem = 2MB
max_connections = 20             # Reducir conexiones

# Crear usuario y BD
sudo -u postgres psql << EOF
CREATE USER vitalgo_user WITH PASSWORD 'vitalgo_pass_2024';
CREATE DATABASE vitalgo_db OWNER vitalgo_user;
GRANT ALL PRIVILEGES ON DATABASE vitalgo_db TO vitalgo_user;
EOF
```

#### Redis (redis.conf)
```bash
# Editar: /etc/redis/redis.conf
maxmemory 128mb
maxmemory-policy allkeys-lru
save ""  # Desactivar persistencia para ahorrar recursos
```

### 4. Variables de Entorno

```bash
# ~/.env.production
# Backend
DATABASE_URL=postgresql://vitalgo_user:vitalgo_pass_2024@localhost:5432/vitalgo_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=vitalgo-secret-key-production-2024
ENVIRONMENT=production

# Frontend - Usar IP pública de la instancia
NEXT_PUBLIC_API_URL=http://[TU-IP-PUBLICA]/api/v1
NEXT_PUBLIC_ENVIRONMENT=production
```

### 5. Configuración de Nginx (Optimizada)

```nginx
# /etc/nginx/sites-available/vitalgo
server {
    listen 80 default_server;
    server_name _;  # Acepta cualquier dominio/IP

    # Compresión gzip
    gzip on;
    gzip_types text/plain application/json application/javascript text/css;
    
    # Cache de archivos estáticos
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, immutable";
    }

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_read_timeout 30s;
    }
}

# Activar sitio
sudo ln -s /etc/nginx/sites-available/vitalgo /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
```

### 6. Scripts de Despliegue Optimizados

#### deploy-free-tier.sh
```bash
#!/bin/bash
# Script optimizado para t2.micro

echo "🚀 Iniciando despliegue VitalGo Free Tier..."

# Variables
export NODE_OPTIONS="--max-old-space-size=512"  # Limitar memoria Node.js
export PYTHON_ENV=production

# Detener servicios
pm2 delete all 2>/dev/null

# Actualizar código
git pull origin main

# Backend (optimizado)
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt  # Usar requirements.txt en lugar de Poetry

# Iniciar backend con límites de memoria
pm2 start "python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --workers 1" \
  --name vitalgo-backend \
  --max-memory-restart 300M

# Frontend (build optimizado)
cd ../frontend
npm ci --production  # Instalación más rápida
npm run build

# Iniciar frontend en modo producción
pm2 start "npm run start" \
  --name vitalgo-frontend \
  --max-memory-restart 400M

# Configurar PM2 para reinicio automático
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu

echo "✅ Despliegue completado"
echo "📍 Accede a: http://$(curl -s ifconfig.me)"
```

### 7. Seguridad Básica (Sin Costos Adicionales)

#### Firewall con UFW
```bash
# Configurar firewall básico
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw --force enable
```

#### SSL Gratuito (Opcional con DuckDNS)
```bash
# Si usas DuckDNS, puedes obtener SSL gratuito
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tu-subdominio.duckdns.org --email tu@email.com --agree-tos
```

### 8. Monitoreo Simple

```bash
# Script de monitoreo básico
cat > ~/monitor.sh << 'EOF'
#!/bin/bash
echo "=== VitalGo Status ==="
echo "Memory: $(free -h | grep Mem | awk '{print $3"/"$2}')"
echo "Disk: $(df -h / | tail -1 | awk '{print $3"/"$2}')"
echo "Services:"
pm2 list
echo "PostgreSQL: $(systemctl is-active postgresql)"
echo "Redis: $(systemctl is-active redis)"
echo "Nginx: $(systemctl is-active nginx)"
EOF

chmod +x ~/monitor.sh
```

### 9. Backup Local Simple

```bash
# backup-local.sh
#!/bin/bash
DATE=$(date +%Y%m%d)
mkdir -p ~/backups

# Backup de base de datos
pg_dump -U vitalgo_user vitalgo_db > ~/backups/vitalgo_$DATE.sql

# Mantener solo últimos 7 días
find ~/backups -name "*.sql" -mtime +7 -delete

echo "Backup completado: ~/backups/vitalgo_$DATE.sql"
```

### 10. Costos AWS Free Tier

#### Dentro del Free Tier (12 meses)
- **EC2 t2.micro**: $0 (750 horas/mes)
- **EBS Storage (8GB)**: $0 (30GB incluidos)
- **Transferencia datos**: $0 (15GB salida/mes)
- **CloudWatch básico**: $0 (métricas básicas)

#### Costos Adicionales Potenciales
- **IP pública dinámica**: $0 (mientras esté en uso)
- **Elastic IP sin usar**: $3.60/mes (EVITAR)
- **Transferencia >15GB**: $0.09/GB
- **Snapshots EBS**: $0.05/GB/mes

**Total mensual en Free Tier**: $0

### 11. Checklist Free Tier

#### Pre-requisitos AWS
- [ ] Cuenta AWS (nueva para Free Tier)
- [ ] Verificación de teléfono/tarjeta completada
- [ ] Key pair SSH creado
- [ ] Región seleccionada (us-east-1 recomendada)

#### Configuración t2.micro
- [ ] Instancia t2.micro seleccionada
- [ ] 8GB de almacenamiento EBS gp2
- [ ] Security group con puertos 22, 80 abiertos
- [ ] NO asignar Elastic IP

### 12. Guía Paso a Paso (Free Tier)

#### 1. Crear instancia EC2
```bash
# Usar AWS Console (más fácil)
# AMI: Ubuntu 22.04 LTS (ami-0c7217cdde317cfec)
# Tipo: t2.micro (Free tier eligible)
# Storage: 8GB gp2
# Security Group: vitalgo-sg (HTTP, HTTPS, SSH)
```

#### 2. Conectar y configurar
```bash
# SSH a la instancia
ssh -i tu-key.pem ubuntu@TU-IP-PUBLICA

# Configurar SWAP (CRÍTICO para 1GB RAM)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

#### 3. Instalar dependencias
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar stack básico
sudo apt install -y git nginx postgresql postgresql-contrib redis-server
sudo apt install -y python3-pip python3-venv nodejs npm
sudo npm install -g pm2

# Configurar PostgreSQL
sudo -u postgres psql -c "CREATE USER vitalgo_user WITH PASSWORD 'vitalgo_pass_2024';"
sudo -u postgres createdb -O vitalgo_user vitalgo_db
```

#### 4. Desplegar aplicación
```bash
# Clonar repositorio
git clone [TU-REPO-URL] vitalgo
cd vitalgo

# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn sqlalchemy psycopg2-binary

# Crear requirements.txt simplificado si no existe
cat > requirements.txt << EOF
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.7
redis==5.0.1
pyjwt==2.8.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
pydantic[email]==2.5.0
EOF

pm2 start "python3 -m uvicorn main:app --host 0.0.0.0 --port 8000" --name backend

# Frontend
cd ../frontend
npm install --production
npm run build
pm2 start "npm run start" --name frontend

# Configurar nginx
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/vitalgo
# [Editar configuración como se mostró antes]

pm2 save
pm2 startup
```

### 13. Limitaciones Free Tier

#### Recursos Técnicos
- **RAM**: 1GB (requiere SWAP y optimización)
- **CPU**: 1 vCPU (burstable)
- **Storage**: 30GB máximo
- **Transferencia**: 15GB salida/mes

#### Optimizaciones Necesarias
- Configurar SWAP de 2GB
- Usar pm2 con límites de memoria
- Build de producción para Next.js
- PostgreSQL con configuración mínima
- Redis sin persistencia

#### Monitoreo de Uso
```bash
# Verificar uso Free Tier
aws ce get-dimension-values --dimension Key=SERVICE --time-period Start=2024-01-01,End=2024-01-31
```

### 14. Script de Instalación Completa

```bash
#!/bin/bash
# install-free-tier.sh

echo "🚀 Instalación VitalGo Free Tier"

# SWAP
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Software
sudo apt update && sudo apt install -y git nginx postgresql redis-server python3-pip nodejs npm
sudo npm install -g pm2

# Base de datos
sudo -u postgres psql -c "CREATE USER vitalgo_user WITH PASSWORD 'vitalgo_pass_2024';"
sudo -u postgres createdb -O vitalgo_user vitalgo_db

# Aplicación
git clone [TU-REPO] vitalgo && cd vitalgo

# Backend
cd backend && python3 -m venv venv && source venv/bin/activate
pip install fastapi uvicorn sqlalchemy psycopg2-binary redis pyjwt passlib
pm2 start "python3 -m uvicorn main:app --host 0.0.0.0 --port 8000" --name backend --max-memory-restart 300M

# Frontend  
cd ../frontend && npm ci --production && npm run build
pm2 start "npm run start" --name frontend --max-memory-restart 400M

pm2 save && pm2 startup

echo "✅ VitalGo instalado. Accede a: http://$(curl -s ifconfig.me)"
```

### 🎯 Resultado Final

Tu aplicación VitalGo estará corriendo 24/7 en AWS completamente **GRATIS** durante 12 meses, accesible desde cualquier parte del mundo a través de la IP pública de tu instancia.