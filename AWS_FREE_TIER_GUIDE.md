# 🆓 VitalGo - AWS Free Tier Deployment Guide

Esta guía te ayudará a desplegar VitalGo usando **SOLO servicios gratuitos de AWS** para pruebas y desarrollo.

## 📊 Resumen de Costos: **$0/mes** (dentro de límites Free Tier)

### Servicios AWS Free Tier Utilizados:

| Servicio | Free Tier | Uso en VitalGo |
|----------|-----------|----------------|
| **EC2** | 750 hrs/mes t2.micro | 1 instancia 24/7 (744 hrs) ✅ |
| **RDS PostgreSQL** | 750 hrs/mes db.t3.micro + 20GB | 1 DB 24/7 (744 hrs) ✅ |
| **S3** | 5GB almacenamiento | Assets estáticos ✅ |
| **Elastic IP** | 1 IP (si está asociada) | 1 IP fija ✅ |
| **CloudWatch** | 5GB logs | Monitoreo básico ✅ |
| **Data Transfer** | 15GB/mes salida | Tráfico web ✅ |

## 🚀 Inicio Rápido

### Paso 1: Prerequisitos

```bash
# Instalar AWS CLI (si no lo tienes)
brew install awscli

# Verificar instalación
aws --version
docker --version
```

### Paso 2: Configurar AWS CLI

```bash
aws configure
```

Necesitarás:
- **AWS Access Key ID**: (de tu cuenta AWS)
- **AWS Secret Access Key**: (de tu cuenta AWS)
- **Default region**: `us-east-1` (recomendado)
- **Default output format**: `json`

### Paso 3: Ejecutar Despliegue Free Tier

```bash
# Hacer el script ejecutable
chmod +x deploy-free-tier.sh

# Ejecutar despliegue
./deploy-free-tier.sh
```

El script te pedirá:
1. **Nombre del Key Pair** (para SSH): Se creará automáticamente
2. **Contraseña de base de datos**: Mínimo 8 caracteres
3. **Email para alertas**: Para notificaciones de facturación

## 📝 Qué se Despliega

### Arquitectura Free Tier:

```
Internet
    │
    ├── Elastic IP (Gratis)
    │
    ├── EC2 t2.micro (Free Tier)
    │   ├── Docker
    │   ├── Frontend (Next.js) - Puerto 3000
    │   └── Backend (FastAPI) - Puerto 8000
    │
    ├── RDS PostgreSQL db.t3.micro (Free Tier)
    │   └── 20GB Storage
    │
    └── S3 Bucket (5GB Free)
        └── Assets estáticos
```

## 🔐 Acceso a la Aplicación

Después del despliegue, recibirás:

```
Frontend: http://<IP-PUBLICA>:3000
Backend API: http://<IP-PUBLICA>:8000
API Docs: http://<IP-PUBLICA>:8000/docs
SSH: ssh -i ~/.ssh/vitalgo-key.pem ec2-user@<IP-PUBLICA>
```

### Credenciales por Defecto:

- **Admin**: admin@vitalgo.app / VitalGo2024!
- **Paramédico**: paramedico@vitalgo.com / Param2024!
- **Paciente**: Registra uno nuevo desde la aplicación

## 💰 Monitoreo de Costos (MUY IMPORTANTE)

### Alertas Automáticas Configuradas:
- 🔔 Alerta a $1 USD
- 🔔 Alerta a $5 USD
- 🔔 Alerta a $10 USD

### Verificar Uso Free Tier:

