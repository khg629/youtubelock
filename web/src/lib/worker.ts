const WORKER_URL = process.env.WORKER_URL || "http://localhost:8000";

export async function workerFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${WORKER_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || "Worker request failed");
  }
  return res.json();
}
