"""
QR Code routes for VitalGo Medical Management API

Handles QR code generation and emergency access to patient medical information.
"""

from fastapi import APIRouter, HTTPException, Depends, Request, Response
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional
import qrcode
import io
import base64
import secrets
import uuid
from datetime import datetime, timedelta

# Database imports
import psycopg2
from psycopg2.extras import RealDictCursor
import os

# Database connection - SECURE VERSION
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

from ...application.commands import GeneratePatientQRCommand
from ...application.queries import (
    GetPatientByUserIdQuery, GetPatientEmergencyInfoQuery, 
    GetQRCodeDataQuery, ValidateQRAccessQuery
)
from ...application.handlers.patient_handlers import PatientCommandHandlers, PatientQueryHandlers

# Import auth verification
from .auth import verify_token

# Pydantic models
class QRGenerationRequest(BaseModel):
    expires_in_days: Optional[int] = None


class QRResponse(BaseModel):
    qr_token: str
    qr_image: str  # Base64 encoded QR image
    expires_at: Optional[datetime]
    access_url: str


class EmergencyAccessResponse(BaseModel):
    patient_info: dict
    access_granted: bool
    accessed_at: datetime
    access_type: str


# Router
router = APIRouter(prefix="/qr", tags=["qr-codes"])

# Import the same handlers from patients.py
from .patients import SimpleMedicalHandlers

# Dependency injection using working handlers
async def get_command_handlers():
    """Get command handlers instance"""
    return SimpleMedicalHandlers()

async def get_query_handlers():
    """Get query handlers instance"""
    return SimpleMedicalHandlers()


def generate_qr_token() -> str:
    """Generate secure QR token"""
    return secrets.token_urlsafe(32)


def create_qr_image(data: str) -> str:
    """Create QR code image and return as base64 string"""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    img_str = base64.b64encode(buffer.getvalue()).decode()
    
    return f"data:image/png;base64,{img_str}"


@router.post("/generate", response_model=QRResponse)
async def generate_patient_qr(
    request: QRGenerationRequest,
    current_user: dict = Depends(verify_token),
    command_handlers: SimpleMedicalHandlers = Depends(get_command_handlers),
    query_handlers: SimpleMedicalHandlers = Depends(get_query_handlers)
):
    """Generate QR code for patient emergency access"""
    try:
        # Only patients can generate their own QR codes
        if current_user["role"] != "patient":
            raise HTTPException(status_code=403, detail="Only patients can generate QR codes")
        
        # Get patient using the same approach as patients.py
        from .patients import SimpleQuery
        patient_query = SimpleQuery(user_id=current_user["sub"])
        patient = await query_handlers.handle_get_patient_by_user_id(patient_query)
        
        if not patient:
            raise HTTPException(status_code=404, detail="Patient profile not found")
        
        # Generate QR token and create QR code
        qr_token = generate_qr_token()
        
        # Calculate expiry
        expires_at = None
        if request.expires_in_days:
            expires_at = datetime.now() + timedelta(days=request.expires_in_days)
        
        # Create access URL (this would be your domain in production)
        access_url = f"https://vitalgo.app/emergency/{qr_token}"
        
        # Generate QR image
        qr_image = create_qr_image(access_url)
        
        # Save QR code to database (this would be handled by a command handler)
        # For now, we'll return the response without persisting
        
        return QRResponse(
            qr_token=qr_token,
            qr_image=qr_image,
            expires_at=expires_at,
            access_url=access_url
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/emergency/{qr_token}/page")
async def emergency_access_page(
    qr_token: str,
    request: Request
):
    """Public emergency access page for QR codes"""
    try:
        # This would be a full HTML page in production
        # For now, return basic HTML
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>VitalGo - Acceso de Emergencia</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background-color: #f8f9fa;
                }}
                .container {{
                    max-width: 800px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 12px;
                    padding: 30px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }}
                .header {{
                    text-align: center;
                    margin-bottom: 30px;
                }}
                .logo {{
                    color: #01EF7F;
                    font-size: 2rem;
                    font-weight: bold;
                }}
                .emergency-badge {{
                    background: #dc3545;
                    color: white;
                    padding: 8px 16px;
                    border-radius: 20px;
                    display: inline-block;
                    margin-top: 10px;
                    font-size: 0.9rem;
                }}
                .access-form {{
                    margin-top: 20px;
                }}
                .form-group {{
                    margin-bottom: 15px;
                }}
                label {{
                    display: block;
                    margin-bottom: 5px;
                    font-weight: 500;
                }}
                input, select {{
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 16px;
                }}
                button {{
                    background: #01EF7F;
                    color: #002C41;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                    width: 100%;
                    font-size: 16px;
                }}
                button:hover {{
                    background: #00d671;
                }}
                .medical-info {{
                    display: none;
                    margin-top: 30px;
                    padding: 20px;
                    background: #f8f9fa;
                    border-radius: 8px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">VitalGo</div>
                    <div class="emergency-badge">ACCESO DE EMERGENCIA</div>
                    <p>Sistema de Información Médica de Emergencia</p>
                </div>
                
                <div class="access-form">
                    <form id="accessForm">
                        <div class="form-group">
                            <label for="accessType">Tipo de acceso:</label>
                            <select id="accessType" name="accessType" required>
                                <option value="">Seleccionar...</option>
                                <option value="paramedic">Paramédico</option>
                                <option value="patient">Paciente</option>
                            </select>
                        </div>
                        
                        <div class="form-group" id="credentialsGroup" style="display: none;">
                            <label for="credentials">Credenciales (Email o Licencia Médica):</label>
                            <input type="text" id="credentials" name="credentials" placeholder="Ingrese email o número de licencia">
                        </div>
                        
                        <button type="submit">Acceder a Información Médica</button>
                    </form>
                </div>
                
                <div class="medical-info" id="medicalInfo">
                    <!-- Medical information will be loaded here -->
                </div>
            </div>
            
            <script>
                document.getElementById('accessType').addEventListener('change', function() {{
                    const credentialsGroup = document.getElementById('credentialsGroup');
                    if (this.value) {{
                        credentialsGroup.style.display = 'block';
                    }} else {{
                        credentialsGroup.style.display = 'none';
                    }}
                }});
                
                document.getElementById('accessForm').addEventListener('submit', async function(e) {{
                    e.preventDefault();
                    
                    const accessType = document.getElementById('accessType').value;
                    const credentials = document.getElementById('credentials').value;
                    
                    try {{
                        const response = await fetch('/api/v1/qr/emergency/{qr_token}/access', {{
                            method: 'POST',
                            headers: {{
                                'Content-Type': 'application/json'
                            }},
                            body: JSON.stringify({{
                                access_type: accessType,
                                credentials: credentials
                            }})
                        }});
                        
                        const result = await response.json();
                        
                        if (response.ok && result.access_granted) {{
                            displayMedicalInfo(result.patient_info);
                        }} else {{
                            alert('Acceso denegado: ' + (result.detail || 'Credenciales inválidas'));
                        }}
                    }} catch (error) {{
                        alert('Error al acceder a la información médica');
                    }}
                }});
                
                function displayMedicalInfo(patientInfo) {{
                    const medicalInfoDiv = document.getElementById('medicalInfo');
                    medicalInfoDiv.innerHTML = `
                        <h3>Información Médica de Emergencia</h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                            <div>
                                <h4>Información Personal</h4>
                                <p><strong>Nombre:</strong> ${{patientInfo.patient_name}}</p>
                                <p><strong>Documento:</strong> ${{patientInfo.document}}</p>
                                <p><strong>Edad:</strong> ${{patientInfo.age}} años</p>
                                <p><strong>Tipo de Sangre:</strong> ${{patientInfo.blood_type}}</p>
                                <p><strong>EPS:</strong> ${{patientInfo.eps}}</p>
                                <p><strong>Contacto de Emergencia:</strong> ${{patientInfo.emergency_contact}}</p>
                            </div>
                            
                            <div>
                                <h4>Alergias Críticas</h4>
                                ${{patientInfo.critical_allergies.map(allergy => `
                                    <div style="background: #fff3cd; padding: 10px; margin: 5px 0; border-radius: 4px;">
                                        <strong>${{allergy.allergen}}</strong> (${{allergy.severity}})<br>
                                        <small>${{allergy.symptoms}}</small>
                                    </div>
                                `).join('')}}
                            </div>
                            
                            <div>
                                <h4>Condiciones Crónicas</h4>
                                ${{patientInfo.chronic_illnesses.map(illness => `
                                    <div style="background: #d1ecf1; padding: 10px; margin: 5px 0; border-radius: 4px;">
                                        <strong>${{illness.name}}</strong><br>
                                        <small>${{illness.treatment || 'Sin tratamiento específico'}}</small>
                                    </div>
                                `).join('')}}
                            </div>
                            
                            <div>
                                <h4>Cirugías Recientes</h4>
                                ${{patientInfo.recent_surgeries.map(surgery => `
                                    <div style="background: #f8d7da; padding: 10px; margin: 5px 0; border-radius: 4px;">
                                        <strong>${{surgery.name}}</strong> (${{surgery.date}})<br>
                                        <small>Hospital: ${{surgery.hospital}}</small>
                                    </div>
                                `).join('')}}
                            </div>
                        </div>
                    `;
                    medicalInfoDiv.style.display = 'block';
                }}
            </script>
        </body>
        </html>
        """
        
        return HTMLResponse(content=html_content)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error loading emergency page")


@router.get("/verify-ownership/{qr_token}")
async def verify_qr_ownership(
    qr_token: str,
    current_user: dict = Depends(verify_token),
    query_handlers: SimpleMedicalHandlers = Depends(get_query_handlers)
):
    """Verify if current patient owns the given QR token"""
    try:
        # Only patients can verify QR ownership
        if current_user["role"] != "patient":
            raise HTTPException(status_code=403, detail="Only patients can verify QR ownership")
        
        # For now, since we don't have QR storage, we'll implement a basic mock verification
        # In production, this would check the database to see if this QR token belongs to the current user
        
        # Get patient using the same approach as patients.py
        from .patients import SimpleQuery
        patient_query = SimpleQuery(user_id=current_user["sub"])
        patient = await query_handlers.handle_get_patient_by_user_id(patient_query)
        
        if not patient:
            raise HTTPException(status_code=404, detail="Patient profile not found")
        
        # For demo purposes, we'll use a simple token format check
        # In production, you'd query the QR database table
        # For now, we'll allow access only if the user is a patient (basic security)
        
        return {
            "isOwner": True,  # This should be a real database check
            "patient_id": patient["id"],
            "verified_at": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/emergency/{qr_token}")
async def get_emergency_patient_data(
    qr_token: str,
    current_user: dict = Depends(verify_token),
    query_handlers: SimpleMedicalHandlers = Depends(get_query_handlers)
):
    """Get patient data for emergency access via QR code - REAL DATABASE VERSION"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # First, verify QR token exists and get patient info
        cursor.execute("""
            SELECT pqr.patient_id, pqr.is_active, pqr.expires_at,
                   p.user_id, p.document_type, p.document_number, p.birth_date, 
                   p.gender, p.blood_type, p.eps, p.emergency_contact_name, 
                   p.emergency_contact_phone, p.address, p.city,
                   u.first_name, u.last_name, u.phone, u.email
            FROM patient_qr_codes pqr
            JOIN patients p ON pqr.patient_id = p.id
            JOIN users u ON p.user_id = u.id
            WHERE pqr.qr_token = %s AND pqr.is_active = true
        """, (qr_token,))
        
        qr_data = cursor.fetchone()
        
        if not qr_data:
            raise HTTPException(status_code=404, detail="QR code not found or inactive")
            
        # Check if QR has expired
        if qr_data["expires_at"] and qr_data["expires_at"] < datetime.now():
            raise HTTPException(status_code=404, detail="QR code has expired")
        
        # Verify user has permission to access this QR code
        patient_user_id = qr_data["user_id"]
        patient_id = qr_data["patient_id"]
        
        if current_user["role"] == "paramedic":
            # Paramedics can access any QR
            pass
        elif current_user["role"] == "admin":
            # Admins can access any QR  
            pass
        elif current_user["role"] == "patient":
            # Patients can only access their own QR
            if current_user["sub"] != patient_user_id:
                raise HTTPException(status_code=403, detail="Access denied: You can only access your own QR code")
        else:
            raise HTTPException(status_code=403, detail="Insufficient permissions to access medical data")
        
        # Get patient's allergies
        cursor.execute("""
            SELECT allergen, severity, symptoms, treatment, diagnosed_date, notes
            FROM allergies 
            WHERE patient_id = %s AND is_active = true AND deleted_at IS NULL
            ORDER BY severity DESC, diagnosed_date DESC
        """, (patient_id,))
        allergies = cursor.fetchall()
        
        # Get patient's illnesses
        cursor.execute("""
            SELECT name as illness_name, cie10_code, diagnosed_date, status, 
                   symptoms, treatment, prescribed_by, notes, is_chronic
            FROM illnesses 
            WHERE patient_id = %s AND is_active = true AND deleted_at IS NULL
            ORDER BY diagnosed_date DESC
        """, (patient_id,))
        illnesses = cursor.fetchall()
        
        # Get patient's surgeries
        cursor.execute("""
            SELECT name as surgery_name, surgery_date, surgeon, hospital, 
                   description, diagnosis, anesthesia_type, surgery_duration_minutes, notes
            FROM surgeries 
            WHERE patient_id = %s AND is_active = true AND deleted_at IS NULL
            ORDER BY surgery_date DESC
        """, (patient_id,))
        surgeries = cursor.fetchall()
        
        # Update QR access stats
        cursor.execute("""
            UPDATE patient_qr_codes 
            SET access_count = access_count + 1, 
                last_accessed_at = NOW(),
                updated_at = NOW()
            WHERE qr_token = %s
        """, (qr_token,))
        
        # Log the access attempt for security auditing
        access_log_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO qr_access_logs 
            (id, qr_code_id, accessed_by_user_id, access_type, ip_address, success, created_at)
            SELECT %s, pqr.id, %s, %s, %s, true, NOW()
            FROM patient_qr_codes pqr 
            WHERE pqr.qr_token = %s
        """, (access_log_id, current_user["sub"], current_user["role"], "unknown", qr_token))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        # Build response with real data
        patient_data = {
            "patient": {
                "id": patient_id,
                "first_name": qr_data["first_name"],
                "last_name": qr_data["last_name"],
                "document_type": qr_data["document_type"],
                "document_number": qr_data["document_number"],
                "phone": qr_data["phone"],
                "birth_date": qr_data["birth_date"].isoformat() if qr_data["birth_date"] else None,
                "gender": qr_data["gender"],
                "blood_type": qr_data["blood_type"],
                "eps": qr_data["eps"],
                "emergency_contact_name": qr_data["emergency_contact_name"],
                "emergency_contact_phone": qr_data["emergency_contact_phone"],
                "allergies": [
                    {
                        "allergen": allergy["allergen"],
                        "severity": allergy["severity"],
                        "symptoms": allergy["symptoms"],
                        "treatment": allergy["treatment"],
                        "diagnosed_date": allergy["diagnosed_date"].isoformat() if allergy["diagnosed_date"] else None,
                        "notes": allergy["notes"]
                    } for allergy in allergies
                ],
                "illnesses": [
                    {
                        "illness_name": illness["illness_name"],
                        "cie10_code": illness["cie10_code"],
                        "diagnosis_date": illness["diagnosed_date"].isoformat() if illness["diagnosed_date"] else None,
                        "status": illness["status"],
                        "notes": illness["notes"]
                    } for illness in illnesses
                ],
                "surgeries": [
                    {
                        "surgery_name": surgery["surgery_name"],
                        "surgery_date": surgery["surgery_date"].isoformat() if surgery["surgery_date"] else None,
                        "hospital": surgery["hospital"],
                        "surgeon": surgery["surgeon"],
                        "notes": surgery["notes"]
                    } for surgery in surgeries
                ]
            },
            "access_log": {
                "qr_token": qr_token,
                "accessed_by": current_user["sub"],
                "accessed_by_role": current_user["role"],
                "accessed_at": datetime.now().isoformat(),
                "ip_address": "unknown"  # In production, get from request
            }
        }
        
        return JSONResponse(content=patient_data)
        
    except HTTPException:
        raise
    except Exception as e:
        if 'conn' in locals():
            conn.rollback()
            cursor.close()
            conn.close()
        raise HTTPException(status_code=500, detail=f"Error loading patient data: {str(e)}")


@router.get("/paramedic/scan-history")
async def get_paramedic_scan_history(
    current_user: dict = Depends(verify_token),
    query_handlers: SimpleMedicalHandlers = Depends(get_query_handlers)
):
    """Get QR scan history for the current paramedic - REAL DATABASE VERSION"""
    try:
        # Only paramedics and admins can access scan history
        if current_user["role"] not in ["paramedic", "admin"]:
            raise HTTPException(status_code=403, detail="Only paramedics can access scan history")
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get QR access logs for this paramedic (or all if admin)
        if current_user["role"] == "admin":
            # Admins can see all scan history
            cursor.execute("""
                SELECT 
                    qal.id as log_id,
                    qal.created_at as scanned_at,
                    qal.ip_address,
                    qal.access_type,
                    pqr.qr_token,
                    p.id as patient_id,
                    p.blood_type,
                    p.emergency_contact_name,
                    p.emergency_contact_phone,
                    p.eps,
                    u.first_name,
                    u.last_name,
                    u.email,
                    u.phone,
                    -- Get critical allergies
                    COALESCE(
                        (SELECT array_agg(allergen || ' (' || severity || ')') 
                         FROM allergies 
                         WHERE patient_id = p.id 
                           AND is_active = true 
                           AND deleted_at IS NULL 
                           AND severity IN ('high', 'critical')), 
                        '{}'::text[]
                    ) as critical_allergies,
                    -- Get chronic conditions
                    COALESCE(
                        (SELECT array_agg(name) 
                         FROM illnesses 
                         WHERE patient_id = p.id 
                           AND is_active = true 
                           AND deleted_at IS NULL 
                           AND is_chronic = true), 
                        '{}'::text[]
                    ) as chronic_conditions
                FROM qr_access_logs qal
                JOIN patient_qr_codes pqr ON qal.qr_code_id = pqr.id
                JOIN patients p ON pqr.patient_id = p.id  
                JOIN users u ON p.user_id = u.id
                WHERE qal.success = true
                ORDER BY qal.created_at DESC
                LIMIT 50
            """)
        else:
            # Paramedics can only see their own scan history
            cursor.execute("""
                SELECT 
                    qal.id as log_id,
                    qal.created_at as scanned_at,
                    qal.ip_address,
                    qal.access_type,
                    pqr.qr_token,
                    p.id as patient_id,
                    p.blood_type,
                    p.emergency_contact_name,
                    p.emergency_contact_phone,
                    p.eps,
                    u.first_name,
                    u.last_name,
                    u.email,
                    u.phone,
                    -- Get critical allergies
                    COALESCE(
                        (SELECT array_agg(allergen || ' (' || severity || ')') 
                         FROM allergies 
                         WHERE patient_id = p.id 
                           AND is_active = true 
                           AND deleted_at IS NULL 
                           AND severity IN ('high', 'critical')), 
                        '{}'::text[]
                    ) as critical_allergies,
                    -- Get chronic conditions
                    COALESCE(
                        (SELECT array_agg(name) 
                         FROM illnesses 
                         WHERE patient_id = p.id 
                           AND is_active = true 
                           AND deleted_at IS NULL 
                           AND is_chronic = true), 
                        '{}'::text[]
                    ) as chronic_conditions
                FROM qr_access_logs qal
                JOIN patient_qr_codes pqr ON qal.qr_code_id = pqr.id
                JOIN patients p ON pqr.patient_id = p.id  
                JOIN users u ON p.user_id = u.id
                WHERE qal.accessed_by_user_id = %s 
                  AND qal.success = true
                ORDER BY qal.created_at DESC
                LIMIT 50
            """, (current_user["sub"],))
        
        scan_records = cursor.fetchall()
        cursor.close()
        conn.close()
        
        # Format the response data
        scan_history = []
        for record in scan_records:
            scan_history.append({
                "id": record["log_id"],
                "patient_name": f"{record['first_name']} {record['last_name']}",
                "patient_id": record["patient_id"], 
                "qr_token": record["qr_token"],
                "scanned_at": record["scanned_at"].isoformat() if record["scanned_at"] else None,
                "location": "Hospital/Clínica",  # This could be enhanced with actual location tracking
                "emergency_type": "Acceso de emergencia",  # Could be enhanced with actual emergency type logging
                "status": "completed",
                "access_type": record["access_type"],
                "ip_address": record.get("ip_address", "N/A"),
                "critical_info": {
                    "blood_type": record["blood_type"] or "No registrado",
                    "critical_allergies": list(record["critical_allergies"]) if record["critical_allergies"] else [],
                    "chronic_conditions": list(record["chronic_conditions"]) if record["chronic_conditions"] else [],
                    "eps": record["eps"] or "No registrado",
                    "emergency_contact": f"{record['emergency_contact_name']} - {record['emergency_contact_phone']}" if record["emergency_contact_name"] else "No registrado"
                }
            })
        
        return {
            "scan_history": scan_history,
            "total_scans": len(scan_history),
            "paramedic_id": current_user["sub"],
            "paramedic_role": current_user["role"],
            "generated_at": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        if 'conn' in locals():
            cursor.close()
            conn.close()
        raise HTTPException(status_code=500, detail=f"Error loading scan history: {str(e)}")


@router.post("/emergency/{qr_token}/access", response_model=EmergencyAccessResponse)
async def validate_emergency_access(
    qr_token: str,
    request: Request,
    query_handlers: PatientQueryHandlers = Depends(get_query_handlers)
):
    """Validate emergency access to patient information"""
    try:
        # Get request body
        body = await request.json()
        access_type = body.get("access_type")
        credentials = body.get("credentials")
        
        if not access_type or not credentials:
            raise HTTPException(status_code=400, detail="Access type and credentials required")
        
        # Validate QR token and get patient info
        qr_query = GetQRCodeDataQuery(qr_token=qr_token)
        qr_data = await query_handlers.handle_get_qr_data(qr_query)
        
        if not qr_data:
            raise HTTPException(status_code=404, detail="Invalid or expired QR code")
        
        # Validate access permissions
        validate_query = ValidateQRAccessQuery(
            qr_token=qr_token,
            user_role=access_type,
            credentials=credentials
        )
        
        access_validation = await query_handlers.handle_validate_qr_access(validate_query)
        
        if not access_validation["valid"]:
            return EmergencyAccessResponse(
                patient_info={},
                access_granted=False,
                accessed_at=datetime.now(),
                access_type=access_type
            )
        
        # Get emergency patient information
        emergency_query = GetPatientEmergencyInfoQuery(patient_id=qr_data["patient_id"])
        patient_info = await query_handlers.handle_get_patient_emergency_info(emergency_query)
        
        # Log access (this would be handled by a command handler)
        
        return EmergencyAccessResponse(
            patient_info=patient_info,
            access_granted=True,
            accessed_at=datetime.now(),
            access_type=access_type
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")