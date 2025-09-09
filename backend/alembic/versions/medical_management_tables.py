"""Add medical management tables

Revision ID: medical_mgmt_001
Revises: 5168f64bad08
Create Date: 2025-09-09 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'medical_mgmt_001'
down_revision = '5168f64bad08'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create users table
    op.create_table('users',
        sa.Column('id', sa.String(36), nullable=False, primary_key=True),
        sa.Column('email', sa.String(255), nullable=False, unique=True, index=True),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('first_name', sa.String(100), nullable=False),
        sa.Column('last_name', sa.String(100), nullable=False),
        sa.Column('phone', sa.String(20), nullable=False),
        sa.Column('role', sa.String(20), nullable=False, index=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True, index=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('deleted_at', sa.DateTime(), nullable=True, index=True)
    )
    
    # Create patients table
    op.create_table('patients',
        sa.Column('id', sa.String(36), nullable=False, primary_key=True),
        sa.Column('user_id', sa.String(36), nullable=False, index=True),
        sa.Column('document_type', sa.String(5), nullable=False),
        sa.Column('document_number', sa.String(20), nullable=False, unique=True, index=True),
        sa.Column('birth_date', sa.Date(), nullable=False),
        sa.Column('gender', sa.String(1), nullable=False),
        sa.Column('blood_type', sa.String(5), nullable=False, index=True),
        sa.Column('eps', sa.String(100), nullable=False),
        sa.Column('emergency_contact_name', sa.String(100), nullable=False),
        sa.Column('emergency_contact_phone', sa.String(20), nullable=False),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('city', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('deleted_at', sa.DateTime(), nullable=True, index=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE')
    )
    
    # Create paramedics table
    op.create_table('paramedics',
        sa.Column('id', sa.String(36), nullable=False, primary_key=True),
        sa.Column('user_id', sa.String(36), nullable=False, index=True),
        sa.Column('medical_license', sa.String(50), nullable=False, unique=True, index=True),
        sa.Column('specialty', sa.String(100), nullable=False),
        sa.Column('institution', sa.String(200), nullable=False),
        sa.Column('years_experience', sa.Integer(), nullable=False),
        sa.Column('license_expiry_date', sa.DateTime(), nullable=False, index=True),
        sa.Column('status', sa.String(20), nullable=False, default='PENDIENTE', index=True),
        sa.Column('approved_by', sa.String(36), nullable=True),
        sa.Column('approved_at', sa.DateTime(), nullable=True),
        sa.Column('rejection_reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('deleted_at', sa.DateTime(), nullable=True, index=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['approved_by'], ['users.id'], ondelete='SET NULL')
    )
    
    # Create allergies table
    op.create_table('allergies',
        sa.Column('id', sa.String(36), nullable=False, primary_key=True),
        sa.Column('patient_id', sa.String(36), nullable=False, index=True),
        sa.Column('allergen', sa.String(200), nullable=False, index=True),
        sa.Column('severity', sa.String(20), nullable=False, index=True),
        sa.Column('symptoms', sa.Text(), nullable=False),
        sa.Column('treatment', sa.Text(), nullable=True),
        sa.Column('diagnosed_date', sa.DateTime(), nullable=True, index=True),
        sa.Column('last_reaction_date', sa.DateTime(), nullable=True, index=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True, index=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('deleted_at', sa.DateTime(), nullable=True, index=True),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ondelete='CASCADE')
    )
    
    # Create illnesses table
    op.create_table('illnesses',
        sa.Column('id', sa.String(36), nullable=False, primary_key=True),
        sa.Column('patient_id', sa.String(36), nullable=False, index=True),
        sa.Column('name', sa.String(200), nullable=False, index=True),
        sa.Column('cie10_code', sa.String(10), nullable=True, index=True),
        sa.Column('status', sa.String(20), nullable=False, default='ACTIVA', index=True),
        sa.Column('diagnosed_date', sa.DateTime(), nullable=False, index=True),
        sa.Column('resolved_date', sa.DateTime(), nullable=True, index=True),
        sa.Column('symptoms', sa.Text(), nullable=True),
        sa.Column('treatment', sa.Text(), nullable=True),
        sa.Column('prescribed_by', sa.String(100), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('is_chronic', sa.Boolean(), nullable=False, default=False, index=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('deleted_at', sa.DateTime(), nullable=True, index=True),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ondelete='CASCADE')
    )
    
    # Create surgeries table
    op.create_table('surgeries',
        sa.Column('id', sa.String(36), nullable=False, primary_key=True),
        sa.Column('patient_id', sa.String(36), nullable=False, index=True),
        sa.Column('name', sa.String(200), nullable=False, index=True),
        sa.Column('surgery_date', sa.DateTime(), nullable=False, index=True),
        sa.Column('surgeon', sa.String(100), nullable=False),
        sa.Column('hospital', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('diagnosis', sa.Text(), nullable=True),
        sa.Column('complications', postgresql.ARRAY(sa.Text()), nullable=True),
        sa.Column('recovery_notes', sa.Text(), nullable=True),
        sa.Column('anesthesia_type', sa.String(100), nullable=True),
        sa.Column('surgery_duration_minutes', sa.Integer(), nullable=True),
        sa.Column('follow_up_required', sa.Boolean(), nullable=False, default=False, index=True),
        sa.Column('follow_up_date', sa.DateTime(), nullable=True, index=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('deleted_at', sa.DateTime(), nullable=True, index=True),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ondelete='CASCADE')
    )
    
    # Create patient_qr_codes table for QR code management
    op.create_table('patient_qr_codes',
        sa.Column('id', sa.String(36), nullable=False, primary_key=True),
        sa.Column('patient_id', sa.String(36), nullable=False, index=True),
        sa.Column('qr_token', sa.String(100), nullable=False, unique=True, index=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True, index=True),
        sa.Column('expires_at', sa.DateTime(), nullable=True, index=True),
        sa.Column('last_accessed_at', sa.DateTime(), nullable=True),
        sa.Column('access_count', sa.Integer(), nullable=False, default=0),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ondelete='CASCADE')
    )
    
    # Create qr_access_logs table for security auditing
    op.create_table('qr_access_logs',
        sa.Column('id', sa.String(36), nullable=False, primary_key=True),
        sa.Column('qr_code_id', sa.String(36), nullable=False, index=True),
        sa.Column('accessed_by_user_id', sa.String(36), nullable=True, index=True),
        sa.Column('access_type', sa.String(20), nullable=False, index=True),  # 'patient', 'paramedic', 'anonymous'
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('success', sa.Boolean(), nullable=False, default=True, index=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now(), index=True),
        sa.ForeignKeyConstraint(['qr_code_id'], ['patient_qr_codes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['accessed_by_user_id'], ['users.id'], ondelete='SET NULL')
    )

    # Create indexes for better performance
    op.create_index('ix_users_email_active', 'users', ['email', 'is_active'])
    op.create_index('ix_patients_document', 'patients', ['document_type', 'document_number'])
    op.create_index('ix_allergies_patient_active', 'allergies', ['patient_id', 'is_active'])
    op.create_index('ix_illnesses_patient_status', 'illnesses', ['patient_id', 'status'])
    op.create_index('ix_surgeries_patient_date', 'surgeries', ['patient_id', 'surgery_date'])
    op.create_index('ix_paramedics_status_license', 'paramedics', ['status', 'license_expiry_date'])

    # Add constraints
    op.create_check_constraint('ck_users_role', 'users', "role IN ('patient', 'paramedic', 'admin')")
    op.create_check_constraint('ck_patients_gender', 'patients', "gender IN ('M', 'F', 'O')")
    op.create_check_constraint('ck_patients_blood_type', 'patients', "blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')")
    op.create_check_constraint('ck_allergies_severity', 'allergies', "severity IN ('LEVE', 'MODERADA', 'SEVERA', 'CRITICA')")
    op.create_check_constraint('ck_illnesses_status', 'illnesses', "status IN ('ACTIVA', 'RESUELTA', 'CRONICA')")
    op.create_check_constraint('ck_paramedics_status', 'paramedics', "status IN ('PENDIENTE', 'APROBADO', 'RECHAZADO', 'SUSPENDIDO')")
    op.create_check_constraint('ck_paramedics_experience', 'paramedics', "years_experience >= 0 AND years_experience <= 60")
    op.create_check_constraint('ck_qr_access_type', 'qr_access_logs', "access_type IN ('patient', 'paramedic', 'anonymous')")


def downgrade() -> None:
    # Drop tables in reverse order due to foreign key constraints
    op.drop_table('qr_access_logs')
    op.drop_table('patient_qr_codes')
    op.drop_table('surgeries')
    op.drop_table('illnesses')
    op.drop_table('allergies')
    op.drop_table('paramedics')
    op.drop_table('patients')
    op.drop_table('users')