from typing import Optional, List
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
    redis_url: str

    # Security - SECURE VERSION
    # NEVER hardcode secrets - always use environment variables
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # API
    api_v1_str: str = "/api/v1"
    api_v1_prefix: str = "/api/v1"  # Alternative naming
    project_name: str = "Backend API"
    debug: bool = False

    # CORS
    allowed_origins: Optional[str] = '["http://localhost:3000"]'
    
    # Security
    bcrypt_rounds: int = 12
    
    # Email Configuration (optional)
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    
    # AWS/Cloud Configuration (optional)
    aws_region: Optional[str] = None
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None

    model_config = {"env_file": ".env", "case_sensitive": False, "extra": "ignore"}


settings = Settings()
