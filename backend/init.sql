-- VitalGo Database Initialization Script
-- This script creates all necessary tables and initial data for the VitalGo platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('patient', 'paramedic', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE document_type AS ENUM ('CC', 'TI', 'CE', 'PAS');
CREATE TYPE gender_type AS ENUM ('M', 'F', 'Other');
CREATE TYPE allergy_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE illness_status AS ENUM ('ACTIVA', 'CONTROLADA', 'CURADA');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role user_role NOT NULL DEFAULT 'patient',
    status user_status NOT NULL DEFAULT 'active',
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- EPS (Health Insurance Companies) table
CREATE TABLE eps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(10) UNIQUE,
    phone VARCHAR(20),
    website VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Patients table
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_type document_type NOT NULL,
    document_number VARCHAR(20) NOT NULL,
    birth_date DATE,
    gender gender_type,
    blood_type VARCHAR(5),
    eps_id UUID REFERENCES eps(id),
    eps VARCHAR(255), -- Temporary field for backward compatibility
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    allergies_notes TEXT,
    medical_conditions TEXT,
    medications TEXT,
    medical_profile_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(document_type, document_number)
);

-- Paramedics table
CREATE TABLE paramedics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    certification_level VARCHAR(100),
    institution VARCHAR(255),
    experience_years INTEGER,
    specialties TEXT[],
    is_verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Allergies table
CREATE TABLE allergies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    allergen VARCHAR(255) NOT NULL,
    severity allergy_severity NOT NULL DEFAULT 'medium',
    symptoms TEXT,
    treatment TEXT,
    diagnosed_date DATE,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Illnesses table
CREATE TABLE illnesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    cie10_code VARCHAR(10),
    diagnosed_date DATE,
    status illness_status NOT NULL DEFAULT 'ACTIVA',
    symptoms TEXT,
    treatment TEXT,
    prescribed_by VARCHAR(255),
    notes TEXT,
    is_chronic BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Surgeries table
CREATE TABLE surgeries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    surgery_date DATE,
    surgeon VARCHAR(255),
    hospital VARCHAR(255),
    description TEXT,
    diagnosis VARCHAR(500),
    anesthesia_type VARCHAR(100),
    surgery_duration_minutes INTEGER,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- QR Codes table
CREATE TABLE patient_qr_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    qr_token VARCHAR(255) UNIQUE NOT NULL,
    qr_image_path VARCHAR(500),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    access_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- QR Access Logs table
CREATE TABLE qr_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    qr_code_id UUID NOT NULL REFERENCES patient_qr_codes(id) ON DELETE CASCADE,
    accessed_by_user_id UUID REFERENCES users(id),
    access_type VARCHAR(50),
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT FALSE,
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Admin Actions table (for audit trail)
CREATE TABLE admin_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id UUID,
    details JSONB,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_patients_user_id ON patients(user_id);
CREATE INDEX idx_patients_document ON patients(document_type, document_number);
CREATE INDEX idx_paramedics_user_id ON paramedics(user_id);
CREATE INDEX idx_paramedics_license ON paramedics(license_number);
CREATE INDEX idx_allergies_patient_id ON allergies(patient_id);
CREATE INDEX idx_allergies_active ON allergies(patient_id, is_active, deleted_at);
CREATE INDEX idx_illnesses_patient_id ON illnesses(patient_id);
CREATE INDEX idx_illnesses_active ON illnesses(patient_id, is_active, deleted_at);
CREATE INDEX idx_surgeries_patient_id ON surgeries(patient_id);
CREATE INDEX idx_surgeries_active ON surgeries(patient_id, is_active, deleted_at);
CREATE INDEX idx_qr_codes_token ON patient_qr_codes(qr_token);
CREATE INDEX idx_qr_codes_patient_active ON patient_qr_codes(patient_id, is_active);
CREATE INDEX idx_qr_access_logs_qr_code ON qr_access_logs(qr_code_id);
CREATE INDEX idx_qr_access_logs_created ON qr_access_logs(created_at);
CREATE INDEX idx_admin_actions_admin ON admin_actions(admin_id);
CREATE INDEX idx_admin_actions_created ON admin_actions(created_at);

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_paramedics_updated_at BEFORE UPDATE ON paramedics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_allergies_updated_at BEFORE UPDATE ON allergies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_illnesses_updated_at BEFORE UPDATE ON illnesses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_surgeries_updated_at BEFORE UPDATE ON surgeries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_qr_codes_updated_at BEFORE UPDATE ON patient_qr_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial EPS data
INSERT INTO eps (name, code, phone, website) VALUES
('SURA', 'EPS001', '+57-1-560-1234', 'https://www.sura.com'),
('Nueva EPS', 'EPS002', '+57-1-489-5000', 'https://www.nuevaeps.com.co'),
('Sanitas', 'EPS003', '+57-1-560-9999', 'https://www.sanitas.co'),
('Compensar', 'EPS004', '+57-1-756-8000', 'https://www.compensar.com'),
('Famisanar', 'EPS005', '+57-1-307-7777', 'https://www.famisanar.com.co'),
('Salud Total', 'EPS006', '+57-1-744-4444', 'https://www.saludtotal.com.co'),
('Coomeva EPS', 'EPS007', '+57-2-333-0000', 'https://www.coomeva.com.co'),
('Cafesalud', 'EPS008', '+57-1-756-5656', 'https://www.cafesalud.com.co'),
('Cruz Blanca', 'EPS009', '+57-1-307-9999', 'https://www.cruzblancaeps.com'),
('Medimás', 'EPS010', '+57-1-307-8888', 'https://www.medimas.com.co');

