import { Injectable } from '@nestjs/common';
import type { PermissionsResolver } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { AsignacionRepository } from '../repositories/asignacion.repository';

/**
 * Implementación real del puerto `PermissionsResolver` (core/http/guards/
 * permissions-resolver.interface.ts) — reemplaza a `NoopPermissionsResolver`
 * (que deniega todo) una vez que `SeguridadModule` se registra
 * (docs/architecture/09-seguridad-y-multiempresa.md §2). Solo resuelve RBAC
 * (rol → permiso); ACL fino y ABAC son Fase 2
 * (docs/architecture/15-modulo-security.md §4,6 — precedencia deny-ACL >
 * allow-ACL > rol, no implementada todavía). Sin cache de Redis todavía
 * (Fase 2, docs/architecture/09 §2 "con cache en Redis con invalidación al
 * cambiar un rol") — cada chequeo consulta la base.
 */
@Injectable()
export class PermissionsResolverService implements PermissionsResolver {
  constructor(private readonly asignacionRepository: AsignacionRepository) {}

  async hasPermission(user: UserContext, permission: string): Promise<boolean> {
    const codigosEfectivos = await this.asignacionRepository.resolverPermisosDeUsuario(
      user,
      user.userId,
    );
    return codigosEfectivos.includes(permission);
  }
}
