import type { UserContext } from '@gorazus/contracts';

/**
 * Un adaptador por canal detrás de una interfaz única — docs/architecture/
 * 32-core-platform/06-eventos-y-mensajeria.md §4.1: agregar un proveedor
 * nuevo no toca el resto del Notification Center. `context` se agrega al
 * `send(to, body)` del documento porque las credenciales del proveedor son
 * por tenant (`core.integration_credentials`, aislado por RLS vía
 * `withTenantScope` — mismo criterio que `BaseRepository`) — ningún adaptador
 * real puede resolver "las" credenciales sin saber de qué tenant.
 */
export interface NotificationChannelAdapter {
  readonly channelType: string;
  send(
    context: Pick<UserContext, 'tenantId' | 'companyId'>,
    to: string,
    body: string,
  ): Promise<{ providerResponse: string }>;
}
