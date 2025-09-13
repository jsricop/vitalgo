# VitalGO - Full Stack Application

Sistema completo de desarrollo local con Backend FastAPI y Frontend Next.js usando arquitectura hexagonal y vertical slicing.

## 🏗️ Estructura del Proyecto

```
vitalgo/
├── backend/                     # FastAPI + PostgreSQL + Redis
│   ├── slices/                 # Arquitectura hexagonal + vertical slicing
│   │   ├── core/               # Configuración central
│   │   ├── shared/             # Recursos compartidos
│   │   ├── health_check/       # Feature de health checks
│   │   └── main.py             # Aplicación FastAPI
│   ├── tests/                  # Suite de pruebas
│   ├── alembic/                # Migraciones de base de datos
│   ├── docker-compose.yml      # Servicios de infraestructura
│   └── pyproject.toml          # Dependencias Python
├── frontend/                   # Next.js + TypeScript + Tailwind
│   ├── src/                    # Código fuente
│   │   ├── app/                # Next.js App Router
│   │   ├── features/           # Vertical slices de negocio
│   │   ├── shared/             # Componentes compartidos (Atomic Design)
│   │   └── lib/                # Configuraciones core
│   ├── package.json            # Dependencias Node.js
│   └── tailwind.config.js      # Configuración de estilos
├── start-local-deploy.sh       # 🚀 Script de inicio
└── stop-local-deploy.sh        # 🛑 Script de parada
```

## 🚀 Inicio Rápido

### Levantar todos los servicios:
```bash
./start-local-deploy.sh
```

Este script automáticamente:
- ✅ Valida prerequisites del sistema
- ✅ Instala/actualiza dependencias
- ✅ Levanta PostgreSQL + Redis en Docker
- ✅ Ejecuta migraciones de base de datos
- ✅ Inicia backend FastAPI con auto-reload
- ✅ Inicia frontend Next.js con auto-reload
- ✅ Ejecuta health checks completos

### Detener todos los servicios:
```bash
./stop-local-deploy.sh
```

## 📍 URLs de los Servicios

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Frontend** | http://localhost:3000 | Next.js App |
| **Backend API** | http://localhost:8000 | FastAPI API |
| **API Docs** | http://localhost:8000/docs | Swagger UI |
| **Alternative Docs** | http://localhost:8000/redoc | ReDoc |
| **Health Check** | http://localhost:8000/health/detailed | Estado del sistema |

## 🛠️ Stack Tecnológico

### Backend
- **FastAPI 0.116.1** - Framework web moderno
- **Python 3.13.7** - Lenguaje con soporte LTS hasta 2029
- **PostgreSQL 17** - Base de datos con soporte hasta 2029
- **Redis 7.4** - Cache y sesiones
- **SQLAlchemy 2.0.43** - ORM async moderno
- **Alembic** - Migraciones de BD
- **Poetry** - Gestión de dependencias
- **Docker** - Contenedores para servicios

### Frontend
- **Next.js 15** - Framework React con App Router
- **React 19** - Librería UI con características concurrentes
- **TypeScript** - Tipado estático en modo strict
- **Tailwind CSS** - Framework CSS utility-first
- **Zustand** - Gestión de estado ligera
- **SWR** - Data fetching y caching
- **React Hook Form** - Gestión de formularios

## 🏛️ Arquitectura

### Backend: Hexagonal + Vertical Slicing
```
slices/
├── health_check/              # Feature slice ejemplo
│   ├── api/                   # Controladores HTTP
│   ├── core/                  # Lógica de negocio
│   └── infrastructure/        # Adaptadores externos
├── shared/                    # Recursos compartidos
│   ├── domain/                # Modelos de dominio
│   ├── infrastructure/        # BD, APIs externas
│   └── utils/                 # Utilidades
└── core/                      # Configuración central
```

