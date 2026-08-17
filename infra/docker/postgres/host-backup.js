#!/usr/bin/env node
/**
 * GORAZUS ERP — respaldo manual on-demand, ejecutado desde el HOST
 * (Windows/dev) directo a D:\...\backups\ como archivo real, vía
 * `docker compose exec postgres pg_dump`. Distinto del respaldo
 * automático diario del servicio `backup` (infra/postgres/backup/backup.sh,
 * que escribe dentro del volumen `postgres_backups`) — este es para tener
 * un dump verificable en el filesystem del repo (D:) cuando lo necesitás
 * ahora mismo, no en 24hs. Solo lee la base (`pg_dump`), no escribe nada
 * en Postgres.
 */
const { execSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const BACKUP_DIR = path.join(ROOT, 'backups');
const COMPOSE = `docker compose --env-file .env -f infra/docker/docker-compose.yml -f infra/docker/docker-compose.dev.yml`;

const dbUser = process.env['POSTGRES_USER'] || 'gorazus_superuser';
const dbName = process.env['POSTGRES_DB'] || 'gorazus';

fs.mkdirSync(BACKUP_DIR, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, '').replace('Z', 'Z');
const file = path.join(BACKUP_DIR, `gorazus_${timestamp}.dump`);

console.log(`Generando respaldo -> ${file}`);
const dump = execSync(
  `${COMPOSE} exec -T postgres pg_dump -U ${dbUser} -Fc --no-owner --no-privileges -d ${dbName}`,
  { cwd: ROOT, maxBuffer: 1024 * 1024 * 1024 },
);
fs.writeFileSync(file, dump);

console.log(`Respaldo escrito: ${(fs.statSync(file).size / 1024 / 1024).toFixed(2)} MB`);
console.log('Verificando integridad (pg_restore --list, sin restaurar nada)...');
execSync(`${COMPOSE} exec -T postgres pg_restore --list < "${file}"`, {
  cwd: ROOT,
  stdio: ['pipe', 'ignore', 'inherit'],
  shell: true,
});
console.log('Respaldo verificado OK.');
