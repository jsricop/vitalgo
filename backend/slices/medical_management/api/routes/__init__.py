"""
API Routes for Medical Management

This module consolidates all API routes for the medical management domain.
"""

from fastapi import APIRouter
from .auth import router as auth_router
from .patients import router as patients_router  
from .qr import router as qr_router

# Create main router for medical management
api_router = APIRouter(prefix="/api/v1")

# Include all sub-routers
api_router.include_router(auth_router)
api_router.include_router(patients_router)
api_router.include_router(qr_router)

__all__ = ["api_router"]