import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import { DomainException } from '@gorazus/core-http';
import { UserRepository } from '../repositories/user.repository';

export class UsuarioNoEncontradoException extends DomainException {
  constructor() {
    super('USUARIO_NO_ENCONTRADO', 'El usuario de la sesión ya no existe.', 404);
  }
}

export interface CurrentUserResult {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  tenantId: string;
  activeCompanyId: string | null;
  activeBranchId: string | null;
}

/**
 * `GET /auth/me` (FASE 03 Parte 02) — identidad del usuario autenticado.
 * Deliberadamente mínimo (sin roles/permisos, sin datos editables de
 * perfil): eso es `modules/seguridad` (`/seguridad/usuarios/me`,
 * `AUTH_README.md §5`) — acá solo lo que `auth` ya conoce de su propio
 * contrato (`UserContext`) más los campos identificatorios de `core.users`.
 */
@Injectable()
export class GetCurrentUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(context: UserContext): Promise<CurrentUserResult> {
    const record = await this.userRepository.findById(context, { id: context.userId });
    if (!record) {
      throw new UsuarioNoEncontradoException();
    }

    return {
      id: record.id,
      email: record.email,
      fullName: record.full_name,
      isActive: record.is_active,
      lastLoginAt: record.last_login_at,
      tenantId: record.tenant_id,
      activeCompanyId: context.companyId,
      activeBranchId: context.branchId,
    };
  }
}
