import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { user_companies } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import { EmpresaUsuarioRepository } from '../repositories/empresa-usuario.repository';
import { UsuarioAdminRepository } from '../repositories/usuario-admin.repository';
import { UsuarioNoEncontradoException } from './usuarios-admin.service';

export class EmpresaYaAsignadaException extends DomainException {
  constructor() {
    super('EMPRESA_YA_ASIGNADA', 'Esa empresa ya está asignada a este usuario.', 409);
  }
}

export class EmpresaInactivaException extends DomainException {
  constructor() {
    super('EMPRESA_INACTIVA', 'No se puede asignar una empresa inactiva.', 409);
  }
}

export class AsignacionNoEncontradaException extends DomainException {
  constructor() {
    super('ASIGNACION_NO_ENCONTRADA', 'Esa empresa no está asignada a este usuario.', 404);
  }
}

/**
 * Multiempresa por usuario (FASE 03 Parte 03) — wirea `core.user_companies`,
 * existente en el modelo certificado desde Enterprise v1.0.0 sin
 * consumidor de aplicación hasta esta parte. Es la lista de pertenencia
 * ("a qué empresas puede acceder este usuario"), NO la empresa activa de
 * la sesión (eso lo sigue fijando `auth` al emitir el token, sin cambios
 * acá — ver `USERS_REPORT.md`).
 */
@Injectable()
export class EmpresasUsuarioService {
  constructor(
    private readonly empresaUsuarioRepository: EmpresaUsuarioRepository,
    private readonly usuarioAdminRepository: UsuarioAdminRepository,
  ) {}

  async listar(context: UserContext, userId: string): Promise<user_companies[]> {
    await this.verificarUsuarioExiste(context, userId);
    return this.empresaUsuarioRepository.listarPorUsuario(context, userId);
  }

  async asignar(
    context: UserContext,
    userId: string,
    companyId: string,
    isDefault: boolean,
  ): Promise<user_companies> {
    await this.verificarUsuarioExiste(context, userId);

    const activa = await this.empresaUsuarioRepository.empresaActiva(context, companyId);
    if (!activa) throw new EmpresaInactivaException();

    const yaAsignada = await this.empresaUsuarioRepository.yaAsignada(context, userId, companyId);
    if (yaAsignada) throw new EmpresaYaAsignadaException();

    return this.empresaUsuarioRepository.asignar(context, userId, companyId, isDefault);
  }

  async desasignar(context: UserContext, userId: string, companyId: string): Promise<void> {
    await this.verificarUsuarioExiste(context, userId);
    const yaAsignada = await this.empresaUsuarioRepository.yaAsignada(context, userId, companyId);
    if (!yaAsignada) throw new AsignacionNoEncontradaException();

    await this.empresaUsuarioRepository.desasignar(context, userId, companyId);
  }

  private async verificarUsuarioExiste(context: UserContext, userId: string): Promise<void> {
    const usuario = await this.usuarioAdminRepository.findById(context, { id: userId });
    // `findById` no filtra soft-deleted — ver mismo chequeo en
    // `UsuariosAdminService.obtenerCrudo()`.
    if (!usuario || usuario.deleted_at !== null) throw new UsuarioNoEncontradoException(userId);
  }
}
