from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime
import json

import os
import psycopg2

from .auth import verify_token

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
    """Get database connection"""
    return psycopg2.connect(DATABASE_URL)

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/pending-paramedics")
async def get_pending_paramedics(current_user: dict = Depends(verify_token)):
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado. Solo administradores pueden acceder."
        )
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, email, first_name, last_name, phone, created_at, role
                FROM users 
                WHERE role = 'paramedic' AND is_active = false
                ORDER BY created_at DESC
            """)
            
            pending_paramedics = []
            for row in cur.fetchall():
                pending_paramedics.append({
                    "id": str(row[0]),
                    "email": row[1],
                    "first_name": row[2],
                    "last_name": row[3],
                    "phone": row[4],
                    "created_at": row[5].isoformat() if row[5] else None,
                    "status": "pending"
                })
            
            return pending_paramedics
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener paramédicos pendientes: {str(e)}"
        )
    finally:
        conn.close()

@router.post("/approve-paramedic/{paramedic_id}")
async def approve_paramedic(paramedic_id: str, current_user: dict = Depends(verify_token)):
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado. Solo administradores pueden acceder."
        )
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # Verificar que el paramédico existe y está pendiente
            cur.execute("""
                SELECT id, email, first_name, last_name, role 
                FROM users 
                WHERE id = %s AND role = 'paramedic' AND is_active = false
            """, (paramedic_id,))
            
            paramedic = cur.fetchone()
            if not paramedic:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Paramédico no encontrado o ya fue procesado"
                )
            
            # Activar el paramédico
            cur.execute("""
                UPDATE users 
                SET is_active = true, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (paramedic_id,))
            
            # Registrar la acción de aprobación
            cur.execute("""
                INSERT INTO admin_actions (
                    admin_id, target_user_id, action_type, action_details, created_at
                ) VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP)
            """, (
                current_user["user_id"],
                paramedic_id,
                "approve_paramedic",
                json.dumps({
                    "paramedic_email": paramedic[1],
                    "paramedic_name": f"{paramedic[2]} {paramedic[3]}"
                })
            ))
            
            conn.commit()
            
            return {
                "message": f"Paramédico {paramedic[2]} {paramedic[3]} aprobado exitosamente",
                "paramedic_id": paramedic_id,
                "status": "approved"
            }
            
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al aprobar paramédico: {str(e)}"
        )
    finally:
        conn.close()

@router.post("/reject-paramedic/{paramedic_id}")
async def reject_paramedic(
    paramedic_id: str, 
    rejection_data: dict,
    current_user: dict = Depends(verify_token)
):
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado. Solo administradores pueden acceder."
        )
    
    rejection_reason = rejection_data.get("rejection_reason")
    if not rejection_reason or rejection_reason.strip() == "":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La razón de rechazo es obligatoria"
        )
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # Verificar que el paramédico existe y está pendiente
            cur.execute("""
                SELECT id, email, first_name, last_name, role 
                FROM users 
                WHERE id = %s AND role = 'paramedic' AND is_active = false
            """, (paramedic_id,))
            
            paramedic = cur.fetchone()
            if not paramedic:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Paramédico no encontrado o ya fue procesado"
                )
            
            # Eliminar el paramédico rechazado
            cur.execute("DELETE FROM users WHERE id = %s", (paramedic_id,))
            
            # Registrar la acción de rechazo
            cur.execute("""
                INSERT INTO admin_actions (
                    admin_id, target_user_id, action_type, action_details, created_at
                ) VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP)
            """, (
                current_user["user_id"],
                paramedic_id,
                "reject_paramedic",
                json.dumps({
                    "paramedic_email": paramedic[1],
                    "paramedic_name": f"{paramedic[2]} {paramedic[3]}",
                    "rejection_reason": rejection_reason.strip()
                })
            ))
            
            conn.commit()
            
            return {
                "message": f"Paramédico {paramedic[2]} {paramedic[3]} rechazado",
                "paramedic_id": paramedic_id,
                "status": "rejected",
                "rejection_reason": rejection_reason.strip()
            }
            
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al rechazar paramédico: {str(e)}"
        )
    finally:
        conn.close()

@router.get("/admin-actions")
async def get_admin_actions(
    limit: int = 50,
    current_user: dict = Depends(verify_token)
):
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado. Solo administradores pueden acceder."
        )
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    aa.id,
                    aa.action_type,
                    aa.action_details,
                    aa.created_at,
                    u.first_name || ' ' || u.last_name as admin_name
                FROM admin_actions aa
                JOIN users u ON aa.admin_id = u.id
                ORDER BY aa.created_at DESC
                LIMIT %s
            """, (limit,))
            
            actions = []
            for row in cur.fetchall():
                actions.append({
                    "id": str(row[0]),
                    "action_type": row[1],
                    "action_details": json.loads(row[2]) if row[2] else {},
                    "created_at": row[3].isoformat() if row[3] else None,
                    "admin_name": row[4]
                })
            
            return actions
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener historial de acciones: {str(e)}"
        )
    finally:
        conn.close()