1. Ve a [AWS Billing Dashboard](https://console.aws.amazon.com/billing/)
2. Click en "Free Tier" en el menú lateral
3. Revisa tu uso actual vs límites

### Límites Mensuales Free Tier:

```
EC2: 750 horas (31 días = 744 horas) ✅
RDS: 750 horas (31 días = 744 horas) ✅
Total: Puedes mantener TODO encendido 24/7 por 1 mes
```

## 🛠️ Comandos Útiles

### Gestión de la Aplicación:

```bash
# Ver logs en tiempo real
ssh -i ~/.ssh/vitalgo-key.pem ec2-user@<IP> 'docker-compose logs -f'

# Reiniciar aplicación
ssh -i ~/.ssh/vitalgo-key.pem ec2-user@<IP> 'cd vitalgo && docker-compose restart'

# Detener aplicación (ahorra horas Free Tier)
ssh -i ~/.ssh/vitalgo-key.pem ec2-user@<IP> 'cd vitalgo && docker-compose down'

# Iniciar aplicación
ssh -i ~/.ssh/vitalgo-key.pem ec2-user@<IP> 'cd vitalgo && docker-compose up -d'
```

### Gestión de AWS:

```bash
# Ver estado del stack
aws cloudformation describe-stacks --stack-name vitalgo-free-tier

# Detener instancia EC2 (ahorra horas)
aws ec2 stop-instances --instance-ids <INSTANCE-ID>

# Iniciar instancia EC2
aws ec2 start-instances --instance-ids <INSTANCE-ID>

# ELIMINAR TODO (cuando termines las pruebas)
aws cloudformation delete-stack --stack-name vitalgo-free-tier
```

## ⚠️ Importante: Evitar Cargos

### Para mantener $0 de costo:

1. **NO excedas los límites Free Tier**:
   - Max 1 instancia EC2 t2.micro
   - Max 1 base de datos RDS
   - Max 20GB almacenamiento RDS
   - Max 15GB transferencia datos/mes

2. **Detén recursos cuando no los uses**:
   ```bash
   # Detener EC2 + RDS (ahorra horas)
   aws ec2 stop-instances --instance-ids <ID>
   aws rds stop-db-instance --db-instance-identifier vitalgo-database-free
   ```

3. **Elimina el stack al terminar**:
   ```bash
   aws cloudformation delete-stack --stack-name vitalgo-free-tier
   ```

4. **Revisa tu facturación diariamente**:
   - https://console.aws.amazon.com/billing/

## 🔧 Solución de Problemas

### Error: "Invalid template"
```bash
# Validar template antes de desplegar
aws cloudformation validate-template --template-body file://aws/cloudformation-free-tier.yml
```

### Error: "Stack already exists"
```bash
# Eliminar stack anterior
aws cloudformation delete-stack --stack-name vitalgo-free-tier
# Esperar 5 minutos y volver a intentar
```

### No puedo conectar por SSH
```bash
# Verificar permisos del archivo .pem
chmod 400 ~/.ssh/vitalgo-key.pem

# Verificar Security Group permite SSH (puerto 22)
aws ec2 describe-security-groups --group-names vitalgo-ec2-sg
```

### La aplicación no carga
```bash
# Verificar que Docker esté corriendo
ssh -i ~/.ssh/vitalgo-key.pem ec2-user@<IP> 'docker ps'

# Ver logs de errores
ssh -i ~/.ssh/vitalgo-key.pem ec2-user@<IP> 'docker-compose logs --tail=50'
```

## 📅 Límites de Tiempo Free Tier

AWS Free Tier es válido por **12 meses** desde la creación de tu cuenta AWS.

### Después de 12 meses:
- EC2 t2.micro: ~$8.50/mes
- RDS db.t3.micro: ~$13/mes
- Total: ~$22/mes

## 🗑️ Limpieza Completa

Cuando termines de probar, **ELIMINA TODO** para evitar cargos:

```bash
# 1. Eliminar CloudFormation Stack (elimina todo)
aws cloudformation delete-stack --stack-name vitalgo-free-tier

# 2. Verificar que se eliminó
aws cloudformation list-stacks --stack-status-filter DELETE_COMPLETE

# 3. Eliminar Key Pair (opcional)
aws ec2 delete-key-pair --key-name vitalgo-key
rm ~/.ssh/vitalgo-key.pem
```

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs: `docker-compose logs`
2. Verifica el estado de AWS: `aws cloudformation describe-stack-events --stack-name vitalgo-free-tier`
3. Consulta la facturación: https://console.aws.amazon.com/billing/

## ✅ Checklist de Verificación

- [ ] AWS CLI configurado
- [ ] Docker instalado y corriendo
- [ ] Cuenta AWS con Free Tier activo
- [ ] Alertas de facturación configuradas
- [ ] Stack desplegado exitosamente
- [ ] Aplicación accesible por HTTP
- [ ] Monitoreo de facturación activo

---

**⚡ Recuerda**: El Free Tier es para **desarrollo y pruebas**. Para producción, considera la arquitectura completa con ECS, ALB y CloudFront.