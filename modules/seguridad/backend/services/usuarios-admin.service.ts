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

export interface UsuarioCreado {
  usuario: users;
  passwordTemporal: string;
}

/**
 * Alta de usuario simplificada (Fase 1): la contraseña temporal se genera
 * y devuelve directamente en la respuesta para que el administrador se la
 * comunique — el flujo completo de invitación por email con token de
 * activación (docs/architecture/15-modulo-security.md §1) es Fase 2, no
 * implementado todavía (`core.notifications`/envío de email no wireado).
 * Offboarding (§1: revocar sesiones/API keys al desactivar) también queda
 * en Fase 2 — acá `desactivar` solo marca `is_active = false`.
 */
@Injectable()
export class UsuariosAdminService {
  constructor(
    private readonly usuarioAdminRepository: UsuarioAdminRepository,
    private readonly asignacionRepository: AsignacionRepository,
  ) {}

  async crear(context: UserContext, email: string, fullName: string): Promise<UsuarioCreado> {
    const existente = await this.usuarioAdminRepository.findMany(
      context,
      { email },
      { page: 1, pageSize: 1 },
    );
    if (existente.data.length > 0) throw new EmailYaRegistradoException(email);

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

    return { usuario, passwordTemporal };
  }

  async listar(
    context: UserContext,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<users>> {
    return this.usuarioAdminRepository.findMany(context, {}, pagination);
  }

  async desactivar(context: UserContext, userId: string): Promise<users> {
    return this.usuarioAdminRepository.update(context, { id: userId }, { is_active: false });
  }

  /** Reactivación — simétrico a `desactivar` (Activación/Bloqueo). */
  async activar(context: UserContext, userId: string): Promise<users> {
    return this.usuarioAdminRepository.update(context, { id: userId }, { is_active: true });
  }

  async obtenerPerfil(context: UserContext, userId: string): Promise<users> {
    const usuario = await this.usuarioAdminRepository.findById(context, { id: userId });
    if (!usuario) throw new UsuarioNoEncontradoException(userId);
    return usuario;
  }

  /** Autoedición del propio perfil — nunca email/roles (eso es administración, ver `asignarRol`). */
  async actualizarPerfil(context: UserContext, userId: string, fullName: string): Promise<users> {
    await this.obtenerPerfil(context, userId);
    return this.usuarioAdminRepository.update(context, { id: userId }, { full_name: fullName });
  }

  /** Cambio de contraseña self-service — exige la contraseña actual, a diferencia del alta administrativa (`crear`) que fija una temporal sin verificación previa. */
  async cambiarPassword(
    context: UserContext,
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const usuario = await this.obtenerPerfil(context, userId);
    const passwordValida = await verifyPassword(currentPassword, usuario.password_hash ?? '');
    if (!passwordValida) throw new PasswordActualInvalidaException();

    const passwordHash = await hashPassword(newPassword);
    await this.usuarioAdminRepository.update(
      context,
      { id: userId },
      { password_hash: passwordHash },
    );
  }

  async asignarRol(context: UserContext, userId: string, rolId: string): Promise<void> {
    await this.asignacionRepository.asignarRolAUsuario(context, userId, rolId);
  }

  async revocarRol(context: UserContext, userId: string, rolId: string): Promise<void> {
    await this.asignacionRepository.revocarRolDeUsuario(context, userId, rolId);
  }
}
