-- ============================================================================
-- Mazaya RGA Portal — PostgreSQL schema
-- Migration 004: state_documents — shared document store for the portal bridge
-- ----------------------------------------------------------------------------
-- Backs the portal's storage API (mz_db_v1, mz_usr_v1, mz_ses_v1, mz_o365_v1)
-- with one shared server-side row per key, so all users see the same data
-- without changing any portal screen. Optional: only needed if you deploy the
-- backend using the "blob bridge" path. The relational tables (001/003) remain
-- the long-term target.
-- ============================================================================

CREATE TABLE IF NOT EXISTS state_documents (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_state_documents_updated BEFORE UPDATE ON state_documents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
