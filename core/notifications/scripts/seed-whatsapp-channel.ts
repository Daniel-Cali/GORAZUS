/**
 * Da de alta el canal WhatsApp en `core.notification_channels` para el tenant
 * demo — sin esto, `NotificationCenterService.send()` falla con "canal no
 * dado de alta" (no hay UI de administración todavía, ver
 * WhatsAppCredentialsService). Mismo patrón operativo que
 * modules/seguridad/backend/scripts/seed-rbac.ts (script standalone, no
 * endpoint HTTP, import relativo directo al cliente Prisma generado).
 *
 * Uso: `npx ts-node --transpile-only core/notifications/scripts/seed-whatsapp-channel.ts`
 */
// eslint-disable-next-line @nx/enforce-module-boundaries -- script standalone, ver comentario de cabecera
import { PrismaClient } from '../../database/prisma/schemas/core/generated';

const SEED_TENANT_ID = '00000000-0000-0000-0000-000000000000';

async function main(): Promise<void> {
  const client = new PrismaClient({ datasources: { db: { url: process.env['DATABASE_URL'] } } });

  try {
    const existing = await client.notification_channels.findFirst({
      where: { tenant_id: SEED_TENANT_ID, channel_type: 'whatsapp', deleted_at: null },
    });
    if (existing) {
      console.log('El canal WhatsApp ya existe para el tenant demo, nada que hacer.');
      return;
    }

    const channel = await client.notification_channels.create({
      data: {
        tenant_id: SEED_TENANT_ID,
        channel_type: 'whatsapp',
        provider_name: 'whatsapp_business_cloud_api',
        is_default: false,
      },
    });
    console.log(`Canal WhatsApp creado: ${channel.id}`);
    console.log(
      'Recordatorio: cargar credenciales reales vía WhatsAppCredentialsService.saveCredentials() antes de enviar.',
    );
  } finally {
    await client.$disconnect();
  }
}

void main();
