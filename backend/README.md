# Backend API - FastAPI with Hexagonal Architecture

A production-ready FastAPI backend built with hexagonal architecture and vertical slicing patterns.

## 🏗️ Architecture

This project follows **Hexagonal Architecture** (Ports and Adapters) combined with **Vertical Slicing**:

- **slices/**: Each feature is organized as a vertical slice
  - **api/**: HTTP controllers and routes
  - **core/**: Business logic (domain + services)  
  - **infrastructure/**: External adapters (databases, APIs)
- **shared/**: Common infrastructure and utilities

## 🚀 Tech Stack

- **FastAPI 0.116.1**: Modern Python web framework
- **Python 3.13.7**: Latest stable Python with LTS support
- **PostgreSQL 17**: Latest stable database
- **Redis 7.4**: Caching and session storage
- **SQLAlchemy 2.0.43**: Modern async ORM
- **Alembic**: Database migrations
- **Docker**: Containerization
- **Poetry**: Dependency management

## 📋 Prerequisites

- Python 3.13.7+
- Docker 25.0+
- Poetry 1.8+
- PostgreSQL 17 client

## 🛠️ Quick Start

### 1. Install Dependencies
```bash
# Install Poetry if not installed
curl -sSL https://install.python-poetry.org | python3 -

# Install project dependencies
poetry install
```

### 2. Start Services
```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Run database migrations
poetry run alembic upgrade head
```

### 3. Start Development Server
```bash
# Development mode
poetry run uvicorn slices.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Verify Installation
- Health Check: http://localhost:8000/health
- Detailed Health: http://localhost:8000/health/detailed  
- API Documentation: http://localhost:8000/docs
- Alternative Docs: http://localhost:8000/redoc

## 🧪 Testing

```bash
# Run all tests
poetry run pytest -v

# Run with coverage
poetry run pytest --cov=slices tests/

# Code formatting
poetry run black slices/ tests/
poetry run isort slices/ tests/

# Type checking  
poetry run mypy slices/
```

## 🐳 Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Scale services (if needed)
docker-compose up -d --scale backend=3
```

## 📊 Health Monitoring

- **Basic**: `GET /health` - Simple health check
- **Detailed**: `GET /health/detailed` - Full system health including DB and Redis

## 🔧 Environment Configuration

Copy `.env.production` and customize:

```bash
cp .env.production .env
# Edit .env with your production values
```

Key settings:
- `SECRET_KEY`: JWT signing key (CRITICAL: Change in production)
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string

## 📝 Development Guidelines

### Adding New Features

1. Create a new slice directory: `slices/feature_name/`
2. Add API routes: `slices/feature_name/api/routes.py`
3. Implement business logic: `slices/feature_name/core/`
4. Add infrastructure: `slices/feature_name/infrastructure/`
5. Write tests: `tests/feature_name/`

### Database Changes

```bash
# Create migration
poetry run alembic revision --autogenerate -m "Description"

# Apply migrations
poetry run alembic upgrade head

# Rollback (if needed)
poetry run alembic downgrade -1
```

## 🚦 Project Status

✅ **Production Ready Features:**
- FastAPI application with health checks
- PostgreSQL 17 with async SQLAlchemy  
- Redis caching integration
- Database migrations with Alembic
- Comprehensive testing suite
- Docker containerization
- Code quality tools (Black, isort, mypy)
- API documentation (OpenAPI/Swagger)

🚀 **Ready for Sprint Development:**
- Clean architecture foundation
- Testing framework configured
- CI/CD ready structure
- Security best practices

## 📖 API Documentation

When the server is running:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc  
- **OpenAPI JSON**: http://localhost:8000/api/v1/openapi.json

## 🤝 Contributing

1. Follow the existing architecture patterns
2. Add tests for new features
3. Run code quality checks before committing
4. Update documentation as needed

## 📄 License

This project is proprietary. All rights reserved.