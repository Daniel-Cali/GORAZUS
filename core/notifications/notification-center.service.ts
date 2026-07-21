import { Inject, Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import { PRISMA_CORE, withTenantScope, type CorePrismaClient } from '@gorazus/core-database';
import { LoggerService } from '@gorazus/core-logging';
import { WhatsAppGatewayAdapter } from './channels/whatsapp-gateway.adapter';
import type { NotificationDeliveryResult, SendNotificationInput } from './types';

/**
 * Punto de entrada único del Notification Center — docs/architecture/
 * 32-core-platform/06-eventos-y-mensajeria.md §4: "nadie envía email/
 * notificación in-app por fuera de esta interfaz".
 *
 * Diferencias deliberadas Fase 1 vs. el diseño completo del documento
 * (núcleo mínimo, decisión del usuario — 42-integraciones-plan-fase-8.md §2):
 * - Envío síncrono, no encolado en `Background Jobs` (`core/scheduler` sí
 *   existe, pero integrarlo es Fase 2 — el flujo actual no bloquea nada crítico
 *   porque hoy el único llamador sería explícito, no un evento de dominio
 *   masivo).
 * - Sin `Template Engine`/`Language Manager` (ninguno existe en `core/`
 *   todavía) — `body` es texto ya resuelto por el llamador, interpolación de
 *   variables es responsabilidad del caller, no de este servicio.
 * - Sin reintento con backoff ni webhook de confirmación asíncrona — un solo
 *   intento, resultado inmediato.
 * - Solo destinatarios internos (`core.users`, vía `recipient_user_id`
 *   NOT NULL en el esquema físico) — notificar a un lead/cliente de CRM y el
 *   cruce con `crm.whatsapp_logs` (§4.1) depende del módulo `crm`, que no
 *   tiene backend construido todavía.
 */
@Injectable()
export class NotificationCenterService {
  constructor(
    @Inject(PRISMA_CORE) private readonly prisma: CorePrismaClient,
    private readonly whatsAppAdapter: WhatsAppGatewayAdapter,
    private readonly logger: LoggerService,
  ) {}

  async send(
    context: Pick<UserContext, 'tenantId' | 'companyId'>,
    input: SendNotificationInput,
  ): Promise<NotificationDeliveryResult> {
    return withTenantScope(this.prisma, context, async (tx) => {
      const channel = await tx.notification_channels.findFirst({
        where: { channel_type: input.channelType, deleted_at: null, is_active: true },
      });
      if (!channel) {
        throw new Error(
          `Canal '${input.channelType}' no está dado de alta en core.notification_channels para este tenant`,
        );
      }

      const preference = await tx.notification_preferences.findFirst({
        where: { user_id: input.recipientUserId, channel_id: channel.id, deleted_at: null },
      });
      if (preference && !preference.is_opted_in) {
        throw new Error(
          'El destinatario tiene este canal desactivado en notification_preferences.is_opted_in',
        );
      }

      /** Sin `hr.employees`/campo de teléfono en `core.users` (verificado — ningún schema modela teléfono de usuario interno todavía) — `notification_preferences.metadata` (JSONB genérico, ya existente) es el lugar previsto para dato de canal específico del destinatario. */
      const metadata = (preference?.metadata ?? {}) as Record<string, unknown>;
      const phoneNumber =
        typeof metadata['whatsappPhoneNumber'] === 'string'
          ? (metadata['whatsappPhoneNumber'] as string)
          : undefined;
      if (!phoneNumber) {
        throw new Error(
          `Sin número de WhatsApp para el destinatario — configurar notification_preferences.metadata.whatsappPhoneNumber (user_id=${input.recipientUserId}, channel_id=${channel.id})`,
        );
      }

      const notification = await tx.notifications.create({
        data: {
          tenant_id: context.tenantId,
          company_id: context.companyId,
          recipient_user_id: input.recipientUserId,
          subject: input.subject ?? null,
          body: input.body,
        },
      });

      let status: 'sent' | 'failed' = 'sent';
      let providerResponse: string | undefined;
      let errorMessage: string | undefined;
      try {
        const result = await this.whatsAppAdapter.send(context, phoneNumber, input.body);
        providerResponse = result.providerResponse;
      } catch (error) {
        status = 'failed';
        errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error('Fallo entregando notificación por WhatsApp', {
          recipientUserId: input.recipientUserId,
          notificationId: notification.id,
          error: errorMessage,
        });
      }

      await tx.notification_delivery_logs.create({
        data: {
          tenant_id: context.tenantId,
          company_id: context.companyId,
          notification_id: notification.id,
          channel_id: channel.id,
          status,
          provider_response: providerResponse ?? errorMessage ?? null,
        },
      });

      return { status, providerResponse, error: errorMessage };
    });
  }
}
