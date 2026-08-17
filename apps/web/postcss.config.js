// PostCSS carga este archivo como CommonJS; `require` es la API compatible.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('node:path');

module.exports = {
  plugins: {
    // Ruta explícita: Tailwind resuelve su config relativa a
    // `process.cwd()`, no a este archivo — si el dev server arranca con
    // cwd en la raíz del monorepo (p. ej. `nx serve web`), la búsqueda
    // automática no encuentra `tailwind.config.ts` y cae al tema por
    // defecto (rompe los tokens de shadcn/ui como `border-border`).
    tailwindcss: { config: path.join(__dirname, 'tailwind.config.ts') },
    autoprefixer: {},
  },
};
