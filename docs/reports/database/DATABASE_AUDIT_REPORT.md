# Informe de Auditoría — Base de Datos GORAZUS

> Database Finalization, Fase 1 (Auditoría Completa). Verificado en vivo contra PostgreSQL 17.10
> real (Docker), no contra documentación. Cifras **posteriores** a la migración
> `docs/database/sql/35_functional_completion.sql` (ver `DATABASE_COMPLETION_REPORT.md`).

## 1. Esquemas

21 esquemas de negocio + `partman` (extensión) + `public` (por defecto). Ninguno nuevo — la
migración de esta fase es aditiva sobre esquemas ya existentes.

## 2. Tablas

**503** tablas lógicas (501 certificadas + 2 nuevas: `products.product_physical_attributes`,
`suppliers.supplier_contracts`). 730+ tablas físicas contando particiones (200 particiones hijas
ya provisionadas por `pg_partman` al momento de la verificación anterior, más las que se hayan
creado desde entonces por el propio mecanismo de particionamiento automático — no se recontaron en
esta fase, no cambia el análisis).

## 3. Relaciones (Foreign Keys)

**0 FK sin validar**, verificado antes y después de la migración. La migración agregó 5 FK nuevas
(`safety_data_sheet_file_id→core.files`, `country_id`/`language_id`/`timezone_id`×2 tablas→
`configuration.*`, `product_id→products.products` en la tabla nueva, `supplier_id→
suppliers.suppliers` en la tabla nueva) — las 5 validadas correctamente.

## 4. Índices

**2.964 índices lógicos** (2.948 preexistentes + 16 nuevos: 9 explícitos en la migración + 5 PK
implícitos de las 2 tablas nuevas + 2 UNIQUE implícitos de `local_id`/`product_id`). Índices
explícitos nuevos de esta fase: (`idx_products_products_hazardous`,
`idx_core_companies_country_id`, `idx_core_branches_country_id`,
`idx_suppliers_supplier_contracts_supplier_id`,
`idx_suppliers_supplier_contracts_tenant_scope`,
`uq_suppliers_supplier_contracts_local_id`,
`idx_products_product_physical_attributes_tenant_scope`,
`uq_products_product_physical_attributes_local_id`, más
`idx_products_products_lifecycle_status`). **0 índices inválidos** antes y después.

## 5. Triggers

982 triggers preexistentes (5 nombres distintos, funciones compartidas) + 4 nuevos (`
trg_set_audit_fields`/`trg_audit_log` aplicados explícitamente a las 2 tablas nuevas — no se
heredan automáticamente de una tabla padre, tuvieron que declararse en la propia migración, ver
`DATABASE_MIGRATION_REPORT.md` de la fase anterior, que ya había anticipado exactamente este
mecanismo).

## 6. Funciones

20 funciones/procedimientos propios de GORAZUS (sin cambios esta fase — ninguno de los 4 gaps
funcionales requería una función nueva, solo columnas/tabla). 67 funciones de extensión
(`pg_trgm`/`pgcrypto`) sin tocar.

## 7. Secuencias

**503** secuencias `<tabla>_local_id_seq` (501 + 2 nuevas, una por tabla, patrón universal sin
excepciones).

## 8. Enums

**0** tipos ENUM nativos — confirmado sin cambios. El proyecto usa `text` + `CHECK` en su lugar
(decisión de arquitectura ya establecida, ver `DATABASE_SPANISH_STANDARD.md §9` de la fase
anterior). Los 3 `CHECK` extendidos en esta fase (`costing_method`, `barcode_type`,
`lifecycle_status` nuevo) siguen ese mismo patrón, no se introdujo ningún ENUM nuevo.

## 9. Vistas y vistas materializadas

9 vistas + 4 vistas materializadas, sin cambios — ninguno de los 4 gaps funcionales requería una
vista nueva.

## 10. Foreign Keys — detalle de integridad

**5.164+** (certificadas) **+ 5 nuevas de esta fase = ~5.169**. 100% validadas (`convalidated =
true`), verificado con `pg_constraint` en vivo, no inferido.

## 11. Check Constraints

119 preexistentes + esta fase: 2 modificados (`costing_method` con 5º valor,
`barcode_type` con 2 valores nuevos — mismo constraint, `ALTER`, no un constraint nuevo) + 2
nuevos (`products_lifecycle_status` implícito en el `ADD COLUMN ... CHECK`,
`ck_supplier_contracts_dates`, `supplier_contracts_status_check` implícito). Total real de checks
distintos: 121.

## 12. Unique Constraints

501 preexistentes (`<tabla>_local_id_key`) + 2 nuevas (una por tabla nueva) = **503**.

## 13. Tablas de auditoría e historial

Revisadas explícitamente: `core.audit_logs` (particionada, trigger `fn_audit_log` universal —
ahora también en las 2 tablas nuevas), `core.change_history`, `core.activity_logs`,
`security.security_audit_logs`, y los `*_status_history`/`*_history` de 8 módulos distintos
(`journal_entry_status_history`, `lead_status_history`, `customer_credit_limit_history`,
`supplier_credit_limit_history`, `production_order_status_history`, `purchase_*_status_history` ×4,
`quote_status_history`, `sales_order_status_history`, `leave_request_status_history`,
`import_status_history`, `payroll_run_status_history`, `project_*_status_history` ×2,
`service_order_status_history`, `candidate_stage_history`, `asset_custodian_history`,
`customer_block_history`/`supplier_block_history`) — cobertura de historial ya extensa y
consistente, ninguna tabla nueva de esta fase requería su propio historial (no tienen "estado" con
transiciones, son catálogos/relaciones).

## 14. Hallazgos de la auditoría (antes de aplicar la migración)

Reconfirmados, ya documentados en fases previas de este proyecto, no nuevos de esta sesión:

| #   | Hallazgo                                                               | Origen                                                                                                                                                                                           |
| --- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | RLS de Empresa/Sucursal ausente (solo Tenant)                          | `DATABASE_CERTIFICATION.md` hallazgo #1 — **fuera de alcance de esta fase**, es una decisión de producto sobre multiempresa avanzada, no una estructura faltante                                 |
| 2   | 185 FK cross-schema                                                    | `DATABASE_CERTIFICATION.md` hallazgo #2 — **fuera de alcance**, pendiente de ADR                                                                                                                 |
| 3   | 4 gaps funcionales aditivos                                            | `FUNCTIONAL_GAPS.md` — **resueltos en esta fase**, ver `DATABASE_COMPLETION_REPORT.md`                                                                                                           |
| 4   | `core.restore_test_logs` sin RLS                                       | `DATABASE_HEALTH_REPORT.md` (certificación) — **fuera de alcance**, `34_rls_hardening.sql` ya la excluye a propósito                                                                             |
| 5   | QR/RFID, fecha de fabricación, peso/volumen/dimensiones, obsolescencia | `INVENTORY_ARCHITECTURE.md §5.2` — **resueltos en esta fase** (obsolescencia + los 3 primeros; garantías queda fuera, es un gap de backend no de schema — la tabla `sales.warranties` ya existe) |

De los 5 hallazgos ya documentados, esta fase resolvió los 2 marcados "resueltos" y dejó
explícitamente fuera los otros 3 (decisiones de arquitectura/producto, no estructuras faltantes).
