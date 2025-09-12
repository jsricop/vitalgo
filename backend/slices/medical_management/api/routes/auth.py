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
import os
from passlib.context import CryptContext

from ...application.commands import CreateUserCommand, CreatePatientCommand, CreateParamedicCommand
from ...application.queries import ValidateUserCredentialsQuery, GetUserByEmailQuery
from ...application.handlers.patient_handlers import PatientCommandHandlers, PatientQueryHandlers
from slices.core.config import settings

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


class UpdateUserRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class EPSResponse(BaseModel):
    id: str
    name: str
    code: str
    regime_type: str
    status: str


# JWT configuration - using pydantic settings
SECRET_KEY = settings.secret_key

ALGORITHM = settings.algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = settings.access_token_expire_minutes

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


# Simple database operations (inline for now)
import hashlib
import uuid
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from datetime import datetime

# Database connection - using pydantic settings
DATABASE_URL = settings.database_url

# Convert asyncpg URL to psycopg2 format if needed for some libraries
if "postgresql+asyncpg://" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")

def get_db_connection():
    """Get database connection"""
    return psycopg2.connect(DATABASE_URL)

def hash_password(password: str) -> str:
    """Simple password hashing using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return hashlib.sha256(password.encode()).hexdigest() == hashed

class SimpleHandlers:
    """Simplified database handlers"""
    
    async def handle_create_user(self, command):
        conn = get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                user_id = str(uuid.uuid4())
                password_hash = hash_password(command.password)
                
                # Set status based on role - paramedics start inactive for approval
                status = "active" if command.role != "paramedic" else "inactive"
                
                cursor.execute("""
                    INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, status, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                    RETURNING id, email, first_name, last_name, role, status, created_at
                """, (user_id, command.email, password_hash, command.first_name, command.last_name, 
                      command.phone, command.role, status))
                
                user = cursor.fetchone()
                conn.commit()
                
                return {
                    "id": user["id"],
                    "email": user["email"],
                    "first_name": user["first_name"],
                    "last_name": user["last_name"],
                    "role": user["role"],
                    "is_active": user["status"] == "active",
                    "created_at": str(user["created_at"])
                }
                
        except Exception as e:
            conn.rollback()
            raise ValueError(f"Error creating user: {str(e)}")
        finally:
            conn.close()
    
    async def handle_create_patient(self, command):
        conn = get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                patient_id = str(uuid.uuid4())
                
                cursor.execute("""
                    INSERT INTO patients (id, user_id, document_type, document_number, birth_date, 
                                        gender, blood_type, eps, emergency_contact_name, 
                                        emergency_contact_phone, address, city, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                    RETURNING id, user_id, document_number, blood_type
                """, (patient_id, command.user_id, command.document_type, command.document_number,
                      command.birth_date, command.gender, command.blood_type, command.eps,
                      command.emergency_contact_name, command.emergency_contact_phone,
                      command.address, command.city))
                
                patient = cursor.fetchone()
                conn.commit()
                
                return {
                    "id": patient["id"],
                    "user_id": patient["user_id"],
                    "document_number": patient["document_number"],
                    "blood_type": patient["blood_type"]
                }
                
        except Exception as e:
            conn.rollback()
            raise ValueError(f"Error creating patient: {str(e)}")
        finally:
            conn.close()
    
    async def handle_validate_credentials(self, query):
        conn = get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("""
                    SELECT id, email, password_hash, first_name, last_name, phone, role, status, created_at
                    FROM users 
                    WHERE email = %s AND status = 'active'
                """, (query.email,))
                
                user = cursor.fetchone()
                if not user:
                    return None
                
                # Verify password
                if not verify_password(query.password, user["password_hash"]):
                    return None
                
                return {
                    "id": user["id"],
                    "email": user["email"],
                    "first_name": user["first_name"],
                    "last_name": user["last_name"],
                    "phone": user["phone"],
                    "role": user["role"],
                    "is_active": user["status"] == "active",
                    "created_at": str(user["created_at"])
                }
                
        except Exception as e:
            raise ValueError(f"Error validating credentials: {str(e)}")
        finally:
            conn.close()
    
    async def handle_get_user_by_id(self, query):
        conn = get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("""
                    SELECT id, email, first_name, last_name, phone, role, status, created_at
                    FROM users 
                    WHERE id = %s AND status = 'active'
                """, (query.user_id,))
                
                user = cursor.fetchone()
                if not user:
                    return None
                
                return {
                    "id": user["id"],
                    "email": user["email"],
                    "first_name": user["first_name"],
                    "last_name": user["last_name"],
                    "phone": user["phone"],
                    "role": user["role"],
                    "is_active": user["status"] == "active",
                    "created_at": str(user["created_at"])
                }
                
        except Exception as e:
            raise ValueError(f"Error getting user by ID: {str(e)}")
        finally:
            conn.close()

# Dependency injection
async def get_command_handlers():
    """Get command handlers instance"""
    return SimpleHandlers()


async def get_query_handlers():
    """Get query handlers instance"""  
    return SimpleHandlers()


@router.post("/register/patient", response_model=dict)
async def register_patient(
    request: PatientRegistrationRequest,
    command_handlers: SimpleHandlers = Depends(get_command_handlers)
):
    """Register a new patient"""
    try:
        # Validate EPS against database
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute("""
            SELECT COUNT(*) as count FROM eps 
            WHERE name = %s AND status = 'activa'
        """, (request.eps,))
        
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not result or result['count'] == 0:
            raise HTTPException(
                status_code=400, 
                detail=f"La EPS '{request.eps}' no es válida o no está activa. Por favor selecciona una EPS de la lista."
            )
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
            user_id=user_dto["id"],
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
    command_handlers: SimpleHandlers = Depends(get_command_handlers)
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
            user_id=user_dto["id"],
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
    query_handlers: SimpleHandlers = Depends(get_query_handlers)
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
        
        if not user_dto["is_active"]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is deactivated"
            )
        
        # Create access token
        access_token = create_access_token({
            "id": user_dto["id"],
            "email": user_dto["email"],
            "role": user_dto["role"]
        })
        
        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            user={
                "id": user_dto["id"],
                "email": user_dto["email"],
                "first_name": user_dto["first_name"],
                "last_name": user_dto["last_name"],
                "role": user_dto["role"]
            },
            role=user_dto["role"],
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    current_user: dict = Depends(verify_token)
):
    """Get current user information"""
    try:
        # Simple direct query instead of using handlers
        conn = get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("""
                    SELECT id, email, first_name, last_name, phone, role, status, created_at
                    FROM users 
                    WHERE id = %s AND status = 'active'
                """, (current_user["sub"],))
                
                user = cursor.fetchone()
                if not user:
                    raise HTTPException(status_code=404, detail="User not found")
                
                return UserResponse(
                    id=user["id"],
                    email=user["email"],
                    first_name=user["first_name"],
                    last_name=user["last_name"],
                    phone=user["phone"] or "",
                    role=user["role"],
                    is_active=user["status"] == "active",
                    created_at=str(user["created_at"])
                )
                
        finally:
            conn.close()
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/check-document", response_model=dict)
async def check_document_exists(
    document_type: str,
    document_number: str
):
    """Check if document already exists in the database"""
    try:
        conn = get_db_connection()
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT p.id, u.email, u.first_name, u.last_name
                FROM patients p
                JOIN users u ON p.user_id = u.id
                WHERE p.document_type = %s AND p.document_number = %s
            """, (document_type, document_number))
            
            patient = cur.fetchone()
            conn.close()
            
            if patient:
                return {
                    "exists": True,
                    "message": "Este número de documento ya está registrado en el sistema"
                }
            else:
                return {
                    "exists": False,
                    "message": "Documento disponible"
                }
                
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al verificar documento: {str(e)}"
        )

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


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    request: UpdateUserRequest,
    current_user: dict = Depends(verify_token)
):
    """Update user information"""
    try:
        # Check if user is updating their own profile or is admin
        if current_user["sub"] != user_id and current_user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Not authorized to update this user")
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Build update query dynamically based on provided fields
        update_fields = []
        params = []
        
        if request.first_name is not None:
            update_fields.append("first_name = %s")
            params.append(request.first_name)
            
        if request.last_name is not None:
            update_fields.append("last_name = %s")
            params.append(request.last_name)
            
        if request.email is not None:
            # Check if email already exists (for other users)
            cursor.execute("SELECT id FROM users WHERE email = %s AND id != %s", (request.email, user_id))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="Email already registered")
            update_fields.append("email = %s")
            params.append(request.email)
            
        if request.phone is not None:
            update_fields.append("phone = %s")
            params.append(request.phone)
            
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")
            
        # Add updated_at field
        update_fields.append("updated_at = CURRENT_TIMESTAMP")
        params.append(user_id)
        
        update_query = f"""
            UPDATE users 
            SET {', '.join(update_fields)}
            WHERE id = %s
            RETURNING id, email, first_name, last_name, phone, role, status, created_at
        """
        
        cursor.execute(update_query, params)
        updated_user = cursor.fetchone()
        
        if not updated_user:
            raise HTTPException(status_code=404, detail="User not found")
            
        conn.commit()
        cursor.close()
        conn.close()
        
        return UserResponse(
            id=updated_user["id"],
            email=updated_user["email"],
            first_name=updated_user["first_name"],
            last_name=updated_user["last_name"],
            phone=updated_user["phone"],
            role=updated_user["role"],
            is_active=updated_user["status"] == "active",
            created_at=str(updated_user["created_at"])
        )
        
    except HTTPException:
        raise
    except Exception as e:
        if 'conn' in locals():
            conn.rollback()
            cursor.close()
            conn.close()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/change-password", response_model=dict)
