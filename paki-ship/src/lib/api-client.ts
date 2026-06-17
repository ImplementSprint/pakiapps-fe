const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");

function buildUrl(path: string) {
  if (!API_BASE_URL) {
    return path;
  }

  return `${API_BASE_URL}${path}`;
}

export async function apiFetch(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);

  if (
    init?.body &&
    !(init.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(buildUrl(path), {
    ...init,
    headers,
    credentials: "include",
  });
}
