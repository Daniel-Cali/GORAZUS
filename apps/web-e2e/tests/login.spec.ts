import { expect, test } from '@playwright/test';

/**
 * Flujo real de login (modules/auth/frontend/pages/login.page.tsx) contra el
 * backend real — usa el tenant/usuario de prueba sembrado por
 * `modules/seguridad/backend/scripts/seed-rbac.ts demo admin@demo.local`.
 */
test.describe('Login', () => {
  test('sin token, redirige a /login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('renderiza el formulario con los 3 campos y el botón', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel('Organización')).toBeVisible();
    await expect(page.getByLabel('Correo')).toBeVisible();
    await expect(page.getByLabel('Contraseña')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toBeVisible();
  });

  test('credenciales inválidas muestran un error inline, sin crash', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Organización').fill('demo');
    await page.getByLabel('Correo').fill('admin@demo.local');
    await page.getByLabel('Contraseña').fill('password-incorrecta');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    await expect(
      page.getByText(/usuario o la contraseña son incorrectos|no se pudo iniciar sesión/i),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('credenciales válidas navegan al dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Organización').fill('demo');
    await page.getByLabel('Correo').fill('admin@demo.local');
    await page.getByLabel('Contraseña').fill('Test1234!');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
  });
});
