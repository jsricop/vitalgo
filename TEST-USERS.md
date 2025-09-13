# 🔐 VitalGo - Usuarios de Prueba

Esta documentación contiene los usuarios de prueba disponibles tanto en el ambiente **LOCAL** como en **AWS** para testing y desarrollo.

## 🌐 URLs de Aplicación

### Local Development
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Health**: http://localhost:8000/health

### AWS Production
- **Frontend**: http://35.169.20.114:3000
- **Backend API**: http://35.169.20.114:8000
- **API Health**: http://35.169.20.114:8000/health

---

## 👥 Usuarios de Prueba

**Password para todos los usuarios**: `test123`

### 📋 Pacientes

| Usuario | Email | Nombre Completo | Documento | Sangre | EPS |
|---------|-------|----------------|-----------|---------|-----|
| **María García** | `maria.garcia@email.com` | María García | CC 12345678 | O+ | SURA |
| **Carlos López** | `carlos.lopez@email.com` | Carlos López | CC 87654321 | A+ | Nueva EPS |
| **Ana Rodríguez** | `ana.rodriguez@email.com` | Ana Rodríguez | CC 11223344 | B+ | Sanitas |
| **Luis Martínez** | `luis.martinez@email.com` | Luis Martínez | CC 55667788 | AB- | Compensar |

### 🏥 Paramédicos

| Usuario | Email | Nombre Completo | Licencia | Especialidad |
|---------|-------|----------------|----------|--------------|
| **Dr. Roberto Fernández** | `dr.fernandez@email.com` | Roberto Fernández | MED-12345 | Emergencias, Cardiología |
| **Dra. Patricia Morales** | `dra.morales@email.com` | Patricia Morales | MED-67890 | Primeros Auxilios, Pediatría |

### 👑 Administrador

| Usuario | Email | Password | Rol |
|---------|-------|----------|-----|
| **VitalGo Admin** | `admin@vitalgo.app` | `VitalGo2024!` | admin |

---

## 🏥 Datos Médicos de Prueba

### María García (maria.garcia@email.com)
**Alergias:**
- ⚠️ **Penicilina** (Severidad: Alta) - Rash cutáneo, dificultad respiratoria
- 🚨 **Mariscos** (Severidad: Crítica) - Anafilaxia, porta EpiPen

**Enfermedades:**
- 💊 **Hipertensión Arterial** (Controlada) - Losartán 50mg diario
- 🦠 **COVID-19** (Curada) - Enero 2023, recuperación completa

### Carlos López (carlos.lopez@email.com)
**Alergias:**
- 🌸 **Polen** (Severidad: Baja) - Alergia estacional

**Enfermedades:**
- 🍯 **Diabetes Tipo 2** (Controlada) - Metformina 500mg

**Cirugías:**
- ⚕️ **Apendicectomía** (15/09/2020) - Sin complicaciones

### Ana Rodríguez (ana.rodriguez@email.com)
**Alergias:**
- 💊 **Ibuprofeno** (Severidad: Media) - Intolerancia gástrica

**Enfermedades:**
- 🫁 **Asma Bronquial** (Controlada) - Salbutamol inhalador

**Cirugías:**
- 🏥 **Colecistectomía Laparoscópica** (22/06/2021) - Técnica mínimamente invasiva

### Luis Martínez (luis.martinez@email.com)
**Enfermedades:**
- 🍽️ **Gastritis Crónica** (Controlada) - Omeprazol 20mg

**Cirugías:**
- 🩹 **Reparación Hernia Inguinal** (08/03/2022) - Con malla

---

## 🧪 Ejemplos de Testing

### 1. Login API Test

```bash
# Test Local
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "maria.garcia@email.com", "password": "test123"}'

# Test AWS
curl -X POST http://35.169.20.114:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "carlos.lopez@email.com", "password": "test123"}'
```

### 2. Obtener Información de Paciente

```bash
# Primero hacer login para obtener el token
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "maria.garcia@email.com", "password": "test123"}' | \
  jq -r '.access_token')

# Luego obtener información médica
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/patients/medical-summary
```

### 3. Test QR Codes

Cada paciente tiene códigos QR generados:
- María García: `QR_MARIA_GARCIA_001`
- Carlos López: `QR_CARLOS_LOPEZ_002`
- Ana Rodríguez: `QR_ANA_RODRIGUEZ_003`
- Luis Martínez: `QR_LUIS_MARTINEZ_004`

---

## 📊 Base de Datos

### Estadísticas de Datos de Prueba
- ✅ **6 usuarios** (4 pacientes + 2 paramédicos + 1 admin)
- ✅ **4 pacientes** con perfiles médicos completos
- ✅ **4 alergias** con diferentes severidades
- ✅ **5 enfermedades** (crónicas y curadas)
- ✅ **3 cirugías** con detalles completos
- ✅ **4 códigos QR** activos
- ✅ **2 logs de acceso QR** simulados

### EPS Disponibles
- SURA, Nueva EPS, Sanitas, Compensar, Famisanar
- Salud Total, Coomeva EPS, Cafesalud, Cruz Blanca, Medimás

---

## 🚀 Casos de Uso de Testing

### Para Desarrolladores
1. **Test de Autenticación**: Usar cualquier usuario con password `test123`
2. **Test de Roles**: Probar funcionalidades específicas por rol (patient/paramedic/admin)
3. **Test de Datos Médicos**: Verificar visualización de alergias, enfermedades, cirugías
4. **Test de QR**: Simular acceso de emergencia con códigos QR

### Para QA/Testing
1. **Flujos de Usuario Completos**: Desde registro hasta acceso médico
2. **Validaciones**: Probar casos edge con alergias críticas
3. **Roles y Permisos**: Verificar accesos según rol de usuario
4. **Integración**: Testing entre frontend y backend en ambos ambientes

---

## 🔄 Sincronización

Los datos están **100% sincronizados** entre:
- ✅ Base de datos local (PostgreSQL en Docker)
- ✅ Base de datos AWS (PostgreSQL en contenedor EC2)

### Última actualización
- **Fecha**: $(date)
- **Status**: ✅ Ambos ambientes funcionando
- **Hash Password**: SHA-256 (sistema actual)

---

## ⚠️ Notas Importantes

1. **Passwords**: Todos los usuarios de prueba usan `test123` excepto el admin que usa `VitalGo2024!`
2. **Hashing**: El sistema usa SHA-256 simple (no bcrypt) para passwords
3. **Tokens JWT**: Expiran en 24 horas (86400 segundos)
4. **Ambiente**: Los datos son idénticos en local y AWS
5. **Limpieza**: Los datos se pueden regenerar ejecutando `test-data.sql`

---
> 🔗 **Proyecto:** VitalGo Medical Platform