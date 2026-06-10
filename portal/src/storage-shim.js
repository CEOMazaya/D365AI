// ============================================================================
// API-backed storage shim (Entra ID authenticated)
// ----------------------------------------------------------------------------
// The portal talks to a small async key-value API: storage.get/set/delete/list.
// This implementation backs that API with the .NET backend instead of
// localStorage, so all users share one server-side copy of the data.
//
// It works as a "state blob" bridge: the portal keeps treating mz_db_v1 etc. as
// whole-JSON documents, and this shim persists each document to the backend's
// /api/state/{key} endpoint. That gives you shared, multi-user data with no
// changes to any portal screen.
//
// When you're ready to use the fully relational endpoints (customers, projects,
// risks, change-requests, ...), replace the bodies here with per-entity fetch()
// calls — the seam stays in this one file.
//
// AUTH: tokens come from MSAL. Configure VITE_* env vars (see .env.example) and
// the portal will acquire an Entra ID token and send it as a bearer on every
// request. If MSAL isn't configured, it falls back to localStorage so the demo
// still runs offline.
// ============================================================================

import { PublicClientApplication, InteractionRequiredAuthError } from "@azure/msal-browser";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const CLIENT_ID = import.meta.env.VITE_AAD_CLIENT_ID || "";
const TENANT_ID = import.meta.env.VITE_AAD_TENANT_ID || "";
const API_SCOPE = import.meta.env.VITE_API_SCOPE || "";

const msalConfigured = Boolean(API_BASE && CLIENT_ID && TENANT_ID && API_SCOPE);

let msal = null;
let msalReady = null;
if (msalConfigured) {
  msal = new PublicClientApplication({
    auth: {
      clientId: CLIENT_ID,
      authority: `https://login.microsoftonline.com/${TENANT_ID}`,
      redirectUri: window.location.origin,
    },
    cache: { cacheLocation: "localStorage" },
  });
  // Initialize once and handle any redirect response on load.
  msalReady = (async () => {
    await msal.initialize();
    try {
      const resp = await msal.handleRedirectPromise();
      if (resp && resp.account) msal.setActiveAccount(resp.account);
    } catch (e) { console.error("[msal] redirect handling failed", e); }
    const existing = msal.getActiveAccount() || msal.getAllAccounts()[0];
    if (existing) msal.setActiveAccount(existing);
  })();
}

// Explicit interactive sign-in. Returns the account, or throws with a clear error.
export async function signIn() {
  if (!msal) throw new Error("MSAL not configured");
  await msalReady;
  let account = msal.getActiveAccount() || msal.getAllAccounts()[0];
  if (!account) {
    const res = await msal.loginPopup({ scopes: [API_SCOPE], prompt: "select_account" });
    account = res.account;
    msal.setActiveAccount(account);
  }
  return account;
}
if (typeof window !== "undefined") window.msalSignIn = signIn;

async function getToken() {
  if (!msal) return null;
  await msalReady;
  let account = msal.getActiveAccount() || msal.getAllAccounts()[0];
  if (!account) {
    const res = await msal.loginPopup({ scopes: [API_SCOPE], prompt: "select_account" });
    account = res.account;
    msal.setActiveAccount(account);
  }
  try {
    const res = await msal.acquireTokenSilent({ scopes: [API_SCOPE], account });
    return res.accessToken;
  } catch (e) {
    const res = await msal.acquireTokenPopup({ scopes: [API_SCOPE], account });
    return res.accessToken;
  }
}

async function api(path, options = {}) {
  const token = await getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok && res.status !== 404) throw new Error(`API ${res.status} on ${path}`);
  return res;
}

// Storage API backed by the backend. Two keys are served from the RELATIONAL
// tables via scoped endpoints (per-customer isolation enforced server-side):
//   mz_usr_v1 → /api/portal/users      (users table)
//   mz_db_v1  → /api/portal/db         (customers + projects, scoped)
// Everything else (session pointer, o365 config) uses the generic document store.
const PORTAL_KEYS = { mz_usr_v1: "/api/portal/users", mz_db_v1: "/api/portal/db" };

// Fetch the signed-in user resolved by the backend against the users table.
// Returns the portal user object, or null if unauthenticated.
export async function getMe() {
  try {
    const res = await api("/api/auth/me");
    if (res.status === 404 || res.status === 401) return null;
    const u = await res.json();
    if (!u || !u.email) return null;
    // Normalise to the portal's user shape (snake_case ids as strings).
    return {
      id: u.id, name: u.name, email: u.email,
      user_type: u.userType ?? u.user_type,
      org: u.org,
      customer_id: u.customerId ?? u.customer_id ?? null,
      workstream_scope: u.workstreamScope ?? u.workstream_scope ?? [],
      status: u.status,
      job_title: u.jobTitle ?? u.job_title ?? "",
    };
  } catch { return null; }
}
// Expose for the portal (which imports from this module).
if (typeof window !== "undefined") window.getMe = getMe;

const apiStorage = {
  async get(key) {
    // Relational keys → scoped endpoints, returned in the portal's value shape.
    if (PORTAL_KEYS[key]) {
      const res = await api(PORTAL_KEYS[key]);
      if (res.status === 404) return null;
      const data = await res.json();
      return { key, value: JSON.stringify(data) };
    }
    const res = await api(`/api/state/${encodeURIComponent(key)}`);
    if (res.status === 404) return null;
    const data = await res.json();
    return data && data.value != null ? { key, value: data.value } : null;
  },
  async set(key, value) {
    if (PORTAL_KEYS[key]) {
      await api(PORTAL_KEYS[key], { method: "PUT", body: value });
      return { key, value };
    }
    await api(`/api/state/${encodeURIComponent(key)}`, {
      method: "PUT",
      body: JSON.stringify({ value }),
    });
    return { key, value };
  },
  async delete(key) {
    await api(`/api/state/${encodeURIComponent(key)}`, { method: "DELETE" });
    return { key, deleted: true };
  },
  async list(prefix = "") {
    const res = await api(`/api/state?prefix=${encodeURIComponent(prefix)}`);
    if (res.status === 404) return { keys: [], prefix };
    const data = await res.json();
    return { keys: data.keys || [], prefix };
  },
};

// localStorage fallback (offline demo, unchanged from the standalone shim).
const localStorageShim = {
  async get(key) {
    const v = localStorage.getItem(key);
    return v === null ? null : { key, value: v };
  },
  async set(key, value) {
    localStorage.setItem(key, value);
    return { key, value };
  },
  async delete(key) {
    localStorage.removeItem(key);
    return { key, deleted: true };
  },
  async list(prefix = "") {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) keys.push(k);
    }
    return { keys, prefix };
  },
};

if (typeof window !== "undefined" && !window.storage) {
  window.storage = msalConfigured ? apiStorage : localStorageShim;
  if (!msalConfigured) {
    console.info("[storage] MSAL/API not configured — using localStorage (per-browser data).");
  }
}
