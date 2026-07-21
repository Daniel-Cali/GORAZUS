import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { roles } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import { RolRepository } from '../repositories/rol.repository';
import { PermisoRepository } from '../repositories/permiso.repository';
import { AsignacionRepository } from '../repositories/asignacion.repository';
import { Rol } from '../entities/rol.entity';

export class PermisoNoEncontradoException extends DomainException {
  constructor(code: string) {
    super('PERMISO_NO_ENCONTRADO', `No existe el permiso "${code}".`, 404);
  }
}

/**
 * CRUD simple de roles + asignación de permisos — un solo service, no un
 * caso de uso por método (KISS, docs/architecture/02 §3: "no forzar un
 * archivo por acción trivial" — a diferencia de `auth`, donde cada flujo
 * tenía invariantes/pasos propios que justificaban separarlos).
 */
@Injectable()
export class RolesService {
  constructor(
    private readonly rolRepository: RolRepository,
    private readonly permisoRepository: PermisoRepository,
    private readonly asignacionRepository: AsignacionRepository,
  ) {}

  async crear(context: UserContext, nombre: string): Promise<roles> {
    new Rol('pendiente', nombre, false); // valida el invariante de nombre antes de tocar la base
    return this.rolRepository.create(context, {
      tenant_id: context.tenantId,
      company_id: context.companyId,
      name: nombre,
      is_system_role: false,
    });
  }

  async listar(
    context: UserContext,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<roles>> {
    return this.rolRepository.findMany(context, {}, pagination);
  }

  async asignarPermiso(context: UserContext, rolId: string, permisoCode: string): Promise<void> {
    const permiso = await this.permisoRepository.findByCode(context, permisoCode);
    if (!permiso) throw new PermisoNoEncontradoException(permisoCode);
    await this.asignacionRepository.asignarPermisoARol(context, rolId, permiso.id);
  }

  async revocarPermiso(context: UserContext, rolId: string, permisoCode: string): Promise<void> {
    const permiso = await this.permisoRepository.findByCode(context, permisoCode);
    if (!permiso) throw new PermisoNoEncontradoException(permisoCode);
    await this.asignacionRepository.revocarPermisoDeRol(context, rolId, permiso.id);
  }
}
