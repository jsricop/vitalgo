"""
Authentication routes for VitalGo Medical Management API

Handles user registration, login, and authentication operations.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, date, timedelta
import jwt
from passlib.context import CryptContext

from ...application.commands import CreateUserCommand, CreatePatientCommand, CreateParamedicCommand
from ...application.queries import ValidateUserCredentialsQuery, GetUserByEmailQuery
from ...application.handlers.patient_handlers import PatientCommandHandlers, PatientQueryHandlers

# Pydantic models for API
class UserRegistrationRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    phone: str
    role: str = "patient"  # Default role


class PatientRegistrationRequest(BaseModel):
    # User data
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    phone: str
    
    # Patient data
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


class ParamedicRegistrationRequest(BaseModel):
    # User data
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    phone: str
    
    # Paramedic data
    medical_license: str
    specialty: str
    institution: str
    years_experience: int
    license_expiry_date: datetime


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict
    role: str
    expires_in: int


class UserResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    phone: str
    role: str
    is_active: bool
    created_at: str


# JWT configuration
SECRET_KEY = "your-secret-key-change-in-production"  # Should be from environment
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security scheme
security = HTTPBearer()

# Router
router = APIRouter(prefix="/auth", tags=["authentication"])


def create_access_token(user_data: dict) -> str:
    """Create JWT access token"""
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {
        "sub": user_data["id"],
        "email": user_data["email"],
        "role": user_data["role"],
        "exp": expire
    }
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Verify JWT token and return user data"""
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return payload
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


# Mock implementations for testing
class MockCommandHandlers:
    async def handle_create_user(self, command):
        # Mock user creation
        from dataclasses import dataclass
        
        @dataclass
        class MockUserDto:
            id: str
            email: str
            first_name: str
            last_name: str
            role: str
        
        return MockUserDto(
            id="user_123",
            email=command.email,
            first_name=command.first_name,
            last_name=command.last_name,
            role=command.role
        )
    
    async def handle_create_patient(self, command):
        # Mock patient creation
        from dataclasses import dataclass
        
        @dataclass
        class MockPatientDto:
            id: str
            user_id: str
            document_number: str
            blood_type: str
        
        return MockPatientDto(
            id="patient_123",
            user_id=command.user_id,
            document_number=command.document_number,
            blood_type=command.blood_type
        )

class MockQueryHandlers:
    async def handle_validate_credentials(self, query):
        # Always return None for testing - login won't work but registration will
        return None

# Dependency injection placeholders
async def get_command_handlers():
    """Get command handlers instance"""
    return MockCommandHandlers()


async def get_query_handlers():
    """Get query handlers instance"""
    return MockQueryHandlers()


@router.post("/register/patient", response_model=dict)
async def register_patient(
    request: PatientRegistrationRequest,
    command_handlers: PatientCommandHandlers = Depends(get_command_handlers)
):
    """Register a new patient"""
    try:
        # Create user first
        user_command = CreateUserCommand(
            email=request.email,
            password=request.password,
            first_name=request.first_name,
            last_name=request.last_name,
            phone=request.phone,
            role="patient"
        )
        
        user_dto = await command_handlers.handle_create_user(user_command)
        
        # Create patient profile
        patient_command = CreatePatientCommand(
            user_id=user_dto.id,
            document_type=request.document_type,
            document_number=request.document_number,
            birth_date=request.birth_date,
            gender=request.gender,
            blood_type=request.blood_type,
            eps=request.eps,
            emergency_contact_name=request.emergency_contact_name,
            emergency_contact_phone=request.emergency_contact_phone,
            address=request.address,
            city=request.city
        )
        
        patient_dto = await command_handlers.handle_create_patient(patient_command)
        
        return {
            "message": "Patient registered successfully",
            "user": user_dto,
            "patient": patient_dto
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/register/paramedic", response_model=dict)
async def register_paramedic(
    request: ParamedicRegistrationRequest,
    command_handlers: PatientCommandHandlers = Depends(get_command_handlers)
):
    """Register a new paramedic"""
    try:
        # Create user first
        user_command = CreateUserCommand(
            email=request.email,
            password=request.password,
            first_name=request.first_name,
            last_name=request.last_name,
            phone=request.phone,
            role="paramedic"
        )
        
        user_dto = await command_handlers.handle_create_user(user_command)
        
        # Create paramedic profile
        paramedic_command = CreateParamedicCommand(
            user_id=user_dto.id,
            medical_license=request.medical_license,
            specialty=request.specialty,
            institution=request.institution,
            years_experience=request.years_experience,
            license_expiry_date=request.license_expiry_date
        )
        
        # Note: This would need a ParamedicCommandHandler in the actual implementation
        # paramedic_dto = await command_handlers.handle_create_paramedic(paramedic_command)
        
        return {
            "message": "Paramedic registration submitted for approval",
            "user": user_dto,
            "status": "PENDING"
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/login", response_model=LoginResponse)
async def login(
    request: LoginRequest,
    query_handlers: PatientQueryHandlers = Depends(get_query_handlers)
):
    """User login endpoint"""
    try:
        # Validate credentials
        validate_query = ValidateUserCredentialsQuery(
            email=request.email,
            password=request.password
        )
        
        user_dto = await query_handlers.handle_validate_credentials(validate_query)
        if not user_dto:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        if not user_dto.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is deactivated"
            )
        
        # Create access token
        access_token = create_access_token({
            "id": user_dto.id,
            "email": user_dto.email,
            "role": user_dto.role
        })
        
        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            user={
                "id": user_dto.id,
                "email": user_dto.email,
                "first_name": user_dto.first_name,
                "last_name": user_dto.last_name,
                "role": user_dto.role
            },
            role=user_dto.role,
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    current_user: dict = Depends(verify_token),
    query_handlers: PatientQueryHandlers = Depends(get_query_handlers)
):
    """Get current user information"""
    try:
        from ...application.queries import GetUserByIdQuery
        
        query = GetUserByIdQuery(user_id=current_user["sub"])
        user_dto = await query_handlers.handle_get_user_by_id(query)
        
        if not user_dto:
            raise HTTPException(status_code=404, detail="User not found")
        
        return UserResponse(
            id=user_dto.id,
            email=user_dto.email,
            first_name=user_dto.first_name,
            last_name=user_dto.last_name,
            phone=user_dto.phone,
            role=user_dto.role,
            is_active=user_dto.is_active,
            created_at=user_dto.created_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/refresh", response_model=dict)
async def refresh_token(current_user: dict = Depends(verify_token)):
    """Refresh access token"""
    try:
        # Create new token
        access_token = create_access_token({
            "id": current_user["sub"],
            "email": current_user["email"],
            "role": current_user["role"]
        })
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")