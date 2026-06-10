# Portal feature inventory

## Authentication & access
- O365 login screen (simulated Microsoft 365 flow + manual account picker)
- 9 user roles: 4 Mazaya (Admin, PM, Consultant, Architect) + 5 customer (PM, Coordinator, Finance Lead, IT Manager, Viewer)
- 13 granular privileges across Admin / Access / Project groups, with per-user overrides
- Session persistence across reloads

## Admin panel
- User management — create, edit, deactivate, delete; privilege overrides
- Role reference matrix
- **O365 Credentials** — Entra ID tenant/client/secret + D365 URL (NEW)
- Audit log

## Customer & project management
- Customer portfolio with search and summary stats
- Welcome **hero with the Mazaya robot** on the home page (NEW)
- New customer / new project guided forms
- Project workspace with 7 role-filtered tabs
- D365 PO reference badge

## Project workspace tabs
- Overview — progress rings, workstream status, vitals
- Questionnaire — As-Is / Rules / Exception / To-Be questions with fit-gap coding
- Data Collection — prerequisite items with upload / approve / escalate
- Sessions — scheduling with Outlook/Teams invites, plus **recording link + transcript on completed sessions** (NEW)
- MOM — minutes of meeting with decisions, findings, actions
- Escalations — L1–L4 matrix with owners and SLAs
- Risks — risk register with probability × impact severity, mitigation, ownership (NEW)
- Issues — issue tracker with severity, assignee, status, resolution notes (NEW)
- Change Requests — CR log with cost/schedule/scope impact and a standard approval chain: Mazaya PM → Customer PM → Steering Committee (when high impact) (NEW)
- Timeline — 8 phases, 10 milestones, 3 parallel workstreams

## Domain model
- 3 workstreams: WS-A Finance (183 man-days), WS-B HRMS, WS-C CRM
- Seeded questions across GL / SCM and other modules
- Fit-gap codes: F / CF / WA / G / OOS

## AI guide (NEW)
- Floating assistant, bottom-right, available once signed in
- Self-contained knowledge of every screen and the five-stage BA cycle
- Answers free-text questions and offers suggested prompts
- `callLiveAgent` hook left in place to wire to the live MCP/Anthropic agent later
