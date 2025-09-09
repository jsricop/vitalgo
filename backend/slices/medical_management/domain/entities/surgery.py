from typing import Optional, List
from datetime import datetime
from dataclasses import dataclass, field

from ..value_objects import UUID


@dataclass
class Surgery:
    """Surgery entity for patient medical records"""
    
    id: UUID
    patient_id: UUID
    name: str  # Name/type of surgery
    surgery_date: datetime
    surgeon: str  # Primary surgeon name
    hospital: str  # Hospital where surgery was performed
    description: Optional[str] = None  # Detailed description
    diagnosis: Optional[str] = None  # Pre-surgical diagnosis
    complications: List[str] = field(default_factory=list)  # Post-surgical complications
    recovery_notes: Optional[str] = None
    anesthesia_type: Optional[str] = None
    surgery_duration_minutes: Optional[int] = None
    follow_up_required: bool = False
    follow_up_date: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    deleted_at: Optional[datetime] = None
    
    @classmethod
    def create(cls, patient_id: UUID, name: str, surgery_date: datetime,
               surgeon: str, hospital: str, description: Optional[str] = None,
               diagnosis: Optional[str] = None, anesthesia_type: Optional[str] = None,
               surgery_duration_minutes: Optional[int] = None,
               notes: Optional[str] = None) -> 'Surgery':
        """Factory method to create a new surgery record"""
        
        # Validations
        if not name or len(name.strip()) < 2:
            raise ValueError("Surgery name must be at least 2 characters")
        
        if not surgeon or len(surgeon.strip()) < 2:
            raise ValueError("Surgeon name must be at least 2 characters")
        
        if not hospital or len(hospital.strip()) < 2:
            raise ValueError("Hospital name must be at least 2 characters")
        
        if surgery_date > datetime.now():
            raise ValueError("Surgery date cannot be in the future")
        
        if surgery_duration_minutes is not None and surgery_duration_minutes < 1:
            raise ValueError("Surgery duration must be at least 1 minute")
        
        return cls(
            id=UUID(),
            patient_id=patient_id,
            name=name.strip().title(),
            surgery_date=surgery_date,
            surgeon=surgeon.strip(),
            hospital=hospital.strip(),
            description=description.strip() if description else None,
            diagnosis=diagnosis.strip() if diagnosis else None,
            anesthesia_type=anesthesia_type.strip() if anesthesia_type else None,
            surgery_duration_minutes=surgery_duration_minutes,
            notes=notes.strip() if notes else None
        )
    
    def add_complication(self, complication: str) -> None:
        """Add a post-surgical complication"""
        if not complication or len(complication.strip()) < 3:
            raise ValueError("Complication description must be at least 3 characters")
        
        complication_text = complication.strip()
        if complication_text not in self.complications:
            self.complications.append(complication_text)
            self.updated_at = datetime.now()
    
    def remove_complication(self, complication: str) -> None:
        """Remove a complication from the list"""
        if complication in self.complications:
            self.complications.remove(complication)
            self.updated_at = datetime.now()
    
    def update_recovery_notes(self, recovery_notes: str) -> None:
        """Update recovery notes"""
        self.recovery_notes = recovery_notes.strip()
        self.updated_at = datetime.now()
    
    def set_follow_up(self, follow_up_date: datetime, required: bool = True) -> None:
        """Set follow-up appointment"""
        if follow_up_date <= datetime.now():
            raise ValueError("Follow-up date must be in the future")
        
        self.follow_up_required = required
        self.follow_up_date = follow_up_date
        self.updated_at = datetime.now()
    
    def complete_follow_up(self) -> None:
        """Mark follow-up as completed"""
        self.follow_up_required = False
        self.updated_at = datetime.now()
    
    def update_details(self, description: Optional[str] = None,
                      diagnosis: Optional[str] = None,
                      anesthesia_type: Optional[str] = None,
                      surgery_duration_minutes: Optional[int] = None) -> None:
        """Update surgery details"""
        if description is not None:
            self.description = description.strip() if description else None
        if diagnosis is not None:
            self.diagnosis = diagnosis.strip() if diagnosis else None
        if anesthesia_type is not None:
            self.anesthesia_type = anesthesia_type.strip() if anesthesia_type else None
        if surgery_duration_minutes is not None:
            if surgery_duration_minutes < 1:
                raise ValueError("Surgery duration must be at least 1 minute")
            self.surgery_duration_minutes = surgery_duration_minutes
        
        self.updated_at = datetime.now()
    
    def update_notes(self, notes: Optional[str]) -> None:
        """Update surgery notes"""
        self.notes = notes.strip() if notes else None
        self.updated_at = datetime.now()
    
    def has_complications(self) -> bool:
        """Check if surgery had complications"""
        return len(self.complications) > 0
    
    def days_since_surgery(self) -> int:
        """Calculate days since surgery"""
        return (datetime.now() - self.surgery_date).days
    
    def is_recent(self, days: int = 30) -> bool:
        """Check if surgery was performed recently"""
        return self.days_since_surgery() <= days
    
    def is_follow_up_overdue(self) -> bool:
        """Check if follow-up is overdue"""
        if not self.follow_up_required or not self.follow_up_date:
            return False
        return self.follow_up_date < datetime.now()
    
    def soft_delete(self) -> None:
        """Soft delete surgery record"""
        self.deleted_at = datetime.now()
        self.updated_at = datetime.now()
    
    def to_dict(self) -> dict:
        """Convert entity to dictionary"""
        return {
            'id': str(self.id),
            'patient_id': str(self.patient_id),
            'name': self.name,
            'surgery_date': self.surgery_date.isoformat(),
            'surgeon': self.surgeon,
            'hospital': self.hospital,
            'description': self.description,
            'diagnosis': self.diagnosis,
            'complications': self.complications,
            'complications_count': len(self.complications),
            'recovery_notes': self.recovery_notes,
            'anesthesia_type': self.anesthesia_type,
            'surgery_duration_minutes': self.surgery_duration_minutes,
            'follow_up_required': self.follow_up_required,
            'follow_up_date': self.follow_up_date.isoformat() if self.follow_up_date else None,
            'is_follow_up_overdue': self.is_follow_up_overdue(),
            'notes': self.notes,
            'days_since_surgery': self.days_since_surgery(),
            'is_recent': self.is_recent(),
            'has_complications': self.has_complications(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def to_emergency_dict(self) -> dict:
        """Convert to emergency information dictionary (for QR)"""
        return {
            'name': self.name,
            'date': self.surgery_date.strftime('%Y-%m-%d'),
            'surgeon': self.surgeon,
            'hospital': self.hospital,
            'complications': self.complications if self.complications else ["No complications recorded"],
            'anesthesia': self.anesthesia_type or "Not specified",
            'days_ago': self.days_since_surgery()
        }