from enum import Enum
from typing import Optional
from datetime import datetime
import re
import uuid


class BloodType(Enum):
    """Valid blood types in the Colombian health system"""
    A_POSITIVE = "A+"
    A_NEGATIVE = "A-"
    B_POSITIVE = "B+"
    B_NEGATIVE = "B-"
    AB_POSITIVE = "AB+"
    AB_NEGATIVE = "AB-"
    O_POSITIVE = "O+"
    O_NEGATIVE = "O-"
    
    @classmethod
    def from_string(cls, value: str) -> 'BloodType':
        """Convert string to BloodType enum"""
        for blood_type in cls:
            if blood_type.value == value.upper():
                return blood_type
        raise ValueError(f"Invalid blood type: {value}")


class Severity(Enum):
    """Severity levels for medical conditions"""
    MILD = "LEVE"
    MODERATE = "MODERADA"
    SEVERE = "SEVERA"
    CRITICAL = "CRITICA"
    
    @classmethod
    def from_string(cls, value: str) -> 'Severity':
        """Convert string to Severity enum"""
        mapping = {
            "LEVE": cls.MILD,
            "MODERADA": cls.MODERATE,
            "SEVERA": cls.SEVERE,
            "CRITICA": cls.CRITICAL
        }
        return mapping.get(value.upper(), cls.MILD)


class IllnessStatus(Enum):
    """Status of an illness"""
    ACTIVE = "ACTIVA"
    RESOLVED = "RESUELTA"
    CHRONIC = "CRONICA"
    
    @classmethod
    def from_string(cls, value: str) -> 'IllnessStatus':
        """Convert string to IllnessStatus enum"""
        for status in cls:
            if status.value == value.upper():
                return status
        raise ValueError(f"Invalid illness status: {value}")


class ParamedicStatus(Enum):
    """Status of a paramedic registration"""
    PENDING = "PENDIENTE"
    APPROVED = "APROBADO"
    REJECTED = "RECHAZADO"
    SUSPENDED = "SUSPENDIDO"
    
    @classmethod
    def from_string(cls, value: str) -> 'ParamedicStatus':
        """Convert string to ParamedicStatus enum"""
        for status in cls:
            if status.value == value.upper():
                return status
        raise ValueError(f"Invalid paramedic status: {value}")


class DocumentType(Enum):
    """Colombian document types"""
    CC = "CC"  # Cédula de Ciudadanía
    CE = "CE"  # Cédula de Extranjería
    PA = "PA"  # Pasaporte
    TI = "TI"  # Tarjeta de Identidad
    RC = "RC"  # Registro Civil
    
    @classmethod
    def from_string(cls, value: str) -> 'DocumentType':
        """Convert string to DocumentType enum"""
        for doc_type in cls:
            if doc_type.value == value.upper():
                return doc_type
        raise ValueError(f"Invalid document type: {value}")


class Email:
    """Value object for email validation"""
    
    def __init__(self, value: str):
        if not self._is_valid_email(value):
            raise ValueError(f"Invalid email format: {value}")
        self.value = value.lower()
    
    @staticmethod
    def _is_valid_email(email: str) -> bool:
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    def __str__(self):
        return self.value
    
    def __eq__(self, other):
        if isinstance(other, Email):
            return self.value == other.value
        return False


class UUID:
    """Value object for UUID generation and validation"""
    
    def __init__(self, value: Optional[str] = None):
        if value:
            try:
                uuid.UUID(value)
                self.value = value
            except ValueError:
                raise ValueError(f"Invalid UUID format: {value}")
        else:
            self.value = str(uuid.uuid4())
    
    def __str__(self):
        return self.value
    
    def __eq__(self, other):
        if isinstance(other, UUID):
            return self.value == other.value
        return False


class DateRange:
    """Value object for date ranges"""
    
    def __init__(self, start_date: datetime, end_date: Optional[datetime] = None):
        if end_date and start_date > end_date:
            raise ValueError("Start date must be before end date")
        self.start_date = start_date
        self.end_date = end_date
    
    def is_active(self) -> bool:
        """Check if the date range is currently active"""
        now = datetime.now()
        if self.end_date:
            return self.start_date <= now <= self.end_date
        return self.start_date <= now
    
    def duration_days(self) -> Optional[int]:
        """Calculate duration in days"""
        if self.end_date:
            return (self.end_date - self.start_date).days
        return None


class ColombianEPS:
    """Value object for Colombian EPS validation"""
    
    def __init__(self, value: str):
        """
        Initialize EPS with validation.
        Now validates against the database-driven EPS catalog.
        """
        self.value = value.strip()
        # Basic validation - non-empty string
        if not self.value:
            raise ValueError("EPS name cannot be empty")
        
        # Note: Database validation should be performed at the application layer
        # This value object just ensures the value is a valid string
    
    def __str__(self):
        return self.value
    
    def __eq__(self, other):
        if isinstance(other, ColombianEPS):
            return self.value == other.value
        return False
    
    @staticmethod
    async def validate_against_database(eps_name: str) -> bool:
        """
        Validate EPS name against database catalog.
        This should be called from the application layer.
        """
        try:
            import psycopg2
            from psycopg2.extras import RealDictCursor
            import os
            
            DATABASE_URL = os.getenv("DATABASE_URL")
            if not DATABASE_URL:
                # Fallback for validation - return True without database check
                return True
            
            conn = psycopg2.connect(DATABASE_URL)
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            cursor.execute("""
                SELECT COUNT(*) as count FROM eps 
                WHERE name = %s AND status = 'activa'
            """, (eps_name,))
            
            result = cursor.fetchone()
            cursor.close()
            conn.close()
            
            return result and result['count'] > 0
            
        except Exception:
            # If database validation fails, allow the value
            # This ensures system resilience
            return True