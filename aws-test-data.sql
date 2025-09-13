-- VitalGo Test Data Script
-- Datos de prueba para desarrollo y testing

-- Limpiar datos existentes (excepto EPS y admin)
DELETE FROM qr_access_logs;
DELETE FROM patient_qr_codes;
DELETE FROM surgeries;
DELETE FROM illnesses;
DELETE FROM allergies;
DELETE FROM paramedics;
DELETE FROM patients;
DELETE FROM users WHERE email != 'admin@vitalgo.app';

-- Insertar usuarios de prueba
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, status, email_verified, created_at) VALUES
-- Pacientes
('550e8400-e29b-41d4-a716-446655440001', 'maria.garcia@email.com', '$2b$12$kH7/iZxdkJ3.XsxI6yQBr.vFnxBmGQB4.z8OY7Qx0YPmVGHwFDqIq', 'María', 'García', '+573001234567', 'patient', 'active', true, NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'carlos.lopez@email.com', '$2b$12$kH7/iZxdkJ3.XsxI6yQBr.vFnxBmGQB4.z8OY7Qx0YPmVGHwFDqIq', 'Carlos', 'López', '+573009876543', 'patient', 'active', true, NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'ana.rodriguez@email.com', '$2b$12$kH7/iZxdkJ3.XsxI6yQBr.vFnxBmGQB4.z8OY7Qx0YPmVGHwFDqIq', 'Ana', 'Rodríguez', '+573005555555', 'patient', 'active', true, NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'luis.martinez@email.com', '$2b$12$kH7/iZxdkJ3.XsxI6yQBr.vFnxBmGQB4.z8OY7Qx0YPmVGHwFDqIq', 'Luis', 'Martínez', '+573007777777', 'patient', 'active', true, NOW()),
-- Paramédicos
('550e8400-e29b-41d4-a716-446655440005', 'dr.fernandez@email.com', '$2b$12$kH7/iZxdkJ3.XsxI6yQBr.vFnxBmGQB4.z8OY7Qx0YPmVGHwFDqIq', 'Roberto', 'Fernández', '+573002222222', 'paramedic', 'active', true, NOW()),
('550e8400-e29b-41d4-a716-446655440006', 'dra.morales@email.com', '$2b$12$kH7/iZxdkJ3.XsxI6yQBr.vFnxBmGQB4.z8OY7Qx0YPmVGHwFDqIq', 'Patricia', 'Morales', '+573003333333', 'paramedic', 'active', true, NOW());

