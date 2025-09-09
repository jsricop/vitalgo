from typing import Optional
from datetime import datetime
from dataclasses import dataclass, field
import bcrypt

from ..value_objects import Email, UUID


@dataclass
class User:
    """Base User entity for authentication"""
    
    id: UUID
    email: Email
    password_hash: str
    first_name: str
    last_name: str
    phone: str
    role: str  # 'patient', 'paramedic', 'admin'
    is_active: bool = True
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    deleted_at: Optional[datetime] = None
    
    @classmethod
    def create(cls, email: str, password: str, first_name: str, 
               last_name: str, phone: str, role: str) -> 'User':
        """Factory method to create a new user with hashed password"""
        return cls(
            id=UUID(),
            email=Email(email),
            password_hash=cls._hash_password(password),
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            role=role
        )
    
    @staticmethod
    def _hash_password(password: str) -> str:
        """Hash password using bcrypt with salt"""
        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters long")
        
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    def verify_password(self, password: str) -> bool:
        """Verify password against hash"""
        return bcrypt.checkpw(password.encode('utf-8'), 
                            self.password_hash.encode('utf-8'))
    
    def change_password(self, new_password: str) -> None:
        """Change user password"""
        self.password_hash = self._hash_password(new_password)
        self.updated_at = datetime.now()
    
    def deactivate(self) -> None:
        """Soft delete user"""
        self.is_active = False
        self.deleted_at = datetime.now()
        self.updated_at = datetime.now()
    
    def activate(self) -> None:
        """Reactivate user"""
        self.is_active = True
        self.deleted_at = None
        self.updated_at = datetime.now()
    
    def update_profile(self, first_name: Optional[str] = None,
                      last_name: Optional[str] = None,
                      phone: Optional[str] = None) -> None:
        """Update user profile information"""
        if first_name:
            self.first_name = first_name
        if last_name:
            self.last_name = last_name
        if phone:
            self.phone = phone
        self.updated_at = datetime.now()
    
    def get_full_name(self) -> str:
        """Get user's full name"""
        return f"{self.first_name} {self.last_name}"
    
    def to_dict(self) -> dict:
        """Convert entity to dictionary (excluding sensitive data)"""
        return {
            'id': str(self.id),
            'email': str(self.email),
            'first_name': self.first_name,
            'last_name': self.last_name,
            'phone': self.phone,
            'role': self.role,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }