#!/bin/sh
# GORAZUS ERP — restauración desde un respaldo de backup.sh. Uso:
#   docker compose exec backup /scripts/restore.sh gorazus_20260720T120000Z.dump
# Restaura contra la misma base (PGDATABASE) — pensado para el runbook de
# prueba de restauración mensual (docs/database/08-estrategia-respaldo.md §6,
# .github/workflows/nightly-restore-test.yml) contra un entorno AISLADO, no
# contra producción directamente.
set -eu

if [ -z "${1:-}" ]; then
    echo "Uso: restore.sh <archivo.dump> (relativo a /backups)" >&2
    exit 1
fi

FILE="/backups/$1"
if [ ! -f "$FILE" ]; then
    echo "No existe: $FILE" >&2
    exit 1
fi

echo "[$(date -u +%FT%TZ)] Restaurando $FILE contra $PGDATABASE en $PGHOST..."
pg_restore --clean --if-exists --no-owner --no-privileges -d "$PGDATABASE" "$FILE"
echo "[$(date -u +%FT%TZ)] Restauración completa."
