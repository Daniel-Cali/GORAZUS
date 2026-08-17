#!/usr/bin/env node
/**
 * GORAZUS ERP — restauración manual desde un .dump de D:\...\backups\.
 * A propósito NO restaura automáticamente: `pg_restore --clean` elimina
 * objetos existentes antes de recrearlos, es una operación destructiva
 * sobre la base actual. Este script solo IMPRIME el comando exacto —
 * quien lo corre lo pega y confirma a mano, nunca queda un solo
 * `pnpm db:restore` que borre datos por error de tipeo/ambiente.
 * Uso: pnpm db:restore gorazus_20260811T190216Z.dump
 */
const path = require('node:path');

const file = process.argv[2];
if (!file) {
  console.error('Uso: pnpm db:restore <archivo.dump>  (relativo a backups/, ej: gorazus_20260811T190216Z.dump)');
  console.error('Archivos disponibles en backups/:');
  try {
    const fs = require('node:fs');
    const dir = path.resolve(__dirname, '..', '..', '..', 'backups');
    for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.dump'))) console.error(`  - ${f}`);
  } catch {
    // sin backups/ todavía — nada que listar
  }
  process.exit(1);
}

const COMPOSE = 'docker compose --env-file .env -f infra/docker/docker-compose.yml -f infra/docker/docker-compose.dev.yml';
console.log('Esta operación reemplaza objetos existentes en la base "gorazus". Revisar y correr a mano:\n');
console.log(`  ${COMPOSE} exec -T postgres pg_restore --clean --if-exists --no-owner --no-privileges -U gorazus_superuser -d gorazus < "backups/${file}"\n`);
console.log('Recomendado: probar primero contra una base/entorno aislado (docs/database/08-estrategia-respaldo.md §6), no contra la base de desarrollo activa sin necesidad.');
