import type { UserContext } from '@gorazus/contracts';

/**
 * Catálogo `crm.lead_status` — sembrado por SQL, solo lectura desde la
 * aplicación (nunca se crea un estado nuevo desde un caso de uso, a
 * diferencia del patrón "resolver-o-crear" de catálogos dinámicos de
 * otros módulos).
 */
export abstract class LeadStatusRepository {
  abstract buscarPorCodigo(context: UserContext, code: string): Promise<{ id: string } | null>;
}
