import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import { DomainException } from '@gorazus/core-http';
import { UserRepository } from '../repositories/user.repository';
import { OrganizationStatusRepository } from '../repositories/organization-status.repository';
import {
  EmpresaInactivaException,
  SucursalInactivaException,
} from './organization-status.exceptions';

export class UsuarioInactivoException extends DomainException {
  constructor() {
    super('USUARIO_INACTIVO', 'El usuario de la sesión ya no está activo.', 403);
  }
}

export { EmpresaInactivaException, SucursalInactivaException };

export interface SessionValidationResult {
  valid: true;
  userId: string;
  tenantId: string;
  sessionId: string;
  activeCompanyId: string | null;
  activeBranchId: string | null;
}

/**
 * `GET /auth/session` (FASE 03 Parte 02) — llegar acá ya probó firma +
 * expiración del JWT y que la sesión no esté revocada en Redis
 * (`JwtStrategy`, `core/http`). Este caso de uso agrega lo que un JWT
 * válido por sí solo NO garantiza: que el usuario siga activo y que la
 * empresa/sucursal activas de la sesión sigan activas — un JWT de 15 min
 * ya emitido no se entera solo si alguien desactivó la cuenta o la
 * empresa hace 2 minutos.
 */
@Injectable()
export class ValidateTokenUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly organizationStatusRepository: OrganizationStatusRepository,
  ) {}

  async execute(context: UserContext): Promise<SessionValidationResult> {
    const user = await this.userRepository.findById(context, { id: context.userId });
    if (!user || !user.is_active) {
      throw new UsuarioInactivoException();
    }

    if (context.companyId !== null) {
      const companyActive = await this.organizationStatusRepository.isCompanyActive(
        context,
        context.companyId,
      );
      if (!companyActive) {
        throw new EmpresaInactivaException();
      }
    }
    if (context.branchId !== null) {
      const branchActive = await this.organizationStatusRepository.isBranchActive(
        context,
        context.branchId,
      );
      if (!branchActive) {
        throw new SucursalInactivaException();
      }
    }

    return {
      valid: true,
      userId: context.userId,
      tenantId: context.tenantId,
      sessionId: context.sessionId,
      activeCompanyId: context.companyId,
      activeBranchId: context.branchId,
    };
  }
}
