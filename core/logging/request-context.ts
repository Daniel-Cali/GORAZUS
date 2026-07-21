import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Almacén mínimo de correlación (tenantId/userId/requestId) vía
 * AsyncLocalStorage, propagado sin pasar parámetros explícitos por
 * toda la cadena de llamadas — ver docs/architecture/32-core-platform/
 * 02-multiempresa-y-alcance-organizacional.md §"Interfaces":
 * "propagado vía AsyncLocalStorage, no vía parámetro explícito, para
 * que ningún desarrollador pueda 'olvidar' pasarlo".
 *
 * Esto NO es el Security Context completo (roles/permisos/empresa
 * activa) — ese vive en packages/contracts y lo llena el módulo `auth`
 * (EPIC IAM, todavía no construido). Este store es el subconjunto que
 * el Logging Framework necesita ya, para no bloquear observabilidad
 * detrás de IAM. Cuando exista el Security Context real, debería
 * escribir a este mismo store (o reemplazarlo) en vez de duplicar el
 * mecanismo de propagación.
 */
export interface RequestContextData {
  requestId: string;
  tenantId?: string;
  userId?: string;
}

const storage = new AsyncLocalStorage<RequestContextData>();

export const RequestContext = {
  run<T>(data: RequestContextData, callback: () => T): T {
    return storage.run(data, callback);
  },
  get(): RequestContextData | undefined {
    return storage.getStore();
  },
};
