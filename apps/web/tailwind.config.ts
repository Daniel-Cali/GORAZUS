import path from 'node:path';
import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

/**
 * Tokens de tema vía variables CSS (ver ui-kit/theme/tailwind-tokens.ts)
 * — convención estándar de shadcn/ui, permite alternar claro/oscuro
 * cambiando solo las variables en :root/.dark, nunca los valores de
 * este archivo (docs/frontend/UI_GUIDELINES.md §3).
 */
export default {
  darkMode: ['class'],
  // Absolutas vía `__dirname`: Tailwind resuelve `content` relativo a
  // `process.cwd()`, no a este archivo — si el dev server arranca con
  // cwd en la raíz del monorepo (p. ej. `nx serve web`), los globs
  // relativos no matchean nada, el scan de JIT queda vacío y solo
  // sobreviven las clases usadas directamente vía `@apply` en globals.css
  // (rompe cualquier utilidad de Tailwind usada solo en componentes .tsx).
  content: [
    path.join(__dirname, 'index.html'),
    path.join(__dirname, 'src/**/*.{ts,tsx}'),
    // Subcarpetas explícitas (no `ui-kit/**`) para no recorrer `ui-kit/node_modules`.
    path.join(__dirname, '../../ui-kit/components/**/*.{ts,tsx}'),
    path.join(__dirname, '../../ui-kit/theme/**/*.{ts,tsx}'),
  ],
  theme: {
    container: { center: true, padding: '2rem', screens: { '2xl': '1400px' } },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
