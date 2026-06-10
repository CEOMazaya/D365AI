# Mazaya RGA Portal — Database

PostgreSQL schema backing the portal. Today the portal persists to browser
storage; this schema is what the .NET backend will read and write when the
portal moves server-side.

## Apply

```bash
createdb mazaya_rga
psql -d mazaya_rga -f migrations/001_init.sql
psql -d mazaya_rga -f migrations/002_seed.sql
psql -d mazaya_rga -f migrations/003_raid.sql
psql -d mazaya_rga -f migrations/004_state.sql
psql -d mazaya_rga -f migrations/005_customer_domains.sql
```

## Tables

| Table | Holds |
|---|---|
| `users` | 9 roles across Mazaya + customer orgs, with per-user privilege overrides |
| `customers` | Customer companies |
| `projects` | D365 implementation projects, workstreams, D365 PO reference |
| `questionnaire_responses` | One row per question: As-Is/Rules/Exception/To-Be + fit-gap code |
| `data_items` | Prerequisite data collection items with upload/approval state |
| `sessions` | Workshop sessions incl. `recording_url` and `transcript` |
| `moms` | Minutes of meeting (decisions, findings, actions as JSONB) |
| `escalations` | L1–L4 escalation matrix entries |
| `risks` | Risk register — probability × impact, computed severity, mitigation |
| `issues` | Issue tracker — severity, assignee, status, resolution |
| `change_requests` | Change requests — cost/schedule/scope impact, approval status |
| `change_request_approvals` | One row per approval step in the CR chain |
| `o365_credentials` | Entra ID app registration per environment (secret stored as a Key Vault reference, never raw) |
| `audit_log` | Append-only activity trail |
| `state_documents` | Shared document store for the portal blob bridge (Mazaya-only) |
| `customer_domains` | Email domain → customer mapping for multi-tenant onboarding |

## Notes

- UUID primary keys; `created_at` / `updated_at` maintained by the `set_updated_at` trigger.
- Enums encode the portal's fixed vocabularies (roles, fit-gap codes, statuses, escalation levels).
- `o365_credentials.client_secret_ref` is deliberately a **reference** (Key Vault URI), so the raw secret never lives in the database.
- The questionnaire is a first-class table (queryable, joinable, fit-gap reporting) rather than a JSON blob; MOM sub-lists stay JSONB since they're always read with their parent.
