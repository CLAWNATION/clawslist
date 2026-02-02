const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:4000";

export function getApiOrigin() {
  return API_ORIGIN;
}

export async function apiRequest(path, { method = "GET", token, body } = {}) {
  const res = await fetch(`${API_ORIGIN}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error || "request_failed");
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}
