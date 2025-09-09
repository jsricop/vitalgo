-- Populate Medical Data for VitalGo
-- This script adds example medical records for existing patients

-- First, let's get the patient IDs we need
-- maria.garcia@email.com -> patient_id: 6459fdb9-836a-4939-97bc-a4565fdb3833
-- juan.perez@email.com -> patient_id: 6ca48b3e-2bbe-4675-bc64-6d9e66cd3d77

-- Add more test patients first
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, is_active, created_at, updated_at)
VALUES 
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'carlos.rodriguez@email.com', 'b55c8792d1ce458e279308835f8a97b580263503e76e1998e279703e35ad0c2e', 'Carlos', 'Rodríguez', '+57 312 888 9999', 'patient', true, NOW(), NOW()),
  ('b2c3d4e5-f678-9012-bcde-f23456789012', 'ana.martinez@email.com', 'b55c8792d1ce458e279308835f8a97b580263503e76e1998e279703e35ad0c2e', 'Ana', 'Martínez', '+57 315 777 6666', 'patient', true, NOW(), NOW()),
  ('c3d4e5f6-7890-1234-cdef-345678901234', 'dr.lopez@email.com', 'b55c8792d1ce458e279308835f8a97b580263503e76e1998e279703e35ad0c2e', 'Roberto', 'López', '+57 320 555 3333', 'paramedic', true, NOW(), NOW()),
  ('d4e5f678-9012-3456-def0-456789012345', 'dra.silva@email.com', 'b55c8792d1ce458e279308835f8a97b580263503e76e1998e279703e35ad0c2e', 'Patricia', 'Silva', '+57 318 444 2222', 'paramedic', true, NOW(), NOW());

-- Add patient profiles for new users
INSERT INTO patients (id, user_id, document_type, document_number, birth_date, gender, blood_type, eps, emergency_contact_name, emergency_contact_phone, address, city, created_at, updated_at)
VALUES
  ('p1234567-8901-2345-6789-012345678901', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'CC', '98765432', '1988-03-10', 'M', 'B+', 'Sanitas', 'Laura Rodríguez', '+57 310 666 5555', 'Av. 68 #100-20', 'Bogotá', NOW(), NOW()),
  ('p2345678-9012-3456-7890-123456789012', 'b2c3d4e5-f678-9012-bcde-f23456789012', 'CC', '11223344', '1992-11-25', 'F', 'AB-', 'Compensar', 'Pedro Martínez', '+57 313 222 1111', 'Calle 85 #15-30', 'Bogotá', NOW(), NOW());

-- Add paramedic profiles
INSERT INTO paramedics (id, user_id, medical_license, specialty, institution, years_experience, license_expiry_date, status, approved_by, approved_at, created_at, updated_at)
VALUES
  ('pm123456-7890-1234-5678-901234567890', 'c3d4e5f6-7890-1234-cdef-345678901234', 'MP12345', 'Medicina de Emergencias', 'Hospital San José', 8, '2026-12-31', 'APROBADO', null, NOW(), NOW(), NOW()),
  ('pm234567-8901-2345-6789-012345678901', 'd4e5f678-9012-3456-def0-456789012345', 'MP67890', 'Cardiología', 'Clínica del Country', 12, '2027-06-30', 'APROBADO', null, NOW(), NOW(), NOW());

-- ALLERGIES for all patients
INSERT INTO allergies (id, patient_id, allergen, symptoms, severity, notes, diagnosed_date, is_active, created_at, updated_at)
VALUES
  -- María García
  ('al123456-7890-1234-5678-901234567890', '6459fdb9-836a-4939-97bc-a4565fdb3833', 'Penicilina', 'Urticaria severa', 'SEVERA', 'Evitar todos los antibióticos betalactámicos', '2015-03-15', true, NOW(), NOW()),
  ('al234567-8901-2345-6789-012345678901', '6459fdb9-836a-4939-97bc-a4565fdb3833', 'Mariscos', 'Anafilaxia', 'CRITICA', 'Llevar siempre epinefrina', '2018-07-20', true, NOW(), NOW()),
  ('al345678-9012-3456-7890-123456789012', '6459fdb9-836a-4939-97bc-a4565fdb3833', 'Polen', 'Rinitis alérgica', 'LEVE', 'Síntomas estacionales en primavera', '2020-04-10', true, NOW(), NOW()),
  
  -- Juan Pérez
  ('al456789-0123-4567-8901-234567890123', '6ca48b3e-2bbe-4675-bc64-6d9e66cd3d77', 'Aspirina', 'Broncoespasmo', 'SEVERA', 'Usar paracetamol como alternativa', '2019-11-05', true, NOW(), NOW()),
  ('al567890-1234-5678-9012-345678901234', '6ca48b3e-2bbe-4675-bc64-6d9e66cd3d77', 'Látex', 'Dermatitis de contacto', 'MODERADA', 'Usar guantes de nitrilo', '2021-02-28', true, NOW(), NOW()),
  
  -- Carlos Rodríguez
  ('al678901-2345-6789-0123-456789012345', 'p1234567-8901-2345-6789-012345678901', 'Ibuprofeno', 'Edema facial', 'SEVERA', 'Evitar todos los AINEs', '2017-06-12', true, NOW(), NOW()),
  ('al789012-3456-7890-1234-567890123456', 'p1234567-8901-2345-6789-012345678901', 'Cacahuates', 'Shock anafiláctico', 'CRITICA', 'Portar EpiPen en todo momento', '2010-12-01', true, NOW(), NOW()),
  
  -- Ana Martínez
  ('al890123-4567-8901-2345-678901234567', 'p2345678-9012-3456-7890-123456789012', 'Sulfonamidas', 'Síndrome de Stevens-Johnson', 'CRITICA', 'Contraindicación absoluta', '2016-08-22', true, NOW(), NOW()),
  ('al901234-5678-9012-3456-789012345678', 'p2345678-9012-3456-7890-123456789012', 'Ácaros del polvo', 'Asma alérgica', 'MODERADA', 'Usar fundas antialérgicas', '2014-03-18', true, NOW(), NOW());

