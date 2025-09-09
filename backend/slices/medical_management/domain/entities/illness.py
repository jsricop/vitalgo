from typing import Optional
from datetime import datetime
from dataclasses import dataclass, field

from ..value_objects import UUID, IllnessStatus


@dataclass
class Illness:
    """Illness entity for patient medical records"""
    
    id: UUID
    patient_id: UUID
    name: str  # Name of the illness/condition
    cie10_code: Optional[str] = None  # International Classification of Diseases code
    status: IllnessStatus
    diagnosed_date: datetime
    resolved_date: Optional[datetime] = None
    symptoms: Optional[str] = None
    treatment: Optional[str] = None
    prescribed_by: Optional[str] = None  # Doctor who diagnosed/prescribed
    notes: Optional[str] = None
    is_chronic: bool = False
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    deleted_at: Optional[datetime] = None
    
    @classmethod
    def create(cls, patient_id: UUID, name: str, diagnosed_date: datetime,
               cie10_code: Optional[str] = None, symptoms: Optional[str] = None,
               treatment: Optional[str] = None, prescribed_by: Optional[str] = None,
               notes: Optional[str] = None, is_chronic: bool = False) -> 'Illness':
        """Factory method to create a new illness record"""
        
        # Validations
        if not name or len(name.strip()) < 2:
            raise ValueError("Illness name must be at least 2 characters")
        
        if diagnosed_date > datetime.now():
            raise ValueError("Diagnosed date cannot be in the future")
        
        # Set initial status based on chronic flag
        initial_status = IllnessStatus.CHRONIC if is_chronic else IllnessStatus.ACTIVE
        
        return cls(
            id=UUID(),
            patient_id=patient_id,
            name=name.strip().title(),
            cie10_code=cie10_code.strip().upper() if cie10_code else None,
            status=initial_status,
            diagnosed_date=diagnosed_date,
            symptoms=symptoms.strip() if symptoms else None,
            treatment=treatment.strip() if treatment else None,
            prescribed_by=prescribed_by.strip() if prescribed_by else None,
            notes=notes.strip() if notes else None,
            is_chronic=is_chronic
        )
    
    def update_status(self, status: str) -> None:
        """Update illness status"""
        new_status = IllnessStatus.from_string(status)
        
        if new_status == IllnessStatus.RESOLVED and self.is_chronic:
            raise ValueError("Chronic illnesses cannot be marked as resolved")
        
        self.status = new_status
        
        if new_status == IllnessStatus.RESOLVED:
            self.resolved_date = datetime.now()
        elif self.resolved_date:
            self.resolved_date = None
        
        self.updated_at = datetime.now()
    
    def mark_as_chronic(self) -> None:
        """Mark illness as chronic"""
        self.is_chronic = True
        self.status = IllnessStatus.CHRONIC
        self.resolved_date = None
        self.updated_at = datetime.now()
    
    def resolve(self, resolved_date: Optional[datetime] = None) -> None:
        """Mark illness as resolved"""
        if self.is_chronic:
            raise ValueError("Chronic illnesses cannot be resolved")
        
        self.status = IllnessStatus.RESOLVED
        self.resolved_date = resolved_date or datetime.now()
        self.updated_at = datetime.now()
    
    def update_treatment(self, treatment: str, prescribed_by: Optional[str] = None) -> None:
        """Update illness treatment"""
        self.treatment = treatment.strip()
        if prescribed_by:
            self.prescribed_by = prescribed_by.strip()
        self.updated_at = datetime.now()
    
    def update_symptoms(self, symptoms: str) -> None:
        """Update illness symptoms"""
        self.symptoms = symptoms.strip()
        self.updated_at = datetime.now()
    
    def update_notes(self, notes: Optional[str]) -> None:
        """Update illness notes"""
        self.notes = notes.strip() if notes else None
        self.updated_at = datetime.now()
    
    def update_cie10_code(self, cie10_code: str) -> None:
        """Update CIE-10 code"""
        self.cie10_code = cie10_code.strip().upper()
        self.updated_at = datetime.now()
    
    def is_active(self) -> bool:
        """Check if illness is currently active"""
        return self.status in [IllnessStatus.ACTIVE, IllnessStatus.CHRONIC]
    
    def is_resolved(self) -> bool:
        """Check if illness is resolved"""
        return self.status == IllnessStatus.RESOLVED
    
    def days_since_diagnosis(self) -> int:
        """Calculate days since diagnosis"""
        return (datetime.now() - self.diagnosed_date).days
    
    def days_since_resolution(self) -> Optional[int]:
        """Calculate days since resolution"""
        if self.resolved_date:
            return (datetime.now() - self.resolved_date).days
        return None
    
    def soft_delete(self) -> None:
        """Soft delete illness record"""
        self.deleted_at = datetime.now()
        self.updated_at = datetime.now()
    
    def to_dict(self) -> dict:
        """Convert entity to dictionary"""
        return {
            'id': str(self.id),
            'patient_id': str(self.patient_id),
            'name': self.name,
            'cie10_code': self.cie10_code,
            'status': self.status.value,
            'diagnosed_date': self.diagnosed_date.isoformat(),
            'resolved_date': self.resolved_date.isoformat() if self.resolved_date else None,
            'symptoms': self.symptoms,
            'treatment': self.treatment,
            'prescribed_by': self.prescribed_by,
            'notes': self.notes,
            'is_chronic': self.is_chronic,
            'is_active': self.is_active(),
            'days_since_diagnosis': self.days_since_diagnosis(),
            'days_since_resolution': self.days_since_resolution(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def to_emergency_dict(self) -> dict:
        """Convert to emergency information dictionary (for QR)"""
        status_text = "CRÓNICA" if self.is_chronic else self.status.value
        return {
            'name': self.name,
            'cie10_code': self.cie10_code or "No code",
            'status': status_text,
            'diagnosed': self.diagnosed_date.strftime('%Y-%m-%d'),
            'treatment': self.treatment or "No specific treatment recorded",
            'symptoms': self.symptoms or "No symptoms recorded"
        }