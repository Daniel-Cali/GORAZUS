import { defineConfig, devices } from '@playwright/test';

/**
 * GORAZUS ERP — Playwright real (FASE 05, 2026-07-20). Antes de esto, la
 * verificación en navegador de esta sesión fue siempre ad hoc (scripts
 * descartables), nunca una suite committeada. Requiere que `apps/web` +
 * `apps/api` (+ Postgres/Redis/RabbitMQ/MinIO) ya estén corriendo — no
 * levanta el stack por sí mismo (ver README.md de esta carpeta).
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: process.env['E2E_BASE_URL'] || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    ignoreHTTPSErrors: true, // certificado autofirmado de desarrollo, ver infra/nginx/generate-dev-cert.sh
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
