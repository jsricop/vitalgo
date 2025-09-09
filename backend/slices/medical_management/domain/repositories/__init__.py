"""
Repository interfaces for the medical management domain.

These interfaces define the contracts that infrastructure layer implementations
must follow for data persistence operations.
"""

from abc import ABC, abstractmethod
from typing import Optional, List
from datetime import datetime

from ..entities import User, Patient, Paramedic, Allergy, Illness, Surgery
from ..value_objects import UUID, Email, ParamedicStatus


class UserRepository(ABC):
    """Repository interface for User entity operations"""
    
    @abstractmethod
    async def create(self, user: User) -> User:
        """Create a new user"""
        pass
    
    @abstractmethod
    async def get_by_id(self, user_id: UUID) -> Optional[User]:
        """Get user by ID"""
        pass
    
    @abstractmethod
    async def get_by_email(self, email: Email) -> Optional[User]:
        """Get user by email"""
        pass
    
    @abstractmethod
    async def update(self, user: User) -> User:
        """Update existing user"""
        pass
    
    @abstractmethod
    async def delete(self, user_id: UUID) -> bool:
        """Soft delete user"""
        pass


class PatientRepository(ABC):
    """Repository interface for Patient entity operations"""
    
    @abstractmethod
    async def create(self, patient: Patient) -> Patient:
        """Create a new patient"""
        pass
    
    @abstractmethod
    async def get_by_id(self, patient_id: UUID) -> Optional[Patient]:
        """Get patient by ID"""
        pass
    
    @abstractmethod
    async def get_by_user_id(self, user_id: UUID) -> Optional[Patient]:
        """Get patient by user ID"""
        pass
    
    @abstractmethod
    async def get_by_document(self, document_type: str, document_number: str) -> Optional[Patient]:
        """Get patient by document"""
        pass
    
    @abstractmethod
    async def update(self, patient: Patient) -> Patient:
        """Update existing patient"""
        pass
    
    @abstractmethod
    async def delete(self, patient_id: UUID) -> bool:
        """Soft delete patient"""
        pass


class ParamedicRepository(ABC):
    """Repository interface for Paramedic entity operations"""
    
    @abstractmethod
    async def create(self, paramedic: Paramedic) -> Paramedic:
        """Create a new paramedic"""
        pass
    
    @abstractmethod
    async def get_by_id(self, paramedic_id: UUID) -> Optional[Paramedic]:
        """Get paramedic by ID"""
        pass
    
    @abstractmethod
    async def get_by_user_id(self, user_id: UUID) -> Optional[Paramedic]:
        """Get paramedic by user ID"""
        pass
    
    @abstractmethod
    async def get_by_license(self, license_number: str) -> Optional[Paramedic]:
        """Get paramedic by license number"""
        pass
    
    @abstractmethod
    async def get_by_status(self, status: ParamedicStatus) -> List[Paramedic]:
        """Get paramedics by status"""
        pass
    
    @abstractmethod
    async def update(self, paramedic: Paramedic) -> Paramedic:
        """Update existing paramedic"""
        pass
    
    @abstractmethod
    async def delete(self, paramedic_id: UUID) -> bool:
        """Soft delete paramedic"""
        pass


class AllergyRepository(ABC):
    """Repository interface for Allergy entity operations"""
    
    @abstractmethod
    async def create(self, allergy: Allergy) -> Allergy:
        """Create a new allergy"""
        pass
    
    @abstractmethod
    async def get_by_id(self, allergy_id: UUID) -> Optional[Allergy]:
        """Get allergy by ID"""
        pass
    
    @abstractmethod
    async def get_by_patient_id(self, patient_id: UUID) -> List[Allergy]:
        """Get all allergies for a patient"""
        pass
    
    @abstractmethod
    async def get_active_by_patient_id(self, patient_id: UUID) -> List[Allergy]:
        """Get active allergies for a patient"""
        pass
    
    @abstractmethod
    async def update(self, allergy: Allergy) -> Allergy:
        """Update existing allergy"""
        pass
    
    @abstractmethod
    async def delete(self, allergy_id: UUID) -> bool:
        """Soft delete allergy"""
        pass


class IllnessRepository(ABC):
    """Repository interface for Illness entity operations"""
    
    @abstractmethod
    async def create(self, illness: Illness) -> Illness:
        """Create a new illness"""
        pass
    
    @abstractmethod
    async def get_by_id(self, illness_id: UUID) -> Optional[Illness]:
        """Get illness by ID"""
        pass
    
    @abstractmethod
    async def get_by_patient_id(self, patient_id: UUID) -> List[Illness]:
        """Get all illnesses for a patient"""
        pass
    
    @abstractmethod
    async def get_active_by_patient_id(self, patient_id: UUID) -> List[Illness]:
        """Get active illnesses for a patient"""
        pass
    
    @abstractmethod
    async def get_chronic_by_patient_id(self, patient_id: UUID) -> List[Illness]:
        """Get chronic illnesses for a patient"""
        pass
    
    @abstractmethod
    async def update(self, illness: Illness) -> Illness:
        """Update existing illness"""
        pass
    
    @abstractmethod
    async def delete(self, illness_id: UUID) -> bool:
        """Soft delete illness"""
        pass


class SurgeryRepository(ABC):
    """Repository interface for Surgery entity operations"""
    
    @abstractmethod
    async def create(self, surgery: Surgery) -> Surgery:
        """Create a new surgery"""
        pass
    
    @abstractmethod
    async def get_by_id(self, surgery_id: UUID) -> Optional[Surgery]:
        """Get surgery by ID"""
        pass
    
    @abstractmethod
    async def get_by_patient_id(self, patient_id: UUID) -> List[Surgery]:
        """Get all surgeries for a patient"""
        pass
    
    @abstractmethod
    async def get_recent_by_patient_id(self, patient_id: UUID, days: int = 30) -> List[Surgery]:
        """Get recent surgeries for a patient"""
        pass
    
    @abstractmethod
    async def update(self, surgery: Surgery) -> Surgery:
        """Update existing surgery"""
        pass
    
    @abstractmethod
    async def delete(self, surgery_id: UUID) -> bool:
        """Soft delete surgery"""
        pass


__all__ = [
    'UserRepository',
    'PatientRepository',
    'ParamedicRepository',
    'AllergyRepository',
    'IllnessRepository',
    'SurgeryRepository'
]