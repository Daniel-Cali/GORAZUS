import type { UserContext } from '@gorazus/contracts';
import type { user_companies } from '@gorazus/core-database';

/**
 * Adaptador sobre `core.user_companies` (multiempresa por usuario,
 * FASE 03 Parte 03) — existía en el modelo de datos certificado desde
 * Enterprise v1.0.0 sin un solo consumidor de aplicación (`core.users`
 * solo carga un `company_id`/`branch_id` fijo, usado por `UserContext`/
 * JWT). Esta tabla es la lista de pertenencia ("a qué empresas puede
 * acceder este usuario"), no reemplaza el `company_id` de sesión activa.
 */
export abstract class EmpresaUsuarioRepository {
  abstract listarPorUsuario(context: UserContext, userId: string): Promise<user_companies[]>;
  abstract asignar(
    context: UserContext,
    userId: string,
    companyId: string,
    isDefault: boolean,
  ): Promise<user_companies>;
  abstract desasignar(context: UserContext, userId: string, companyId: string): Promise<void>;
  /** Existe y no es soft-deleted — usado para no asignar dos veces la misma empresa. */
  abstract yaAsignada(context: UserContext, userId: string, companyId: string): Promise<boolean>;
  /** `core.companies.is_active` — evita asignar una empresa dada de baja. */
  abstract empresaActiva(context: UserContext, companyId: string): Promise<boolean>;
}
