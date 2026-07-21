import type { ApiErrorBody, ApiSuccessBody } from '@gorazus/contracts';
import { getAccessToken, setAccessToken } from './token-store';
import { notifySessionExpired } from './session';
import { trackRequestStart, trackRequestEnd } from './request-tracker';

/**
 * Cliente HTTP único y delgado — `fetch` nativo envuelto, nunca una clase
 * `ApiService` por módulo (docs/frontend/API_LAYER.md §1). Vive en `ui-kit/`
 * porque es el único paquete que `modules/<x>/frontend` puede importar además
 * de `packages/contracts` (docs/frontend/FOLDER_STRUCTURE.md §6) — `core/`
 * en la raíz del monorepo es exclusivamente backend (NestJS), no existe un
 * "core de frontend" físico.
 */
let baseUrl = '/api/v1';

/** Cada app consumidora fija su base real al montar (p. ej. `import.meta.env.VITE_API_URL` en Vite) — ui-kit no asume un bundler concreto. */
export function configureApiClient(options: { baseUrl: string }): void {
  baseUrl = options.baseUrl;
}

export class ApiClientError extends Error {
  readonly code: string;
  readonly details: ApiErrorBody['error']['details'];
  readonly status: number;

  constructor(status: number, body: ApiErrorBody) {
    super(body.error.message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = body.error.code;
    this.details = body.error.details;
  }
}

function networkErrorBody(message: string): ApiErrorBody {
  return { error: { code: 'NETWORK_ERROR', message, details: [] } };
}

let refreshPromise: Promise<void> | null = null;

/** Deduplicado: N requests que fallan por 401 a la vez disparan un solo refresh (API_LAYER.md §4). */
function refreshAccessToken(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${baseUrl}/auth/refresh`, { method: 'POST', credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) throw new Error('refresh failed');
        // Bug real encontrado en FASE 05 (2026-07-20): `POST /auth/refresh` envuelve la respuesta
        // en `{ data: { accessToken } }` (ver auth.controller.ts) — leer `body.accessToken` directo
        // siempre daba `undefined`, dejando el reintento automático tras un 401 silenciosamente roto
        // (nunca se había ejercitado este camino con un browser real antes de esta sesión).
        const body = (await response.json()) as ApiSuccessBody<{ accessToken: string }>;
        setAccessToken(body.data.accessToken);
      })
      .catch((error) => {
        setAccessToken(null);
        notifySessionExpired();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

/**
 * Bug real encontrado en FASE 05 (2026-07-20, Playwright real: un `page.goto`
 * a una ruta protegida después de loguearse mandaba de vuelta a /login) —
 * `token-store.ts` ya documentaba la intención ("`initSession()` que cada
 * app consumidora llama al montar"), pero la función nunca se había escrito
 * ni conectado. Sin esto, CUALQUIER recarga completa de página (F5, abrir
 * un link directo, `page.goto` en un test) pierde el access token en
 * memoria y manda al usuario a /login aunque su cookie httpOnly de refresh
 * siga siendo válida — apps/web/src/app/require-auth.tsx debe llamarla
 * antes de decidir si redirige. A diferencia de `refreshAccessToken()`
 * (usada en medio de un request ya autenticado), acá un fallo es un estado
 * normal esperado (nadie logueado todavía) — no dispara `notifySessionExpired()`.
 */
export async function initSession(): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!response.ok) return false;
    const body = (await response.json()) as ApiSuccessBody<{ accessToken: string }>;
    setAccessToken(body.data.accessToken);
    return true;
  } catch {
    return false;
  }
}

export interface RequestOptions {
  params?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
}

function buildUrl(path: string, params?: RequestOptions['params']): string {
  const url = new URL(`${baseUrl}${path}`, window.location.origin);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: RequestOptions,
  isRetry = false,
): Promise<ApiSuccessBody<T>> {
  trackRequestStart();
  try {
    const headers: Record<string, string> = {};
    const token = getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    let response: Response;
    try {
      response = await fetch(buildUrl(path, options?.params), {
        method,
        headers,
        credentials: 'include',
        signal: options?.signal,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new ApiClientError(0, networkErrorBody('No se pudo conectar con el servidor.'));
    }

    // Bug real encontrado en FASE 05 (2026-07-20, primer test de Playwright real contra
    // credenciales inválidas): un 401 de /auth/login (contraseña incorrecta) entraba acá,
    // intentaba refrescar un token que nunca existió, fallaba, y pisaba el error real del
    // backend ("Credenciales inválidas") con el genérico "La sesión expiró" — un intento de
    // login fallido no es una sesión que expiró, no hay sesión que refrescar todavía.
    if (
      response.status === 401 &&
      !isRetry &&
      !path.startsWith('/auth/refresh') &&
      !path.startsWith('/auth/login')
    ) {
      try {
        await refreshAccessToken();
      } catch {
        throw new ApiClientError(401, {
          error: { code: 'SESION_EXPIRADA', message: 'La sesión expiró.', details: [] },
        });
      }
      return request<T>(method, path, body, options, true);
    }

    if (!response.ok) {
      const errorBody = await response
        .json()
        .catch(() => networkErrorBody('Respuesta inesperada del servidor.'));
      throw new ApiClientError(response.status, errorBody as ApiErrorBody);
    }

    return (await response.json()) as ApiSuccessBody<T>;
  } finally {
    trackRequestEnd();
  }
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, body, options),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PUT', path, body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PATCH', path, body, options),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>('DELETE', path, undefined, options),
};
