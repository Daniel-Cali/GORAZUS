import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { UserContext } from '@gorazus/contracts';
import { LoggerService } from '@gorazus/core-logging';
import { WhatsAppCredentialsService } from '../integrations/whatsapp-credentials.service';
import type { NotificationChannelAdapter } from './notification-channel.adapter';

/**
 * WhatsApp Business Cloud API (Meta) — docs/architecture/32-core-platform/
 * 06-eventos-y-mensajeria.md §4.1. Fase 1: mensaje de texto libre únicamente
 * (`type: 'text'`) — la restricción real de la API (fuera de la ventana de
 * 24h desde el último mensaje del destinatario solo se aceptan plantillas
 * pre-aprobadas por Meta, `type: 'template'`) requiere `Template Engine`
 * (08-frameworks-de-infraestructura.md §4, no construido todavía) para
 * resolver el nombre de plantilla aprobada — documentado como Fase 2, no
 * simulado acá. Un envío fuera de la ventana de 24h sin plantilla
 * simplemente falla con el error real que devuelve Meta (no se oculta).
 */
@Injectable()
export class WhatsAppGatewayAdapter implements NotificationChannelAdapter {
  readonly channelType = 'whatsapp';

  constructor(
    private readonly credentialsService: WhatsAppCredentialsService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  async send(
    context: Pick<UserContext, 'tenantId' | 'companyId'>,
    to: string,
    body: string,
  ): Promise<{ providerResponse: string }> {
    const credentials = await this.credentialsService.getCredentials(context);
    if (!credentials) {
      throw new Error(
        'Canal WhatsApp sin credenciales configuradas para este tenant (core.integrations, name="whatsapp_business")',
      );
    }

    const apiVersion = this.configService.get<string>('notifications.whatsappGraphApiVersion');
    const url = `https://graph.facebook.com/${apiVersion}/${credentials.phoneNumberId}/messages`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${credentials.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body },
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) {
      this.logger.error('WhatsApp Graph API rechazó el envío', {
        status: response.status,
        payload,
      });
      throw new Error(`WhatsApp Graph API error ${response.status}: ${JSON.stringify(payload)}`);
    }
    return { providerResponse: JSON.stringify(payload) };
  }
}
