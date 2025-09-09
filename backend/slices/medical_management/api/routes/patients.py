"""
Patient medical information routes for VitalGo Medical Management API

Handles CRUD operations for patient medical data including:
- Allergies
- Illnesses 
- Surgeries
- Medical summary
"""

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from ...application.commands import (
    AddAllergyCommand, UpdateAllergyCommand,
    AddIllnessCommand, UpdateIllnessCommand, UpdateIllnessStatusCommand,
    AddSurgeryCommand, UpdateSurgeryCommand, AddSurgeryComplicationCommand
)
from ...application.queries import (
    GetPatientByUserIdQuery, GetPatientMedicalSummaryQuery,
    GetPatientAllergiesQuery, GetPatientIllnessesQuery, GetPatientSurgeriesQuery
)
from ...application.handlers.patient_handlers import PatientCommandHandlers, PatientQueryHandlers

# Import auth verification from auth routes
from .auth import verify_token

# Pydantic models for API requests
class AllergyCreateRequest(BaseModel):
    allergen: str
    severity: str
    symptoms: str
    treatment: Optional[str] = None
    diagnosed_date: Optional[datetime] = None
    notes: Optional[str] = None


class AllergyUpdateRequest(BaseModel):
    allergen: Optional[str] = None
    severity: Optional[str] = None
    symptoms: Optional[str] = None
    treatment: Optional[str] = None
    notes: Optional[str] = None


class IllnessCreateRequest(BaseModel):
    name: str
    diagnosed_date: datetime
    cie10_code: Optional[str] = None
    symptoms: Optional[str] = None
    treatment: Optional[str] = None
    prescribed_by: Optional[str] = None
    notes: Optional[str] = None
    is_chronic: bool = False


class IllnessUpdateRequest(BaseModel):
    name: Optional[str] = None
    cie10_code: Optional[str] = None
    symptoms: Optional[str] = None
    treatment: Optional[str] = None
    prescribed_by: Optional[str] = None
    notes: Optional[str] = None


class IllnessStatusUpdateRequest(BaseModel):
    status: str  # ACTIVA, RESUELTA, CRONICA


class SurgeryCreateRequest(BaseModel):
    name: str
    surgery_date: datetime
    surgeon: str
    hospital: str
    description: Optional[str] = None
    diagnosis: Optional[str] = None
    anesthesia_type: Optional[str] = None
    surgery_duration_minutes: Optional[int] = None
    notes: Optional[str] = None


class SurgeryUpdateRequest(BaseModel):
    name: Optional[str] = None
    surgeon: Optional[str] = None
    hospital: Optional[str] = None
    description: Optional[str] = None
    diagnosis: Optional[str] = None
    anesthesia_type: Optional[str] = None
    surgery_duration_minutes: Optional[int] = None
    notes: Optional[str] = None


class ComplicationRequest(BaseModel):
    complication: str


class UpdatePatientProfileRequest(BaseModel):
    document_type: Optional[str] = None
    document_number: Optional[str] = None
    birth_date: Optional[datetime] = None
    gender: Optional[str] = None
    blood_type: Optional[str] = None
    eps: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None


# Router
router = APIRouter(prefix="/patients", tags=["patients"])

# Security scheme
security = HTTPBearer()

# Simple database operations (inline for now)
import hashlib
import uuid
import psycopg2
from psycopg2.extras import RealDictCursor
import os

# Database connection - SECURE VERSION
# Database connection - SECURE VERSION
# NEVER hardcode credentials - always use environment variables
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise EnvironmentError(
        "DATABASE_URL environment variable is required. "
        "Please set it before starting the application. "
        "Example: export DATABASE_URL='postgresql://user:password@host:port/database'"
    )

# Convert asyncpg URL to psycopg2 format if needed
if "postgresql+asyncpg://" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")

def get_db_connection():
    """Get database connection with security checks"""
    return psycopg2.connect(DATABASE_URL)

class SimpleQuery:
    """Simple query object"""
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)

class SimpleCommand:
    """Simple command object"""  
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)

