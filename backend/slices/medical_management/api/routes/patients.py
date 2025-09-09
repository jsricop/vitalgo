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


# Router
router = APIRouter(prefix="/patients", tags=["patients"])

# Security scheme
security = HTTPBearer()

# Dependency injection placeholders
async def get_command_handlers() -> PatientCommandHandlers:
    """Get command handlers instance"""
    pass

async def get_query_handlers() -> PatientQueryHandlers:
    """Get query handlers instance"""
    pass


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
            patient_id=patient.id,
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
    command_handlers: PatientCommandHandlers = Depends(get_command_handlers),
    query_handlers: PatientQueryHandlers = Depends(get_query_handlers)
):
    """Add new allergy to patient record"""
    try:
        # Get patient
        patient_query = GetPatientByUserIdQuery(user_id=current_user["sub"])
        patient = await query_handlers.handle_get_patient_by_user_id(patient_query)
        
        if not patient:
            raise HTTPException(status_code=404, detail="Patient profile not found")
        
        # Create allergy
        command = AddAllergyCommand(
            patient_id=patient.id,
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
        
        allergies_query = GetPatientAllergiesQuery(patient_id=patient.id)
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
        command = UpdateAllergyCommand(
            allergy_id=allergy_id,
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
    command_handlers: PatientCommandHandlers = Depends(get_command_handlers),
    query_handlers: PatientQueryHandlers = Depends(get_query_handlers)
):
    """Add new illness to patient record"""
    try:
        patient_query = GetPatientByUserIdQuery(user_id=current_user["sub"])
        patient = await query_handlers.handle_get_patient_by_user_id(patient_query)
        
        if not patient:
            raise HTTPException(status_code=404, detail="Patient profile not found")
        
        command = AddIllnessCommand(
            patient_id=patient.id,
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
        
        illnesses_query = GetPatientIllnessesQuery(patient_id=patient.id)
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
        command = UpdateIllnessCommand(
            illness_id=illness_id,
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
        command = UpdateIllnessStatusCommand(
            illness_id=illness_id,
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
    command_handlers: PatientCommandHandlers = Depends(get_command_handlers),
    query_handlers: PatientQueryHandlers = Depends(get_query_handlers)
):
    """Add new surgery to patient record"""
    try:
        patient_query = GetPatientByUserIdQuery(user_id=current_user["sub"])
        patient = await query_handlers.handle_get_patient_by_user_id(patient_query)
        
        if not patient:
            raise HTTPException(status_code=404, detail="Patient profile not found")
        
        command = AddSurgeryCommand(
            patient_id=patient.id,
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
        
        surgeries_query = GetPatientSurgeriesQuery(patient_id=patient.id)
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
        command = UpdateSurgeryCommand(
            surgery_id=surgery_id,
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
        command = AddSurgeryComplicationCommand(
            surgery_id=surgery_id,
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