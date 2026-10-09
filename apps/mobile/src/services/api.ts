import { API_URL } from '@/services/env';

// Cliente HTTP do servidor (docs/BACKEND.md). O token da sessão fica em memória (o session.ts
// guarda uma cópia no cofre do aparelho).

const TIMEOUT_MS = 10000;

let token: string | null = null;
export const setApiToken = (value: string | null) => {
  token = value;
};
export const hasApiToken = () => token !== null;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly body: unknown = null,
  ) {
    super(message);
  }
}

/** Chama o servidor. Sem servidor configurado ou sem rede: ApiError com status 0. */
export async function api<T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, body?: unknown): Promise<T> {
  if (!API_URL) throw new ApiError(0, 'servidor não configurado');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      signal: controller.signal,
      headers: { ...(body !== undefined ? { 'content-type': 'application/json' } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    const json = text ? JSON.parse(text) : null;
    if (!res.ok) throw new ApiError(res.status, json?.error ?? `erro ${res.status}`, json);
    return json as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, 'sem conexão');
  } finally {
    clearTimeout(timer);
  }
}
