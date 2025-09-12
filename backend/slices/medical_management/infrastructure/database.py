"""
Database configuration and session management for VitalGo
"""
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from contextlib import asynccontextmanager
from typing import AsyncGenerator

# Database URL from environment or default
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql+asyncpg://backend_user:backend_pass@localhost:5432/backend_db"
)

# Create async SQLAlchemy engine
engine = create_async_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=0,
    pool_pre_ping=True,
    echo=False  # Set to True for SQL logging in development
)

# Create AsyncSessionLocal class
AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

# Base class for models
Base = declarative_base()


async def get_db_session() -> AsyncSession:
    """Create and return an async database session"""
    return AsyncSessionLocal()


@asynccontextmanager
async def get_db_context() -> AsyncGenerator[AsyncSession, None]:
    """Async context manager for database sessions with automatic cleanup"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def create_tables():
    """Create all tables in the database"""
    from .models import Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def drop_tables():
    """Drop all tables in the database"""  
    from .models import Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)