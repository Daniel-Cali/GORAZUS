import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Controles mínimos de accesibilidad para las rutas públicas. La pantalla de
 * login no requiere datos sembrados ni una sesión, por lo que es un smoke
 * test estable que también puede ejecutarse en CI antes de los flujos E2E
 * autenticados.
 */
test.describe('Accesibilidad', () => {
  test('el formulario de inicio de sesión no tiene violaciones WCAG AA', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /iniciar sesión/i })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