-- Insertar pacientes con información médica completa
INSERT INTO patients (id, user_id, document_type, document_number, birth_date, gender, blood_type, eps_id, emergency_contact_name, emergency_contact_phone, address, city, medical_profile_completed, created_at) VALUES
('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'CC', '12345678', '1985-03-15', 'F', 'O+', (SELECT id FROM eps WHERE name = 'SURA' LIMIT 1), 'Juan García', '+573001111111', 'Calle 123 #45-67', 'Bogotá', true, NOW()),
('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'CC', '87654321', '1978-08-22', 'M', 'A+', (SELECT id FROM eps WHERE name = 'Nueva EPS' LIMIT 1), 'Elena López', '+573002222222', 'Carrera 88 #12-34', 'Medellín', true, NOW()),
('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'CC', '11223344', '1992-12-05', 'F', 'B+', (SELECT id FROM eps WHERE name = 'Sanitas' LIMIT 1), 'Miguel Rodríguez', '+573003333333', 'Avenida 6 #78-90', 'Cali', true, NOW()),
('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'CC', '55667788', '1990-06-10', 'M', 'AB-', (SELECT id FROM eps WHERE name = 'Compensar' LIMIT 1), 'Carmen Martínez', '+573004444444', 'Transversal 15 #23-45', 'Barranquilla', true, NOW());

-- Insertar paramédicos
INSERT INTO paramedics (id, user_id, license_number, certification_level, institution, experience_years, specialties, is_verified, verification_date, created_at) VALUES
('750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440005', 'MED-12345', 'Paramédico Avanzado', 'Universidad Nacional', 8, ARRAY['Emergencias', 'Cardiología', 'Trauma'], true, NOW(), NOW()),
('750e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440006', 'MED-67890', 'Técnico en Emergencias', 'Universidad Javeriana', 5, ARRAY['Primeros Auxilios', 'Pediatría'], true, NOW(), NOW());

-- Insertar alergias
INSERT INTO allergies (id, patient_id, allergen, severity, symptoms, treatment, diagnosed_date, notes, created_at) VALUES
('850e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 'Penicilina', 'high', 'Rash cutáneo, dificultad respiratoria', 'Evitar penicilina, usar eritromicina como alternativa', '2020-01-15', 'Reacción severa confirmada por alergólogo', NOW()),
('850e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440001', 'Mariscos', 'critical', 'Anafilaxia', 'EpiPen siempre disponible', '2019-05-10', 'Porta EpiPen en todo momento', NOW()),
('850e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440002', 'Polen', 'low', 'Estornudos, congestión nasal', 'Antihistamínicos en temporada de polen', '2021-03-20', 'Alergia estacional', NOW()),
('850e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440003', 'Ibuprofeno', 'medium', 'Dolor de estómago, náuseas', 'Evitar IBP, usar acetaminofén', '2022-08-15', 'Intolerancia gástrica', NOW());

-- Insertar enfermedades
INSERT INTO illnesses (id, patient_id, name, cie10_code, diagnosed_date, status, symptoms, treatment, prescribed_by, notes, is_chronic, created_at) VALUES
('950e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 'Hipertensión Arterial', 'I10', '2018-04-12', 'CONTROLADA', 'Dolor de cabeza, mareos', 'Losartán 50mg diario', 'Dr. Ramírez - Cardiología', 'Control cada 6 meses', true, NOW()),
('950e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440002', 'Diabetes Tipo 2', 'E11', '2019-11-08', 'CONTROLADA', 'Sed excesiva, fatiga', 'Metformina 500mg 2 veces al día', 'Dra. González - Endocrinología', 'Dieta controlada y ejercicio regular', true, NOW()),
('950e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440003', 'Asma Bronquial', 'J45', '2015-02-18', 'CONTROLADA', 'Dificultad respiratoria, tos', 'Salbutamol inhalador de rescate', 'Dr. Herrera - Neumología', 'Evitar alérgenos ambientales', true, NOW()),
('950e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440004', 'Gastritis Crónica', 'K29.5', '2020-07-25', 'CONTROLADA', 'Dolor epigástrico, acidez', 'Omeprazol 20mg en ayunas', 'Dr. Vega - Gastroenterología', 'Dieta blanda, evitar condimentos', true, NOW()),
('950e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440001', 'COVID-19', 'U07.1', '2023-01-10', 'CURADA', 'Fiebre, tos, pérdida del olfato', 'Aislamiento, paracetamol, vitaminas', 'Dr. Silva - Medicina General', 'Recuperación completa sin secuelas', false, NOW());

-- Insertar cirugías
INSERT INTO surgeries (id, patient_id, name, surgery_date, surgeon, hospital, description, diagnosis, anesthesia_type, surgery_duration_minutes, notes, created_at) VALUES
('a50e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440002', 'Apendicectomía', '2020-09-15', 'Dr. Mendoza', 'Hospital San Ignacio', 'Extracción de apéndice inflamado', 'Apendicitis aguda', 'General', 45, 'Cirugía sin complicaciones, recuperación normal', NOW()),
('a50e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440003', 'Colecistectomía Laparoscópica', '2021-06-22', 'Dra. Ruiz', 'Clínica Shaio', 'Extracción de vesícula biliar por laparoscopia', 'Colelitiasis sintomática', 'General', 90, 'Técnica mínimamente invasiva, alta al día siguiente', NOW()),
('a50e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440004', 'Reparación de Hernia Inguinal', '2022-03-08', 'Dr. Castillo', 'Hospital Militar', 'Corrección de hernia inguinal derecha', 'Hernia inguinal indirecta', 'Raquídea', 60, 'Colocación de malla, evolución satisfactoria', NOW());

-- Insertar códigos QR para pacientes
INSERT INTO patient_qr_codes (id, patient_id, qr_token, expires_at, is_active, access_count, created_at) VALUES
('b50e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 'QR_MARIA_GARCIA_001', NOW() + INTERVAL '1 year', true, 0, NOW()),
('b50e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440002', 'QR_CARLOS_LOPEZ_002', NOW() + INTERVAL '1 year', true, 0, NOW()),
('b50e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440003', 'QR_ANA_RODRIGUEZ_003', NOW() + INTERVAL '1 year', true, 0, NOW()),
('b50e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440004', 'QR_LUIS_MARTINEZ_004', NOW() + INTERVAL '1 year', true, 0, NOW());

-- Insertar logs de acceso QR (simulando algunos accesos)
INSERT INTO qr_access_logs (id, qr_code_id, accessed_by_user_id, access_type, ip_address, user_agent, success, created_at) VALUES
('c50e8400-e29b-41d4-a716-446655440001', 'b50e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440005', 'emergency_access', '192.168.1.100', 'Mozilla/5.0 Emergency Access', true, NOW() - INTERVAL '2 days'),
('c50e8400-e29b-41d4-a716-446655440002', 'b50e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440006', 'medical_review', '192.168.1.101', 'Mozilla/5.0 Medical App', true, NOW() - INTERVAL '1 day');

COMMIT;