-- Create admin user for CarFix
-- Email: manny@carfixve.app
-- Password: r00tr00t (will be hashed by the application)

-- Note: The password hash below is bcrypt hash for 'r00tr00t' with salt rounds 10
-- Generated using: bcrypt.hash('r00tr00t', 10)
-- You'll need to run this through your backend or use the registration endpoint

INSERT INTO users (
    name,
    email,
    password,
    role,
    is_verified,
    is_active,
    created_at
) VALUES (
    'Manny Admin',
    'manny@carfixve.app',
    '$2a$10$YourHashWillGoHere', -- This will be replaced by the setup script
    'admin',
    true,
    true,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- Note: Run the setup script to properly hash the password
