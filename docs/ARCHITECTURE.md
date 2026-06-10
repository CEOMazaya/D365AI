# Architecture

## Today
The portal is a single-page React app (Vite). All state persists to the browser
via a `window.storage` API, shimmed onto `localStorage` in `storage-shim.js`.
This makes the portal fully runnable with no backend — clone, `npm install`,
`npm run dev`.

Storage keys:
- `mz_db_v1` — customers → projects → questionnaire/data/sessions/MOM/escalations
- `mz_usr_v1` — users
- `mz_ses_v1` — current login session
- `mz_o365_v1` — O365 credentials

## Server-side (now built)

The `backend/` folder holds an ASP.NET Core 8 API: EF Core + Npgsql against the
PostgreSQL schema, Entra ID JWT auth, and both a `/api/state` blob bridge and
relational controllers. The portal's `storage-shim.js` now targets the backend
when `VITE_*` env vars are set, and falls back to localStorage otherwise. See
`backend/README.md`.

## Original plan (for reference)
The PostgreSQL schema in `database/` mirrors this model. The planned path:

1. Add a .NET backend exposing REST endpoints for each entity.
2. Replace the bodies of the `window.storage` shim methods with `fetch()` calls
   to that backend — the portal components don't change, only the shim.
3. Move O365 client secrets into Key Vault; the DB stores only a vault reference.
4. Connect the AI guide's `callLiveAgent` hook to the deployed MCP/Anthropic
   agent so it can answer live D365 configuration questions, not just portal
   navigation.

## Relationship to the AI configuration agent
The configuration agent (MCP server, orchestrator, X++ services, Azure kit) is a
separate delivery. The portal's approval-gate and progress screens are designed
to surface that agent's runs; the AI guide is the first touchpoint, with the
live hook reserved for connecting them.