async def change_password(
    request: ChangePasswordRequest,
    current_user: dict = Depends(verify_token)
):
    """Change user password"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get current user data
        cursor.execute("SELECT password_hash FROM users WHERE id = %s", (current_user["sub"],))
        user_data = cursor.fetchone()
        
        if not user_data:
            raise HTTPException(status_code=404, detail="User not found")
            
        # Verify current password
        if not verify_password(request.current_password, user_data["password_hash"]):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
            
        # Hash new password
        new_password_hash = hash_password(request.new_password)
        
        # Update password
        cursor.execute("""
            UPDATE users 
            SET password_hash = %s, updated_at = CURRENT_TIMESTAMP 
            WHERE id = %s
        """, (new_password_hash, current_user["sub"]))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {"message": "Password changed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        if 'conn' in locals():
            conn.rollback()
            cursor.close()
            conn.close()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/eps", response_model=list[EPSResponse])
async def get_eps_list(
    regime_type: Optional[str] = None,
    status: str = "activa"
):
    """Get list of EPS (Entidades Promotoras de Salud) available in Colombia"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Base query
        query = "SELECT id, name, code, regime_type, status FROM eps WHERE status = %s"
        params = [status]
        
        # Add regime_type filter if provided
        if regime_type and regime_type in ["contributivo", "subsidiado", "ambos"]:
            query += " AND (regime_type = %s OR regime_type = 'ambos')"
            params.append(regime_type)
        
        query += " ORDER BY name ASC"
        
        cursor.execute(query, params)
        eps_list = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return [EPSResponse(
            id=eps["id"],
            name=eps["name"],
            code=eps["code"],
            regime_type=eps["regime_type"],
            status=eps["status"]
        ) for eps in eps_list]
        
    except Exception as e:
        if 'conn' in locals():
            cursor.close()
            conn.close()
        raise HTTPException(status_code=500, detail=f"Error retrieving EPS list: {str(e)}")


