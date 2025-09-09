from typing import Optional
import os

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings using Pydantic."""

    # Database (PostgreSQL 17) - SECURE VERSION
    # NEVER hardcode credentials - always use environment variables
    database_url: str
    database_pool_size: int = 10
    database_max_overflow: int = 20

    # Redis 7.4
    redis_url: str = "redis://localhost:6379/0"

    # Security - SECURE VERSION
    # NEVER hardcode secrets - always use environment variables
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # API
    api_v1_str: str = "/api/v1"
    project_name: str = "Backend API"
    debug: bool = False

    model_config = {"env_file": ".env", "case_sensitive": False}


settings = Settings()