class SimpleMedicalHandlers:
    """Simplified medical data handlers with security validations"""
    
    def _validate_string_input(self, value: str, field_name: str, max_length: int = 1000) -> str:
        """Validate and sanitize string input"""
        if not isinstance(value, str):
            raise ValueError(f"{field_name} must be a string")
        
        # Remove potential harmful characters
        sanitized = value.strip()
        
        if len(sanitized) > max_length:
            raise ValueError(f"{field_name} exceeds maximum length of {max_length}")
        
        # Basic SQL injection protection (psycopg2 handles parameterization)
        if any(keyword in sanitized.lower() for keyword in ['drop table', 'delete from', 'update ', 'insert into']):
            raise ValueError(f"Invalid content in {field_name}")
            
        return sanitized
    
    def _validate_uuid(self, value: str, field_name: str) -> str:
        """Validate UUID format"""
        try:
            uuid.UUID(value)
            return value
        except ValueError:
            raise ValueError(f"Invalid {field_name} format")
    
    async def handle_get_patient_by_user_id(self, query):
        # Validate input
        user_id = self._validate_uuid(query.user_id, "user_id")
        
        conn = get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("""
                    SELECT id, user_id, document_type, document_number, birth_date, 
                           gender, blood_type, eps, emergency_contact_name, emergency_contact_phone
                    FROM patients 
                    WHERE user_id = %s AND deleted_at IS NULL
                """, (user_id,))
                
                patient = cursor.fetchone()
                return dict(patient) if patient else None
                
        except Exception as e:
            # Log error securely without exposing sensitive data
            print(f"Database error in handle_get_patient_by_user_id: Patient lookup failed")
            raise ValueError("Error retrieving patient information")
        finally:
            conn.close()
    
    async def handle_add_allergy(self, command):
        # Validate inputs
        patient_id = self._validate_uuid(command.patient_id, "patient_id")
        allergen = self._validate_string_input(command.allergen, "allergen", 200)
        severity = self._validate_string_input(command.severity, "severity", 20)
        symptoms = self._validate_string_input(command.symptoms, "symptoms", 1000)
        treatment = self._validate_string_input(command.treatment or "", "treatment", 1000) if command.treatment else None
        notes = self._validate_string_input(command.notes or "", "notes", 1000) if command.notes else None
        
        conn = get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                allergy_id = str(uuid.uuid4())
                
                cursor.execute("""
                    INSERT INTO allergies (id, patient_id, allergen, severity, symptoms, 
                                         treatment, diagnosed_date, notes, is_active, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                    RETURNING id, allergen, severity, symptoms
                """, (allergy_id, patient_id, allergen, severity,
                      symptoms, treatment, command.diagnosed_date, 
                      notes, True))
                
                allergy = cursor.fetchone()
                conn.commit()
                
                return dict(allergy) if allergy else None
                
        except Exception as e:
            conn.rollback()
            # Log error securely without exposing sensitive data
            print(f"Database error in handle_add_allergy: Allergy creation failed")
            raise ValueError("Error creating allergy")
        finally:
            conn.close()
    
    async def handle_add_illness(self, command):
        conn = get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                illness_id = str(uuid.uuid4())
                
                cursor.execute("""
                    INSERT INTO illnesses (id, patient_id, name, cie10_code, status, diagnosed_date, 
                                         resolved_date, symptoms, treatment, prescribed_by, notes, 
                                         is_chronic, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                    RETURNING id, name, status, diagnosed_date
                """, (illness_id, command.patient_id, command.name, command.cie10_code,
                      'ACTIVA', command.diagnosed_date, None, command.symptoms, command.treatment,
                      command.prescribed_by, command.notes, command.is_chronic))
                
                illness = cursor.fetchone()
                conn.commit()
                
                return dict(illness) if illness else None
                
        except Exception as e:
            conn.rollback()
            # Log error securely without exposing sensitive data
            print(f"Database error in handle_add_illness: Illness creation failed")
            raise ValueError("Error creating illness")
        finally:
            conn.close()
    
    async def handle_add_surgery(self, command):
        conn = get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                surgery_id = str(uuid.uuid4())
                
                cursor.execute("""
                    INSERT INTO surgeries (id, patient_id, name, surgery_date, surgeon, hospital, 
                                         description, diagnosis, complications, recovery_notes, 
                                         anesthesia_type, surgery_duration_minutes, follow_up_required, 
                                         follow_up_date, notes, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                    RETURNING id, name, surgery_date, surgeon, hospital
                """, (surgery_id, command.patient_id, command.name, command.surgery_date,
                      command.surgeon, command.hospital, command.description, command.diagnosis,
                      None, None, command.anesthesia_type, command.surgery_duration_minutes,
                      False, None, command.notes))
                
                surgery = cursor.fetchone()
                conn.commit()
                
                return dict(surgery) if surgery else None
                
        except Exception as e:
            conn.rollback()
            # Log error securely without exposing sensitive data
            print(f"Database error in handle_add_surgery: Surgery creation failed")
            raise ValueError("Error creating surgery")
        finally:
            conn.close()

    # READ HANDLERS
    async def handle_get_patient_allergies(self, query):
        """Get all allergies for a patient"""
        conn = get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("""
                    SELECT id, allergen, severity, symptoms, treatment, diagnosed_date, 
                           last_reaction_date, notes, is_active, created_at, updated_at
                    FROM allergies 
                    WHERE patient_id = %s AND is_active = true AND deleted_at IS NULL
                    ORDER BY created_at DESC
                """, (query.patient_id,))
                
                allergies = cursor.fetchall()
                return [dict(allergy) for allergy in allergies]
                
        except Exception as e:
            print(f"Database error in handle_get_patient_allergies: {e}")
            raise ValueError("Error retrieving allergies")
        finally:
            conn.close()
    
    async def handle_get_patient_illnesses(self, query):
        """Get all illnesses for a patient"""
        conn = get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("""
                    SELECT id, name, status, diagnosed_date, cie10_code, symptoms, 
                           treatment, prescribed_by, is_chronic, notes, created_at, updated_at
                    FROM illnesses 
                    WHERE patient_id = %s AND deleted_at IS NULL
                    ORDER BY created_at DESC
                """, (query.patient_id,))
                
                illnesses = cursor.fetchall()
                return [dict(illness) for illness in illnesses]
                
        except Exception as e:
            print(f"Database error in handle_get_patient_illnesses: {e}")
            raise ValueError("Error retrieving illnesses")
        finally:
            conn.close()
    
    async def handle_get_patient_surgeries(self, query):
        """Get all surgeries for a patient"""
        conn = get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("""
                    SELECT id, name, surgery_date, surgeon, hospital, description, 
                           diagnosis, complications, recovery_notes, anesthesia_type, 
                           surgery_duration_minutes, follow_up_required, follow_up_date, 
                           notes, created_at, updated_at
                    FROM surgeries 
                    WHERE patient_id = %s AND deleted_at IS NULL
                    ORDER BY surgery_date DESC
                """, (query.patient_id,))
                
                surgeries = cursor.fetchall()
                return [dict(surgery) for surgery in surgeries]
                
        except Exception as e:
            print(f"Database error in handle_get_patient_surgeries: {e}")
            raise ValueError("Error retrieving surgeries")
        finally:
            conn.close()

    # UPDATE HANDLERS
    async def handle_update_allergy(self, command):
        """Update an existing allergy"""
        conn = get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                # Build update query dynamically based on provided fields
                update_fields = []
                params = []
                
                if command.allergen:
                    update_fields.append("allergen = %s")
                    params.append(self._validate_string_input(command.allergen, "allergen", 200))
                
                if command.severity:
                    update_fields.append("severity = %s")
                    params.append(self._validate_string_input(command.severity, "severity", 20))
                
                if command.symptoms:
                    update_fields.append("symptoms = %s")
                    params.append(self._validate_string_input(command.symptoms, "symptoms", 1000))
                
                if command.treatment:
                    update_fields.append("treatment = %s")
                    params.append(self._validate_string_input(command.treatment, "treatment", 1000))
                
                if command.notes:
                    update_fields.append("notes = %s")
                    params.append(self._validate_string_input(command.notes, "notes", 1000))
                
                if not update_fields:
                    raise ValueError("No fields to update")
                
                # Add updated_at field
                update_fields.append("updated_at = NOW()")
                params.extend([command.allergy_id, command.patient_id])
                
                query_sql = f"""
                    UPDATE allergies 
                    SET {', '.join(update_fields)}
                    WHERE id = %s AND patient_id = %s AND deleted_at IS NULL
                    RETURNING id, allergen, severity, symptoms, treatment, notes
                """
                
                cursor.execute(query_sql, params)
                updated_allergy = cursor.fetchone()
                
                if not updated_allergy:
                    raise ValueError("Allergy not found or unauthorized")
                
                conn.commit()
                return dict(updated_allergy)
                
        except Exception as e:
            conn.rollback()
            print(f"Database error in handle_update_allergy: {e}")
            raise ValueError("Error updating allergy")
        finally:
            conn.close()
    
    async def handle_update_illness(self, command):
        """Update an existing illness"""
        conn = get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                # Build update query dynamically
                update_fields = []
                params = []
                
                if command.name:
                    update_fields.append("name = %s")
                    params.append(self._validate_string_input(command.name, "name", 200))
                
                if command.cie10_code:
                    update_fields.append("cie10_code = %s")
                    params.append(self._validate_string_input(command.cie10_code, "cie10_code", 10))
                
                if command.symptoms:
                    update_fields.append("symptoms = %s")
                    params.append(self._validate_string_input(command.symptoms, "symptoms", 1000))
                
                if command.treatment:
                    update_fields.append("treatment = %s")
                    params.append(self._validate_string_input(command.treatment, "treatment", 1000))
                
                if command.prescribed_by:
                    update_fields.append("prescribed_by = %s")
                    params.append(self._validate_string_input(command.prescribed_by, "prescribed_by", 200))
                
                if command.notes:
                    update_fields.append("notes = %s")
                    params.append(self._validate_string_input(command.notes, "notes", 1000))
                
                if not update_fields:
                    raise ValueError("No fields to update")
                
                # Add updated_at field
                update_fields.append("updated_at = NOW()")
                params.extend([command.illness_id, command.patient_id])
                
                query_sql = f"""
                    UPDATE illnesses 
                    SET {', '.join(update_fields)}
                    WHERE id = %s AND patient_id = %s AND deleted_at IS NULL
                    RETURNING id, name, status, diagnosed_date, cie10_code, treatment
                """
                
                cursor.execute(query_sql, params)
                updated_illness = cursor.fetchone()
                
                if not updated_illness:
                    raise ValueError("Illness not found or unauthorized")
                
                conn.commit()
                return dict(updated_illness)
                
        except Exception as e:
            conn.rollback()
            print(f"Database error in handle_update_illness: {e}")
            raise ValueError("Error updating illness")
        finally:
            conn.close()
    
    async def handle_update_illness_status(self, command):
        """Update illness status"""
        conn = get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("""
                    UPDATE illnesses 
                    SET status = %s, updated_at = NOW()
                    WHERE id = %s AND patient_id = %s AND deleted_at IS NULL
                    RETURNING id, name, status
                """, (command.status, command.illness_id, command.patient_id))
                
                updated_illness = cursor.fetchone()
                
                if not updated_illness:
                    raise ValueError("Illness not found or unauthorized")
                
                conn.commit()
                return dict(updated_illness)
                
        except Exception as e:
            conn.rollback()
            print(f"Database error in handle_update_illness_status: {e}")
            raise ValueError("Error updating illness status")
        finally:
            conn.close()
    
    async def handle_update_surgery(self, command):
        """Update an existing surgery"""
        conn = get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                # Build update query dynamically
                update_fields = []
                params = []
                
                if command.name:
                    update_fields.append("name = %s")
                    params.append(self._validate_string_input(command.name, "name", 200))
                
                if command.surgeon:
                    update_fields.append("surgeon = %s")
                    params.append(self._validate_string_input(command.surgeon, "surgeon", 200))
                
                if command.hospital:
                    update_fields.append("hospital = %s")
                    params.append(self._validate_string_input(command.hospital, "hospital", 200))
                
                if command.description:
                    update_fields.append("description = %s")
                    params.append(self._validate_string_input(command.description, "description", 1000))
                
                if command.diagnosis:
                    update_fields.append("diagnosis = %s")
                    params.append(self._validate_string_input(command.diagnosis, "diagnosis", 1000))
                
                if command.anesthesia_type:
                    update_fields.append("anesthesia_type = %s")
                    params.append(self._validate_string_input(command.anesthesia_type, "anesthesia_type", 100))
                
                if command.surgery_duration_minutes:
                    update_fields.append("surgery_duration_minutes = %s")
                    params.append(command.surgery_duration_minutes)
                
                if command.notes:
                    update_fields.append("notes = %s")
                    params.append(self._validate_string_input(command.notes, "notes", 1000))
                
                if not update_fields:
                    raise ValueError("No fields to update")
                
                # Add updated_at field
                update_fields.append("updated_at = NOW()")
                params.extend([command.surgery_id, command.patient_id])
                
                query_sql = f"""
                    UPDATE surgeries 
                    SET {', '.join(update_fields)}
                    WHERE id = %s AND patient_id = %s AND deleted_at IS NULL
                    RETURNING id, name, surgery_date, surgeon, hospital, notes
                """
                
                cursor.execute(query_sql, params)
                updated_surgery = cursor.fetchone()
                
                if not updated_surgery:
                    raise ValueError("Surgery not found or unauthorized")
                
                conn.commit()
                return dict(updated_surgery)
                
        except Exception as e:
            conn.rollback()
            print(f"Database error in handle_update_surgery: {e}")
            raise ValueError("Error updating surgery")
        finally:
            conn.close()
    
    async def handle_add_surgery_complication(self, command):
        """Add complication to surgery"""
        conn = get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                # Get current complications and append new one
                cursor.execute("SELECT complications FROM surgeries WHERE id = %s AND patient_id = %s", 
                             (command.surgery_id, command.patient_id))
                surgery = cursor.fetchone()
                
                if not surgery:
                    raise ValueError("Surgery not found or unauthorized")
                
                current_complications = surgery['complications'] if surgery['complications'] else ""
                new_complication = self._validate_string_input(command.complication, "complication", 500)
                
                # Append new complication
                if current_complications:
                    updated_complications = f"{current_complications}; {new_complication}"
                else:
                    updated_complications = new_complication
                
                cursor.execute("""
                    UPDATE surgeries 
                    SET complications = %s, updated_at = NOW()
                    WHERE id = %s AND patient_id = %s
                    RETURNING id, name, complications
                """, (updated_complications, command.surgery_id, command.patient_id))
                
                updated_surgery = cursor.fetchone()
                conn.commit()
                return dict(updated_surgery)
                
        except Exception as e:
            conn.rollback()
            print(f"Database error in handle_add_surgery_complication: {e}")
            raise ValueError("Error adding surgery complication")
        finally:
            conn.close()

    async def handle_delete_allergy(self, allergy_id: str, patient_id: str):
        """Delete an allergy (soft delete)"""
        conn = get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                # Verify allergy exists and belongs to patient
                cursor.execute("""
                    SELECT id, allergen, severity 
                    FROM allergies 
                    WHERE id = %s AND patient_id = %s AND is_active = true AND deleted_at IS NULL
                """, (allergy_id, patient_id))
                
                allergy = cursor.fetchone()
                if not allergy:
                    raise ValueError("Allergy not found or already deleted")
                
                # Soft delete
                cursor.execute("""
                    UPDATE allergies 
                    SET is_active = false, deleted_at = NOW(), updated_at = NOW()
                    WHERE id = %s AND patient_id = %s
                    RETURNING id, allergen
                """, (allergy_id, patient_id))
                
                deleted_allergy = cursor.fetchone()
                conn.commit()
                return dict(deleted_allergy)
                
        except Exception as e:
            conn.rollback()
            print(f"Database error in handle_delete_allergy: {e}")
            raise ValueError("Error deleting allergy")
        finally:
            conn.close()

    async def handle_delete_illness(self, illness_id: str, patient_id: str):
        """Delete an illness (soft delete)"""
        conn = get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                # Verify illness exists and belongs to patient
                cursor.execute("""
                    SELECT id, name, status 
                    FROM illnesses 
                    WHERE id = %s AND patient_id = %s AND deleted_at IS NULL
                """, (illness_id, patient_id))
                
                illness = cursor.fetchone()
                if not illness:
                    raise ValueError("Illness not found or already deleted")
                
                # Soft delete
                cursor.execute("""
                    UPDATE illnesses 
                    SET deleted_at = NOW(), updated_at = NOW()
                    WHERE id = %s AND patient_id = %s
                    RETURNING id, name
                """, (illness_id, patient_id))
                
                deleted_illness = cursor.fetchone()
                conn.commit()
                return dict(deleted_illness)
                
        except Exception as e:
            conn.rollback()
            print(f"Database error in handle_delete_illness: {e}")
            raise ValueError("Error deleting illness")
        finally:
            conn.close()

    async def handle_delete_surgery(self, surgery_id: str, patient_id: str):
        """Delete a surgery (soft delete)"""
        conn = get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                # Verify surgery exists and belongs to patient
                cursor.execute("""
                    SELECT id, name, surgery_date 
                    FROM surgeries 
                    WHERE id = %s AND patient_id = %s AND deleted_at IS NULL
                """, (surgery_id, patient_id))
                
                surgery = cursor.fetchone()
                if not surgery:
                    raise ValueError("Surgery not found or already deleted")
                
                # Soft delete
                cursor.execute("""
                    UPDATE surgeries 
                    SET deleted_at = NOW(), updated_at = NOW()
                    WHERE id = %s AND patient_id = %s
                    RETURNING id, name
                """, (surgery_id, patient_id))
                
                deleted_surgery = cursor.fetchone()
                conn.commit()
                return dict(deleted_surgery)
                
        except Exception as e:
            conn.rollback()
            print(f"Database error in handle_delete_surgery: {e}")
            raise ValueError("Error deleting surgery")
        finally:
            conn.close()

