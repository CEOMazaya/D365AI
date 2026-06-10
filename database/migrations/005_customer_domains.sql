-- ============================================================================
-- Mazaya RGA Portal — PostgreSQL schema
-- Migration 005: multi-customer onboarding — customer email domains
-- ----------------------------------------------------------------------------
-- Supports many customers, each with one or more projects, under multi-tenant
-- Entra ID sign-in. A customer user's email domain maps them to their customer
-- on first sign-in. Unknown domains land the user in a 'pending' state for a
-- Mazaya Admin to assign manually.
--
-- Run after 004_state.sql.
-- ============================================================================

-- One or more email domains per customer (e.g. 'kbm.com.kw').
CREATE TABLE customer_domains (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  domain      TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (domain)                      -- a domain belongs to exactly one customer
);
CREATE INDEX idx_customer_domains_customer ON customer_domains(customer_id);

-- Allow users to be parked pending customer assignment. The users.status enum
-- gains a 'pending' value; such users authenticate but see nothing until a
-- Mazaya Admin assigns their customer and activates them.
ALTER TYPE user_status ADD VALUE IF NOT EXISTS 'pending';
