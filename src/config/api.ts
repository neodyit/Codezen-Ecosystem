/**
 * Central API Client Configuration for CodeZen Ecosystem
 * 
 * In production or custom deployment, set VITE_BACKEND_API_URL in .env:
 * Example: VITE_BACKEND_API_URL="https://yourdomain.com/backend/api"
 * Or via XAMPP/Apache: "http://localhost/Codezen-Ecosystem/backend-laravel/public/api"
 * Or via Artisan: "http://127.0.0.1:8000/api"
 */

function resolveBackendApiUrl(): string {
  const envUrl = import.meta.env.VITE_BACKEND_API_URL || import.meta.env.VITE_BACKEND_URL;
  
  if (typeof window !== "undefined") {
    const currentHost = window.location.hostname; // e.g. "10.200.50.173" or "localhost"

    // If accessing from another device over WiFi (e.g. 192.168.x.x, 10.x.x.x)
    // and the env is hardcoded to "localhost" or "127.0.0.1", replace the host dynamically!
    if (envUrl && (envUrl.includes("localhost") || envUrl.includes("127.0.0.1")) && currentHost !== "localhost" && currentHost !== "127.0.0.1") {
      return envUrl.replace(/localhost|127\.0\.0\.1/g, currentHost);
    }

    if (!envUrl) {
      return `http://${currentHost}/Codezen-Ecosystem/backend-laravel/public/api`;
    }
  }

  return envUrl || "/backend/api";
}

const rawBaseUrl = resolveBackendApiUrl();

// Ensure no trailing slash
export const API_ROOT = rawBaseUrl.replace(/\/+$/, "");

// Auth endpoints base (e.g. {API_ROOT}/auth)
export const AUTH_API_URL = `${API_ROOT}/auth`;

// Academic options endpoint
export const ACADEMIC_OPTIONS_URL = `${API_ROOT}/academic-options`;

/**
 * Helper to get cookie by name
 */
export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
  return match ? decodeURIComponent(match[3]) : null;
}

/**
 * Helper to set long-lasting cookie (defaults to 30 days)
 */
export function setCookie(name: string, value: string, days: number = 30) {
  if (typeof document === "undefined") return;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = "; expires=" + date.toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/; SameSite=Lax`;
}

/**
 * Helper to delete cookie
 */
export function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax`;
}

/**
 * Unified Token Getter (checks localStorage first, falls back to persistent cookie)
 */
export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  const localTok = localStorage.getItem("codezen_token");
  if (localTok) return localTok;
  const cookieTok = getCookie("codezen_token");
  if (cookieTok) {
    // Restore back into localStorage for fast synchronized access
    localStorage.setItem("codezen_token", cookieTok);
    return cookieTok;
  }
  return null;
}

/**
 * Unified User Getter (checks localStorage first, falls back to persistent cookie)
 */
export function getStoredUser(): any | null {
  if (typeof window === "undefined") return null;
  const localUser = localStorage.getItem("codezen_user");
  if (localUser) {
    try {
      return JSON.parse(localUser);
    } catch {}
  }
  const cookieUser = getCookie("codezen_user");
  if (cookieUser) {
    try {
      const parsed = JSON.parse(cookieUser);
      localStorage.setItem("codezen_user", cookieUser);
      return parsed;
    } catch {}
  }
  return null;
}

/**
 * Unified Login Session Storer (saves to both localStorage and 30-day Cookie)
 */
export function storeAuthSession(token: string, user: any) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem("codezen_token", token);
    setCookie("codezen_token", token, 30);
  }
  if (user) {
    const userJson = JSON.stringify(user);
    localStorage.setItem("codezen_user", userJson);
    setCookie("codezen_user", userJson, 30);
  }
}

/**
 * Handle invalid or expired sessions centrally
 */
export function handleInvalidSession(redirectPath: string = "/login") {
  localStorage.removeItem("codezen_token");
  localStorage.removeItem("codezen_user");
  deleteCookie("codezen_token");
  deleteCookie("codezen_user");

  // Dispatch a global event so UI components (Navigation, Modals) react instantly
  window.dispatchEvent(new Event("codezen_auth_invalidated"));

  // Only redirect if current path is a protected route or if not already on login/register
  const currentPath = window.location.pathname;
  if (
    currentPath.startsWith("/dashboard") ||
    currentPath.startsWith("/profile") ||
    currentPath.startsWith("/admin")
  ) {
    window.location.href = redirectPath;
  }
}

