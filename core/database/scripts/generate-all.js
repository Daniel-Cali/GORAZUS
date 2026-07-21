#!/usr/bin/env node
/**
 * Corre `prisma generate` para cada uno de los 21 schemas — ver
 * split-schema-by-module.js para el porqué del split.
 */
const { execSync } = require('node:child_process');
const path = require('node:path');

const SCHEMAS = [
  'core', 'security', 'customers', 'suppliers', 'products', 'inventory', 'sales',
  'purchases', 'cash', 'banks', 'accounting', 'taxes', 'hr', 'payroll', 'crm',
  'services', 'projects', 'assets', 'reports', 'bi', 'configuration',
];

const ROOT = path.resolve(__dirname, '..');
const PRISMA_BIN = path.join(ROOT, 'node_modules', '.bin', 'prisma');

for (const schema of SCHEMAS) {
  const schemaPath = path.join(ROOT, 'prisma', 'schemas', schema, 'schema.prisma');
  console.log(`=== ${schema} ===`);
  execSync(`"${PRISMA_BIN}" generate --schema="${schemaPath}"`, { stdio: 'inherit', cwd: ROOT });
}