-- ILLNESSES for all patients
INSERT INTO illnesses (id, patient_id, name, diagnosed_date, status, treatment, notes, is_chronic, created_at, updated_at)
VALUES
  -- María García
  ('il123456-7890-1234-5678-901234567890', '6459fdb9-836a-4939-97bc-a4565fdb3833', 'Hipertensión Arterial', '2019-05-10', 'ACTIVA', 'Losartán 50mg/día, Dieta hiposódica', 'Control mensual de presión arterial', true, NOW(), NOW()),
  ('il234567-8901-2345-6789-012345678901', '6459fdb9-836a-4939-97bc-a4565fdb3833', 'Diabetes Mellitus Tipo 2', '2020-09-15', 'CRONICA', 'Metformina 850mg 2v/día, Control glucémico', 'HbA1c: 6.5% último control', true, NOW(), NOW()),
  ('il345678-9012-3456-7890-123456789012', '6459fdb9-836a-4939-97bc-a4565fdb3833', 'Hipotiroidismo', '2018-02-20', 'CRONICA', 'Levotiroxina 75mcg/día', 'TSH en rango normal', true, NOW(), NOW()),
  
  -- Juan Pérez
  ('il456789-0123-4567-8901-234567890123', '6ca48b3e-2bbe-4675-bc64-6d9e66cd3d77', 'Asma Bronquial', '2010-03-15', 'CRONICA', 'Salbutamol PRN, Budesonida inhalada', 'Última crisis hace 6 meses', true, NOW(), NOW()),
  ('il567890-1234-5678-9012-345678901234', '6ca48b3e-2bbe-4675-bc64-6d9e66cd3d77', 'Gastritis Crónica', '2021-07-08', 'ACTIVA', 'Omeprazol 20mg/día', 'Evitar irritantes gástricos', true, NOW(), NOW()),
  
  -- Carlos Rodríguez
  ('il678901-2345-6789-0123-456789012345', 'p1234567-8901-2345-6789-012345678901', 'Enfermedad Coronaria', '2022-01-20', 'ACTIVA', 'Aspirina 100mg, Atorvastatina 40mg, Metoprolol 50mg', 'Post-infarto 2022, stent en DA', true, NOW(), NOW()),
  ('il789012-3456-7890-1234-567890123456', 'p1234567-8901-2345-6789-012345678901', 'Dislipidemia', '2020-06-10', 'CRONICA', 'Atorvastatina 40mg/noche', 'LDL <100 mg/dL', true, NOW(), NOW()),
  ('il890123-4567-8901-2345-678901234567', 'p1234567-8901-2345-6789-012345678901', 'Fibrilación Auricular', '2023-03-15', 'ACTIVA', 'Warfarina según INR, Metoprolol', 'INR objetivo 2-3', true, NOW(), NOW()),
  
  -- Ana Martínez
  ('il901234-5678-9012-3456-789012345678', 'p2345678-9012-3456-7890-123456789012', 'Lupus Eritematoso Sistémico', '2015-11-30', 'CRONICA', 'Hidroxicloroquina 200mg/día, Prednisona 5mg', 'En remisión, control reumatología c/3 meses', true, NOW(), NOW()),
  ('il012345-6789-0123-4567-890123456789', 'p2345678-9012-3456-7890-123456789012', 'Osteoporosis', '2021-04-12', 'ACTIVA', 'Alendronato 70mg/semana, Calcio + Vit D', 'Densitometría anual', true, NOW(), NOW());