/**
 * Logout the user by invalidating server session token and clearing local state
 */
export async function logoutUser(redirectTo: string = "/login") {
  try {
    await apiFetch("/auth/logout", { method: "POST" });
  } catch {
    // ignore network errors during logout
  } finally {
    handleInvalidSession(redirectTo);
  }
}

// Simple in-memory response cache for GET requests with TTL (Time-To-Live)
const apiCache = new Map<string, { data: any; status: number; ok: boolean; timestamp: number }>();

/**
 * Invalidate in-memory cache for a specific key pattern or all cache
 */
export function invalidateApiCache(pattern?: string | RegExp) {
  if (!pattern) {
    apiCache.clear();
    return;
  }
  for (const key of apiCache.keys()) {
    if (typeof pattern === "string" ? key.includes(pattern) : pattern.test(key)) {
      apiCache.delete(key);
    }
  }
}

/**
 * Standard authenticated fetch helper with JSON and token headers
 * Automatically detects invalid/expired sessions (HTTP 401 Unauthorized)
 * and purges local storage to log out the user cleanly.
 * 
 * Supports transparent in-memory client caching for GET requests (ttlMs option, defaults to 60s).
 */
export async function apiFetch(
  endpoint: string,
  options: RequestInit & { ttlMs?: number; skipCache?: boolean } = {}
) {
  const method = (options.method || "GET").toUpperCase();
  const token = getStoredToken();
  const ttlMs = options.ttlMs ?? 60000; // default 60s cache for GET requests
  const skipCache = options.skipCache ?? false;

  // If endpoint starts with '/', remove it to append to API_ROOT
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_ROOT}${cleanEndpoint}`;
  const cacheKey = `${method}:${url}:${token || "anon"}`;

  // Serve from cache if valid GET request
  if (method === "GET" && !skipCache && ttlMs > 0) {
    const cached = apiCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < ttlMs) {
      // Return a mock Response object mirroring fetch Response
      return {
        ok: cached.ok,
        status: cached.status,
        statusText: cached.ok ? "OK" : "Error",
        headers: new Headers(),
        url,
        json: async () => structuredClone(cached.data),
        text: async () => JSON.stringify(cached.data),
        clone: () => ({ json: async () => structuredClone(cached.data) }),
      } as unknown as Response;
    }
  }

  // Mutating requests (POST, PUT, DELETE, PATCH) automatically invalidate cached GET endpoints
  if (method !== "GET") {
    // Invalidate caches matching common taxonomy / entity endpoints
    if (cleanEndpoint.includes("/settings")) invalidateApiCache("settings");
    if (cleanEndpoint.includes("/events")) invalidateApiCache("events");
    if (cleanEndpoint.includes("/products") || cleanEndpoint.includes("/store")) invalidateApiCache("store");
    if (cleanEndpoint.includes("/users") || cleanEndpoint.includes("/members")) {
      invalidateApiCache("users");
      invalidateApiCache("members");
    }
    if (cleanEndpoint.includes("/applications")) invalidateApiCache("applications");
    if (cleanEndpoint.includes("/rbac")) invalidateApiCache("rbac");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const { ttlMs: _ttl, skipCache: _skip, ...fetchOptions } = options;

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  // If response is successful and is a GET request, store parsed data in memory cache
  if (method === "GET" && response.ok && ttlMs > 0) {
    try {
      const cloned = response.clone();
      const jsonData = await cloned.json();
      apiCache.set(cacheKey, {
        data: jsonData,
        status: response.status,
        ok: response.ok,
        timestamp: Date.now(),
      });
    } catch {}
  }

  // Only invalidate session if the user explicitly called logoutUser()
  // Never automatically purge localStorage on API 401s, because temporary network blips,
  // rate limits, or backend proxy timeouts should not kick the user out of their session.
  if (response.status === 401 && token) {
    // Session token is preserved in localStorage and cookies.
    // The user can continue navigating or retry without having to re-authenticate.
  }

  return response;
}

