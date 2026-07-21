#!/usr/bin/env node
/**
 * Copia los 21 clientes Prisma generados a dist/ — necesario porque
 * @nx/js:tsc respeta .gitignore al copiar "assets" (por diseño, ver
 * su CopyAssetsHandler), y core/database/prisma/schemas/*\/generated/
 * está en .gitignore a propósito (no se commitea, se regenera). Sin
 * esta copia explícita, dist/core/database/src/database.module.js
 * (compilado) no encuentra sus imports relativos a
 * ../prisma/schemas/<schema>/generated en runtime — se detectó
 * corriendo `pnpm nx serve api` de verdad, no solo compilando.
 *
 * Corre como parte del target `build` de core-database (ver
 * project.json, dependsOn) — siempre antes de que tsc compile, para
 * que un `rm -rf dist` + rebuild deje todo consistente.
 */
const fs = require('fs');
const path = require('path');

const SCHEMAS = [
  'core', 'security', 'customers', 'suppliers', 'products', 'inventory', 'sales',
  'purchases', 'cash', 'banks', 'accounting', 'taxes', 'hr', 'payroll', 'crm',
  'services', 'projects', 'assets', 'reports', 'bi', 'configuration',
];

const ROOT = path.resolve(__dirname, '..');
const DIST = path.resolve(ROOT, '..', '..', 'dist', 'core', 'database');

let copied = 0;
for (const schema of SCHEMAS) {
  const src = path.join(ROOT, 'prisma', 'schemas', schema, 'generated');
  const dest = path.join(DIST, 'prisma', 'schemas', schema, 'generated');
  if (!fs.existsSync(src)) {
    console.warn(`Falta ${src} — correr "pnpm db:generate" primero.`);
    continue;
  }
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
  copied++;
}
console.log(`Copiados ${copied}/${SCHEMAS.length} clientes generados a dist/`);
