# D365AI

Two related deliverables for Mazaya's Dynamics 365 practice:

1. **RGA Portal** (`portal/`) — a React app for Dynamics 365 requirements
   gathering: customers, projects, questionnaires, fit-gap analysis, workshop
   sessions with recordings & transcripts, minutes of meeting, escalations, and
   role-based access for nine user types.
2. **Database** (`database/`) — the PostgreSQL schema that backs the portal.

> The AI configuration agent (the MCP server, orchestrator, X++ services, and
> Azure deployment kit) lives in its own delivery and is referenced from
> `docs/`.

## Repo layout

```
D365AI/
├── portal/                  React + Vite app
│   ├── src/
│   │   ├── MazayaRGA_Portal.jsx   the portal (single-file component tree)
│   │   ├── assets.js              Mazaya logo + hero robot SVGs
│   │   ├── storage-shim.js        window.storage backed by localStorage
│   │   └── main.jsx               entry point
│   ├── public/                    logo + hero SVG files, favicon
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── backend/                 ASP.NET Core 8 API (PostgreSQL + Entra ID)
│   ├── Program.cs
│   ├── Models/ Data/ Auth/ Controllers/
│   └── README.md
├── database/
│   ├── migrations/
│   │   ├── 001_init.sql           schema
│   │   ├── 002_seed.sql           seed users + default O365 row
│   │   ├── 003_raid.sql           risks, issues, change requests, approvals
│   │   └── 004_state.sql          state document store (blob bridge)
│   └── README.md
├── docs/
│   ├── PORTAL_FEATURES.md         full feature inventory
│   └── ARCHITECTURE.md            how the pieces fit + roadmap
└── README.md
```

## Run the portal

```bash
cd portal
npm install
npm run dev          # http://localhost:5173
```

Sign in with any seeded account (e.g. `admin@mazayasolutions.com`) via the
"Demo — select account" list on the login screen, or the Microsoft 365 button.

## Apply the database

```bash
createdb mazaya_rga
psql -d mazaya_rga -f database/migrations/001_init.sql
psql -d mazaya_rga -f database/migrations/002_seed.sql
psql -d mazaya_rga -f database/migrations/003_raid.sql
```

## What's included in the portal

- **Mazaya branding** — the clean logo on login, nav, and footer; the hero
  robot on the home page.
- **AI guide** — a floating assistant (bottom-right) that explains every screen
  and the BA process. Self-contained today; a `callLiveAgent` hook is left in
  place to connect it to the live agent later.
- **Sessions with recordings & transcripts** — once a session is completed, add
  its recording link and full transcript; both persist for later review.
- **RAID governance** — Risks (probability × impact register), Issues (tracker
  with severity and resolution), and Change Requests with a standard approval
  chain (Mazaya PM → Customer PM → Steering Committee when impact is high).
- **O365 credentials** — Admin Panel → O365 Credentials stores the Entra ID
  app registration (tenant, client, secret, D365 URL). In production the secret
  belongs in Key Vault; the DB column holds a vault reference.

See `docs/PORTAL_FEATURES.md` for the complete inventory.

## Deploying

- Portal → Azure Static Web Apps: see `docs/DEPLOY_PORTAL_AZURE.md` (free tier).
- Agent / MCP server → Azure Container Apps: see the agent's `DEPLOY.md`.
- Backend API → Azure Container Apps + Azure Database for PostgreSQL: see `backend/README.md`.
