# Plan de Despliegue VitalGo en AWS
## Compilación con DockerHub + Despliegue AWS CLI v2

### Resumen de la Aplicación
- **Backend**: Python FastAPI + PostgreSQL (Puerto 8000)
- **Frontend**: Next.js (Puerto 3000)
- **Base de Datos**: PostgreSQL
- **Contenedores**: Docker Hub Registry (gruporq)

---

## FASE 1: PREPARACIÓN LOCAL

### 1.1 Verificar Prerequisites
**Comando:**
```bash
aws --version
```
**Checkpoint:** ✅ Verificar que muestre "aws-cli/2.x.x"

**Comando:**
```bash
docker --version
```
**Checkpoint:** ✅ Verificar que muestre versión de Docker

**Comando:**
```bash
docker login
```
**Checkpoint:** ✅ Login exitoso a Docker Hub

---

### 1.2 Configurar AWS CLI
**Comando:**
```bash
aws configure
```
**Checkpoint:** ✅ Ingresar:
- AWS Access Key ID: [Clave de acceso]
- AWS Secret Access Key: [Clave secreta]
- Default region: us-east-1
- Default output format: json

**Verificación:**
```bash
aws sts get-caller-identity
```
**Checkpoint:** ✅ Verificar que muestre el Account ID y User ARN correctos

---

### 1.3 Crear Key Pair EC2
**Comando:**
```bash
aws ec2 create-key-pair --key-name vitalgo-key --query 'KeyMaterial' --output text > ~/.ssh/vitalgo-key.pem
```
**Checkpoint:** ✅ Archivo ~/.ssh/vitalgo-key.pem creado

**Comando:**
```bash
chmod 400 ~/.ssh/vitalgo-key.pem
```
**Checkpoint:** ✅ Permisos del archivo configurados correctamente

**Verificación:**
```bash
aws ec2 describe-key-pairs --key-names vitalgo-key
```
**Checkpoint:** ✅ Key pair "vitalgo-key" listado

---

## FASE 2: BUILD Y PUSH A DOCKER HUB

### 2.1 Build Local de Imágenes
**Comando:**
```bash
docker build -t gruporq/vitalgo-backend:latest ./backend
```
**Checkpoint:** ✅ Backend image built successfully

**Comando:**
```bash
docker build -t gruporq/vitalgo-frontend:latest ./frontend --build-arg NEXT_PUBLIC_API_URL=http://[PENDING_EC2_IP]:8000
```
**Checkpoint:** ✅ Frontend image built successfully

**Verificación:**
```bash
docker images | grep gruporq/vitalgo
```
**Checkpoint:** ✅ Ambas imágenes listadas localmente

---

### 2.2 Push a Docker Hub
**Comando:**
```bash
docker push gruporq/vitalgo-backend:latest
```
**Checkpoint:** ✅ Backend image pushed to Docker Hub

**Comando:**
```bash
docker push gruporq/vitalgo-frontend:latest
```
**Checkpoint:** ✅ Frontend image pushed to Docker Hub

**Verificación Manual:** Ir a https://hub.docker.com/u/gruporq
**Checkpoint:** ✅ Verificar que ambas imágenes estén disponibles en Docker Hub

---

## FASE 3: DESPLIEGUE AWS INFRAESTRUCTURA

### 3.1 Validar CloudFormation Template
**Comando:**
```bash
aws cloudformation validate-template --template-body file://aws/cloudformation-free-tier.yml
```
**Checkpoint:** ✅ Template validation successful

---

### 3.2 Crear Stack CloudFormation
**Comando:**
```bash
aws cloudformation create-stack \
  --stack-name vitalgo-free-tier \
  --template-body file://aws/cloudformation-free-tier.yml \
  --parameters \
    ParameterKey=DatabasePassword,ParameterValue=VitalGo2024! \
    ParameterKey=JWTSecretKey,ParameterValue=your-secure-jwt-secret-key-32chars-min \
    ParameterKey=KeyPairName,ParameterValue=vitalgo-key \
  --capabilities CAPABILITY_IAM
```
**Checkpoint:** ✅ Stack creation initiated

**Verificación:**
```bash
aws cloudformation describe-stack-events --stack-name vitalgo-free-tier --query 'StackEvents[0:5].[Timestamp,ResourceStatus,LogicalResourceId]' --output table
```
**Checkpoint:** ✅ Mostrar eventos recientes del stack

---

