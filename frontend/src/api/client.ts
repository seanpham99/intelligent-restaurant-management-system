type RuntimeEnv = {
  VITE_API_BASE_URL?: string;
};

const runtimeEnv = (import.meta as ImportMeta & { env?: RuntimeEnv }).env ?? {};
const API_BASE_URL = (runtimeEnv.VITE_API_BASE_URL ?? 'http://localhost:8000').replace(/\/+$/, '');

function buildUrl(path: string): string {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildUrl(path), init);
  if (!response.ok) {
    throw new Error(`${init?.method ?? 'GET'} ${path} failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function getJson<T>(path: string): Promise<T> {
  return requestJson<T>(path, { method: 'GET' });
}

export function postJson<TReq, TRes>(path: string, body: TReq): Promise<TRes> {
  return requestJson<TRes>(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}
