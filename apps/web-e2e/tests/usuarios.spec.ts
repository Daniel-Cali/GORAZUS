import { expect, test } from '@playwright/test';

/**
 * Flujo real de gestión de usuarios (modules/seguridad/frontend) — segundo
 * módulo con frontend real esta sesión, después de auth. El grupo "Sistema"
 * del sidebar arranca colapsado — hay que expandirlo antes de poder
 * clickear el link "Seguridad" (mismo hallazgo que la verificación ad hoc
 * original de FASE 03, ahora committeado como test real).
 */
async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByLabel('Organización').fill('demo');
  await page.getByLabel('Correo').fill('admin@demo.local');
  await page.getByLabel('Contraseña').fill('Test1234!');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
}

test.describe('Usuarios (seguridad)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('navega desde el sidebar (grupo Sistema → Seguridad) al listado', async ({ page }) => {
    await page.getByText('Sistema', { exact: true }).click(); // expande el grupo colapsado
    await page.getByRole('link', { name: 'Seguridad' }).click();
    await expect(page).toHaveURL(/\/seguridad\/usuarios/);
    await expect(page.getByRole('columnheader', { name: 'Nombre' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Correo' })).toBeVisible();
  });

  test('crea un usuario nuevo y aparece en el listado', async ({ page }) => {
    await page.goto('/seguridad/usuarios');
    await page.getByRole('button', { name: 'Nuevo usuario' }).click();

    const nombre = `E2E Test ${Date.now()}`;
    const email = `e2e-${Date.now()}@demo.local`;
    await page.getByLabel('Nombre completo').fill(nombre);
    await page.getByLabel('Correo').fill(email);
    await page.getByRole('button', { name: 'Crear' }).click();

    // La contraseña temporal se muestra en un diálogo aparte al crear.
    await expect(page.getByText(/contraseña temporal/i)).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Listo' }).click();

    await expect(page.getByRole('cell', { name: nombre })).toBeVisible();
    await expect(page.getByRole('cell', { name: email })).toBeVisible();
  });
});
