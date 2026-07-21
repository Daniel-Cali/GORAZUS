#!/usr/bin/env node
/**
 * Aplica los archivos SQL versionados de docs/database/sql/ (01-33) en
 * orden numérico contra el contenedor de Postgres, vía el servicio
 * `postgres` de docker compose — NO usa `prisma migrate` (decisión ya
 * fijada, docs/architecture/02-arquitectura-modulos-backend.md §4: el
 * SQL crudo es la fuente de verdad, Prisma solo consume vía `db pull`).
 *
 * Idempotencia real: NO garantizada para 01-21 (CREATE TABLE sin
 * IF NOT EXISTS, por diseño — evita crear una tabla "a medias" si algo
 * más falla a mitad de camino). Sí es razonablemente segura para
 * re-ejecutar completa contra una base ya migrada, PERO fallará con
 * errores de "already exists" en ese caso — está pensado para
 * aprovisionar un ambiente NUEVO desde cero, no para aplicar deltas
 * incrementales sobre uno ya migrado (para eso, aplicar manualmente
 * solo el archivo nuevo que corresponda).
 */
const { execSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const SQL_DIR = path.join(ROOT, 'docs', 'database', 'sql');
const COMPOSE_FILES = ['-f', path.join(ROOT, 'infra', 'docker', 'docker-compose.yml'), '-f', path.join(ROOT, 'infra', 'docker', 'docker-compose.dev.yml')];

const dbUser = process.env['POSTGRES_USER'] || 'gorazus_app';
const dbName = process.env['POSTGRES_DB'] || 'gorazus';

const files = fs
  .readdirSync(SQL_DIR)
  .filter((f) => /^\d{2}_.*\.sql$/.test(f))
  .sort();

console.log(`Aplicando ${files.length} archivos SQL contra ${dbName} (usuario ${dbUser})...`);

for (const file of files) {
  const fullPath = path.join(SQL_DIR, file);
  console.log(`=== ${file} ===`);
  try {
    execSync(
      `docker compose ${COMPOSE_FILES.map((f) => `"${f}"`).join(' ')} exec -T postgres psql -U ${dbUser} -d ${dbName} -v ON_ERROR_STOP=1 -f -`,
      { stdio: ['pipe', 'inherit', 'inherit'], input: fs.readFileSync(fullPath), cwd: ROOT },
    );
  } catch (error) {
    console.error(`FALLÓ en ${file} — revisar arriba. Deteniendo (no se aplican los archivos restantes).`);
    process.exit(1);
  }
}

console.log('Migración completa.');
