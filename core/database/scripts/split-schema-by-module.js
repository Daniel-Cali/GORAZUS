#!/usr/bin/env node
/**
 * Divide core/database/prisma/schema.prisma (el pull completo de los
 * 21 schemas, ~500 modelos) en un schema.prisma independiente por
 * schema de Postgres, en core/database/prisma/schemas/<nombre>/.
 *
 * Por qué existe: un cliente Prisma monolítico con los 500 modelos
 * juntos hace colgar `prisma generate` (WASM getDMMF, límite de
 * escala de Prisma 5.x, confirmado empíricamente). 21 clientes
 * independientes (68 modelos máximo, el de `core`) generan en
 * segundos. Ver el comentario de cabecera de
 * core/database/src/database.module.ts para el detalle completo.
 *
 * Efecto secundario intencional: los campos de relación Prisma que
 * cruzaban schemas se podan — no se pierde nada real, esas referencias
 * ya estaban prohibidas como FK de Postgres entre schemas de distintos
 * módulos (docs/architecture/02-arquitectura-modulos-backend.md §4).
 *
 * Uso: node core/database/scripts/split-schema-by-module.js
 * (correr después de cada `pnpm db:pull` real contra una base viva,
 * antes de `pnpm db:generate`).
 */
const fs = require('fs');
const path = require('path');

const SCHEMAS = [
  'core', 'security', 'customers', 'suppliers', 'products', 'inventory', 'sales',
  'purchases', 'cash', 'banks', 'accounting', 'taxes', 'hr', 'payroll', 'crm',
  'services', 'projects', 'assets', 'reports', 'bi', 'configuration',
];

const KNOWN_SCALARS = ['String', 'Int', 'BigInt', 'Boolean', 'DateTime', 'Json', 'Decimal', 'Float', 'Bytes'];

const ROOT = path.resolve(__dirname, '..');
const MASTER_SCHEMA = path.join(ROOT, 'prisma', 'schema.prisma');

function parseBlocks(src) {
  const lines = src.split('\n');
  let i = 0;
  while (i < lines.length && !lines[i].startsWith('model ') && !lines[i].startsWith('enum ')) i++;

  const blocks = [];
  while (i < lines.length) {
    if (lines[i].startsWith('model ') || lines[i].startsWith('enum ')) {
      const kind = lines[i].startsWith('model ') ? 'model' : 'enum';
      const name = lines[i].split(/\s+/)[1];
      const block = [lines[i]];
      i++;
      while (i < lines.length && lines[i].trim() !== '}') {
        block.push(lines[i]);
        i++;
      }
      block.push(lines[i]);
      i++;
      blocks.push({ kind, name, lines: block, text: block.join('\n') });
    } else {
      i++;
    }
  }
  return blocks;
}

function main() {
  const src = fs.readFileSync(MASTER_SCHEMA, 'utf8');
  const blocks = parseBlocks(src);

  const schemaOf = new Map();
  for (const b of blocks) {
    const m = b.text.match(/@@schema\("([a-z_]+)"\)/);
    if (m) schemaOf.set(b.name, m[1]);
  }

  let totalStripped = 0;
  for (const targetSchema of SCHEMAS) {
    const includedNames = new Set(blocks.filter((b) => schemaOf.get(b.name) === targetSchema).map((b) => b.name));
    const usedEnums = new Set();
    let strippedFields = 0;

    const modelTexts = [];
    for (const b of blocks) {
      if (b.kind !== 'model' || schemaOf.get(b.name) !== targetSchema) continue;
      const filtered = b.lines.filter((line) => {
        const m = line.match(/^\s*\w+\s+(\w+)(\[\])?\??\s*(@relation.*)?$/);
        if (!m) return true;
        const typeName = m[1];
        if (KNOWN_SCALARS.includes(typeName)) return true;
        if (includedNames.has(typeName)) return true;
        const enumBlock = blocks.find((eb) => eb.kind === 'enum' && eb.name === typeName);
        if (enumBlock) {
          usedEnums.add(typeName);
          return true;
        }
        strippedFields++;
        return false;
      });
      modelTexts.push(filtered.join('\n'));
    }

    let out = `generator client {\n  provider        = "prisma-client-js"\n  output          = "./generated"\n  previewFeatures = ["multiSchema"]\n}\n\ndatasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n  schemas  = ["${targetSchema}"]\n}\n\n`;
    for (const enumName of usedEnums) {
      out += blocks.find((eb) => eb.kind === 'enum' && eb.name === enumName).text + '\n\n';
    }
    out += modelTexts.join('\n\n') + '\n';

    const dir = path.join(ROOT, 'prisma', 'schemas', targetSchema);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'schema.prisma'), out);
    totalStripped += strippedFields;
    console.log(`${targetSchema}: ${modelTexts.length} modelos, ${usedEnums.size} enums, ${strippedFields} campos cross-schema podados`);
  }
  console.log(`Total podado: ${totalStripped}`);
}

main();
