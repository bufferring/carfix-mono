-- Run this in Supabase SQL Editor to create admin user
-- Email: manny@carfixve.app
-- Password: r00tr00t

INSERT INTO users (name, email, password, role, is_verified, is_active)
VALUES (
  'Manny Admin',
  'manny@carfixve.app',
  '$2b$10$lrQhvcueJtnb5kfhdlVLlumjK62Duefb2/xW9uDoyBbImbdk76Qvi',
  'admin',
  true,
  true
)
ON CONFLICT (email) DO NOTHING;
