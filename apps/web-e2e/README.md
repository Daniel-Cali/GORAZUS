# GORAZUS ERP — E2E real (Playwright)

Suite committeada (FASE 05, 2026-07-20) — antes de esto, toda verificación en navegador de esta
sesión fue con scripts ad hoc descartables, nunca una suite real. Requiere que el stack ya esté
corriendo (no lo levanta esta suite):

```bash
# Backend + frontend locales (ts-node + Vite dev server)
pnpm nx serve api   # otra terminal
pnpm nx serve web   # otra terminal

# Playwright, contra el dev server (default)
cd apps/web-e2e
PLAYWRIGHT_BROWSERS_PATH="$PWD/../../.playwright-browsers" npx playwright test

# O contra el stack completo de Docker Compose (nginx + HTTPS)
E2E_BASE_URL=https://localhost PLAYWRIGHT_BROWSERS_PATH="$PWD/../../.playwright-browsers" npx playwright test

# Solo el control público de accesibilidad (WCAG A y AA) del inicio de sesión
PLAYWRIGHT_BROWSERS_PATH="$PWD/../../.playwright-browsers" npx playwright test accessibility.spec.ts
```

La suite incluye `@axe-core/playwright`. Las rutas públicas se comprueban sin
credenciales; para las rutas autenticadas, los tests existentes necesitan el
usuario demo y los servicios locales indicados arriba.

Requiere el tenant/usuario de prueba ya sembrado — ver
`modules/seguridad/backend/scripts/seed-rbac.ts demo admin@demo.local`.

`PLAYWRIGHT_BROWSERS_PATH` apunta al proyecto (`.playwright-browsers/`, gitignored) — nunca a
`C:\`, ver `.gitignore` y la regla permanente de esta sesión (todo dentro de `D:\15_Codigo_Fuente\GORAZUS`).
