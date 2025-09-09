from typing import Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings using Pydantic."""

    # Database (PostgreSQL 17)
    database_url: str = (
        "postgresql+asyncpg://backend_user:backend_pass@localhost:5432/backend_db"
    )
    database_pool_size: int = 10
    database_max_overflow: int = 20

    # Redis 7.4
    redis_url: str = "redis://localhost:6379/0"

    # Security
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # API
    api_v1_str: str = "/api/v1"
    project_name: str = "Backend API"
    debug: bool = False

    model_config = {"env_file": ".env", "case_sensitive": False}


settings = Settings()
