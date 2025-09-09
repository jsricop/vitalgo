"""
Configuration for Medical Management Infrastructure

Contains database connections, external service configurations,
and other infrastructure-related settings.
"""

from pydantic_settings import BaseSettings
from typing import Optional
import os


class MedicalConfig(BaseSettings):
    """Configuration class for medical management module"""
    
    # Database settings
    database_url: str = "postgresql://postgres:password@localhost:5432/vitalgo"
    database_echo: bool = False
    
    # JWT settings
    jwt_secret_key: str = "change-this-secret-key-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 1440  # 24 hours
    
    # QR Code settings
    qr_base_url: str = "https://vitalgo.app"
    qr_default_expiry_days: int = 365  # 1 year
    
    # Security settings
    password_min_length: int = 8
    max_login_attempts: int = 5
    
    # External APIs (for future use)
    eps_validation_api_url: Optional[str] = None
    cie10_api_url: Optional[str] = None
    
    # Redis settings (for caching)
    redis_url: str = "redis://localhost:6379/0"
    
    class Config:
        env_file = ".env"
        env_prefix = "MEDICAL_"


# Global configuration instance
medical_config = MedicalConfig()


# Database URL for Alembic
def get_database_url() -> str:
    """Get database URL for Alembic migrations"""
    return medical_config.database_url