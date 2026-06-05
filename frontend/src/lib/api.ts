/** Direct backend URL — unchanged so hardcoded localhost:5000 usage keeps working */
export const API_BASE = 'http://localhost:5000/api';

export function getAuthHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = localStorage.getItem('auth-token');
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const OFFLINE_RETRY_MS = 15000;
let apiOnline: boolean | null = null;
let lastCheck = 0;
let offlineWarned = false;

export function isFetchNetworkError(err: unknown): boolean {
  return err instanceof TypeError;
}

export function markApiOffline(): void {
  apiOnline = false;
  lastCheck = Date.now();
}

/** Probe backend; skips repeated fetches while known offline to reduce console noise */
export async function isApiReachable(force = false): Promise<boolean> {
  const now = Date.now();
  if (!force && apiOnline === false && now - lastCheck < OFFLINE_RETRY_MS) {
    return false;
  }
  if (!force && apiOnline === true && now - lastCheck < 5000) {
    return true;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    await fetch(`${API_BASE}/dashboard/summary`, { signal: controller.signal });
    clearTimeout(timeout);
    apiOnline = true;
    lastCheck = now;
    offlineWarned = false;
    return true;
  } catch {
    apiOnline = false;
    lastCheck = now;
    if (!offlineWarned) {
      console.warn(
        '[ChocoLoop] API offline at localhost:5000 — start backend: cd backend & npm run dev'
      );
      offlineWarned = true;
    }
    return false;
  }
}

export async function apiFetch(
  input: string,
  init?: RequestInit
): Promise<Response | null> {
  const reachable = await isApiReachable();
  if (!reachable) return null;
  try {
    return await fetch(input, init);
  } catch (err) {
    if (isFetchNetworkError(err)) markApiOffline();
    return null;
  }
}
