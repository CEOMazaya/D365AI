-- ============================================================================
-- Mazaya RGA Portal — PostgreSQL schema
-- Migration 003: RAID governance — risks, issues, change requests, approvals
-- ----------------------------------------------------------------------------
-- Adds the project-governance backbone the portal was missing:
--   * risks               — risk register with probability × impact scoring
--   * issues              — issue tracker with severity and resolution state
--   * change_requests     — CR log with impact and a standard approval chain
--   * change_request_approvals — one row per approval step, ordered
--
-- Run after 002_seed.sql.
-- ============================================================================

-- ── RISK REGISTER ───────────────────────────────────────────────────────────
-- Standard probability × impact, each Low/Medium/High. A computed severity
-- column derives the heat-map band so reporting doesn't recompute it.
CREATE TYPE risk_level   AS ENUM ('low', 'medium', 'high');
CREATE TYPE risk_status  AS ENUM ('open', 'mitigating', 'closed', 'accepted');

CREATE TABLE risks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  workstream    TEXT,                              -- WSA / WSB / WSC / null = cross
  title         TEXT NOT NULL,
  description   TEXT,
  probability   risk_level NOT NULL DEFAULT 'medium',
  impact        risk_level NOT NULL DEFAULT 'medium',
  -- severity band derived from probability × impact (3x3 -> low/medium/high/critical)
  severity      TEXT GENERATED ALWAYS AS (
    CASE
      WHEN probability = 'high'   AND impact = 'high'   THEN 'critical'
      WHEN probability = 'high'   AND impact = 'medium' THEN 'high'
      WHEN probability = 'medium' AND impact = 'high'   THEN 'high'
      WHEN probability = 'low'    AND impact = 'low'    THEN 'low'
      WHEN probability = 'low'    AND impact = 'medium' THEN 'low'
      WHEN probability = 'medium' AND impact = 'low'    THEN 'low'
      ELSE 'medium'
    END
  ) STORED,
  mitigation    TEXT,
  owner         TEXT,
  status        risk_status NOT NULL DEFAULT 'open',
  target_date   DATE,
  raised_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_risks_project ON risks(project_id);
CREATE INDEX idx_risks_severity ON risks(project_id, severity);
CREATE TRIGGER trg_risks_updated BEFORE UPDATE ON risks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── ISSUE TRACKER ───────────────────────────────────────────────────────────
CREATE TYPE issue_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE issue_status   AS ENUM ('open', 'in_progress', 'resolved', 'closed');

CREATE TABLE issues (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  workstream    TEXT,
  title         TEXT NOT NULL,
  description   TEXT,
  severity      issue_severity NOT NULL DEFAULT 'medium',
  status        issue_status NOT NULL DEFAULT 'open',
  assignee      TEXT,
  linked_risk_id UUID REFERENCES risks(id) ON DELETE SET NULL,   -- a risk that materialised
  target_date   DATE,
  resolution    TEXT,
  raised_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  raised_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_issues_project ON issues(project_id);
CREATE INDEX idx_issues_status ON issues(project_id, status);
CREATE TRIGGER trg_issues_updated BEFORE UPDATE ON issues
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── CHANGE REQUESTS ─────────────────────────────────────────────────────────
-- A CR moves through a fixed approval chain. Its overall status reflects where
-- it is in that chain; per-step detail lives in change_request_approvals.
CREATE TYPE cr_status AS ENUM (
  'draft', 'submitted', 'in_review', 'approved', 'rejected', 'implemented', 'cancelled'
);
CREATE TYPE cr_impact AS ENUM ('low', 'medium', 'high');

CREATE TABLE change_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  cr_number       TEXT,                            -- human ref e.g. CR-001
  title           TEXT NOT NULL,
  description     TEXT,
  workstream      TEXT,
  reason          TEXT,                            -- why the change is needed
  cost_impact     cr_impact NOT NULL DEFAULT 'low',
  schedule_impact cr_impact NOT NULL DEFAULT 'low',
  scope_impact    cr_impact NOT NULL DEFAULT 'low',
  estimated_days  NUMERIC(6,1),                    -- man-day estimate
  -- when cost or schedule impact is high, the chain must include Steering Committee
  needs_steering  BOOLEAN GENERATED ALWAYS AS (
    cost_impact = 'high' OR schedule_impact = 'high'
  ) STORED,
  status          cr_status NOT NULL DEFAULT 'draft',
  linked_issue_id UUID REFERENCES issues(id) ON DELETE SET NULL,
  raised_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_cr_project ON change_requests(project_id);
CREATE INDEX idx_cr_status ON change_requests(project_id, status);
CREATE TRIGGER trg_cr_updated BEFORE UPDATE ON change_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── CHANGE REQUEST APPROVALS ────────────────────────────────────────────────
-- One row per step in the chain, ordered by step_order. The standard chain:
--   1 Consultant (raise)  2 Mazaya PM  3 Customer PM  4 Steering Committee*
--   (* only when needs_steering is true)
CREATE TYPE approval_decision AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE change_request_approvals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cr_id         UUID NOT NULL REFERENCES change_requests(id) ON DELETE CASCADE,
  step_order    SMALLINT NOT NULL,                 -- 1..4
  role_label    TEXT NOT NULL,                     -- 'Mazaya PM', 'Customer PM', 'Steering Committee'
  approver_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  approver_name TEXT,
  decision      approval_decision NOT NULL DEFAULT 'pending',
  comment       TEXT,
  decided_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cr_id, step_order)
);
CREATE INDEX idx_cra_cr ON change_request_approvals(cr_id);
CREATE TRIGGER trg_cra_updated BEFORE UPDATE ON change_request_approvals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
