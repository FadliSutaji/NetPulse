export interface User { id: string; username: string; email: string; role: string; is_active: boolean }
export interface ServerItem { id: string; name: string; ip_address: string | null; status: "ONLINE" | "WARNING" | "OFFLINE"; api_key?: string; last_seen_at: string | null; created_at: string }
export interface MetricPoint { time: string; cpu_percent: number; cpu_cores: number; ram_percent: number; ram_used_bytes: number; ram_total_bytes: number }
export interface AlertLogItem { id: number; server_id: string; alert_type: string; severity: string; message: string; triggered_at: string; resolved_at: string | null }

export function logoutUser() {
  localStorage.removeItem("np_token");
  localStorage.removeItem("np_user");
}

export function getAuthSession(): { token: string | null; user: User | null; mode: "live" } {
  if (typeof window === "undefined") return { token: null, user: null, mode: "live" };
  try {
    return { token: localStorage.getItem("np_token"), user: JSON.parse(localStorage.getItem("np_user") || "null"), mode: "live" };
  } catch {
    logoutUser();
    return { token: null, user: null, mode: "live" };
  }
}

class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const base = process.env.NEXT_PUBLIC_API_URL || `${window.location.protocol}//${window.location.hostname}:8000/api/v1`;
  const token = getAuthSession().token;
  const response = await fetch(base + path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    if (response.status === 401 && token) {
      logoutUser();
      window.location.assign("/login");
    }
    throw new ApiError(typeof body.detail === "string" ? body.detail : `Permintaan gagal (${response.status})`, response.status);
  }
  return response.status === 204 ? undefined as T : response.json();
}

export async function loginApi(username: string, password: string) {
  const result = await request<{ access_token: string; user: User }>("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });
  localStorage.setItem("np_token", result.access_token);
  localStorage.setItem("np_user", JSON.stringify(result.user));
  return result;
}
export const registerApi = (username: string, email: string, password: string) => request<User>("/auth/register", { method: "POST", body: JSON.stringify({ username, email, password }) });
export const fetchServers = () => request<ServerItem[]>("/servers");
export const createServerApi = (name: string, ip_address: string) => request<ServerItem>("/servers", { method: "POST", body: JSON.stringify({ name, ip_address: ip_address || null }) });
export const deleteServerApi = (id: string) => request<void>(`/servers/${encodeURIComponent(id)}`, { method: "DELETE" });
export const fetchAlertLogs = (id?: string) => request<AlertLogItem[]>(`/alerts/logs${id ? `?server_id=${encodeURIComponent(id)}` : ""}`);
export async function fetchServerMetrics(id: string) {
  const path = `/metrics/${encodeURIComponent(id)}`;
  const [latest, history] = await Promise.all([
    request<MetricPoint>(`${path}/latest`).catch(error => {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }),
    request<{ data: MetricPoint[] }>(`${path}/history`),
  ]);
  return { latest, history: history.data };
}
