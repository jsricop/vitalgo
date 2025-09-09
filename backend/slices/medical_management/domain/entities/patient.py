from typing import Optional, List
from datetime import datetime, date
from dataclasses import dataclass, field

from ..value_objects import (
    UUID, Email, BloodType, DocumentType, ColombianEPS
)
from .user import User


@dataclass
class Patient:
    """Patient entity with medical information"""
    
    id: UUID
    user_id: UUID
    document_type: DocumentType
    document_number: str
    birth_date: date
    gender: str  # 'M', 'F', 'O'
    blood_type: BloodType
    eps: ColombianEPS
    emergency_contact_name: str
    emergency_contact_phone: str
    address: Optional[str] = None
    city: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    deleted_at: Optional[datetime] = None
    
    # Medical history references (IDs)
    allergies: List[UUID] = field(default_factory=list)
    illnesses: List[UUID] = field(default_factory=list)
    surgeries: List[UUID] = field(default_factory=list)
    medications: List[UUID] = field(default_factory=list)
    
    @classmethod
    def create(cls, user_id: UUID, document_type: str, document_number: str,
               birth_date: date, gender: str, blood_type: str, eps: str,
               emergency_contact_name: str, emergency_contact_phone: str,
               address: Optional[str] = None, city: Optional[str] = None) -> 'Patient':
        """Factory method to create a new patient"""
        
        # Validations
        if gender not in ['M', 'F', 'O']:
            raise ValueError("Gender must be 'M', 'F', or 'O'")
        
        if not document_number:
            raise ValueError("Document number is required")
        
        if birth_date > date.today():
            raise ValueError("Birth date cannot be in the future")
        
        age = cls._calculate_age(birth_date)
        if age < 0 or age > 150:
            raise ValueError("Invalid birth date")
        
        return cls(
            id=UUID(),
            user_id=user_id,
            document_type=DocumentType.from_string(document_type),
            document_number=document_number,
            birth_date=birth_date,
            gender=gender,
            blood_type=BloodType.from_string(blood_type),
            eps=ColombianEPS(eps),
            emergency_contact_name=emergency_contact_name,
            emergency_contact_phone=emergency_contact_phone,
            address=address,
            city=city
        )
    
    @staticmethod
    def _calculate_age(birth_date: date) -> int:
        """Calculate age from birth date"""
        today = date.today()
        age = today.year - birth_date.year
        if today.month < birth_date.month or \
           (today.month == birth_date.month and today.day < birth_date.day):
            age -= 1
        return age
    
    def get_age(self) -> int:
        """Get patient's current age"""
        return self._calculate_age(self.birth_date)
    
    def update_medical_info(self, blood_type: Optional[str] = None,
                           eps: Optional[str] = None) -> None:
        """Update patient's medical information"""
        if blood_type:
            self.blood_type = BloodType.from_string(blood_type)
        if eps:
            self.eps = ColombianEPS(eps)
        self.updated_at = datetime.now()
    
    def update_contact_info(self, address: Optional[str] = None,
                           city: Optional[str] = None,
                           emergency_contact_name: Optional[str] = None,
                           emergency_contact_phone: Optional[str] = None) -> None:
        """Update patient's contact information"""
        if address is not None:
            self.address = address
        if city is not None:
            self.city = city
        if emergency_contact_name:
            self.emergency_contact_name = emergency_contact_name
        if emergency_contact_phone:
            self.emergency_contact_phone = emergency_contact_phone
        self.updated_at = datetime.now()
    
    def add_allergy(self, allergy_id: UUID) -> None:
        """Add an allergy to patient's record"""
        if allergy_id not in self.allergies:
            self.allergies.append(allergy_id)
            self.updated_at = datetime.now()
    
    def remove_allergy(self, allergy_id: UUID) -> None:
        """Remove an allergy from patient's record"""
        if allergy_id in self.allergies:
            self.allergies.remove(allergy_id)
            self.updated_at = datetime.now()
    
    def add_illness(self, illness_id: UUID) -> None:
        """Add an illness to patient's record"""
        if illness_id not in self.illnesses:
            self.illnesses.append(illness_id)
            self.updated_at = datetime.now()
    
    def remove_illness(self, illness_id: UUID) -> None:
        """Remove an illness from patient's record"""
        if illness_id in self.illnesses:
            self.illnesses.remove(illness_id)
            self.updated_at = datetime.now()
    
    def add_surgery(self, surgery_id: UUID) -> None:
        """Add a surgery to patient's record"""
        if surgery_id not in self.surgeries:
            self.surgeries.append(surgery_id)
            self.updated_at = datetime.now()
    
    def remove_surgery(self, surgery_id: UUID) -> None:
        """Remove a surgery from patient's record"""
        if surgery_id in self.surgeries:
            self.surgeries.remove(surgery_id)
            self.updated_at = datetime.now()
    
    def deactivate(self) -> None:
        """Soft delete patient"""
        self.deleted_at = datetime.now()
        self.updated_at = datetime.now()
    
    def to_dict(self) -> dict:
        """Convert entity to dictionary"""
        return {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'document_type': self.document_type.value,
            'document_number': self.document_number,
            'birth_date': self.birth_date.isoformat(),
            'age': self.get_age(),
            'gender': self.gender,
            'blood_type': self.blood_type.value,
            'eps': str(self.eps),
            'emergency_contact_name': self.emergency_contact_name,
            'emergency_contact_phone': self.emergency_contact_phone,
            'address': self.address,
            'city': self.city,
            'allergies_count': len(self.allergies),
            'illnesses_count': len(self.illnesses),
            'surgeries_count': len(self.surgeries),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def to_emergency_dict(self) -> dict:
        """Convert to emergency information dictionary (for QR)"""
        return {
            'patient_name': '',  # Will be filled with user data
            'document': f"{self.document_type.value} {self.document_number}",
            'age': self.get_age(),
            'blood_type': self.blood_type.value,
            'eps': str(self.eps),
            'emergency_contact': f"{self.emergency_contact_name} - {self.emergency_contact_phone}",
            'allergies': [],  # Will be filled with allergy data
            'chronic_illnesses': [],  # Will be filled with illness data
            'current_medications': []  # Will be filled with medication data
        }