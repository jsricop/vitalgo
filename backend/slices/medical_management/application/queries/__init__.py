"""
CQRS Queries for Medical Management

Queries represent read operations that don't change the state of the system.
They are optimized for data retrieval and presentation.
"""

from dataclasses import dataclass
from typing import Optional, List, Dict, Any
from datetime import datetime


# User Queries
@dataclass
class GetUserByIdQuery:
    """Query to get user by ID"""
    user_id: str


@dataclass
class GetUserByEmailQuery:
    """Query to get user by email"""
    email: str


@dataclass
class ValidateUserCredentialsQuery:
    """Query to validate user login credentials"""
    email: str
    password: str


# Patient Queries
@dataclass
class GetPatientByIdQuery:
    """Query to get patient by ID"""
    patient_id: str


@dataclass
class GetPatientByUserIdQuery:
    """Query to get patient by user ID"""
    user_id: str


@dataclass
class GetPatientByDocumentQuery:
    """Query to get patient by document"""
    document_type: str
    document_number: str


@dataclass
class GetPatientMedicalSummaryQuery:
    """Query to get complete medical summary for a patient"""
    patient_id: str
    include_inactive: bool = False


@dataclass
class GetPatientEmergencyInfoQuery:
    """Query to get emergency information for QR code"""
    patient_id: str


# Paramedic Queries
@dataclass
class GetParamedicByIdQuery:
    """Query to get paramedic by ID"""
    paramedic_id: str


@dataclass
class GetParamedicByUserIdQuery:
    """Query to get paramedic by user ID"""
    user_id: str


@dataclass
class GetPendingParamedicsQuery:
    """Query to get paramedics pending approval"""
    pass


@dataclass
class GetApprovedParamedicsQuery:
    """Query to get approved paramedics"""
    pass


# Allergy Queries
@dataclass
class GetAllergyByIdQuery:
    """Query to get allergy by ID"""
    allergy_id: str


@dataclass
class GetPatientAllergiesQuery:
    """Query to get all allergies for a patient"""
    patient_id: str
    active_only: bool = True


@dataclass
class GetCriticalAllergiesQuery:
    """Query to get critical allergies for a patient"""
    patient_id: str


# Illness Queries
@dataclass
class GetIllnessByIdQuery:
    """Query to get illness by ID"""
    illness_id: str


@dataclass
class GetPatientIllnessesQuery:
    """Query to get all illnesses for a patient"""
    patient_id: str
    status_filter: Optional[str] = None


@dataclass
class GetPatientChronicIllnessesQuery:
    """Query to get chronic illnesses for a patient"""
    patient_id: str


@dataclass
class GetActiveIllnessesQuery:
    """Query to get active illnesses for a patient"""
    patient_id: str


# Surgery Queries
@dataclass
class GetSurgeryByIdQuery:
    """Query to get surgery by ID"""
    surgery_id: str


@dataclass
class GetPatientSurgeriesQuery:
    """Query to get all surgeries for a patient"""
    patient_id: str
    limit: Optional[int] = None


@dataclass
class GetRecentSurgeriesQuery:
    """Query to get recent surgeries for a patient"""
    patient_id: str
    days: int = 30


# QR Code Queries
@dataclass
class GetPatientQRCodeQuery:
    """Query to get active QR code for patient"""
    patient_id: str


@dataclass
class GetQRCodeDataQuery:
    """Query to get data from QR token"""
    qr_token: str


@dataclass
class ValidateQRAccessQuery:
    """Query to validate QR code access permissions"""
    qr_token: str
    user_id: Optional[str] = None
    user_role: Optional[str] = None


# Complex Queries
@dataclass
class GetMedicalTimelineQuery:
    """Query to get chronological medical timeline for patient"""
    patient_id: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


@dataclass
class GetPatientStatisticsQuery:
    """Query to get patient statistics"""
    patient_id: str


@dataclass
class SearchPatientsQuery:
    """Query to search patients by various criteria"""
    search_term: Optional[str] = None
    document_number: Optional[str] = None
    blood_type: Optional[str] = None
    eps: Optional[str] = None
    limit: int = 50
    offset: int = 0


# Response DTOs
@dataclass
class UserDTO:
    """User Data Transfer Object"""
    id: str
    email: str
    first_name: str
    last_name: str
    phone: str
    role: str
    is_active: bool
    created_at: str


@dataclass
class PatientDTO:
    """Patient Data Transfer Object"""
    id: str
    user: UserDTO
    document_type: str
    document_number: str
    birth_date: str
    age: int
    gender: str
    blood_type: str
    eps: str
    emergency_contact_name: str
    emergency_contact_phone: str
    address: Optional[str]
    city: Optional[str]


@dataclass
class MedicalSummaryDTO:
    """Complete medical summary DTO"""
    patient: PatientDTO
    allergies: List[Dict[str, Any]]
    illnesses: List[Dict[str, Any]]
    surgeries: List[Dict[str, Any]]
    statistics: Dict[str, Any]
    last_updated: str


@dataclass
class EmergencyInfoDTO:
    """Emergency information DTO for QR codes"""
    patient_name: str
    document: str
    age: int
    blood_type: str
    eps: str
    emergency_contact: str
    critical_allergies: List[Dict[str, Any]]
    chronic_illnesses: List[Dict[str, Any]]
    recent_surgeries: List[Dict[str, Any]]
    qr_generated_at: str


__all__ = [
    'GetUserByIdQuery',
    'GetUserByEmailQuery',
    'ValidateUserCredentialsQuery',
    'GetPatientByIdQuery',
    'GetPatientByUserIdQuery', 
    'GetPatientByDocumentQuery',
    'GetPatientMedicalSummaryQuery',
    'GetPatientEmergencyInfoQuery',
    'GetParamedicByIdQuery',
    'GetParamedicByUserIdQuery',
    'GetPendingParamedicsQuery',
    'GetApprovedParamedicsQuery',
    'GetAllergyByIdQuery',
    'GetPatientAllergiesQuery',
    'GetCriticalAllergiesQuery',
    'GetIllnessByIdQuery',
    'GetPatientIllnessesQuery',
    'GetPatientChronicIllnessesQuery',
    'GetActiveIllnessesQuery',
    'GetSurgeryByIdQuery',
    'GetPatientSurgeriesQuery',
    'GetRecentSurgeriesQuery',
    'GetPatientQRCodeQuery',
    'GetQRCodeDataQuery',
    'ValidateQRAccessQuery',
    'GetMedicalTimelineQuery',
    'GetPatientStatisticsQuery',
    'SearchPatientsQuery',
    'UserDTO',
    'PatientDTO',
    'MedicalSummaryDTO',
    'EmergencyInfoDTO'
]