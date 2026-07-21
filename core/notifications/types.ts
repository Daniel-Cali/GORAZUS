/**
 * Fase 1 (núcleo mínimo, ver docs/architecture/42-integraciones-plan-fase-8.md §2): un
 * solo canal soportado. `notification_channels.channel_type` ya admite
 * `'email'|'sms'|'push'|'whatsapp'|'in_app'` (docs/database/sql/01_core.sql) — los
 * demás quedan documentados como Fase 2, sin adaptador todavía.
 */
export type NotificationChannelType = 'whatsapp';

export interface SendNotificationInput {
  /** Destinatario interno — `notifications.recipient_user_id` es NOT NULL en el esquema físico, ver `core.users`. Notificar a un contacto externo (lead/cliente de CRM) queda fuera de este alcance, ver notification-center.service.ts. */
  recipientUserId: string;
  channelType: NotificationChannelType;
  subject?: string;
  body: string;
}

export interface NotificationDeliveryResult {
  status: 'sent' | 'failed';
  providerResponse?: string;
  error?: string;
}

export interface WhatsAppCredentials {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId: string;
}