@router.get("/check-email")
async def check_email_exists(email: str):
    """Check if email already exists in the system"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute("""
            SELECT id, email, status 
            FROM users 
            WHERE email = %s
        """, (email.lower(),))
        
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        
        return {
            "exists": user is not None,
            "is_active": user["status"] == "active" if user else None,
            "email": email
        }
        
    except Exception as e:
        if 'conn' in locals():
            cursor.close()
            conn.close()
        raise HTTPException(status_code=500, detail=f"Error checking email: {str(e)}")


@router.get("/check-document")
async def check_document_exists(document_type: str, document_number: str):
    """Check if document already exists in the system"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute("""
            SELECT p.id, p.document_type, p.document_number, u.email, u.status
            FROM patients p
            JOIN users u ON p.user_id = u.id
            WHERE p.document_type = %s AND p.document_number = %s
        """, (document_type, document_number))
        
        patient = cursor.fetchone()
        cursor.close()
        conn.close()
        
        return {
            "exists": patient is not None,
            "document_type": document_type,
            "document_number": document_number,
            "is_active": patient["status"] == "active" if patient else None
        }
        
    except Exception as e:
        if 'conn' in locals():
            cursor.close()
            conn.close()
        raise HTTPException(status_code=500, detail=f"Error checking document: {str(e)}")