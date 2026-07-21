# GORAZUS ERP — imagen de Postgres 17 con pg_partman.
# Ver docs/database/07-estrategia-particionamiento.md §3: pg_partman es la
# herramienta de gestión de particiones ya decidida (no una alternativa
# ad-hoc) — postgres:17-alpine (imagen base original) no la incluye, este
# Dockerfile la agrega sin cambiar ninguna otra configuración de Postgres.
FROM postgres:17

RUN apt-get update \
    && apt-get install -y --no-install-recommends postgresql-17-partman \
    && rm -rf /var/lib/apt/lists/*
