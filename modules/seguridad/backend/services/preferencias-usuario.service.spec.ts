import type { UserContext } from '@gorazus/contracts';
import type { user_profiles } from '@gorazus/core-database';
import { PerfilExtendidoRepository } from '../repositories/perfil-extendido.repository';
import { PreferenciasUsuarioService } from './preferencias-usuario.service';

const CONTEXT: UserContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  branchId: null,
  sessionId: 'session-1',
};

describe('PreferenciasUsuarioService', () => {
  let perfil: user_profiles | null;
  let upsertCalls: Array<{ userId: string; data: unknown }>;
  let perfilExtendidoRepository: PerfilExtendidoRepository;

  beforeEach(() => {
    perfil = null;
    upsertCalls = [];

    perfilExtendidoRepository = {
      buscarPorUsuario: jest.fn(async () => perfil),
      upsert: jest.fn(
        async (
          _ctx: unknown,
          userId: string,
          data: {
            preferredLanguage?: string;
            preferredTimezone?: string;
            metadataPatch?: Record<string, unknown>;
          },
        ) => {
          upsertCalls.push({ userId, data });
          const metadataPrevia =
            perfil && typeof perfil.metadata === 'object' && perfil.metadata !== null
              ? (perfil.metadata as Record<string, unknown>)
              : {};
          perfil = {
            id: 'profile-1',
            user_id: userId,
            preferred_language: data.preferredLanguage ?? perfil?.preferred_language ?? 'es',
            preferred_timezone: data.preferredTimezone ?? perfil?.preferred_timezone ?? 'UTC',
            metadata: { ...metadataPrevia, ...(data.metadataPatch ?? {}) },
          } as user_profiles;
          return perfil;
        },
      ),
    } as unknown as PerfilExtendidoRepository;
  });

  function buildService(): PreferenciasUsuarioService {
    return new PreferenciasUsuarioService(perfilExtendidoRepository);
  }

  it('obtener: sin fila en user_profiles, devuelve los defaults (es/UTC, resto null)', async () => {
    const preferencias = await buildService().obtener(CONTEXT, 'user-1');
    expect(preferencias).toEqual({
      idioma: 'es',
      zonaHoraria: 'UTC',
      tema: null,
      formatoFecha: null,
      formatoHora: null,
      formatoNumero: null,
      paginaInicial: null,
      registrosPorPagina: null,
      notificaciones: null,
    });
  });

  it('actualizar: idioma/zonaHoraria van a columnas, el resto a metadata', async () => {
    const preferencias = await buildService().actualizar(CONTEXT, 'user-1', {
      idioma: 'en',
      zonaHoraria: 'America/Argentina/Buenos_Aires',
      tema: 'dark',
      registrosPorPagina: 50,
    });

    expect(preferencias.idioma).toBe('en');
    expect(preferencias.zonaHoraria).toBe('America/Argentina/Buenos_Aires');
    expect(preferencias.tema).toBe('dark');
    expect(preferencias.registrosPorPagina).toBe(50);
    expect(upsertCalls[0]?.data).toEqual({
      preferredLanguage: 'en',
      preferredTimezone: 'America/Argentina/Buenos_Aires',
      metadataPatch: { tema: 'dark', registrosPorPagina: 50 },
    });
  });

  it('actualizar dos veces: la segunda actualización no pierde preferencias ya guardadas', async () => {
    await buildService().actualizar(CONTEXT, 'user-1', { tema: 'dark' });
    const preferencias = await buildService().actualizar(CONTEXT, 'user-1', {
      registrosPorPagina: 100,
    });

    expect(preferencias.tema).toBe('dark');
    expect(preferencias.registrosPorPagina).toBe(100);
  });
});
