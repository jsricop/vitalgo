"""
Domain Entities for VitalGo Medical Management

This module contains all the domain entities that represent the core business
objects in the medical management system.
"""

from .user import User
from .patient import Patient
from .paramedic import Paramedic
from .allergy import Allergy
from .illness import Illness
from .surgery import Surgery

__all__ = [
    'User',
    'Patient', 
    'Paramedic',
    'Allergy',
    'Illness',
    'Surgery'
]