-- Insert sample admin user (password: VitalGo2024!)
-- Note: This is a hashed password, in production use proper password hashing
INSERT INTO users (email, password_hash, first_name, last_name, role, status, email_verified) VALUES
('admin@vitalgo.app', '$2b$12$kH7/iZxdkJ3.XsxI6yQBr.vFnxBmGQB4.z8OY7Qx0YPmVGHwFDqIq', 'VitalGo', 'Administrator', 'admin', 'active', TRUE);

-- Add helpful comments
COMMENT ON TABLE users IS 'Main users table containing authentication and basic user information';
COMMENT ON TABLE patients IS 'Patient-specific information and medical profile data';
COMMENT ON TABLE paramedics IS 'Paramedic credentials and professional information';
COMMENT ON TABLE allergies IS 'Patient allergies with severity levels and treatment information';
COMMENT ON TABLE illnesses IS 'Patient medical conditions and illnesses with CIE-10 codes';
COMMENT ON TABLE surgeries IS 'Patient surgical history and procedures';
COMMENT ON TABLE patient_qr_codes IS 'QR codes generated for emergency medical access';
COMMENT ON TABLE qr_access_logs IS 'Audit log for QR code access attempts';
COMMENT ON TABLE eps IS 'Colombian health insurance companies (EPS) catalog';

-- Create a view for complete patient information (useful for emergency access)
CREATE OR REPLACE VIEW patient_emergency_info AS
SELECT 
    p.id as patient_id,
    u.first_name,
    u.last_name,
    u.email,
    u.phone,
    p.document_type,
    p.document_number,
    p.birth_date,
    p.gender,
    p.blood_type,
    p.emergency_contact_name,
    p.emergency_contact_phone,
    p.address,
    p.city,
    e.name as eps_name,
    e.phone as eps_phone,
    -- Aggregate allergies
    COALESCE(
        (SELECT jsonb_agg(
            jsonb_build_object(
                'allergen', allergen,
                'severity', severity,
                'symptoms', symptoms,
                'treatment', treatment
            )
        ) FROM allergies 
         WHERE patient_id = p.id AND is_active = TRUE AND deleted_at IS NULL),
        '[]'::jsonb
    ) as allergies,
    -- Aggregate active illnesses
    COALESCE(
        (SELECT jsonb_agg(
            jsonb_build_object(
                'name', name,
                'cie10_code', cie10_code,
                'status', status,
                'is_chronic', is_chronic,
                'treatment', treatment
            )
        ) FROM illnesses 
         WHERE patient_id = p.id AND is_active = TRUE AND deleted_at IS NULL),
        '[]'::jsonb
    ) as illnesses,
    -- Aggregate recent surgeries (last 5 years)
    COALESCE(
        (SELECT jsonb_agg(
            jsonb_build_object(
                'name', name,
                'surgery_date', surgery_date,
                'surgeon', surgeon,
                'hospital', hospital,
                'description', description
            )
        ) FROM surgeries 
         WHERE patient_id = p.id 
           AND is_active = TRUE 
           AND deleted_at IS NULL
           AND surgery_date >= CURRENT_DATE - INTERVAL '5 years'),
        '[]'::jsonb
    ) as recent_surgeries
FROM patients p
JOIN users u ON p.user_id = u.id
LEFT JOIN eps e ON p.eps_id = e.id
WHERE u.status = 'active';

COMMENT ON VIEW patient_emergency_info IS 'Complete patient medical information for emergency access via QR codes';

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO vitalgo_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO vitalgo_user;
-- GRANT SELECT ON patient_emergency_info TO vitalgo_user;