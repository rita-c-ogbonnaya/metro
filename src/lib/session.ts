/**
 * Centralised session/local-state cleanup. Used by every Logout entry point
 * so a sign-out always removes role, profile, drawer state, settings, and
 * any per-tenant UI memory — without nuking the user's theme preference.
 */
const SESSION_KEYS = [
  "metro-role",
  "metro-profile",
  "metro-notif-prefs",
  "metro-open-tenant",
  "metro-sidebar",
  "metro-agreements",
  "metro-documents",
  "metro-notifications-log",
];

export function clearAllSession() {
  if (typeof window === "undefined") return;
  for (const k of SESSION_KEYS) {
    try { window.localStorage.removeItem(k); } catch {}
  }
  try { window.sessionStorage.clear(); } catch {}
}

export function persistJSON<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch { return fallback; }
}
