const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export type Profile = {
  device_id: string; name?: string | null;
  answers: Record<string, string>; share_level: number;
  mirror_persona: string; intimacy_level: string;
  engagement_days: number; question_count: number; reward_tier: string;
};

export type Reflection = {
  id: string; device_id: string; question: string; answer: string;
  follow_up?: string | null; mode: string; created_at: string;
};

export type AskResponse = {
  id: string; answer: string; follow_up?: string | null; mode: string;
  intimacy_level: string; reward?: string | null;
};

export const api = {
  initProfile: (p: { device_id: string; name?: string | null; answers: Record<string, string> }) =>
    request<Profile>("/profile", { method: "POST", body: JSON.stringify(p) }),
  getProfile: (deviceId: string) => request<Profile>(`/profile/${deviceId}`),
  ask: (p: { device_id: string; question: string }) =>
    request<AskResponse>("/ask", { method: "POST", body: JSON.stringify(p) }),
  history: (deviceId: string) => request<Reflection[]>(`/history/${deviceId}`),
  deleteReflection: (id: string) => request<{ ok: boolean }>(`/history/${id}`, { method: "DELETE" }),
};
