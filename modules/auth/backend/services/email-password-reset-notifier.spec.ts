import type { ConfigService } from '@nestjs/config';
import { EmailPasswordResetNotifier } from './email-password-reset-notifier';

const MAILHOG_API = 'http://localhost:8025/api/v2';

interface MailHogMessage {
  Content: { Headers: { Subject?: string[]; To?: string[] }; Body: string };
}

/** nodemailer manda el body como quoted-printable — sin decodificar, un `=` en la URL (`tenant=demo`) aparece como `=3D` y las líneas largas se cortan con `=\r\n`. Decoder mínimo, solo para este test. */
function decodeQuotedPrintable(input: string): string {
  return input
    .replace(/=\r?\n/g, '')
    .replace(/=([0-9A-F]{2})/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)));
}

/**
 * Contra MailHog real (no mockeado) — mismo criterio que `core/cache/lock.service.spec.ts`
 * contra Redis real: manda un correo real por SMTP y lo verifica leyendo
 * la API de MailHog (:8025), que captura todo lo que le llega sin
 * reenviarlo de verdad. Requiere el MailHog del compose de desarrollo
 * arriba (SMTP_HOST/SMTP_PORT, ver .env.example).
 */
describe('EmailPasswordResetNotifier', () => {
  async function fetchLastMessageTo(email: string): Promise<MailHogMessage> {
    const response = await fetch(
      `${MAILHOG_API}/search?kind=to&query=${encodeURIComponent(email)}`,
    );
    const body = (await response.json()) as { items: MailHogMessage[] };
    const message = body.items[0];
    if (!message) {
      throw new Error(`MailHog no capturó ningún correo dirigido a ${email}`);
    }
    return message;
  }

  it('envía el link de reset por SMTP — MailHog lo captura con el token y el tenant correctos', async () => {
    const fakeConfigService = {
      get: (key: string) => {
        const values: Record<string, unknown> = {
          'mail.host': process.env['SMTP_HOST'],
          'mail.port': Number(process.env['SMTP_PORT']),
          CORS_ORIGIN: 'http://localhost:5173',
        };
        return values[key];
      },
    } as unknown as ConfigService;

    const notifier = new EmailPasswordResetNotifier(fakeConfigService);
    const email = `password-reset-notifier-e2e-${Date.now()}@example.com`;
    const token = `token-de-prueba-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await notifier.enviarTokenReset('demo', email, token, expiresAt);

    const message = await fetchLastMessageTo(email);
    const body = decodeQuotedPrintable(message.Content.Body);
    expect(message.Content.Headers.Subject?.[0]).toContain('Restablecer');
    expect(body).toContain(token);
    expect(body).toContain('tenant=demo');
  }, 15000);
});
