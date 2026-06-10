# Pushing this to CEOMazaya/D365AI

Everything here is ready to commit. Two paths depending on whether the repo
already has content.

## If you have a local clone already

```bash
cd D365AI                      # your existing local clone
# copy the contents of this folder into it, then:
git add .
git commit -m "Add RGA portal (logo, hero, AI guide, session recordings), PostgreSQL schema, docs"
git push
```

## If you're starting fresh

```bash
git clone https://github.com/CEOMazaya/D365AI.git
cd D365AI
# copy the contents of this folder in, then:
git add .
git commit -m "Add RGA portal, PostgreSQL schema, and docs"
git push
```

## Verify the portal runs before/after pushing

```bash
cd portal
npm install
npm run dev          # opens http://localhost:5173
```

## Notes
- `node_modules/` and `dist/` are gitignored — they rebuild from `npm install`.
- No secrets are in the repo. The O365 client secret is entered in the running
  app (Admin → O365 Credentials) and, in production, belongs in Key Vault.
- If you revoked the PAT you pasted earlier — good. You don't need a token for
  these commands as long as your local clone is authenticated.
