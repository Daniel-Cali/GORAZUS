// GORAZUS ERP — ESLint flat config (ESLint 9 / Nx 20).
// Fronteras de import entre módulos: docs/architecture/01-estructura-monorepo.md §5.
// La tabla de esa sección se traduce acá a `depConstraints` por tag —
// es lo que convierte "cada módulo debe ser independiente" en una
// regla verificada en CI (ver 01 §1), no una convención de honor.
//
// NOTA: los tags `scope:<modulo>` (uno por carpeta de modules/<x>/,
// usados para "solo puede importar módulos declarados como
// dependencia") se asignan en el project.json de cada módulo cuando
// ese módulo se escafolda (EPIC 02+) — todavía no existen módulos con
// project.json, así que ese nivel fino de enforcement queda
// deliberadamente pendiente. Lo que sí se fija ahora, porque ya está
// completamente documentado y no depende de que existan módulos
// concretos, son las fronteras por TIPO (core/contracts/backend/
// frontend/shared/ui-kit/app) de la tabla de 01 §5.

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import nx from '@nx/eslint-plugin';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      '**/dist',
      '**/build',
      '**/tmp',
      '**/coverage',
      '**/node_modules',
      '.nx/**',
      // Clientes Prisma generados (core/database/generated,
      // core/database/prisma/schemas/*/generated) — código auto-generado, no de autoría propia
      '**/generated/**',
      // Scripts Node operativos standalone (no parte del build de TS del
      // proyecto) — CommonJS/require() es correcto ahí, no violación de estilo
      'core/database/scripts/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    plugins: { '@nx': nx },
    rules: {
      // Ver docs/architecture/01-estructura-monorepo.md §5 — tabla de
      // import enforcement traducida a tags de tipo.
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [
            {
              sourceTag: 'type:app-api',
              onlyDependOnLibsWithTags: ['type:backend', 'type:core'],
            },
            {
              sourceTag: 'type:app-web',
              onlyDependOnLibsWithTags: ['type:frontend', 'type:ui-kit'],
            },
            {
              sourceTag: 'type:backend',
              onlyDependOnLibsWithTags: ['type:core', 'type:contracts', 'type:shared'],
            },
            {
              sourceTag: 'type:frontend',
              onlyDependOnLibsWithTags: ['type:ui-kit', 'type:contracts', 'type:shared'],
            },
            {
              sourceTag: 'type:shared',
              onlyDependOnLibsWithTags: ['type:contracts'],
            },
            {
              // type:core incluye 'type:core' a sí mismo — la capa de
              // infraestructura transversal se apila entre sí (http
              // depende de logging, kernel depende de http/config/etc.),
              // a diferencia de modules/*/backend, donde cruzar a OTRO
              // módulo de negocio sí está prohibido (ver constraint de
              // type:backend más abajo).
              sourceTag: 'type:core',
              onlyDependOnLibsWithTags: ['type:core', 'type:contracts', 'type:tooling'],
            },
            {
              sourceTag: 'type:ui-kit',
              onlyDependOnLibsWithTags: ['type:contracts', 'type:tooling'],
            },
            {
              sourceTag: 'type:contracts',
              onlyDependOnLibsWithTags: [],
            },
            {
              sourceTag: 'type:tooling',
              onlyDependOnLibsWithTags: [],
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    // React solo aplica a modules/*/frontend, apps/web y ui-kit — ver
    // docs/architecture/01-estructura-monorepo.md §2 (árbol de carpetas)
    files: ['**/frontend/**/*.{tsx,jsx}', 'apps/web/**/*.{tsx,jsx}', 'ui-kit/**/*.{tsx,jsx}'],
    plugins: { react, 'react-hooks': reactHooks },
    languageOptions: {
      globals: { ...globals.browser },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off', // React 19 + Vite JSX transform automático
      'react/prop-types': 'off', // TypeScript ya valida props en tiempo de compilación — el proyecto nunca usa PropTypes en runtime (convención ya fijada en todo ui-kit)
    },
    settings: { react: { version: 'detect' } },
  },
);
