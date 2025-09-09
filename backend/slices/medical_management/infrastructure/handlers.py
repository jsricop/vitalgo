"""
Real database handlers for VitalGo Medical Management
"""
from datetime import datetime
from sqlalchemy.orm import Session
import hashlib
from dataclasses import dataclass
from typing import Optional

from .database import get_db_context
from .models import User, Patient, Paramedic
from ..application.commands import CreateUserCommand, CreatePatientCommand, CreateParamedicCommand
from ..application.queries import ValidateUserCredentialsQuery, GetUserByEmailQuery

# Simple password hashing for testing
def hash_password(password: str) -> str:
    """Simple password hashing using SHA-256 (for testing purposes)"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return hashlib.sha256(password.encode()).hexdigest() == hashed


@dataclass
class UserDto:
    id: str
    email: str
    first_name: str
    last_name: str
    phone: str
    role: str
    is_active: bool
    created_at: str


@dataclass
class PatientDto:
    id: str
    user_id: str
    document_type: str
    document_number: str
    blood_type: str
    birth_date: str
    gender: str
    eps: str


@dataclass
class ParamedicDto:
    id: str
    user_id: str
    medical_license: str
    specialty: str
    institution: str
    years_experience: int
    is_approved: bool


class RealCommandHandlers:
    """Real database command handlers"""
    
    async def handle_create_user(self, command: CreateUserCommand) -> UserDto:
        """Create a new user in the database"""
        with get_db_context() as db:
            # Check if user already exists
            existing_user = db.query(User).filter(User.email == command.email).first()
            if existing_user:
                raise ValueError(f"User with email {command.email} already exists")
            
            # Hash password
            password_hash = hash_password(command.password)
            
            # Create user
            user = User(
                email=command.email,
                password_hash=password_hash,
                first_name=command.first_name,
                last_name=command.last_name,
                phone=command.phone,
                role=command.role
            )
            
            db.add(user)
            db.flush()  # Flush to get the ID
            
            return UserDto(
                id=user.id,
                email=user.email,
                first_name=user.first_name,
                last_name=user.last_name,
                phone=user.phone,
                role=user.role,
                is_active=user.is_active,
                created_at=user.created_at.isoformat() if user.created_at else ""
            )
    
    async def handle_create_patient(self, command: CreatePatientCommand) -> PatientDto:
        """Create a new patient profile in the database"""
        with get_db_context() as db:
            # Check if patient already exists
            existing_patient = db.query(Patient).filter(
                Patient.document_number == command.document_number
            ).first()
            if existing_patient:
                raise ValueError(f"Patient with document {command.document_number} already exists")
            
            # Create patient
            patient = Patient(
                user_id=command.user_id,
                document_type=command.document_type,
                document_number=command.document_number,
                birth_date=command.birth_date,
                gender=command.gender,
                blood_type=command.blood_type,
                eps=command.eps,
                emergency_contact_name=command.emergency_contact_name,
                emergency_contact_phone=command.emergency_contact_phone,
                address=command.address,
                city=command.city
            )
            
            db.add(patient)
            db.flush()  # Flush to get the ID
            
            return PatientDto(
                id=patient.id,
                user_id=patient.user_id,
                document_type=patient.document_type,
                document_number=patient.document_number,
                blood_type=patient.blood_type,
                birth_date=patient.birth_date.isoformat() if patient.birth_date else "",
                gender=patient.gender,
                eps=patient.eps
            )
    
    async def handle_create_paramedic(self, command: CreateParamedicCommand) -> ParamedicDto:
        """Create a new paramedic profile in the database"""
        with get_db_context() as db:
            # Check if paramedic already exists
            existing_paramedic = db.query(Paramedic).filter(
                Paramedic.medical_license == command.medical_license
            ).first()
            if existing_paramedic:
                raise ValueError(f"Paramedic with license {command.medical_license} already exists")
            
            # Create paramedic
            paramedic = Paramedic(
                user_id=command.user_id,
                medical_license=command.medical_license,
                specialty=command.specialty,
                institution=command.institution,
                years_experience=command.years_experience,
                license_expiry_date=command.license_expiry_date,
                is_approved=False  # Requires manual approval
            )
            
            db.add(paramedic)
            db.flush()  # Flush to get the ID
            
            return ParamedicDto(
                id=paramedic.id,
                user_id=paramedic.user_id,
                medical_license=paramedic.medical_license,
                specialty=paramedic.specialty,
                institution=paramedic.institution,
                years_experience=paramedic.years_experience,
                is_approved=paramedic.is_approved
            )


class RealQueryHandlers:
    """Real database query handlers"""
    
    async def handle_validate_credentials(self, query: ValidateUserCredentialsQuery) -> Optional[UserDto]:
        """Validate user credentials against the database"""
        with get_db_context() as db:
            user = db.query(User).filter(User.email == query.email).first()
            
            if not user:
                return None
                
            if not verify_password(query.password, user.password_hash):
                return None
                
            return UserDto(
                id=user.id,
                email=user.email,
                first_name=user.first_name,
                last_name=user.last_name,
                phone=user.phone,
                role=user.role,
                is_active=user.is_active,
                created_at=user.created_at.isoformat() if user.created_at else ""
            )
    
    async def handle_get_user_by_email(self, query: GetUserByEmailQuery) -> Optional[UserDto]:
        """Get user by email from the database"""
        with get_db_context() as db:
            user = db.query(User).filter(User.email == query.email).first()
            
            if not user:
                return None
                
            return UserDto(
                id=user.id,
                email=user.email,
                first_name=user.first_name,
                last_name=user.last_name,
                phone=user.phone,
                role=user.role,
                is_active=user.is_active,
                created_at=user.created_at.isoformat() if user.created_at else ""
            )
    
    async def handle_get_user_by_id(self, query) -> Optional[UserDto]:
        """Get user by ID from the database"""
        with get_db_context() as db:
            user = db.query(User).filter(User.id == query.user_id).first()
            
            if not user:
                return None
                
            return UserDto(
                id=user.id,
                email=user.email,
                first_name=user.first_name,
                last_name=user.last_name,
                phone=user.phone,
                role=user.role,
                is_active=user.is_active,
                created_at=user.created_at.isoformat() if user.created_at else ""
            )