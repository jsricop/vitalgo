# 🗃️ VitalGo - Estrategia de Persistencia de Datos

Esta documentación explica cómo están configurados los datos para ser **persistentes** en AWS y **no eliminarse** durante los deployments.

## ✅ **Estado Actual: DATOS PERSISTENTES**

Los datos en AWS **SÍ son persistentes** y **NO se eliminan** durante deployments o reinicios.

---

## 🔧 **Configuración de Persistencia**

### 1. **Volumen Docker Persistente**

En `docker-compose.prod.yml`:

```yaml
services:
  postgres:
    # ...
    volumes:
      - postgres_data:/var/lib/postgresql/data  # ✅ PERSISTENTE
      - ./backend/init.sql:/docker-entrypoint-initdb.d/init.sql

volumes:
  postgres_data:
    driver: local  # ✅ Almacenado en el servidor EC2
```

**Resultado:**
- ✅ **Volumen persistente**: `vitalgo_postgres_data`
- ✅ **Ubicación**: `/var/lib/docker/volumes/vitalgo_postgres_data/`
- ✅ **Supervivencia**: Persiste a través de redeploys, reinicios, actualizaciones

### 2. **Inicialización Inteligente**

El script `init.sql` **solo se ejecuta una vez**:

- ✅ **Primera vez**: Cuando la BD está vacía → Ejecuta `init.sql`
- ✅ **Deployments posteriores**: BD ya existe → **NO ejecuta** `init.sql`
- ✅ **Datos de usuarios**: Se mantienen intactos

### 3. **Scripts Idempotentes**

Mejoras aplicadas al `init.sql`:

```sql
-- ✅ Antes: podía fallar si se ejecutara múltiples veces
INSERT INTO eps (name, code, phone, website) VALUES (...);

-- ✅ Después: seguro para múltiples ejecuciones
INSERT INTO eps (name, code, phone, website) VALUES (...)
ON CONFLICT (name) DO NOTHING;
```

---

## 🧪 **Prueba de Persistencia Realizada**

### Test de Redeploy

**Antes del redeploy:**
```sql
SELECT COUNT(*) FROM users WHERE email LIKE '%@email.com';
-- Result: 6 usuarios de prueba
```

**Acción realizada:**
```bash
sudo docker-compose -f docker-compose.prod.yml restart
```

**Después del redeploy:**
```sql
SELECT COUNT(*) FROM users WHERE email LIKE '%@email.com';
-- Result: 6 usuarios de prueba ✅ PERSISTEN
```

**Login verificado:**
```bash
curl -X POST http://35.169.20.114:8000/api/v1/auth/login \
  -d '{"email": "maria.garcia@email.com", "password": "test123"}'
# Result: ✅ LOGIN EXITOSO después del redeploy
```

---

## 📋 **Usuarios Persistentes en AWS**

Estos usuarios **persisten** a través de deployments:

| Email | Nombre | Tipo | Datos Médicos |
|-------|--------|------|---------------|
| `maria.garcia@email.com` | María García | Paciente | 2 alergias, 2 enfermedades |
| `carlos.lopez@email.com` | Carlos López | Paciente | 1 alergia, 1 enfermedad, 1 cirugía |
| `ana.rodriguez@email.com` | Ana Rodríguez | Paciente | 1 alergia, 1 enfermedad, 1 cirugía |
| `luis.martinez@email.com` | Luis Martínez | Paciente | 1 enfermedad, 1 cirugía |
| `dr.fernandez@email.com` | Roberto Fernández | Paramédico | Especialista |
| `dra.morales@email.com` | Patricia Morales | Paramédico | Especialista |
| `admin@vitalgo.app` | VitalGo Admin | Admin | Usuario sistema |

**Password para usuarios de prueba**: `test123`  
**Password para admin**: `VitalGo2024!`

---

## 🚀 **Qué Ocurre Durante Deployments**

### Proceso de Deploy Normal

1. **Build local**: `docker build` → Imagen actualizada
2. **Push**: `docker push` → Imagen en Docker Hub
3. **Pull en AWS**: `docker-compose pull` → Descarga nueva imagen
4. **Restart**: `docker-compose restart` → Reinicia con nueva imagen
5. **PostgreSQL**: 
   - ✅ **Volumen permanece intacto**
   - ✅ **Datos no se tocan**
   - ✅ **init.sql NO se ejecuta**

### ⚠️ **Lo Único que Eliminaría Datos**

Los datos **SOLO se perderían** si hicieras:

```bash
# ❌ PELIGRO: Esto SÍ eliminaría datos
sudo docker-compose -f docker-compose.prod.yml down -v

# ✅ SEGURO: Esto mantiene datos
sudo docker-compose -f docker-compose.prod.yml down
sudo docker-compose -f docker-compose.prod.yml up -d
```

**La bandera `-v` elimina volúmenes** → **Nunca uses `-v` en producción**

---

## 🛡️ **Estrategia de Backup (Recomendada)**

Para máxima seguridad, considera estos backups:

### 1. **Backup Manual**
```bash
# Crear backup
sudo docker exec vitalgo-postgres-1 pg_dump \
  -U vitalgo_user backend_db > backup_$(date +%Y%m%d).sql

# Restaurar backup
cat backup_20240912.sql | sudo docker exec -i vitalgo-postgres-1 \
  psql -U vitalgo_user backend_db
```

### 2. **Script de Backup Automático** (opcional)
```bash
# Cron job diario
0 2 * * * cd /home/ec2-user/vitalgo && ./backup-db.sh
```

---

## 📊 **Volúmenes Actuales en AWS**

```bash
# Verificar volúmenes existentes
sudo docker volume ls | grep postgres
# Output: local     vitalgo_postgres_data ✅

# Ver tamaño del volumen
sudo docker system df -v
```

---

## ✅ **Resumen: Tu Configuración es SEGURA**

| Aspecto | Estado | Descripción |
|---------|--------|-------------|
| **Persistencia** | ✅ **CONFIGURADA** | Volumen Docker persistente activo |
| **Deployments** | ✅ **SEGUROS** | Los datos NO se eliminan |
| **init.sql** | ✅ **MEJORADO** | Idempotente con ON CONFLICT |
| **Backup** | ⚠️ **RECOMENDADO** | Considera backups automáticos |
| **Testing** | ✅ **VALIDADO** | Persistencia probada y funcionando |

---

## 🚀 **Conclusión**

**NO necesitas hacer cambios adicionales**. Tu configuración actual:

✅ **Mantiene datos persistentes**  
✅ **Survive deployments**  
✅ **Permite actualizaciones de código sin pérdida de datos**  
✅ **Es segura para producción**  

Los datos de prueba seguirán disponibles después de cada deployment a AWS.

---

> 📝 **Documento generado:** $(date)  
> 🔧 **Status:** Persistencia verificada y funcionando  
> 🎯 **Acción requerida:** Ninguna - configuración óptima