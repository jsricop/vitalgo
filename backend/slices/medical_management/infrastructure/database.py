"""
Database configuration and session management for VitalGo
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base
from contextlib import contextmanager
from typing import Generator

# Database URL from environment or default
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql+psycopg2://backend_user:backend_pass@localhost:5432/backend_db"
)

# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=0,
    pool_pre_ping=True,
    echo=False  # Set to True for SQL logging in development
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def get_db_session() -> Session:
    """Create and return a database session"""
    return SessionLocal()


@contextmanager
def get_db_context() -> Generator[Session, None, None]:
    """Context manager for database sessions with automatic cleanup"""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def create_tables():
    """Create all tables in the database"""
    from .models import Base
    Base.metadata.create_all(bind=engine)


def drop_tables():
    """Drop all tables in the database"""  
    from .models import Base
    Base.metadata.drop_all(bind=engine)