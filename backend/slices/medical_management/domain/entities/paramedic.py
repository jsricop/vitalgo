from typing import Optional
from datetime import datetime
from dataclasses import dataclass, field

from ..value_objects import UUID, ParamedicStatus
from .user import User


@dataclass
class Paramedic:
    """Paramedic entity for emergency medical access"""
    
    id: UUID
    user_id: UUID
    medical_license: str  # Professional medical license number
    specialty: str
    institution: str  # Current workplace
    years_experience: int
    license_expiry_date: datetime
    status: ParamedicStatus
    approved_by: Optional[UUID] = None  # Admin who approved
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    deleted_at: Optional[datetime] = None
    
    @classmethod
    def create(cls, user_id: UUID, medical_license: str, specialty: str,
               institution: str, years_experience: int, 
               license_expiry_date: datetime) -> 'Paramedic':
        """Factory method to create a new paramedic registration"""
        
        # Validations
        if not medical_license or len(medical_license) < 3:
            raise ValueError("Valid medical license is required")
        
        if years_experience < 0 or years_experience > 60:
            raise ValueError("Years of experience must be between 0 and 60")
        
        if license_expiry_date <= datetime.now():
            raise ValueError("Medical license must not be expired")
        
        if not specialty or not institution:
            raise ValueError("Specialty and institution are required")
        
        return cls(
            id=UUID(),
            user_id=user_id,
            medical_license=medical_license,
            specialty=specialty,
            institution=institution,
            years_experience=years_experience,
            license_expiry_date=license_expiry_date,
            status=ParamedicStatus.PENDING
        )
    
    def approve(self, approved_by: UUID) -> None:
        """Approve paramedic registration"""
        if self.status != ParamedicStatus.PENDING:
            raise ValueError("Can only approve pending registrations")
        
        self.status = ParamedicStatus.APPROVED
        self.approved_by = approved_by
        self.approved_at = datetime.now()
        self.rejection_reason = None
        self.updated_at = datetime.now()
    
    def reject(self, rejected_by: UUID, reason: str) -> None:
        """Reject paramedic registration"""
        if self.status not in [ParamedicStatus.PENDING, ParamedicStatus.APPROVED]:
            raise ValueError("Can only reject pending or approved registrations")
        
        if not reason:
            raise ValueError("Rejection reason is required")
        
        self.status = ParamedicStatus.REJECTED
        self.approved_by = None
        self.approved_at = None
        self.rejection_reason = reason
        self.updated_at = datetime.now()
    
    def suspend(self, suspended_by: UUID, reason: str) -> None:
        """Suspend approved paramedic"""
        if self.status != ParamedicStatus.APPROVED:
            raise ValueError("Can only suspend approved paramedics")
        
        if not reason:
            raise ValueError("Suspension reason is required")
        
        self.status = ParamedicStatus.SUSPENDED
        self.rejection_reason = reason
        self.updated_at = datetime.now()
    
    def reactivate(self, reactivated_by: UUID) -> None:
        """Reactivate suspended paramedic"""
        if self.status != ParamedicStatus.SUSPENDED:
            raise ValueError("Can only reactivate suspended paramedics")
        
        self.status = ParamedicStatus.APPROVED
        self.approved_by = reactivated_by
        self.approved_at = datetime.now()
        self.rejection_reason = None
        self.updated_at = datetime.now()
    
    def is_active(self) -> bool:
        """Check if paramedic is active and can access patient data"""
        return (self.status == ParamedicStatus.APPROVED and 
                self.license_expiry_date > datetime.now() and
                self.deleted_at is None)
    
    def is_license_expired(self) -> bool:
        """Check if medical license is expired"""
        return self.license_expiry_date <= datetime.now()
    
    def update_professional_info(self, specialty: Optional[str] = None,
                                institution: Optional[str] = None,
                                years_experience: Optional[int] = None,
                                license_expiry_date: Optional[datetime] = None) -> None:
        """Update paramedic's professional information"""
        if specialty:
            self.specialty = specialty
        if institution:
            self.institution = institution
        if years_experience is not None:
            if years_experience < 0 or years_experience > 60:
                raise ValueError("Years of experience must be between 0 and 60")
            self.years_experience = years_experience
        if license_expiry_date:
            if license_expiry_date <= datetime.now():
                raise ValueError("License expiry date cannot be in the past")
            self.license_expiry_date = license_expiry_date
        
        self.updated_at = datetime.now()
    
    def deactivate(self) -> None:
        """Soft delete paramedic"""
        self.deleted_at = datetime.now()
        self.updated_at = datetime.now()
    
    def to_dict(self) -> dict:
        """Convert entity to dictionary"""
        return {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'medical_license': self.medical_license,
            'specialty': self.specialty,
            'institution': self.institution,
            'years_experience': self.years_experience,
            'license_expiry_date': self.license_expiry_date.isoformat(),
            'status': self.status.value,
            'is_active': self.is_active(),
            'is_license_expired': self.is_license_expired(),
            'approved_by': str(self.approved_by) if self.approved_by else None,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'rejection_reason': self.rejection_reason,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def to_public_dict(self) -> dict:
        """Convert to public information dictionary (for verification)"""
        return {
            'id': str(self.id),
            'medical_license': self.medical_license,
            'specialty': self.specialty,
            'institution': self.institution,
            'years_experience': self.years_experience,
            'status': self.status.value,
            'is_active': self.is_active()
        }