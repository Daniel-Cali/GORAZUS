import type { UserContext } from '@gorazus/contracts';
import type { user_profiles } from '@gorazus/core-database';

/**
 * Adaptador sobre `core.user_profiles` (FASE 03 Parte 03) — existía en
 * el modelo certificado sin un solo consumidor (`avatar_file_id`,
 * `preferred_language`, `preferred_timezone` + `metadata` JSONB genérico
 * para el resto de preferencias, que no tienen columna propia — ver
 * `USERS_REPORT.md`). 1:1 con `core.users`, creado perezosamente (no
 * existe una fila hasta la primera vez que el usuario toca sus
 * preferencias/avatar).
 */
export abstract class PerfilExtendidoRepository {
  abstract buscarPorUsuario(context: UserContext, userId: string): Promise<user_profiles | null>;
  /** Crea la fila si no existe, o actualiza los campos dados si ya existe. */
  abstract upsert(
    context: UserContext,
    userId: string,
    data: {
      preferredLanguage?: string;
      preferredTimezone?: string;
      metadataPatch?: Record<string, unknown>;
    },
  ): Promise<user_profiles>;
}
