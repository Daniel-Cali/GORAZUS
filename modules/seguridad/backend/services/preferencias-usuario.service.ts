import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { user_profiles } from '@gorazus/core-database';
import { PerfilExtendidoRepository } from '../repositories/perfil-extendido.repository';
import type { ActualizarPreferenciasInput } from '../validators/usuarios.schema';

export interface PreferenciasUsuario {
  idioma: string;
  zonaHoraria: string;
  tema: string | null;
  formatoFecha: string | null;
  formatoHora: string | null;
  formatoNumero: string | null;
  paginaInicial: string | null;
  registrosPorPagina: number | null;
  notificaciones: boolean | null;
}

const DEFAULTS: PreferenciasUsuario = {
  idioma: 'es',
  zonaHoraria: 'UTC',
  tema: null,
  formatoFecha: null,
  formatoHora: null,
  formatoNumero: null,
  paginaInicial: null,
  registrosPorPagina: null,
  notificaciones: null,
};

/**
 * Preferencias de usuario (FASE 03 Parte 03) — wirea `core.user_profiles`
 * (1:1 con `core.users`, existente sin consumidor). Solo `idioma`/
 * `zonaHoraria` tienen columna propia (`preferred_language`/
 * `preferred_timezone`); el resto (tema, formatos, página inicial,
 * registros por página, notificaciones) no tiene columna en el modelo
 * certificado — se guarda en `user_profiles.metadata` JSONB, sin
 * requerir una migración sobre el schema congelado (`VERSION.md`). Este
 * servicio expone una forma estable (`PreferenciasUsuario`), no la fila
 * cruda — el detalle de qué vive en columna vs. en metadata es un detalle
 * de implementación que no debería filtrarse al cliente.
 */
@Injectable()
export class PreferenciasUsuarioService {
  constructor(private readonly perfilExtendidoRepository: PerfilExtendidoRepository) {}

  async obtener(context: UserContext, userId: string): Promise<PreferenciasUsuario> {
    const perfil = await this.perfilExtendidoRepository.buscarPorUsuario(context, userId);
    if (!perfil) return DEFAULTS;
    return this.mapear(perfil);
  }

  async actualizar(
    context: UserContext,
    userId: string,
    cambios: ActualizarPreferenciasInput,
  ): Promise<PreferenciasUsuario> {
    const metadataPatch: Record<string, unknown> = {};
    if (cambios.tema !== undefined) metadataPatch['tema'] = cambios.tema;
    if (cambios.formatoFecha !== undefined) metadataPatch['formatoFecha'] = cambios.formatoFecha;
    if (cambios.formatoHora !== undefined) metadataPatch['formatoHora'] = cambios.formatoHora;
    if (cambios.formatoNumero !== undefined) metadataPatch['formatoNumero'] = cambios.formatoNumero;
    if (cambios.paginaInicial !== undefined) metadataPatch['paginaInicial'] = cambios.paginaInicial;
    if (cambios.registrosPorPagina !== undefined)
      metadataPatch['registrosPorPagina'] = cambios.registrosPorPagina;
    if (cambios.notificaciones !== undefined)
      metadataPatch['notificaciones'] = cambios.notificaciones;

    const perfil = await this.perfilExtendidoRepository.upsert(context, userId, {
      preferredLanguage: cambios.idioma,
      preferredTimezone: cambios.zonaHoraria,
      metadataPatch: Object.keys(metadataPatch).length > 0 ? metadataPatch : undefined,
    });
    return this.mapear(perfil);
  }

  private mapear(perfil: user_profiles): PreferenciasUsuario {
    const metadata =
      typeof perfil.metadata === 'object' && perfil.metadata !== null
        ? (perfil.metadata as Record<string, unknown>)
        : {};
    return {
      idioma: perfil.preferred_language,
      zonaHoraria: perfil.preferred_timezone,
      tema: (metadata['tema'] as string | undefined) ?? null,
      formatoFecha: (metadata['formatoFecha'] as string | undefined) ?? null,
      formatoHora: (metadata['formatoHora'] as string | undefined) ?? null,
      formatoNumero: (metadata['formatoNumero'] as string | undefined) ?? null,
      paginaInicial: (metadata['paginaInicial'] as string | undefined) ?? null,
      registrosPorPagina: (metadata['registrosPorPagina'] as number | undefined) ?? null,
      notificaciones: (metadata['notificaciones'] as boolean | undefined) ?? null,
    };
  }
}
