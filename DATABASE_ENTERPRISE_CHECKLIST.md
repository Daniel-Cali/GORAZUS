# Checklist Enterprise — Base de Datos GORAZUS

> Database Finalization. Checklist de cierre — cada ítem verificado en vivo esta sesión, no
> asumido de documentación previa.

## Estructura

- [x] Todos los schemas de negocio pedidos tienen representación real (21/21, ver
      `DATABASE_FUNCTIONAL_COVERAGE.md`)
- [x] Todas las tablas tienen Primary Key (`uuid`, `gen_random_uuid()`) — 503/503
- [x] Todas las tablas tienen `local_id` (secuencia legible, `BIGINT GENERATED ALWAYS AS IDENTITY`)
      — 503/503
- [x] Todas las tablas tienen `created_at`/`updated_at`/`deleted_at` (soft delete real) — 503/503
- [x] Todas las tablas tienen `created_by`/`updated_by`/`deleted_by` — 503/503
- [x] Todas las tablas nuevas de esta fase tienen comentario (`COMMENT ON TABLE`/`COMMENT ON
    COLUMN`) explicando su propósito — 2/2 tablas, 13/13 columnas nuevas documentadas

## Integridad referencial

- [x] 0 Foreign Keys sin validar (`pg_constraint.convalidated`)
- [x] 0 índices inválidos (`pg_index.indisvalid`)
- [x] Las 5 FK nuevas de esta fase apuntan a tablas reales existentes, verificado
- [x] `ck_supplier_contracts_dates` impide `ends_on < starts_on` a nivel de base de datos, no solo
      de aplicación

## Seguridad

- [x] Las 2 tablas nuevas tienen RLS habilitado y forzado (`ENABLE`/`FORCE ROW LEVEL SECURITY`)
- [x] Las 2 tablas nuevas tienen la misma política `tenant_isolation` que el resto de la base —
      verificado que es exactamente la misma definición, no una variante
- [x] `gorazus_app` sigue sin superusuario/bypass de RLS tras la migración — reverificado

## Auditoría

- [x] Las 2 tablas nuevas tienen `trg_set_audit_fields` (mantiene `updated_at`/`version`)
- [x] Las 2 tablas nuevas tienen `trg_audit_log` (registra en `core.audit_logs`)

## Rendimiento

- [x] Toda columna usada en un `WHERE`/`JOIN` previsible tiene índice — 8 índices nuevos cubren
      los patrones de consulta esperados (hazmat, lifecycle, país, contratos por proveedor)
- [x] Índices parciales donde corresponde (hazmat/lifecycle) para no crecer 1:1 con el catálogo

## Compatibilidad

- [x] `schema.prisma` regenerado y validado (`prisma validate`, versión fijada 5.22.0)
- [x] Los 21 clientes Prisma por módulo regenerados sin error
- [x] Backend existente verificado sin regresión (`productos`, `configuracion` — ver
      `DATABASE_COMPLETION_REPORT.md §5`)
- [x] Migración append-only — no edita ningún script SQL previo (`01_core.sql`..`34_rls_hardening.sql`
      intactos)

## Documentación

- [x] `docs/database/dictionary/*.md` actualizado (4 archivos: `01-core.md`, `04-suppliers.md`,
      `05-products.md`, `06-inventory.md`)
- [x] `DATABASE_DICTIONARY.md` (raíz) actualizado con referencia a la migración
- [x] 9 entregables de esta fase generados
- [x] `CHANGELOG.md`/`ROADMAP.md`/`PROJECT_STATUS.md`/`VERSION.md`/`TECHNICAL_DEBT.md`/
      `NEXT_STEPS.md` actualizados

## Explícitamente fuera de este checklist (decisión, no omisión)

- [ ] RLS de Empresa/Sucursal — pendiente de decisión de producto, no de esta fase
- [ ] Resolución de 185 FK cross-schema — pendiente de ADR
- [ ] Domain Service de Costo Específico — código de aplicación, no de base de datos
- [ ] Consumo real de `sales.warranties`/`suppliers.supplier_contracts` desde un backend — no
      existe todavía ningún módulo `ventas`/`proveedores` con lógica de garantías/contratos
