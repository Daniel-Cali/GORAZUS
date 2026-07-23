import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { users } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
// Ruta relativa, no el alias `@gorazus/tooling/*` — ver la misma nota en
// modules/auth/backend/services/login.usecase.ts (packages/tooling no es
// un paquete pnpm real, el alias solo resuelve en tipo, no en runtime).
// eslint-disable-next-line @nx/enforce-module-boundaries -- packages/tooling no tiene project.json propio, ver comentario arriba
import { hashPassword, verifyPassword } from '../../../../packages/tooling/utils';
import { UsuarioAdminRepository } from '../repositories/usuario-admin.repository';
import { AsignacionRepository } from '../repositories/asignacion.repository';
import { toUsuarioPublico, resolverEstado, UsuarioPublico } from './usuario-publico.mapper';
import type { EstadoUsuario } from '../validators/usuarios.schema';

export class EmailYaRegistradoException extends DomainException {
  constructor(email: string) {
    super(
      'EMAIL_YA_REGISTRADO',
      `Ya existe un usuario con el correo "${email}" en esta organización.`,
      409,
    );
  }
}

export class UsuarioNoEncontradoException extends DomainException {
  constructor(id: string) {
    super('USUARIO_NO_ENCONTRADO', `No existe el usuario "${id}".`, 404);
  }
}

export class PasswordActualInvalidaException extends DomainException {
  constructor() {
    super('PASSWORD_ACTUAL_INVALIDA', 'La contraseña actual no es correcta.', 400);
  }
}

export class UsuarioEliminadoException extends DomainException {
  constructor(id: string) {
    super('USUARIO_ELIMINADO', `El usuario "${id}" está eliminado — restauralo primero.`, 409);
  }
}

export interface UsuarioCreado {
  usuario: UsuarioPublico;
  passwordTemporal: string;
}

export interface PasswordReseteada {
  usuario: UsuarioPublico;
  passwordTemporal: string;
}

/**
 * Alta de usuario simplificada (Fase 1): la contraseña temporal se genera
 * y devuelve directamente en la respuesta para que el administrador se la
 * comunique — el flujo completo de invitación por email con token de
 * activación (docs/architecture/15-modulo-security.md §1) es Fase 2, no
 * implementado todavía (`core.notifications`/envío de email no wireado).
 * Offboarding (§1: revocar sesiones/API keys al desactivar) también queda
 * en Fase 2 — acá `desactivar`/`cambiarEstado` solo tocan `core.users`.
 *
 * FASE 03 Parte 03 agregó edición administrativa, soft-delete/restore,
 * estado agregado (activo/inactivo/suspendido/bloqueado/pendiente/
 * eliminado — ver `usuario-publico.mapper.ts`), reseteo de contraseña
 * administrativo, y corrigió una fuga real: los métodos de acá devolvían
 * la fila cruda de `core.users` (incluido `password_hash`) en cada
 * respuesta — ahora todo pasa por `toUsuarioPublico()`.
 */
@Injectable()
export class UsuariosAdminService {
  constructor(
    private readonly usuarioAdminRepository: UsuarioAdminRepository,
    private readonly asignacionRepository: AsignacionRepository,
  ) {}

  async crear(context: UserContext, email: string, fullName: string): Promise<UsuarioCreado> {
    await this.verificarEmailDisponible(context, email);

    const passwordTemporal = randomBytes(9).toString('base64url');
    const passwordHash = await hashPassword(passwordTemporal);

    const usuario = await this.usuarioAdminRepository.create(context, {
      tenant_id: context.tenantId,
      company_id: context.companyId,
      branch_id: context.branchId,
      email,
      password_hash: passwordHash,
      full_name: fullName,
    });

    return { usuario: toUsuarioPublico(usuario, resolverEstado(usuario)), passwordTemporal };
  }

