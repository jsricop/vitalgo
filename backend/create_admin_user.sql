-- Create admin user for VitalGo
-- User: admin
-- Pass: VTG2025

-- Insert admin user
INSERT INTO users (
    id, 
    email, 
    password_hash, 
    first_name, 
    last_name, 
    phone, 
    role, 
    is_active, 
    created_at, 
    updated_at
) VALUES (
    gen_random_uuid(), 
    'admin@vitalgo.com',
    '9c3efcd9f2c0bba8b78d4b87c0a2d6bc5b6e845e4ba4e68f9b1d4ec4b8e9a4c7', -- SHA-256 hash of "VTG2025"
    'Administrador',
    'VitalGo',
    '3001234567',
    'admin',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- Show the created admin user
SELECT id, email, first_name, last_name, role, is_active, created_at 
FROM users 
WHERE email = 'admin@vitalgo.com';