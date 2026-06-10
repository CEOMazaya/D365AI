-- ============================================================================
-- Mazaya RGA Portal — PostgreSQL schema
-- Migration 001: initial schema
-- ----------------------------------------------------------------------------
-- Backs the portal currently persisted in browser storage (mz_db_v1, mz_usr_v1,
-- mz_ses_v1, mz_o365_v1). When the .NET backend is added, it reads/writes these
-- tables instead of window.storage.
--
-- Conventions:
--   * UUID primary keys (gen_random_uuid)
--   * snake_case columns
--   * created_at / updated_at on every table, kept current by a trigger
--   * JSONB for the semi-structured questionnaire/MOM payloads that mirror the
--     portal's nested objects, with first-class tables for the entities that
--     are queried and joined (users, customers, projects, sessions, etc.)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()

-- updated_at trigger ---------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- USERS & ACCESS
-- ============================================================================
CREATE TYPE org_type AS ENUM ('mazaya', 'customer');
CREATE TYPE user_status AS ENUM ('active', 'inactive');

-- The nine roles from the portal's USER_TYPES.
CREATE TYPE user_role AS ENUM (
  'mazaya_admin', 'mazaya_pm', 'mazaya_consultant', 'mazaya_architect',
  'customer_pm', 'customer_coordinator', 'customer_finance_lead',
  'customer_it', 'customer_viewer'
);

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  user_type       user_role NOT NULL,
  org             org_type NOT NULL,
  customer_id     UUID,                          -- FK added after customers table
  job_title       TEXT,
  status          user_status NOT NULL DEFAULT 'active',
  workstream_scope TEXT[] NOT NULL DEFAULT '{}', -- e.g. {WSA,WSB}
  custom_privs    JSONB,                         -- per-user privilege overrides; NULL = role defaults
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_org ON users(org);
CREATE INDEX idx_users_customer ON users(customer_id);
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- CUSTOMERS & PROJECTS
-- ============================================================================
CREATE TABLE customers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  ref         TEXT,                              -- customer reference code
  industry    TEXT,
  country     TEXT,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_customers_updated BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- now that customers exists, link users.customer_id
ALTER TABLE users
  ADD CONSTRAINT fk_users_customer
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;

CREATE TYPE project_status AS ENUM ('not_started', 'in_progress', 'on_hold', 'completed');

CREATE TABLE projects (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id          UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL,
  status               project_status NOT NULL DEFAULT 'not_started',
  selected_workstreams TEXT[] NOT NULL DEFAULT '{}',  -- {WSA,WSB,WSC}
  d365_project_id      TEXT,                            -- Dynamics PO reference
  mazaya_pm            TEXT,
  start_date           DATE,
  go_live_date         DATE,
  created_by           UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_projects_customer ON projects(customer_id);
CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- QUESTIONNAIRE
-- One row per (project, workstream, module, question) response.
-- ============================================================================
CREATE TYPE fitgap_code AS ENUM ('', 'F', 'CF', 'WA', 'G', 'OOS');

CREATE TABLE questionnaire_responses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  workstream    TEXT NOT NULL,                   -- WSA / WSB / WSC
  module_code   TEXT NOT NULL,                   -- GL, AP, ...
  question_key  TEXT NOT NULL,                   -- stable id of the question
  dimension     TEXT NOT NULL,                   -- As-Is / Rules / Exception / To-Be
  question_text TEXT NOT NULL,
  response      TEXT,
  fitgap        fitgap_code NOT NULL DEFAULT '',
  notes         TEXT,
  answered_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, workstream, module_code, question_key)
);
CREATE INDEX idx_qr_project ON questionnaire_responses(project_id);
CREATE INDEX idx_qr_fitgap ON questionnaire_responses(project_id, fitgap);
CREATE TRIGGER trg_qr_updated BEFORE UPDATE ON questionnaire_responses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- DATA COLLECTION (prerequisite data items)
-- ============================================================================
CREATE TYPE data_item_status AS ENUM ('pending', 'uploaded', 'approved', 'rejected');

CREATE TABLE data_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  workstream   TEXT,
  title        TEXT NOT NULL,
  description  TEXT,
  status       data_item_status NOT NULL DEFAULT 'pending',
  target_date  DATE,
  file_url     TEXT,                             -- blob/SharePoint link once uploaded
  uploaded_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_data_items_project ON data_items(project_id);
CREATE TRIGGER trg_data_items_updated BEFORE UPDATE ON data_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- SESSIONS (+ recording & transcript)
-- ============================================================================
CREATE TYPE session_status AS ENUM ('scheduled', 'completed', 'cancelled');

CREATE TABLE sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  workstream       TEXT,                          -- WSA / WSB / WSC
  ba_stage         SMALLINT,                      -- 1..5
  session_date     DATE NOT NULL,
  start_time       TIME,
  duration_minutes INT,
  location         TEXT,
  attendees        TEXT,                          -- comma-separated emails
  agenda           TEXT,
  reminder_minutes INT,
  status           session_status NOT NULL DEFAULT 'scheduled',
  outlook_event_id TEXT,
  teams_link       TEXT,
  recording_url    TEXT,                          -- Teams/Stream recording link
  transcript       TEXT,                          -- full meeting transcript
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sessions_project ON sessions(project_id);
CREATE INDEX idx_sessions_date ON sessions(session_date);
CREATE TRIGGER trg_sessions_updated BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- MINUTES OF MEETING
-- ============================================================================
CREATE TABLE moms (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  session_id    UUID REFERENCES sessions(id) ON DELETE SET NULL,
  session_title TEXT,
  workstream    TEXT,
  mom_date      DATE,
  facilitator   TEXT,
  attendees     TEXT,
  summary       TEXT,
  decisions     JSONB NOT NULL DEFAULT '[]',     -- [{text, ...}]
  findings      JSONB NOT NULL DEFAULT '[]',
  actions       JSONB NOT NULL DEFAULT '[]',     -- [{text, owner, due, done}]
  distributed   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_moms_project ON moms(project_id);
CREATE TRIGGER trg_moms_updated BEFORE UPDATE ON moms
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- ESCALATIONS
-- ============================================================================
CREATE TYPE escalation_level AS ENUM ('L1', 'L2', 'L3', 'L4');
CREATE TYPE escalation_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');

CREATE TABLE escalations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  level       escalation_level NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  owner       TEXT,
  status      escalation_status NOT NULL DEFAULT 'open',
  raised_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  raised_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_escalations_project ON escalations(project_id);
CREATE TRIGGER trg_escalations_updated BEFORE UPDATE ON escalations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- O365 / ENTRA ID CREDENTIALS (one row per environment)
-- The client secret column holds a Key Vault *reference*, never the raw secret.
-- ============================================================================
CREATE TABLE o365_credentials (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  environment         TEXT NOT NULL DEFAULT 'default',   -- DEV/UAT/PROD/default
  tenant_id           TEXT,
  client_id           TEXT,
  client_secret_ref   TEXT,                               -- Key Vault secret URI, NOT the secret
  d365_environment_url TEXT,
  graph_scopes        TEXT DEFAULT 'https://graph.microsoft.com/.default',
  configured          BOOLEAN NOT NULL DEFAULT FALSE,
  updated_by          UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (environment)
);
CREATE TRIGGER trg_o365_updated BEFORE UPDATE ON o365_credentials
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- AUDIT LOG
-- ============================================================================
CREATE TABLE audit_log (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_email TEXT,
  action      TEXT NOT NULL,                     -- e.g. 'user.create', 'project.update'
  entity_type TEXT,                              -- 'user' | 'project' | ...
  entity_id   UUID,
  detail      JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