  async listar(
    context: UserContext,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<UsuarioPublico>> {
    const resultado = await this.usuarioAdminRepository.findMany(context, {}, pagination);
    return {
      data: resultado.data.map((u) => toUsuarioPublico(u, resolverEstado(u))),
      meta: resultado.meta,
    };
  }

  async obtenerPerfil(context: UserContext, userId: string): Promise<UsuarioPublico> {
    const usuario = await this.obtenerCrudo(context, userId);
    return toUsuarioPublico(usuario, resolverEstado(usuario));
  }

  /** Autoedición del propio perfil — nombre y (opcionalmente) correo; nunca roles (eso es administración, ver `asignarRol`). */
  async actualizarPerfil(
    context: UserContext,
    userId: string,
    fullName: string,
    email?: string,
  ): Promise<UsuarioPublico> {
    await this.obtenerCrudo(context, userId);
    if (email) await this.verificarEmailDisponible(context, email, userId);

    const usuario = await this.usuarioAdminRepository.update(
      context,
      { id: userId },
      { full_name: fullName, ...(email && { email }) },
    );
    return toUsuarioPublico(usuario, resolverEstado(usuario));
  }

  /** Edición administrativa — PATCH parcial, cualquier usuario del tenant (no solo el propio). */
  async editar(
    context: UserContext,
    userId: string,
    cambios: { fullName?: string; email?: string },
  ): Promise<UsuarioPublico> {
    await this.obtenerCrudo(context, userId);
    if (cambios.email) await this.verificarEmailDisponible(context, cambios.email, userId);

    const usuario = await this.usuarioAdminRepository.update(
      context,
      { id: userId },
      {
        ...(cambios.fullName !== undefined && { full_name: cambios.fullName }),
        ...(cambios.email !== undefined && { email: cambios.email }),
      },
    );
    return toUsuarioPublico(usuario, resolverEstado(usuario));
  }

  async desactivar(context: UserContext, userId: string): Promise<UsuarioPublico> {
    return this.cambiarEstado(context, userId, 'inactive');
  }

  /** Reactivación — simétrico a `desactivar` (Activación/Bloqueo). */
  async activar(context: UserContext, userId: string): Promise<UsuarioPublico> {
    return this.cambiarEstado(context, userId, 'active');
  }

  /**
   * Estado agregado (`PATCH :id/status`) — `active` limpia `metadata.status`
   * y fija `is_active=true`; cualquier otro valor fija `is_active=false` y
   * guarda el motivo específico en `metadata.status` (ver
   * `usuario-publico.mapper.ts` `resolverEstado()`). No reemplaza
   * `eliminar`/`restaurar` — "deleted" no es un valor válido acá a
   * propósito, es un mecanismo aparte (`deleted_at`).
   */
  async cambiarEstado(
    context: UserContext,
    userId: string,
    status: EstadoUsuario,
  ): Promise<UsuarioPublico> {
    const actual = await this.obtenerCrudo(context, userId);
    const metadataActual =
      typeof actual.metadata === 'object' && actual.metadata !== null
        ? (actual.metadata as Record<string, unknown>)
        : {};

    const nuevaMetadata =
      status === 'active'
        ? { ...metadataActual, status: undefined }
        : { ...metadataActual, status };

    const usuario = await this.usuarioAdminRepository.update(
      context,
      { id: userId },
      { is_active: status === 'active', metadata: nuevaMetadata as never },
    );
    return toUsuarioPublico(usuario, resolverEstado(usuario));
  }

  /** Baja lógica — a diferencia de `desactivar`/`cambiarEstado` (reversible con un clic), esto marca `deleted_at` y saca al usuario de los listados por default (`notDeletedFilter`, `BaseRepository`). */
  async eliminar(context: UserContext, userId: string): Promise<void> {
    await this.obtenerCrudo(context, userId);
    await this.usuarioAdminRepository.softDelete(
      context,
      { id: userId },
      { deleted_at: new Date(), deleted_by: context.userId, is_active: false },
    );
  }

  async restaurar(context: UserContext, userId: string): Promise<UsuarioPublico> {
    // A diferencia de `obtenerCrudo()` (usado por el resto de este
    // servicio), acá el chequeo de existencia debe ADMITIR un usuario ya
    // eliminado — es justamente el único caso de uso que necesita
    // encontrarlo en ese estado. `findById` no filtra `deleted_at` (solo
    // `findMany` lo hace, vía `BaseRepository.notDeletedFilter()`).
    const existente = await this.usuarioAdminRepository.findById(context, { id: userId });
    if (!existente) throw new UsuarioNoEncontradoException(userId);

    const usuario = await this.usuarioAdminRepository.update(
      context,
      { id: userId },
      { deleted_at: null, deleted_by: null, is_active: true },
    );
    return toUsuarioPublico(usuario, resolverEstado(usuario));
  }

  /** Cambio de contraseña self-service — exige la contraseña actual, a diferencia del alta administrativa (`crear`) que fija una temporal sin verificación previa. */
  async cambiarPassword(
    context: UserContext,
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const usuario = await this.obtenerCrudo(context, userId);
    const passwordValida = await verifyPassword(currentPassword, usuario.password_hash ?? '');
    if (!passwordValida) throw new PasswordActualInvalidaException();

    const passwordHash = await hashPassword(newPassword);
    await this.usuarioAdminRepository.update(
      context,
      { id: userId },
      { password_hash: passwordHash },
    );
  }

  /** Reseteo administrativo — mismo mecanismo que `crear` (temporal generada y devuelta), sin verificar contraseña anterior (a diferencia de `cambiarPassword`, que es autoservicio). */
  async resetearPassword(context: UserContext, userId: string): Promise<PasswordReseteada> {
    await this.obtenerCrudo(context, userId);
    const passwordTemporal = randomBytes(9).toString('base64url');
    const passwordHash = await hashPassword(passwordTemporal);
    const usuario = await this.usuarioAdminRepository.update(
      context,
      { id: userId },
      { password_hash: passwordHash },
    );
    return { usuario: toUsuarioPublico(usuario, resolverEstado(usuario)), passwordTemporal };
  }

  async asignarRol(context: UserContext, userId: string, rolId: string): Promise<void> {
    await this.asignacionRepository.asignarRolAUsuario(context, userId, rolId);
  }

  async revocarRol(context: UserContext, userId: string, rolId: string): Promise<void> {
    await this.asignacionRepository.revocarRolDeUsuario(context, userId, rolId);
  }

  private async obtenerCrudo(context: UserContext, userId: string): Promise<users> {
    const usuario = await this.usuarioAdminRepository.findById(context, { id: userId });
    if (!usuario) throw new UsuarioNoEncontradoException(userId);
    // `findById` no filtra soft-deleted (a diferencia de `findMany`, ver
    // `restaurar()`) — sin este chequeo, cualquier operación de acá
    // (editar, cambiar estado, resetear contraseña, asignar rol/empresa)
    // seguiría operando en silencio sobre un usuario ya eliminado.
    if (usuario.deleted_at !== null) throw new UsuarioEliminadoException(userId);
    return usuario;
  }

  private async verificarEmailDisponible(
    context: UserContext,
    email: string,
    excluirUserId?: string,
  ): Promise<void> {
    const existente = await this.usuarioAdminRepository.findMany(
      context,
      { email },
      { page: 1, pageSize: 1 },
    );
    const enUso = existente.data.find((u) => u.id !== excluirUserId);
    if (enUso) throw new EmailYaRegistradoException(email);
  }
}
