from typing import Optional
from datetime import datetime
from dataclasses import dataclass, field

from ..value_objects import UUID, Severity


@dataclass
class Allergy:
    """Allergy entity for patient medical records"""
    
    id: UUID
    patient_id: UUID
    allergen: str  # Name of the allergen
    severity: Severity
    symptoms: str  # Description of symptoms
    treatment: Optional[str] = None  # Treatment or medication for reactions
    diagnosed_date: Optional[datetime] = None
    last_reaction_date: Optional[datetime] = None
    notes: Optional[str] = None
    is_active: bool = True
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    deleted_at: Optional[datetime] = None
    
    @classmethod
    def create(cls, patient_id: UUID, allergen: str, severity: str,
               symptoms: str, treatment: Optional[str] = None,
               diagnosed_date: Optional[datetime] = None,
               notes: Optional[str] = None) -> 'Allergy':
        """Factory method to create a new allergy record"""
        
        # Validations
        if not allergen or len(allergen.strip()) < 2:
            raise ValueError("Allergen name must be at least 2 characters")
        
        if not symptoms or len(symptoms.strip()) < 5:
            raise ValueError("Symptoms description must be at least 5 characters")
        
        if diagnosed_date and diagnosed_date > datetime.now():
            raise ValueError("Diagnosed date cannot be in the future")
        
        return cls(
            id=UUID(),
            patient_id=patient_id,
            allergen=allergen.strip().title(),
            severity=Severity.from_string(severity),
            symptoms=symptoms.strip(),
            treatment=treatment.strip() if treatment else None,
            diagnosed_date=diagnosed_date,
            notes=notes.strip() if notes else None
        )
    
    def update_severity(self, severity: str) -> None:
        """Update allergy severity"""
        self.severity = Severity.from_string(severity)
        self.updated_at = datetime.now()
    
    def update_symptoms(self, symptoms: str) -> None:
        """Update allergy symptoms"""
        if not symptoms or len(symptoms.strip()) < 5:
            raise ValueError("Symptoms description must be at least 5 characters")
        self.symptoms = symptoms.strip()
        self.updated_at = datetime.now()
    
    def update_treatment(self, treatment: Optional[str]) -> None:
        """Update allergy treatment"""
        self.treatment = treatment.strip() if treatment else None
        self.updated_at = datetime.now()
    
    def record_reaction(self, reaction_date: datetime, symptoms: Optional[str] = None,
                       treatment_given: Optional[str] = None) -> None:
        """Record a new allergic reaction"""
        if reaction_date > datetime.now():
            raise ValueError("Reaction date cannot be in the future")
        
        self.last_reaction_date = reaction_date
        if symptoms:
            self.symptoms = symptoms.strip()
        if treatment_given:
            self.treatment = treatment_given.strip()
        self.updated_at = datetime.now()
    
    def mark_resolved(self) -> None:
        """Mark allergy as resolved/inactive"""
        self.is_active = False
        self.updated_at = datetime.now()
    
    def reactivate(self) -> None:
        """Reactivate resolved allergy"""
        self.is_active = True
        self.updated_at = datetime.now()
    
    def update_notes(self, notes: Optional[str]) -> None:
        """Update allergy notes"""
        self.notes = notes.strip() if notes else None
        self.updated_at = datetime.now()
    
    def is_critical(self) -> bool:
        """Check if allergy is critical severity"""
        return self.severity == Severity.CRITICAL
    
    def days_since_last_reaction(self) -> Optional[int]:
        """Calculate days since last reaction"""
        if self.last_reaction_date:
            return (datetime.now() - self.last_reaction_date).days
        return None
    
    def soft_delete(self) -> None:
        """Soft delete allergy record"""
        self.deleted_at = datetime.now()
        self.updated_at = datetime.now()
    
    def to_dict(self) -> dict:
        """Convert entity to dictionary"""
        return {
            'id': str(self.id),
            'patient_id': str(self.patient_id),
            'allergen': self.allergen,
            'severity': self.severity.value,
            'symptoms': self.symptoms,
            'treatment': self.treatment,
            'diagnosed_date': self.diagnosed_date.isoformat() if self.diagnosed_date else None,
            'last_reaction_date': self.last_reaction_date.isoformat() if self.last_reaction_date else None,
            'days_since_last_reaction': self.days_since_last_reaction(),
            'notes': self.notes,
            'is_active': self.is_active,
            'is_critical': self.is_critical(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def to_emergency_dict(self) -> dict:
        """Convert to emergency information dictionary (for QR)"""
        return {
            'allergen': self.allergen,
            'severity': self.severity.value,
            'symptoms': self.symptoms,
            'treatment': self.treatment or "No specific treatment recorded",
            'last_reaction': self.last_reaction_date.strftime('%Y-%m-%d') if self.last_reaction_date else "Never recorded"
        }