# Dependency injection
async def get_command_handlers():
    """Get command handlers instance"""
    return SimpleMedicalHandlers()

async def get_query_handlers():
    """Get query handlers instance"""
    return SimpleMedicalHandlers()


def require_patient_role(current_user: dict = Depends(verify_token)) -> dict:
    """Verify user has patient role"""
    if current_user["role"] != "patient":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can access this endpoint"
        )
    return current_user


def require_patient_or_paramedic_role(current_user: dict = Depends(verify_token)) -> dict:
    """Verify user has patient or paramedic role"""
    if current_user["role"] not in ["patient", "paramedic"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients or paramedics can access this endpoint"
        )
    return current_user


@router.get("/me/summary")
async def get_my_medical_summary(
    current_user: dict = Depends(require_patient_role),
    query_handlers: PatientQueryHandlers = Depends(get_query_handlers)
):
    """Get complete medical summary for current patient"""
    try:
        # Get patient by user ID
        patient_query = GetPatientByUserIdQuery(user_id=current_user["sub"])
        patient = await query_handlers.handle_get_patient_by_user_id(patient_query)
        
        if not patient:
            raise HTTPException(status_code=404, detail="Patient profile not found")
        
        # Get medical summary
        summary_query = GetPatientMedicalSummaryQuery(
            patient_id=patient["id"],
            include_inactive=True
        )
        summary = await query_handlers.handle_get_patient_medical_summary(summary_query)
        
        return summary
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