### Frontend: Vertical Slicing + Atomic Design
```
src/
├── slices/                  # Vertical slices de negocio
│   ├── authentication/       # Feature slice
        ── components/           # Atomic Design
│   │   ├── atoms/           # Elementos básicos
│   │   ├── molecules/       # Combinaciones
│   │   ├── organisms/       # Secciones complejas
│   │   └── templates/       # Layouts de página
│   ├── dashboard/            # Feature slice
│   └── user-management/      # Feature slice
├── shared/                   # Componentes compartidos
│   ├── hooks/               # Custom hooks
│   ├── services/            # Servicios API
│   └── store/               # Estado global
└── lib/                     # Configuraciones core
```

## 🧪 Testing y Calidad

### Backend
```bash
cd backend
poetry run pytest -v                    # Tests unitarios
poetry run pytest --cov=slices tests/   # Con coverage
poetry run black slices/ tests/         # Formato código
poetry run isort slices/ tests/         # Ordenar imports
poetry run mypy slices/                 # Type checking
```

### Frontend
```bash
cd frontend
npm test                    # Tests unitarios
npm run test:e2e           # Tests E2E
npm run lint               # Linting
npm run type-check         # Type checking
npm run format             # Formato código
```

## 🐳 Docker Services

Los servicios de infraestructura corren en Docker:

```bash
# Ver estado de contenedores
docker-compose ps

# Ver logs
docker-compose logs -f postgres redis

# Acceso directo a PostgreSQL
docker-compose exec postgres psql -U backend_user -d backend_db

# Acceso directo a Redis
docker-compose exec redis redis-cli
```

## 🔧 Desarrollo

### Agregar Nueva Feature Backend

1. Crear estructura:
```bash
mkdir -p backend/slices/mi_feature/{api,core/{domain,services},infrastructure}
```

2. Implementar siguiendo el patrón de `health_check/`

3. Agregar tests:
```bash
mkdir -p backend/tests/mi_feature
```

### Agregar Nueva Feature Frontend

1. Crear estructura:
```bash
mkdir -p frontend/src/features/mi_feature/{components/{atoms,molecules,organisms},hooks,services,store,types,utils}
```

2. Implementar siguiendo patrones existentes

3. Agregar tests correspondientes

## 🚨 Solución de Problemas

### Si los scripts no funcionan:
```bash
# Dar permisos de ejecución
chmod +x start-local-deploy.sh stop-local-deploy.sh

# Verificar dependencias
./start-local-deploy.sh  # Incluye verificación automática
```

### Si hay problemas con puertos:
```bash
# Ver qué proceso usa el puerto
lsof -ti:3000  # Frontend
lsof -ti:8000  # Backend

# Matar proceso específico
kill -9 <PID>
```

### Si Docker da problemas:
```bash
# Limpiar containers
docker-compose down --remove-orphans

# Limpiar volúmenes (⚠️ elimina datos)
docker-compose down -v --remove-orphans

# Reconstruir imágenes
docker-compose build --no-cache
```

## 📝 Logs y Monitoreo

### Archivos de Log
- Backend: `backend/backend.log`
- Frontend: `frontend/frontend.log`

### Health Checks
- **Básico**: `curl http://localhost:8000/health`
- **Detallado**: `curl http://localhost:8000/health/detailed`

## 🔒 Seguridad

- ⚠️ **IMPORTANTE**: Cambiar `SECRET_KEY` en producción
- Configurar CORS apropiadamente para producción
- Usar HTTPS en producción
- Configurar variables de entorno de producción en `.env.production`

## 🤝 Contribuir

1. Sigue los patrones de arquitectura existentes
2. Agrega tests para nuevas features
3. Ejecuta verificaciones de calidad antes de commit
4. Actualiza documentación cuando sea necesario

---

## 🎯 Comandos Esenciales

```bash
# Inicio y parada
./start-local-deploy.sh     # Levantar todo el stack
./stop-local-deploy.sh      # Parar todo el stack

# Desarrollo individual
cd backend && poetry run uvicorn slices.main:app --reload
cd frontend && npm run dev

# Testing
cd backend && poetry run pytest
cd frontend && npm test

# Formato de código
cd backend && poetry run black . && poetry run isort .
cd frontend && npm run format
```

¡Listo para desarrollo Full Stack! 🚀