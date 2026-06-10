-- ============================================================================
-- Mazaya RGA Portal — seed data
-- Migration 002: the four Mazaya internal users the portal ships with.
-- Run after 001_init.sql.
-- ============================================================================

INSERT INTO users (name, email, user_type, org, job_title, status) VALUES
  ('Mazaya Admin',     'admin@mazayasolutions.com', 'mazaya_admin',      'mazaya', 'System Administrator',  'active'),
  ('Ahmad Al-Rashidi', 'ahmad@mazayasolutions.com', 'mazaya_pm',         'mazaya', 'Project Manager',       'active'),
  ('Sara Khalid',      'sara@mazayasolutions.com',  'mazaya_consultant', 'mazaya', 'Functional Consultant', 'active'),
  ('Tariq Hassan',     'tariq@mazayasolutions.com', 'mazaya_architect',  'mazaya', 'Solution Architect',    'active')
ON CONFLICT (email) DO NOTHING;

-- A single default O365 credential row, unconfigured. The Admin → O365
-- Credentials screen populates it; client_secret_ref holds a Key Vault URI.
INSERT INTO o365_credentials (environment, configured) VALUES
  ('default', FALSE)
ON CONFLICT (environment) DO NOTHING;