# ALLERGY ENDPOINTS
@router.post("/me/allergies")
async def add_allergy(
    request: AllergyCreateRequest,
    current_user: dict = Depends(require_patient_role),
    command_handlers: SimpleMedicalHandlers = Depends(get_command_handlers),
    query_handlers: SimpleMedicalHandlers = Depends(get_query_handlers)
):
    """Add new allergy to patient record"""
    try:
        # Get patient
        patient_query = SimpleQuery(user_id=current_user["sub"])
        patient = await query_handlers.handle_get_patient_by_user_id(patient_query)
        
        if not patient:
            raise HTTPException(status_code=404, detail="Patient profile not found")
        
        # Create allergy
        command = SimpleCommand(
            patient_id=patient["id"],
            allergen=request.allergen,
            severity=request.severity,
            symptoms=request.symptoms,
            treatment=request.treatment,
            diagnosed_date=request.diagnosed_date,
            notes=request.notes
        )
        
        result = await command_handlers.handle_add_allergy(command)
        return {
            "message": "Allergy added successfully",
            "allergy": result
        }
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/me/allergies")
async def get_my_allergies(
    current_user: dict = Depends(require_patient_role),
    query_handlers: PatientQueryHandlers = Depends(get_query_handlers)
):
    """Get all allergies for current patient"""
    try:
        patient_query = GetPatientByUserIdQuery(user_id=current_user["sub"])
        patient = await query_handlers.handle_get_patient_by_user_id(patient_query)
        
        if not patient:
            raise HTTPException(status_code=404, detail="Patient profile not found")
        
        allergies_query = GetPatientAllergiesQuery(patient_id=patient["id"])
        allergies = await query_handlers.handle_get_patient_allergies(allergies_query)
        
        return {"allergies": allergies}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/me/allergies/{allergy_id}")