-- SURGERIES for all patients
INSERT INTO surgeries (id, patient_id, name, surgery_date, hospital, surgeon, description, complications, follow_up_required, created_at, updated_at)
VALUES
  -- María García
  ('su123456-7890-1234-5678-901234567890', '6459fdb9-836a-4939-97bc-a4565fdb3833', 'Colecistectomía Laparoscópica', '2017-08-15', 'Clínica del Country', 'Dr. Fernando Gómez', 'Colelitiasis sintomática', ARRAY['Sin complicaciones'], false, NOW(), NOW()),
  ('su234567-8901-2345-6789-012345678901', '6459fdb9-836a-4939-97bc-a4565fdb3833', 'Cesárea', '2019-12-10', 'Clínica La Colina', 'Dra. María Hernández', 'Presentación podálica', ARRAY['Sin complicaciones', 'RN sano'], false, NOW(), NOW()),
  
  -- Juan Pérez
  ('su345678-9012-3456-7890-123456789012', '6ca48b3e-2bbe-4675-bc64-6d9e66cd3d77', 'Apendicectomía', '2015-06-20', 'Hospital San Ignacio', 'Dr. Carlos Mejía', 'Apendicitis aguda', ARRAY['Recuperación sin incidentes'], false, NOW(), NOW()),
  ('su456789-0123-4567-8901-234567890123', '6ca48b3e-2bbe-4675-bc64-6d9e66cd3d77', 'Septoplastia', '2022-03-18', 'Clínica Reina Sofía', 'Dr. Luis Ramírez', 'Desviación septal severa', ARRAY['Mejoría respiratoria significativa'], true, NOW(), NOW()),
  
  -- Carlos Rodríguez
  ('su567890-1234-5678-9012-345678901234', 'p1234567-8901-2345-6789-012345678901', 'Angioplastia Coronaria + Stent', '2022-01-25', 'Fundación Cardioinfantil', 'Dr. Roberto Díaz', 'IAM con elevación ST', ARRAY['Stent medicado en DA proximal'], true, NOW(), NOW()),
  ('su678901-2345-6789-0123-456789012345', 'p1234567-8901-2345-6789-012345678901', 'Hernioplastia Inguinal', '2018-05-10', 'Hospital Militar', 'Dr. Andrés Sánchez', 'Hernia inguinal derecha', ARRAY['Malla de polipropileno', 'sin recidiva'], false, NOW(), NOW()),
  ('su789012-3456-7890-1234-567890123456', 'p1234567-8901-2345-6789-012345678901', 'Prostatectomía Transuretral', '2023-09-15', 'Clínica del Country', 'Dr. Juan Vargas', 'Hiperplasia prostática benigna', ARRAY['Mejoría del flujo urinario'], true, NOW(), NOW()),
  
  -- Ana Martínez
  ('su890123-4567-8901-2345-678901234567', 'p2345678-9012-3456-7890-123456789012', 'Artroscopia de Rodilla', '2020-07-22', 'Clínica Marly', 'Dr. Diego Torres', 'Meniscectomía parcial medial', ARRAY['Rehabilitación exitosa'], false, NOW(), NOW()),
  ('su901234-5678-9012-3456-789012345678', 'p2345678-9012-3456-7890-123456789012', 'Tiroidectomía Parcial', '2016-10-05', 'Hospital San José', 'Dra. Laura Pérez', 'Nódulo tiroideo benigno', ARRAY['Función tiroidea conservada'], true, NOW(), NOW());

-- Generate QR codes for all patients
INSERT INTO patient_qr_codes (id, patient_id, qr_token, is_active, expires_at, access_count, created_at, updated_at)
VALUES
  ('qr123456-7890-1234-5678-901234567890', '6459fdb9-836a-4939-97bc-a4565fdb3833', 'VG-MG-2024-A1B2', true, '2025-12-31', 0, NOW(), NOW()),
  ('qr234567-8901-2345-6789-012345678901', '6ca48b3e-2bbe-4675-bc64-6d9e66cd3d77', 'VG-JP-2024-C3D4', true, '2025-12-31', 0, NOW(), NOW()),
  ('qr345678-9012-3456-7890-123456789012', 'p1234567-8901-2345-6789-012345678901', 'VG-CR-2024-E5F6', true, '2025-12-31', 0, NOW(), NOW()),
  ('qr456789-0123-4567-8901-234567890123', 'p2345678-9012-3456-7890-123456789012', 'VG-AM-2024-G7H8', true, '2025-12-31', 0, NOW(), NOW());

-- Create some QR access logs for testing
INSERT INTO qr_access_logs (id, qr_code_id, accessed_by_user_id, access_type, ip_address, user_agent, success, created_at)
VALUES
  ('log12345-6789-0123-4567-890123456789', 'qr123456-7890-1234-5678-901234567890', 'c3d4e5f6-7890-1234-cdef-345678901234', 'paramedic', '192.168.1.100', 'Mobile App VitalGo', true, NOW()),
  ('log23456-7890-1234-5678-901234567890', 'qr234567-8901-2345-6789-012345678901', 'd4e5f678-9012-3456-def0-456789012345', 'paramedic', '192.168.1.101', 'Web Browser', true, NOW());

-- Summary of test data
SELECT 'Test Data Summary:' as info;
SELECT 'Patients: 4' as count;
SELECT 'Paramedics: 2' as count;
SELECT 'Allergies: 9' as count;
SELECT 'Illnesses: 10' as count;
SELECT 'Surgeries: 9' as count;
SELECT 'QR Codes: 4' as count;