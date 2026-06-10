# Mazaya RGA Portal — backend API

ASP.NET Core 8 Web API that gives the portal shared, server-side data backed by
PostgreSQL, with Entra ID (Azure AD) authentication.

> **Not compiled in this environment.** Unlike the portal (Vite build verified)
> and the SQL (parsed against PostgreSQL), there's no .NET SDK here and NuGet is
> blocked, so this code is written carefully but has **not** been compiled. Your
> first `dotnet build` / `dotnet run` on a machine with the .NET 8 SDK is the
> real verification step. Treat any compile error there as expected first-run
> cleanup, not a redesign.

## What it provides

- **Entra ID auth** — validates JWT bearer tokens from your tenant. The portal
  acquires the token via MSAL and sends it on every request.
- **Identity → role/customer (multi-tenant)** — on first sign-in a user row is
  provisioned. Mazaya staff (`@mazayasolutions.com`) get org `mazaya`. Customer
  users are matched to their customer by **email domain** (the `customer_domains`
  table); an unknown domain parks the user as `pending` for a Mazaya Admin to
  assign. Adjust this policy in `Auth/CurrentUserService.cs`.
- **Per-customer data isolation** — `Auth/AccessGuard.cs` enforces that a
  customer user only ever sees their own customer's customers, projects, risks,
  issues, change requests, sessions, etc. Cross-customer access returns 403.
  Mazaya staff see all customers. This is applied on every customer- and
  project-scoped endpoint.
- **Two data paths:**
  1. **Blob bridge** (`/api/state/{key}`) — stores the portal's existing JSON
     documents (mz_db_v1, …) as shared server-side rows. Simplest route to
     shared data, but it stores the WHOLE dataset as one document and therefore
     **cannot isolate customers** — so with multiple customers it is restricted
     to Mazaya staff only. Customer-facing multi-tenant use needs the relational
     endpoints below.
  2. **Relational endpoints** — first-class controllers for customers,
     projects, risks, issues, change requests (+ approval workflow), sessions,
     data items, escalations, questionnaire, MOM, users, and O365 credentials.
     Use these when you want SQL-level querying/reporting.

## Run locally

Prerequisites: .NET 8 SDK, a PostgreSQL instance with the migrations applied.

```bash
# 1. apply the schema (from repo root)
psql -d mazaya_rga -f database/migrations/001_init.sql
psql -d mazaya_rga -f database/migrations/002_seed.sql
psql -d mazaya_rga -f database/migrations/003_raid.sql
psql -d mazaya_rga -f database/migrations/004_state.sql      # only if using the blob bridge
psql -d mazaya_rga -f database/migrations/005_customer_domains.sql

# 2. set the connection string + Entra ID values
#    edit backend/appsettings.json (or use user-secrets / env vars)

# 3. run
cd backend
dotnet restore
dotnet run
# API on http://localhost:5xxx, Swagger at /swagger in Development
```

Point the portal at it: copy `portal/.env.example` to `portal/.env.local`, fill
in `VITE_API_BASE_URL` and the three `VITE_AAD_*` values, and `npm run dev`.
With those set the portal authenticates and reads/writes the backend; without
them it falls back to localStorage (offline demo).

## Configuration

`appsettings.json`:
- `ConnectionStrings:Postgres` — the database. On Azure, back this with a Key
  Vault reference, not a literal password.
- `AzureAd` — `TenantId`, `ClientId`, and `Audience` of the API's app
  registration.
- `Cors:Origins` — the portal's origin(s), e.g. the Static Web App URL.

## Entra ID app registrations

You need **two** registrations:
1. **API** — exposes a scope (e.g. `access_as_user`). Its client ID is the
   API's `AzureAd:ClientId` and `Audience`.
2. **Portal (SPA)** — has a redirect URI of the Static Web App origin and API
   permission to the scope above. Its client ID is the portal's
   `VITE_AAD_CLIENT_ID`; the scope string is `VITE_API_SCOPE`.

For **multiple customers**, register the apps as **multi-tenant** ("Accounts in
any organizational directory") so users from each customer's own Microsoft 365
tenant can sign in. Authorization is handled in-app: a customer user is scoped to
the customer matching their email domain. Onboard a new customer by adding its
customer record and registering its email domain(s) (Admin → customer domains,
or `POST /api/customers/{id}/domains`); their people can then self-onboard on
first sign-in. Anyone whose domain isn't registered lands as `pending` for a
Mazaya Admin to assign.

## Deploy to Azure (Container Apps)

```bash
# build & push the image (replace registry/names)
az acr build -r <registry> -t mazaya-rga-api:latest backend/

# create the Container App pointing at the image, then set app settings:
#   ConnectionStrings__Postgres  -> Key Vault reference to the PG connection string
#   AzureAd__TenantId / AzureAd__ClientId / AzureAd__Audience
#   Cors__Origins__0             -> https://<your-static-web-app>.azurestaticapps.net
# grant the Container App a managed identity and Key Vault access for secrets.
```

Database: **Azure Database for PostgreSQL Flexible Server**, with the migrations
applied via `psql`. Restrict its firewall to the Container App.

## Project layout

```
backend/
├── Mazaya.Rga.Api.csproj   net8.0; Npgsql EF Core, Microsoft.Identity.Web, Swashbuckle
├── Program.cs              DI: DbContext, Entra ID auth, CORS, controllers, /health
├── Models/Entities.cs      entities mapped 1:1 to the SQL schema
├── Data/RgaDbContext.cs    DbSets, snake_case mapping, computed-column handling
├── Auth/CurrentUserService.cs   token → portal user (first-sign-in provisioning)
└── Controllers/
    ├── AuthController.cs            GET /api/auth/me
    ├── CustomersController.cs       customers CRUD
    ├── ProjectsController.cs        projects (+ nested load)
    ├── ProjectChildControllers.cs   risks, issues, sessions, data-items, escalations, questionnaire, moms
    ├── ChangeRequestsController.cs  CRs + sequential approval chain
    ├── O365CredentialsController.cs O365 config (secret as Key Vault ref)
    ├── UsersController.cs           admin user management
    └── StateController.cs           /api/state blob bridge
```
