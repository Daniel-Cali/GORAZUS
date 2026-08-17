import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { roles } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import { RolRepository } from '../repositories/rol.repository';
import { PermisoRepository } from '../repositories/permiso.repository';
import { AsignacionRepository } from '../repositories/asignacion.repository';
import { Rol, type RoleType } from '../entities/rol.entity';

export class PermisoNoEncontradoException extends DomainException {
  constructor(code: string) {
    super('PERMISO_NO_ENCONTRADO', `No existe el permiso "${code}".`, 404);
  }
}

export class RolNoEncontradoException extends DomainException {
  constructor(id: string) {
    super('ROL_NO_ENCONTRADO', `No existe el rol "${id}".`, 404);
  }
}

/**
 * Traduce el invariante de dominio (`Rol.verificarPuedeEliminarse/Renombrarse`,
 * un `Error` plano — la entidad es pura, sin conocer HTTP) a un
 * `DomainException` con status real. Sin esto, el rechazo de un rol de
 * fábrica llegaba como 500 sin traducir en vez de un 409 limpio — mismo
 * tipo de hallazgo que el CHECK de `address_type` sin validar en Clientes.
 */
export class RolDeFabricaException extends DomainException {
  constructor(mensaje: string) {
    super('ROL_DE_FABRICA', mensaje, 409);
  }
}

/** Respuesta de `obtener()` — el rol junto con los códigos de permiso que tiene asignados hoy (antes no había forma de verlo sin consultar la base a mano). */
export interface RolConPermisos {
  rol: roles;
  permissionCodes: string[];
}

/**
 * CRUD de roles + asignación de permisos — un solo service, no un caso de
 * uso por método (KISS, docs/architecture/02 §3: "no forzar un archivo
 * por acción trivial" — a diferencia de `auth`, donde cada flujo tenía
 * invariantes/pasos propios que justificaban separarlos).
 *
 * Scoping real: `core.roles.company_id`/`branch_id` ya son nullable en el
 * schema (un rol puede ser de todo el tenant, de una empresa, o de una
 * sucursal) pero antes de esta fase la API nunca lo exponía — `crear()`
 * fijaba siempre `context.companyId` y `listar()` no filtraba nada,
 * devolviendo roles de todas las empresas del tenant sin distinción (RLS
 * en `core.roles` solo aísla por tenant, no por empresa, ver
 * `docs/database/dictionary/01-core.md`).
 */
@Injectable()
export class RolesService {
  constructor(
    private readonly rolRepository: RolRepository,
    private readonly permisoRepository: PermisoRepository,
    private readonly asignacionRepository: AsignacionRepository,
  ) {}

  async crear(
    context: UserContext,
    nombre: string,
    companyId?: string | null,
    branchId?: string | null,
    code?: string | null,
    description?: string | null,
    roleType: RoleType = 'custom',
  ): Promise<roles> {
    // Valida invariantes (nombre, código, roleType) y normaliza (trim del
    // nombre, trim+mayúsculas del código) — se usan `rol.name`/`rol.code`
    // de vuelta, no `nombre`/`code` crudos, para que lo persistido sea lo
    // normalizado.
    const rol = new Rol('pendiente', nombre, false, code ?? null, description ?? null, roleType);
    return this.rolRepository.create(context, {
      tenant_id: context.tenantId,
      // `undefined` = "usar el default del llamador" (la empresa activa de
      // la sesión); `null` explícito = rol de todo el tenant a propósito.
      company_id: companyId === undefined ? context.companyId : companyId,
      branch_id: branchId === undefined ? null : branchId,
      name: rol.name,
      code: rol.code,
      description: description ?? null,
      role_type: roleType,
      is_system_role: false,
    });
  }

  async listar(
    context: UserContext,
    companyId: string | undefined,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<roles>> {
    return this.rolRepository.findMany(
      context,
      companyId ? { company_id: companyId } : {},
      pagination,
    );
  }

  private async obtenerRolOFallar(context: UserContext, id: string): Promise<roles> {
    const rol = await this.rolRepository.findById(context, { id });
    if (!rol) throw new RolNoEncontradoException(id);
    return rol;
  }

  async obtener(context: UserContext, id: string): Promise<RolConPermisos> {
    const rol = await this.obtenerRolOFallar(context, id);
    const permissionCodes = await this.asignacionRepository.listarPermisosDeRol(context, id);
    return { rol, permissionCodes };
  }

  async actualizar(context: UserContext, id: string, nombre: string): Promise<roles> {
    const existente = await this.obtenerRolOFallar(context, id);
    try {
      new Rol(
        existente.id,
        existente.name,
        existente.is_system_role,
        existente.code,
        existente.description,
        existente.role_type as RoleType,
      ).verificarPuedeRenombrarse();
    } catch (error) {
      throw new RolDeFabricaException((error as Error).message);
    }
    const nuevo = new Rol('pendiente', nombre, false); // valida y normaliza (trim) el nombre nuevo
    return this.rolRepository.update(context, { id }, { name: nuevo.name });
  }

  async eliminar(context: UserContext, id: string): Promise<roles> {
    const existente = await this.obtenerRolOFallar(context, id);
    try {
      new Rol(
        existente.id,
        existente.name,
        existente.is_system_role,
        existente.code,
        existente.description,
        existente.role_type as RoleType,
      ).verificarPuedeEliminarse();
    } catch (error) {
      throw new RolDeFabricaException((error as Error).message);
    }
    return this.rolRepository.softDelete(
      context,
      { id },
      { deleted_at: new Date(), deleted_by: context.userId },
    );
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
