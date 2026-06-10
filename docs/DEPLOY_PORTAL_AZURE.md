# Deploying the portal to Azure Static Web Apps

This is the runbook for hosting the RGA portal on Azure. The portal is a static
React build today (all data in browser storage, no backend), so the only Azure
resource it needs is a **Static Web App** — which has a free tier that covers
this fully.

> Not run from here. These steps run in your own Azure subscription and your
> GitHub account. Review each one; verify pricing and console wording against
> the current Azure portal as you go.

## What you need to buy / provision

| Resource | Why | Tier | Cost |
|---|---|---|---|
| Azure subscription | Account to host under | Pay-as-you-go | — |
| **Static Web App** | Hosts the portal build, CI/CD from GitHub, free SSL | **Free** | **$0** |

That's the whole list for the portal as it stands. The free Static Web App tier
includes global CDN distribution, free managed SSL certificates, custom domains,
100 GB bandwidth/month, and built-in GitHub Actions CI/CD. You do **not** need
Key Vault, a database, or a backend to get the portal running — those come only
when you add the .NET backend later (see "Going further" at the end).

## Prerequisites

- The `D365AI` repo pushed to GitHub (`CEOMazaya/D365AI`).
- An Azure account. If you don't have one: https://azure.microsoft.com/free
- These files (already in the repo):
  - `portal/public/staticwebapp.config.json` — SPA routing + security headers
  - `.github/workflows/azure-static-web-apps.yml` — the build/deploy workflow

## Step 1 — create the Static Web App

In the Azure portal:

1. **Create a resource → Static Web App → Create.**
2. **Subscription / Resource group:** create a resource group, e.g. `mazaya-rga`.
3. **Name:** `mazaya-rga-portal`.
4. **Plan type:** **Free**.
5. **Region:** pick the closest — **West Europe** is the nearest low-latency
   region to Kuwait. (This is the region for the build/management; the app
   itself is served from Azure's global CDN regardless.)
6. **Deployment source:** **GitHub.** Authorize Azure to access your GitHub,
   then select:
   - Organization: `CEOMazaya`
   - Repository: `D365AI`
   - Branch: `main`
7. **Build presets:** choose **Custom**, and set:
   - **App location:** `portal`
   - **Api location:** *(leave empty)*
   - **Output location:** `dist`
8. **Review + create → Create.**

## Step 2 — let it build

When you create the resource, Azure automatically:
- adds a deployment token to your GitHub repo as the secret
  `AZURE_STATIC_WEB_APPS_API_TOKEN`, and
- commits a GitHub Actions workflow (or uses the one already in the repo).

The committed `.github/workflows/azure-static-web-apps.yml` already has the
correct `app_location: portal` / `output_location: dist` settings, so if Azure
detects it, the first build kicks off on the next push. Watch it under the
repo's **Actions** tab — the job installs dependencies, runs `npm run build`,
and uploads `dist/`.

> If Azure generates its *own* workflow file with slightly different settings,
> that's fine — just make sure `app_location` is `portal` and `output_location`
> is `dist`. You can delete one of the two workflow files to avoid double builds.

## Step 3 — open the portal

Once the Action goes green, the Static Web App's **Overview** page shows the URL:

```
https://<generated-name>.azurestaticapps.net
```

Open it. You should see the login screen with the Mazaya logo; sign in with a
seeded account (e.g. `admin@mazayasolutions.com`) via the demo account list, and
the home page shows the hero robot, the AI guide button, and all the workspace
tabs including Risks, Issues, and Change Requests.

Every push to `main` now rebuilds and redeploys automatically.

## Step 4 (optional) — custom domain

Static Web App → **Custom domains → Add.** Point a CNAME from your domain (e.g.
`portal.mazayasolutions.com`) to the `*.azurestaticapps.net` hostname. Azure
issues a free managed certificate automatically.

## Step 5 (optional) — lock down sign-in with Entra ID

The portal currently uses a demo login. To gate the whole site behind your
Microsoft 365 tenant so only your people can reach it, Static Web Apps has
built-in Entra ID auth — add an `auth` block and a route rule to
`staticwebapp.config.json` requiring `authenticated` on `/*`. This is worth
doing before sharing the URL outside the team. (Ask and I'll add the exact
config — it needs your tenant's app registration details.)

## Notes

- **Bundle size:** the build is ~2 MB because the hero robot is an embedded PNG.
  Well within the Free tier's limits; no action needed. If you ever want it
  smaller, the robot can be served as an external file instead of inlined.
- **No secrets in this deployment.** The static portal holds no credentials. The
  O365 Credentials screen stores values in the browser only; real secrets belong
  in Key Vault once the backend exists.
- **Data is per-browser.** Until the backend + PostgreSQL are wired in, each
  user's data lives in their own browser via `localStorage`. Fine for a pilot;
  not shared across users or devices.

## Going further — full stack on Azure

When you're ready for shared, persistent data:

1. **Azure Database for PostgreSQL (Flexible Server)** — apply the schema:
   ```bash
   psql "<connection-string>" -f database/migrations/001_init.sql
   psql "<connection-string>" -f database/migrations/002_seed.sql
   psql "<connection-string>" -f database/migrations/003_raid.sql
   ```
2. **A .NET backend** on Azure Container Apps or App Service, with the DB
   connection string and O365 secrets pulled from **Key Vault** via managed
   identity.
3. Repoint the portal's `storage-shim.js` from `localStorage` to `fetch()` calls
   against that backend — the single seam, no component changes.

At that point the portal can also use the **same Static Web App**; you'd just
add a linked API. The agent's Azure kit (`Dockerfile`, `deploy.sh`, `DEPLOY.md`,
`mcp_auth.py`) already covers the Container Apps + Key Vault side.