async def update_allergy(
    allergy_id: str,
    request: AllergyUpdateRequest,
    current_user: dict = Depends(require_patient_role),
    command_handlers: PatientCommandHandlers = Depends(get_command_handlers)
):
    """Update existing allergy"""
    try:
        # Get patient ID from current user
        patient_query = GetPatientByUserIdQuery(user_id=current_user["sub"])
        patient = await command_handlers.handle_get_patient_by_user_id(patient_query)
        
        if not patient:
            raise HTTPException(status_code=404, detail="Patient profile not found")
        
        command = UpdateAllergyCommand(
            allergy_id=allergy_id,
            patient_id=patient["id"],
            allergen=request.allergen,
            severity=request.severity,
            symptoms=request.symptoms,
            treatment=request.treatment,
            notes=request.notes
        )
        
        result = await command_handlers.handle_update_allergy(command)
        return {
            "message": "Allergy updated successfully",
            "allergy": result
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


# ILLNESS ENDPOINTS
@router.post("/me/illnesses")
async def add_illness(
    request: IllnessCreateRequest,
    current_user: dict = Depends(require_patient_role),
    command_handlers: SimpleMedicalHandlers = Depends(get_command_handlers),
    query_handlers: SimpleMedicalHandlers = Depends(get_query_handlers)
):
    """Add new illness to patient record"""
    try:
        patient_query = SimpleQuery(user_id=current_user["sub"])
        patient = await query_handlers.handle_get_patient_by_user_id(patient_query)
        
        if not patient:
            raise HTTPException(status_code=404, detail="Patient profile not found")
        
        command = SimpleCommand(
            patient_id=patient["id"],
            name=request.name,
            diagnosed_date=request.diagnosed_date,
            cie10_code=request.cie10_code,
            symptoms=request.symptoms,
            treatment=request.treatment,
            prescribed_by=request.prescribed_by,
            notes=request.notes,
            is_chronic=request.is_chronic
        )
        
        result = await command_handlers.handle_add_illness(command)
        return {
            "message": "Illness added successfully", 
            "illness": result
        }
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/me/illnesses")
async def get_my_illnesses(
    current_user: dict = Depends(require_patient_role),
    query_handlers: PatientQueryHandlers = Depends(get_query_handlers)
):
    """Get all illnesses for current patient"""
    try:
        patient_query = GetPatientByUserIdQuery(user_id=current_user["sub"])
        patient = await query_handlers.handle_get_patient_by_user_id(patient_query)
        
        if not patient:
            raise HTTPException(status_code=404, detail="Patient profile not found")
        
        illnesses_query = GetPatientIllnessesQuery(patient_id=patient["id"])
        illnesses = await query_handlers.handle_get_patient_illnesses(illnesses_query)
        
        return {"illnesses": illnesses}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/me/illnesses/{illness_id}")
async def update_illness(
    illness_id: str,
    request: IllnessUpdateRequest,
    current_user: dict = Depends(require_patient_role),
    command_handlers: PatientCommandHandlers = Depends(get_command_handlers)
):
    """Update existing illness"""
    try:
        # Get patient ID from current user
        patient_query = GetPatientByUserIdQuery(user_id=current_user["sub"])
        patient = await command_handlers.handle_get_patient_by_user_id(patient_query)
        
        if not patient:
            raise HTTPException(status_code=404, detail="Patient profile not found")
        
        command = UpdateIllnessCommand(
            illness_id=illness_id,
            patient_id=patient["id"],
            name=request.name,
            cie10_code=request.cie10_code,
            symptoms=request.symptoms,
            treatment=request.treatment,
            prescribed_by=request.prescribed_by,
            notes=request.notes
        )
        
        result = await command_handlers.handle_update_illness(command)
        return {
            "message": "Illness updated successfully",
            "illness": result
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/me/illnesses/{illness_id}/status")
async def update_illness_status(
    illness_id: str,
    request: IllnessStatusUpdateRequest,
    current_user: dict = Depends(require_patient_role),
    command_handlers: PatientCommandHandlers = Depends(get_command_handlers)
):
    """Update illness status"""
    try:
        # Get patient ID from current user
        patient_query = GetPatientByUserIdQuery(user_id=current_user["sub"])
        patient = await command_handlers.handle_get_patient_by_user_id(patient_query)
        
        if not patient:
            raise HTTPException(status_code=404, detail="Patient profile not found")
        
        command = UpdateIllnessStatusCommand(
            illness_id=illness_id,
            patient_id=patient["id"],
            status=request.status
        )
        
        result = await command_handlers.handle_update_illness_status(command)
        return {
            "message": "Illness status updated successfully",
            "illness": result
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


# SURGERY ENDPOINTS
@router.post("/me/surgeries")
async def add_surgery(
    request: SurgeryCreateRequest,
    current_user: dict = Depends(require_patient_role),
    command_handlers: SimpleMedicalHandlers = Depends(get_command_handlers),
    query_handlers: SimpleMedicalHandlers = Depends(get_query_handlers)
):
    """Add new surgery to patient record"""
    try:
        patient_query = SimpleQuery(user_id=current_user["sub"])
        patient = await query_handlers.handle_get_patient_by_user_id(patient_query)
        
        if not patient:
            raise HTTPException(status_code=404, detail="Patient profile not found")
        
        command = SimpleCommand(
            patient_id=patient["id"],
            name=request.name,
            surgery_date=request.surgery_date,
            surgeon=request.surgeon,
            hospital=request.hospital,
            description=request.description,
            diagnosis=request.diagnosis,
            anesthesia_type=request.anesthesia_type,
            surgery_duration_minutes=request.surgery_duration_minutes,
            notes=request.notes
        )
        
        result = await command_handlers.handle_add_surgery(command)
        return {
            "message": "Surgery added successfully",
            "surgery": result
        }
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/me/surgeries")
async def get_my_surgeries(
    current_user: dict = Depends(require_patient_role),
    query_handlers: PatientQueryHandlers = Depends(get_query_handlers)
):
    """Get all surgeries for current patient"""
    try:
        patient_query = GetPatientByUserIdQuery(user_id=current_user["sub"])
        patient = await query_handlers.handle_get_patient_by_user_id(patient_query)
        
        if not patient:
            raise HTTPException(status_code=404, detail="Patient profile not found")
        
        surgeries_query = GetPatientSurgeriesQuery(patient_id=patient["id"])
        surgeries = await query_handlers.handle_get_patient_surgeries(surgeries_query)
        
        return {"surgeries": surgeries}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/me/surgeries/{surgery_id}")
async def update_surgery(
    surgery_id: str,
    request: SurgeryUpdateRequest,
    current_user: dict = Depends(require_patient_role),
    command_handlers: PatientCommandHandlers = Depends(get_command_handlers)
):
    """Update existing surgery"""
    try:
        # Get patient ID from current user
        patient_query = GetPatientByUserIdQuery(user_id=current_user["sub"])
        patient = await command_handlers.handle_get_patient_by_user_id(patient_query)
        
        if not patient:
            raise HTTPException(status_code=404, detail="Patient profile not found")
        
        command = UpdateSurgeryCommand(
            surgery_id=surgery_id,
            patient_id=patient["id"],
            name=request.name,
            surgeon=request.surgeon,
            hospital=request.hospital,
            description=request.description,
            diagnosis=request.diagnosis,
            anesthesia_type=request.anesthesia_type,
            surgery_duration_minutes=request.surgery_duration_minutes,
            notes=request.notes
        )
        
        result = await command_handlers.handle_update_surgery(command)
        return {
            "message": "Surgery updated successfully",
            "surgery": result
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/me/surgeries/{surgery_id}/complications")
async def add_surgery_complication(
    surgery_id: str,
    request: ComplicationRequest,
    current_user: dict = Depends(require_patient_role),
    command_handlers: PatientCommandHandlers = Depends(get_command_handlers)
):
    """Add complication to surgery"""
    try:
        # Get patient ID from current user
        patient_query = GetPatientByUserIdQuery(user_id=current_user["sub"])
        patient = await command_handlers.handle_get_patient_by_user_id(patient_query)
        
        if not patient:
            raise HTTPException(status_code=404, detail="Patient profile not found")
        
        command = AddSurgeryComplicationCommand(
            surgery_id=surgery_id,
            patient_id=patient["id"],
            complication=request.complication
        )
        
        result = await command_handlers.handle_add_surgery_complication(command)
        return {
            "message": "Complication added successfully",
            "surgery": result
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


# DELETE ENDPOINTS
@router.delete("/me/allergies/{allergy_id}")
async def delete_allergy(
    allergy_id: str,
    current_user: dict = Depends(require_patient_role),
    command_handlers: PatientCommandHandlers = Depends(get_command_handlers)
):
    """Delete an allergy (soft delete)"""
    try:
        # Get patient ID from current user
        patient_query = GetPatientByUserIdQuery(user_id=current_user["sub"])
        patient = await command_handlers.handle_get_patient_by_user_id(patient_query)
        
        if not patient:
            raise HTTPException(status_code=404, detail="Patient profile not found")
        
        result = await command_handlers.handle_delete_allergy(allergy_id, patient["id"])
        return {
            "message": "Allergy deleted successfully",
            "allergy_id": allergy_id
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/me/illnesses/{illness_id}")
async def delete_illness(
    illness_id: str,
    current_user: dict = Depends(require_patient_role),
    command_handlers: PatientCommandHandlers = Depends(get_command_handlers)
):
    """Delete an illness (soft delete)"""
    try:
        # Get patient ID from current user
        patient_query = GetPatientByUserIdQuery(user_id=current_user["sub"])
        patient = await command_handlers.handle_get_patient_by_user_id(patient_query)
        
        if not patient:
            raise HTTPException(status_code=404, detail="Patient profile not found")
        
        result = await command_handlers.handle_delete_illness(illness_id, patient["id"])
        return {
            "message": "Illness deleted successfully",
            "illness_id": illness_id
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/me/surgeries/{surgery_id}")
async def delete_surgery(
    surgery_id: str,
    current_user: dict = Depends(require_patient_role),
    command_handlers: PatientCommandHandlers = Depends(get_command_handlers)
):
    """Delete a surgery (soft delete)"""
    try:
        # Get patient ID from current user
        patient_query = GetPatientByUserIdQuery(user_id=current_user["sub"])
        patient = await command_handlers.handle_get_patient_by_user_id(patient_query)
        
        if not patient:
            raise HTTPException(status_code=404, detail="Patient profile not found")
        
        result = await command_handlers.handle_delete_surgery(surgery_id, patient["id"])
        return {
            "message": "Surgery deleted successfully",
            "surgery_id": surgery_id
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


# PATIENT PROFILE ENDPOINTS
@router.get("/{patient_id}")
async def get_patient_profile(
    patient_id: str,
    current_user: dict = Depends(verify_token)
):
    """Get patient basic profile data"""
    try:
        # For now, we'll use direct database access since the handlers aren't fully implemented
        import psycopg2
        from psycopg2.extras import RealDictCursor
        import os
        
        DATABASE_URL = os.getenv("DATABASE_URL")
        if not DATABASE_URL:
            raise EnvironmentError("DATABASE_URL environment variable is required")
        # Convert asyncpg URL to psycopg2 format if needed
        if "postgresql+asyncpg://" in DATABASE_URL:
            DATABASE_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get patient data
        cursor.execute("""
            SELECT p.*, u.first_name, u.last_name, u.email, u.phone 
            FROM patients p
            JOIN users u ON p.user_id = u.id
            WHERE u.id = %s
        """, (patient_id,))
        
        patient_data = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not patient_data:
            raise HTTPException(status_code=404, detail="Patient not found")
            
        return {
            "id": patient_data["user_id"],
            "first_name": patient_data["first_name"],
            "last_name": patient_data["last_name"],
            "email": patient_data["email"],
            "phone": patient_data["phone"],
            "document_type": patient_data["document_type"],
            "document_number": patient_data["document_number"],
            "birth_date": patient_data["birth_date"].isoformat() if patient_data["birth_date"] else None,
            "gender": patient_data["gender"],
            "blood_type": patient_data["blood_type"],
            "eps": patient_data["eps"],
            "emergency_contact_name": patient_data["emergency_contact_name"],
            "emergency_contact_phone": patient_data["emergency_contact_phone"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        if 'conn' in locals():
            cursor.close()
            conn.close()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/{patient_id}")
async def update_patient_profile(
    patient_id: str,
    request: UpdatePatientProfileRequest,
    current_user: dict = Depends(verify_token)
):
    """Update patient profile data"""
    try:
        # Check authorization - user can only update their own profile
        if current_user["sub"] != patient_id and current_user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Not authorized to update this profile")
            
        import psycopg2
        from psycopg2.extras import RealDictCursor
        import os
        
        DATABASE_URL = os.getenv("DATABASE_URL")
        if not DATABASE_URL:
            raise EnvironmentError("DATABASE_URL environment variable is required")
        # Convert asyncpg URL to psycopg2 format if needed
        if "postgresql+asyncpg://" in DATABASE_URL:
            DATABASE_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Build update query dynamically based on provided fields
        update_fields = []
        params = []
        
        if request.document_type is not None:
            update_fields.append("document_type = %s")
            params.append(request.document_type)
            
        if request.document_number is not None:
            update_fields.append("document_number = %s")
            params.append(request.document_number)
            
        if request.birth_date is not None:
            update_fields.append("birth_date = %s")
            params.append(request.birth_date.date() if hasattr(request.birth_date, 'date') else request.birth_date)
            
        if request.gender is not None:
            update_fields.append("gender = %s")
            params.append(request.gender)
            
        if request.blood_type is not None:
            update_fields.append("blood_type = %s")
            params.append(request.blood_type)
            
        if request.eps is not None:
            update_fields.append("eps = %s")
            params.append(request.eps)
            
        if request.emergency_contact_name is not None:
            update_fields.append("emergency_contact_name = %s")
            params.append(request.emergency_contact_name)
            
        if request.emergency_contact_phone is not None:
            update_fields.append("emergency_contact_phone = %s")
            params.append(request.emergency_contact_phone)
            
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")
            
        # Add updated_at field
        update_fields.append("updated_at = CURRENT_TIMESTAMP")
        params.append(patient_id)
        
        update_query = f"""
            UPDATE patients 
            SET {', '.join(update_fields)}
            WHERE user_id = %s
            RETURNING *
        """
        
        cursor.execute(update_query, params)
        updated_patient = cursor.fetchone()
        
        if not updated_patient:
            raise HTTPException(status_code=404, detail="Patient not found")
            
        conn.commit()
        cursor.close()
        conn.close()
        
        return {
            "message": "Patient profile updated successfully",
            "patient": {
                "id": updated_patient["user_id"],
                "document_type": updated_patient["document_type"],
                "document_number": updated_patient["document_number"],
                "birth_date": updated_patient["birth_date"].isoformat() if updated_patient["birth_date"] else None,
                "gender": updated_patient["gender"],
                "blood_type": updated_patient["blood_type"],
                "eps": updated_patient["eps"],
                "emergency_contact_name": updated_patient["emergency_contact_name"],
                "emergency_contact_phone": updated_patient["emergency_contact_phone"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        if 'conn' in locals():
            conn.rollback()
            cursor.close()
            conn.close()
        raise HTTPException(status_code=500, detail="Internal server error")