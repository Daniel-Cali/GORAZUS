import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { UserContext } from '@gorazus/contracts';
import { PRISMA_CORE, withTenantScope, type CorePrismaClient } from '@gorazus/core-database';
// Ruta relativa, no el alias `@gorazus/tooling/*` — `packages/tooling` no es un
// paquete pnpm real (sin package.json propio), el alias solo resuelve para el
// type-checker (mismo criterio ya usado en modules/auth/backend/services/login.usecase.ts).
// eslint-disable-next-line @nx/enforce-module-boundaries -- packages/tooling no tiene project.json propio, ver comentario arriba
import { decrypt, encrypt, type EncryptedPayload } from '../../../packages/tooling/utils';
import type { WhatsAppCredentials } from '../types';

const INTEGRATION_NAME = 'whatsapp_business';
/** `core.integrations.integration_type` no tiene categoría propia para mensajería — `'other'` es el valor genérico ya previsto para este caso, ver 42-integraciones-plan-fase-8.md §2 ("una fila nueva de integration_type si no encaja en las 5 categorías ya existentes" — WhatsApp sí encaja en la genérica, no amerita tocar el CHECK). */
const INTEGRATION_TYPE = 'other';
/** Fase 1: una sola clave activa — el `keyId` ya viaja en cada `EncryptedPayload` (packages/tooling/utils/encryption.ts), lista para que una Fase 2 con múltiples claves (rotación real vía KMS, 32-core-platform/10 §7) resuelva la clave correcta por `keyId` en vez de una constante. */
const KEY_ID = 'notifications-v1';

const CREDENTIAL_KEYS = {
  accessToken: 'access_token',
  phoneNumberId: 'phone_number_id',
  businessAccountId: 'business_account_id',
} as const;

/**
 * Lee/escribe las credenciales del canal WhatsApp Business en
 * `core.integrations`/`core.integration_credentials` — infraestructura
 * genérica ya diseñada para cualquier integración externa (42-integraciones-
 * plan-fase-8.md §2), sin tabla nueva. El valor cifrado (AES-256-GCM vía
 * `packages/tooling/utils/encryption.ts`, ya construido — coincide con la
 * interfaz de `EncryptionUtils` de 32-core-platform/10-utilidades-comunes.md
 * §7) se serializa a JSON en `encrypted_value` (columna TEXT).
 *
 * Todavía no existe UI de administración (`administracion`, módulo sin
 * backend) para cargar estas credenciales — este servicio queda listo para
 * que esa UI (o un script operativo, Fase 1) las escriba.
 */
@Injectable()
export class WhatsAppCredentialsService {
  constructor(
    @Inject(PRISMA_CORE) private readonly prisma: CorePrismaClient,
    private readonly configService: ConfigService,
  ) {}

  async saveCredentials(
    context: Pick<UserContext, 'tenantId' | 'companyId'>,
    credentials: WhatsAppCredentials,
  ): Promise<void> {
    const key = this.encryptionKey();
    await withTenantScope(this.prisma, context, async (tx) => {
      const integration = await this.findOrCreateIntegration(tx, context);
      const plaintextByKey: Record<string, string> = {
        [CREDENTIAL_KEYS.accessToken]: credentials.accessToken,
        [CREDENTIAL_KEYS.phoneNumberId]: credentials.phoneNumberId,
        [CREDENTIAL_KEYS.businessAccountId]: credentials.businessAccountId,
      };
      for (const [credentialKey, plaintext] of Object.entries(plaintextByKey)) {
        const encryptedValue = JSON.stringify(encrypt(plaintext, KEY_ID, key));
        const existing = await tx.integration_credentials.findFirst({
          where: {
            integration_id: integration.id,
            credential_key: credentialKey,
            deleted_at: null,
          },
        });
        if (existing) {
          await tx.integration_credentials.update({
            where: { id: existing.id },
            data: { encrypted_value: encryptedValue },
          });
        } else {
          await tx.integration_credentials.create({
            data: {
              tenant_id: context.tenantId,
              company_id: context.companyId,
              integration_id: integration.id,
              credential_key: credentialKey,
              encrypted_value: encryptedValue,
            },
          });
        }
      }
    });
  }

  async getCredentials(
    context: Pick<UserContext, 'tenantId' | 'companyId'>,
  ): Promise<WhatsAppCredentials | null> {
    const key = this.encryptionKey();
    return withTenantScope(this.prisma, context, async (tx) => {
      const integration = await tx.integrations.findFirst({
        where: {
          name: INTEGRATION_NAME,
          integration_type: INTEGRATION_TYPE,
          deleted_at: null,
          is_enabled: true,
        },
      });
      if (!integration) return null;

      const rows = await tx.integration_credentials.findMany({
        where: { integration_id: integration.id, deleted_at: null },
      });
      const encryptedByKey = new Map(rows.map((row) => [row.credential_key, row.encrypted_value]));
      const accessTokenEncrypted = encryptedByKey.get(CREDENTIAL_KEYS.accessToken);
      const phoneNumberIdEncrypted = encryptedByKey.get(CREDENTIAL_KEYS.phoneNumberId);
      const businessAccountIdEncrypted = encryptedByKey.get(CREDENTIAL_KEYS.businessAccountId);
      if (!accessTokenEncrypted || !phoneNumberIdEncrypted || !businessAccountIdEncrypted)
        return null;

      return {
        accessToken: decrypt(JSON.parse(accessTokenEncrypted) as EncryptedPayload, key),
        phoneNumberId: decrypt(JSON.parse(phoneNumberIdEncrypted) as EncryptedPayload, key),
        businessAccountId: decrypt(JSON.parse(businessAccountIdEncrypted) as EncryptedPayload, key),
      };
    });
  }

  /** `NOTIFICATIONS_ENCRYPTION_KEY` es hex de 64 caracteres (32 bytes, ver env.schema.ts) — AES-256-GCM exige exactamente 32 bytes de clave. */
  private encryptionKey(): Buffer {
    const hexKey = this.configService.get<string>('notifications.encryptionKey') as string;
    return Buffer.from(hexKey, 'hex');
  }

  private async findOrCreateIntegration(
    tx: CorePrismaClient,
    context: Pick<UserContext, 'tenantId' | 'companyId'>,
  ) {
    const existing = await tx.integrations.findFirst({
      where: { name: INTEGRATION_NAME, integration_type: INTEGRATION_TYPE, deleted_at: null },
    });
    if (existing) return existing;
    return tx.integrations.create({
      data: {
        tenant_id: context.tenantId,
        company_id: context.companyId,
        name: INTEGRATION_NAME,
        integration_type: INTEGRATION_TYPE,
        is_enabled: true,
      },
    });
  }
}
