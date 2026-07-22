import { registerAs } from '@nestjs/config';

/** Namespace `mail` (SMTP) — ver core/config/namespaces/database.config.ts (mismo patrón). En dev apunta a MailHog (.env.example). */
export default registerAs('mail', () => ({
  host: process.env['SMTP_HOST'],
  port: Number(process.env['SMTP_PORT']),
}));
