import { registerAs } from '@nestjs/config';

/**
 * Namespace `notifications` (Notification Center — Fase 1, canal WhatsApp) —
 * mismo patrón que `storage.config.ts`. Ver core/notifications/notification-center.service.ts.
 */
export default registerAs('notifications', () => ({
  encryptionKey: process.env['NOTIFICATIONS_ENCRYPTION_KEY'],
  whatsappGraphApiVersion: process.env['WHATSAPP_GRAPH_API_VERSION'] ?? 'v21.0',
}));
