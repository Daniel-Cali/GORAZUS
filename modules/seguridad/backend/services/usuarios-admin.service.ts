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
import { hashPassword } from '../../../../packages/tooling/utils';
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

  async asignarRol(context: UserContext, userId: string, rolId: string): Promise<void> {
    await this.asignacionRepository.asignarRolAUsuario(context, userId, rolId);
  }

  async revocarRol(context: UserContext, userId: string, rolId: string): Promise<void> {
    await this.asignacionRepository.revocarRolDeUsuario(context, userId, rolId);
  }
}
