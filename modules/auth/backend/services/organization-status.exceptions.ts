import { DomainException } from '@gorazus/core-http';

/**
 * Compartidas entre `RefreshTokenUseCase` y `ValidateTokenUseCase`
 * (FASE 03 Parte 02) — ambas verifican lo mismo (`OrganizationStatusRepository`)
 * en dos puntos distintos del ciclo de vida de la sesión (rotación de
 * refresh y validación de un access token vigente).
 */
export class EmpresaInactivaException extends DomainException {
  constructor() {
    super('EMPRESA_INACTIVA', 'La empresa activa de la sesión ya no está activa.', 403);
  }
}

export class SucursalInactivaException extends DomainException {
  constructor() {
    super('SUCURSAL_INACTIVA', 'La sucursal activa de la sesión ya no está activa.', 403);
  }
}