### 3.3 Monitorear Progreso Stack
**Comando (repetir cada 2-3 minutos):**
```bash
aws cloudformation describe-stacks --stack-name vitalgo-free-tier --query 'Stacks[0].StackStatus' --output text
```
**Checkpoint:** ✅ Esperar hasta que muestre "CREATE_COMPLETE"

**Verificación Final:**
```bash
aws cloudformation describe-stacks --stack-name vitalgo-free-tier --query 'Stacks[0].Outputs' --output table
```
**Checkpoint:** ✅ Obtener outputs: PublicIP, DatabaseEndpoint, ApplicationURL, etc.

---

## FASE 4: CONFIGURACIÓN EC2

### 4.1 Obtener IP Pública de EC2
**Comando:**
```bash
aws cloudformation describe-stacks --stack-name vitalgo-free-tier --query 'Stacks[0].Outputs[?OutputKey==`PublicIP`].OutputValue' --output text
```
**Checkpoint:** ✅ Obtener IP pública de EC2 (guardar como [EC2_PUBLIC_IP])

---

### 4.2 Verificar Estado EC2
**Comando:**
```bash
aws ec2 describe-instances --filters "Name=tag:Name,Values=vitalgo-ec2-free-tier" --query 'Reservations[0].Instances[0].State.Name' --output text
```
**Checkpoint:** ✅ Estado debe ser "running"

**Comando:**
```bash
aws ec2 describe-instances --filters "Name=tag:Name,Values=vitalgo-ec2-free-tier" --query 'Reservations[0].Instances[0].PublicIpAddress' --output text
```
**Checkpoint:** ✅ Verificar que coincida con la IP obtenida anteriormente

---

### 4.3 Conectar vía SSH
**Comando:**
```bash
ssh -i ~/.ssh/vitalgo-key.pem ec2-user@[EC2_PUBLIC_IP]
```
**Checkpoint:** ✅ Conexión SSH exitosa

---

### 4.4 Verificar UserData Script en EC2
**Una vez conectado por SSH, ejecutar:**
```bash
sudo tail -f /var/log/cloud-init-output.log
```
**Checkpoint:** ✅ Verificar que el script de inicialización se haya completado

**Comando:**
```bash
docker ps
```
**Checkpoint:** ✅ Verificar que los contenedores estén corriendo

**Comando:**
```bash
docker-compose -f /home/ec2-user/vitalgo/docker-compose.prod.yml ps
```
**Checkpoint:** ✅ Verificar estado de todos los servicios

---

## FASE 5: ACTUALIZACIÓN CON IMÁGENES DOCKER HUB

### 5.1 Reemplazar Docker Compose para usar Registry
**En EC2, editar docker-compose.prod.yml:**
```bash
sudo nano /home/ec2-user/vitalgo/docker-compose.prod.yml
```

**Reemplazar las secciones build con:**
```yaml
backend:
  image: gruporq/vitalgo-backend:latest
  # Eliminar sección build

frontend:
  image: gruporq/vitalgo-frontend:latest
  # Eliminar sección build
```

**Checkpoint:** ✅ Archivo docker-compose.prod.yml modificado

---

### 5.2 Pull y Restart con Nuevas Imágenes
**Comando:**
```bash
cd /home/ec2-user/vitalgo
```

**Comando:**
```bash
docker-compose -f docker-compose.prod.yml pull
```
**Checkpoint:** ✅ Imágenes descargadas desde Docker Hub

**Comando:**
```bash
docker-compose -f docker-compose.prod.yml down
```
**Checkpoint:** ✅ Contenedores detenidos

