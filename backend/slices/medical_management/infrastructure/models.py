"""
SQLAlchemy models for VitalGo Medical Management
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    role = Column(String(50), nullable=False)  # "patient" or "paramedic"
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    patient = relationship("Patient", back_populates="user", uselist=False)
    paramedic = relationship("Paramedic", back_populates="user", uselist=False)


class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    document_type = Column(String(10), nullable=False)
    document_number = Column(String(50), nullable=False)
    birth_date = Column(Date, nullable=False)
    gender = Column(String(1), nullable=False)  # M/F
    blood_type = Column(String(5), nullable=False)
    eps = Column(String(100), nullable=False)
    emergency_contact_name = Column(String(200), nullable=False)
    emergency_contact_phone = Column(String(20), nullable=False)
    address = Column(String(500))
    city = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="patient")
    allergies = relationship("Allergy", back_populates="patient")
    illnesses = relationship("Illness", back_populates="patient")
    surgeries = relationship("Surgery", back_populates="patient")
    qr_codes = relationship("PatientQRCode", back_populates="patient")


class Paramedic(Base):
    __tablename__ = "paramedics"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    medical_license = Column(String(100), nullable=False)
    specialty = Column(String(100), nullable=False)
    institution = Column(String(200), nullable=False)
    years_experience = Column(Integer, nullable=False)
    license_expiry_date = Column(DateTime, nullable=False)
    is_approved = Column(Boolean, default=False, nullable=False)
    approved_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="paramedic")


class Allergy(Base):
    __tablename__ = "allergies"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    allergen = Column(String(200), nullable=False)
    severity = Column(String(50), nullable=False)  # "MILD", "MODERATE", "SEVERE"
    symptoms = Column(Text)
    diagnosed_date = Column(Date)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    patient = relationship("Patient", back_populates="allergies")


class Illness(Base):
    __tablename__ = "illnesses"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    name = Column(String(200), nullable=False)
    diagnosis_date = Column(Date)
    status = Column(String(50), nullable=False, default="ACTIVE")  # "ACTIVE", "RESOLVED", "CHRONIC"
    treatment = Column(Text)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    patient = relationship("Patient", back_populates="illnesses")


class Surgery(Base):
    __tablename__ = "surgeries"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    procedure_name = Column(String(200), nullable=False)
    date = Column(Date, nullable=False)
    surgeon = Column(String(200))
    hospital = Column(String(200))
    complications = Column(Text)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    patient = relationship("Patient", back_populates="surgeries")


class PatientQRCode(Base):
    __tablename__ = "patient_qr_codes"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    qr_code = Column(String(100), unique=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True))
    
    # Relationships
    patient = relationship("Patient", back_populates="qr_codes")


class EPS(Base):
    __tablename__ = "eps"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(200), nullable=False, unique=True)
    code = Column(String(50), nullable=False, unique=True)
    regime_type = Column(String(20), nullable=False)  # "contributivo", "subsidiado", "ambos"
    status = Column(String(20), nullable=False, default="activa")  # "activa", "inactiva", "liquidacion"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class QRAccessLog(Base):
    __tablename__ = "qr_access_logs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    qr_code = Column(String(100), nullable=False)
    accessor_type = Column(String(50), nullable=False)  # "PATIENT", "PARAMEDIC", "ANONYMOUS"
    accessor_id = Column(String)  # User ID if authenticated
    accessed_at = Column(DateTime(timezone=True), server_default=func.now())
    ip_address = Column(String(45))
    user_agent = Column(Text)