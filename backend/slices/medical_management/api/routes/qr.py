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
from datetime import datetime, timedelta

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

# Dependency injection placeholders
async def get_command_handlers() -> PatientCommandHandlers:
    """Get command handlers instance"""
    pass

async def get_query_handlers() -> PatientQueryHandlers:
    """Get query handlers instance"""
    pass


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
    command_handlers: PatientCommandHandlers = Depends(get_command_handlers),
    query_handlers: PatientQueryHandlers = Depends(get_query_handlers)
):
    """Generate QR code for patient emergency access"""
    try:
        # Only patients can generate their own QR codes
        if current_user["role"] != "patient":
            raise HTTPException(status_code=403, detail="Only patients can generate QR codes")
        
        # Get patient
        patient_query = GetPatientByUserIdQuery(user_id=current_user["sub"])
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


@router.get("/emergency/{qr_token}")
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