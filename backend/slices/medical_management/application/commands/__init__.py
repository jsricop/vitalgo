"""
CQRS Commands for Medical Management

Commands represent actions that change the state of the system.
They encapsulate the request parameters and business logic validation.
"""

from dataclasses import dataclass
from typing import Optional
from datetime import datetime, date

from ...domain.value_objects import UUID


# User Commands
@dataclass
class CreateUserCommand:
    """Command to create a new user"""
    email: str
    password: str
    first_name: str
    last_name: str
    phone: str
    role: str


@dataclass
class UpdateUserCommand:
    """Command to update user profile"""
    user_id: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None


@dataclass
class ChangePasswordCommand:
    """Command to change user password"""
    user_id: str
    old_password: str
    new_password: str


# Patient Commands
@dataclass
class CreatePatientCommand:
    """Command to create a new patient"""
    user_id: str
    document_type: str
    document_number: str
    birth_date: date
    gender: str
    blood_type: str
    eps: str
    emergency_contact_name: str
    emergency_contact_phone: str
    address: Optional[str] = None
    city: Optional[str] = None


@dataclass
class UpdatePatientCommand:
    """Command to update patient information"""
    patient_id: str
    blood_type: Optional[str] = None
    eps: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None


# Paramedic Commands
@dataclass
class CreateParamedicCommand:
    """Command to create a new paramedic registration"""
    user_id: str
    medical_license: str
    specialty: str
    institution: str
    years_experience: int
    license_expiry_date: datetime


@dataclass
class ApproveParamedicCommand:
    """Command to approve a paramedic registration"""
    paramedic_id: str
    approved_by: str


@dataclass
class RejectParamedicCommand:
    """Command to reject a paramedic registration"""
    paramedic_id: str
    rejected_by: str
    reason: str


# Allergy Commands
@dataclass
class AddAllergyCommand:
    """Command to add an allergy to patient"""
    patient_id: str
    allergen: str
    severity: str
    symptoms: str
    treatment: Optional[str] = None
    diagnosed_date: Optional[datetime] = None
    notes: Optional[str] = None


@dataclass
class UpdateAllergyCommand:
    """Command to update an allergy"""
    allergy_id: str
    allergen: Optional[str] = None
    severity: Optional[str] = None
    symptoms: Optional[str] = None
    treatment: Optional[str] = None
    notes: Optional[str] = None


@dataclass
class RecordAllergyReactionCommand:
    """Command to record an allergic reaction"""
    allergy_id: str
    reaction_date: datetime
    symptoms: Optional[str] = None
    treatment_given: Optional[str] = None


# Illness Commands
@dataclass
class AddIllnessCommand:
    """Command to add an illness to patient"""
    patient_id: str
    name: str
    diagnosed_date: datetime
    cie10_code: Optional[str] = None
    symptoms: Optional[str] = None
    treatment: Optional[str] = None
    prescribed_by: Optional[str] = None
    notes: Optional[str] = None
    is_chronic: bool = False


@dataclass
class UpdateIllnessCommand:
    """Command to update an illness"""
    illness_id: str
    name: Optional[str] = None
    cie10_code: Optional[str] = None
    symptoms: Optional[str] = None
    treatment: Optional[str] = None
    prescribed_by: Optional[str] = None
    notes: Optional[str] = None


@dataclass
class UpdateIllnessStatusCommand:
    """Command to update illness status"""
    illness_id: str
    status: str


# Surgery Commands
@dataclass
class AddSurgeryCommand:
    """Command to add a surgery to patient"""
    patient_id: str
    name: str
    surgery_date: datetime
    surgeon: str
    hospital: str
    description: Optional[str] = None
    diagnosis: Optional[str] = None
    anesthesia_type: Optional[str] = None
    surgery_duration_minutes: Optional[int] = None
    notes: Optional[str] = None


@dataclass
class UpdateSurgeryCommand:
    """Command to update a surgery"""
    surgery_id: str
    name: Optional[str] = None
    surgeon: Optional[str] = None
    hospital: Optional[str] = None
    description: Optional[str] = None
    diagnosis: Optional[str] = None
    anesthesia_type: Optional[str] = None
    surgery_duration_minutes: Optional[int] = None
    notes: Optional[str] = None


@dataclass
class AddSurgeryComplicationCommand:
    """Command to add a surgical complication"""
    surgery_id: str
    complication: str


# QR Code Commands
@dataclass
class GeneratePatientQRCommand:
    """Command to generate QR code for patient"""
    patient_id: str
    expires_in_days: Optional[int] = None


__all__ = [
    'CreateUserCommand',
    'UpdateUserCommand', 
    'ChangePasswordCommand',
    'CreatePatientCommand',
    'UpdatePatientCommand',
    'CreateParamedicCommand',
    'ApproveParamedicCommand',
    'RejectParamedicCommand',
    'AddAllergyCommand',
    'UpdateAllergyCommand',
    'RecordAllergyReactionCommand',
    'AddIllnessCommand',
    'UpdateIllnessCommand',
    'UpdateIllnessStatusCommand',
    'AddSurgeryCommand',
    'UpdateSurgeryCommand',
    'AddSurgeryComplicationCommand',
    'GeneratePatientQRCommand'
]