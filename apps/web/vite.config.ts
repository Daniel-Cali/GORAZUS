/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/web',
  // Proxy /api al backend local en desarrollo — mismo mecanismo que nginx en
  // Docker Compose/Kubernetes (ver infra/nginx/nginx.conf), así el código de
  // la app siempre llama a una ruta relativa ("/api/v1", default real en
  // ui-kit/http/client.ts) sin importar el entorno. Bug real corregido FASE
  // 05 (2026-07-20): `apps/web/.env` fijaba VITE_API_URL a
  // "http://localhost:3000" a mano — funcionaba para `pnpm nx serve web`
  // suelto, pero ese valor queda HORNEADO en el build de producción y
  // rompía cualquier despliegue detrás de nginx (CORS/conexión rechazada,
  // confirmado con Playwright real contra el stack completo).
  server: { port: 5173, host: true, proxy: { '/api': 'http://localhost:3000' } },
  preview: { port: 4300, host: true },
  // tsconfigPaths resuelve @gorazus/modules/* (modules/ no es un paquete pnpm
  // propio, solo un path alias de tsconfig.base.json) — @gorazus/ui-kit y
  // @gorazus/contracts ya resuelven vía symlink real de pnpm workspace.
  plugins: [tsconfigPaths(), react()],
  build: {
    outDir: '../../dist/apps/web',
    emptyOutDir: true,
    reportCompressedSize: true,
  },
  test: {
    watch: false,
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test-setup.ts'],
    // `modules/*/frontend` no tenía ningún test hasta este bloque — se
    // amplía el único Vitest ya configurado en vez de crear una segunda
    // arquitectura de testing (Prompt "Frontend Testing Foundation" §6/§11).
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      '../../modules/*/frontend/{hooks,pages,components,test}/**/*.{test,spec}.{ts,tsx}',
    ],
    exclude: ['**/node_modules/**', '**/dist/**'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/apps/web',
      provider: 'v8' as const,
    },
  },
});
