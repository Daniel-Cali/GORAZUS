#!/bin/sh
# GORAZUS ERP — respaldo lógico automático (FASE 05, 2026-07-20).
# Fase 1 (núcleo mínimo, mismo criterio ya aplicado en toda la sesión):
# `pg_dump` programado + retención, corriendo de verdad en un contenedor
# propio — no solo documentado. El mecanismo objetivo de producción real
# (pgBackRest + WAL archiving continuo + PITR, ver
# docs/database/08-estrategia-respaldo.md §2) es infraestructura mayor
# (repo/stanza propios, servidor dedicado) que no se improvisa sin esa
# instalación real — queda documentada como Fase 2 explícita, no fingida acá.
set -eu

BACKUP_DIR="/backups"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
FILE="$BACKUP_DIR/gorazus_${TIMESTAMP}.dump"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

mkdir -p "$BACKUP_DIR"

echo "[$(date -u +%FT%TZ)] Iniciando respaldo -> $FILE"
pg_dump -Fc --no-owner --no-privileges -f "$FILE"
echo "[$(date -u +%FT%TZ)] Respaldo completo: $(du -h "$FILE" | cut -f1)"

echo "[$(date -u +%FT%TZ)] Aplicando retención (${RETENTION_DAYS} días)..."
find "$BACKUP_DIR" -name 'gorazus_*.dump' -mtime "+${RETENTION_DAYS}" -print -delete

echo "[$(date -u +%FT%TZ)] Listo. Respaldos actuales:"
ls -lh "$BACKUP_DIR"
