# Backup — GORAZUS Database

> Generado 2026-07-17 (PHASE 01 — Database Enterprise). Referencia y verificación
> contra `docs/database/08-estrategia-respaldo.md` (diseño completo de backups
> físicos/lógicos, PITR, retención, pruebas de restauración) — no repite el diseño,
> confirma qué existe realmente en la instancia y documenta lo nuevo de esta fase.

## 1. Diseño (referencia, sin cambios)

Estrategia completa ya fijada en `docs/database/08-estrategia-respaldo.md` — backups
físicos vía `pg_basebackup`/WAL archiving, backups lógicos vía `pg_dump` para
exportes selectivos, PITR (Point-In-Time Recovery), pruebas de restauración
periódicas registradas en `core.restore_test_logs` (tabla real, verificada —
ver [SECURITY.md §1](./SECURITY.md#1-row-level-security--verificado) para la
observación sobre su RLS). No se repite el diseño acá.

## 2. Verificado en esta fase

- **Rol `gorazus_backup`** existe (`SECURITY.md §2`) con privilegio mínimo
  (`pg_read_all_data`/equivalente para `pg_dump`/WAL archiving, sin acceso SQL
  normal a datos).
- **`core.restore_test_logs`** existe con su schema completo — la tabla que
  registra el resultado de cada prueba de restauración periódica ya está lista
  para recibir datos.

## 3. Nuevo en esta fase: archivado de particiones desconectadas

`core.fn_export_detached_partition(p_partition_name, p_export_path)` — ya existía
en `docs/database/sql/29_partitioning.sql §4`, pero nunca se había podido probar
porque no existían particiones reales para desconectar (ver
[DATABASE_ARCHITECTURE.md §4](./DATABASE_ARCHITECTURE.md#4-particionamiento-corregido-en-esta-fase)).
Con las 200 particiones ahora reales, esta función es invocable — exporta a CSV
antes de `DROP TABLE` de una partición ya fuera de la ventana de retención
(`docs/database/07-estrategia-particionamiento.md §6`). El paso de subida real a
MinIO (bucket `archive-cold`) sigue siendo responsabilidad de un job externo a
nivel de aplicación, no de esta función SQL.

## 4. Qué NO se probó en esta fase

- **Restauración real de un backup completo** — requeriría un ciclo completo de
  `pg_basebackup` + restore contra un servidor separado, fuera del alcance de
  "trabajar únicamente sobre la base de datos" en el sentido de no afectar el
  entorno de trabajo actual del desarrollador. Se documenta como pendiente de
  prueba, no se ejecuta sin coordinación explícita (una restauración de prueba mal
  ejecutada puede sobrescribir el volumen `postgres_data` actual).
- **Retención de 7 años para `sales.invoices`/`purchases.purchase_invoices`/
  `accounting.journal_entries`** (ya configurada en `29_partitioning.sql §2`) — no
  verificable con datos reales todavía (la base tiene semanas de antigüedad, no
  años).

## 5. Trazabilidad

| Punto pedido en la fase  | Cerrado en                                |
| ------------------------ | ----------------------------------------- |
| Revisar backups          | §1-2 (referencia + verificación)          |
| Optimización relacionada | §3 (función de archivado ahora invocable) |