**Comando:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```
**Checkpoint:** ✅ Contenedores iniciados con nuevas imágenes

---

### 5.3 Verificar Aplicación
**Comando:**
```bash
curl http://localhost:8000/health
```
**Checkpoint:** ✅ API Backend respondiendo

**Comando:**
```bash
curl http://localhost:3000
```
**Checkpoint:** ✅ Frontend respondiendo

**Salir de SSH:**
```bash
exit
```

---

## FASE 6: VERIFICACIONES EXTERNAS

### 6.1 Verificar Acceso Público
**Comando local:**
```bash
curl http://[EC2_PUBLIC_IP]:8000/health
```
**Checkpoint:** ✅ API accesible públicamente

**Comando local:**
```bash
curl -I http://[EC2_PUBLIC_IP]:3000
```
**Checkpoint:** ✅ Frontend accesible públicamente

**Verificación Manual:** Abrir navegador en http://[EC2_PUBLIC_IP]:3000
**Checkpoint:** ✅ Aplicación VitalGo carga correctamente

---

### 6.2 Verificar Base de Datos RDS
**Comando:**
```bash
aws rds describe-db-instances --db-instance-identifier vitalgo-database-free --query 'DBInstances[0].DBInstanceStatus' --output text
```
**Checkpoint:** ✅ Estado debe ser "available"

**Comando:**
```bash
aws rds describe-db-instances --db-instance-identifier vitalgo-database-free --query 'DBInstances[0].Endpoint.Address' --output text
```
**Checkpoint:** ✅ Endpoint de base de datos disponible

---

## FASE 7: PROCESO DE ACTUALIZACIÓN CONTINUA

### 7.1 Script de Actualización Rápida
**Para futuras actualizaciones, crear script local:**
```bash
#!/bin/bash
# update-vitalgo.sh
docker build -t gruporq/vitalgo-backend:latest ./backend
docker build -t gruporq/vitalgo-frontend:latest ./frontend --build-arg NEXT_PUBLIC_API_URL=http://[EC2_PUBLIC_IP]:8000
docker push gruporq/vitalgo-backend:latest
docker push gruporq/vitalgo-frontend:latest

ssh -i ~/.ssh/vitalgo-key.pem ec2-user@[EC2_PUBLIC_IP] 'cd /home/ec2-user/vitalgo && docker-compose -f docker-compose.prod.yml pull && docker-compose -f docker-compose.prod.yml up -d'
```
**Checkpoint:** ✅ Script creado y funcional

---

## FASE 8: MONITOREO Y LOGS

### 8.1 Verificar CloudWatch Logs
**Comando:**
```bash
aws logs describe-log-groups --log-group-name-prefix "/aws/ec2/vitalgo"
```
**Checkpoint:** ✅ Log groups creados

### 8.2 Verificar S3 Bucket
**Comando:**
```bash
aws s3 ls | grep vitalgo
```
**Checkpoint:** ✅ Bucket S3 para assets estáticos creado

---

## FASE 9: CLEANUP (OPCIONAL)

### 9.1 Eliminar Stack (Solo para desarrollo)
**Comando:**
```bash
aws cloudformation delete-stack --stack-name vitalgo-free-tier
```
**Checkpoint:** ✅ Stack deletion initiated

**Verificación:**
```bash
aws cloudformation describe-stacks --stack-name vitalgo-free-tier --query 'Stacks[0].StackStatus' --output text
```
**Checkpoint:** ✅ Esperar "DELETE_COMPLETE" o error de stack no encontrado

---

## CHECKLIST DE VERIFICACIÓN MANUAL

### ✅ Checkpoints Críticos:
1. [ ] AWS CLI v2 instalado y configurado
2. [ ] Key pair EC2 creado y guardado
3. [ ] Docker images compiladas localmente
4. [ ] Imágenes subidas a Docker Hub
5. [ ] CloudFormation template validado
6. [ ] Stack CloudFormation creado exitosamente
7. [ ] EC2 instancia en estado "running"
8. [ ] SSH connection a EC2 exitosa
9. [ ] Contenedores Docker corriendo en EC2
10. [ ] API Backend accesible (puerto 8000)
11. [ ] Frontend accesible (puerto 3000)
12. [ ] Base de datos RDS en estado "available"
13. [ ] Aplicación funcional desde navegador

### 🔧 Comandos de Troubleshooting:
```bash
# Ver logs CloudFormation
aws cloudformation describe-stack-events --stack-name vitalgo-free-tier

# Ver logs EC2
ssh -i ~/.ssh/vitalgo-key.pem ec2-user@[EC2_PUBLIC_IP] 'sudo journalctl -u docker -f'

# Restart servicios
ssh -i ~/.ssh/vitalgo-key.pem ec2-user@[EC2_PUBLIC_IP] 'cd /home/ec2-user/vitalgo && docker-compose -f docker-compose.prod.yml restart'
```

### 📊 Información Importante:
- **Región AWS**: us-east-1
- **Tipo Instancia**: t2.micro (Free Tier)
- **Base de Datos**: db.t3.micro (Free Tier)
- **Storage**: 20GB (Free Tier)
- **Docker Registry**: Docker Hub (gruporq)

---

**Notas**: Este plan está optimizado para AWS Free Tier y utiliza Docker Hub como registro intermedio para acelerar despliegues futuros.