# Database Guidelines — GORAZUS

> EPIC 04 — Implementation Standards. Consolida `docs/architecture/02-arquitectura-modulos-backend.md §4`,
> `docs/database/01-modelo-conceptual.md`, `02-modelo-logico.md` y
> `06-estrategia-seguridad.md` en una guía operativa de "cómo agregar/modificar una
> tabla" — no repite el modelo de datos completo (~498 tablas, eso vive en
> `docs/database/logico/`), fija el procedimiento y las reglas duras. Sin código.

## 1. SQL crudo es la fuente de verdad (referencia, no se reabre)

Decisión ya fijada y revisada en `docs/architecture/02-arquitectura-modulos-backend.md §4`:
el schema SQL versionado a mano (`docs/database/sql/*.sql`, 30 archivos numerados) es
la fuente de verdad; Prisma consume vía `prisma db pull`, nunca gestiona el schema
(`prisma migrate` no se usa). Toda modificación de tabla empieza y termina en el
archivo `.sql` correspondiente, nunca en un cambio de `schema.prisma` escrito a mano.

## 2. Las 18 columnas universales (referencia)

Toda tabla de negocio nueva, sin excepción, lleva las 18 columnas ya fijadas en
`docs/database/01-modelo-conceptual.md §1.1`: `id` (UUID, PK), `local_id` (correlativo
legible), `tenant_id`/`company_id`/`branch_id` (alcance), `created_at/by`,
`updated_at/by`, `deleted_at/by` (auditoría + soft delete), `version` (negocio),
`row_version` (técnica), `is_active`, `is_deleted` (columna calculada), `observations`,
`metadata` (JSONB, con las 3 reglas de cuándo sí/cuándo no de `01 §1.3`). No se
reimplementan a mano en cada `CREATE TABLE` sin verificar el tipo exacto — cualquier
divergencia respecto a esta plantilla es un bug de schema, no una variante válida. Por
qué no herencia de tablas de Postgres: `01 §1.4`, no se repite.

## 3. Nunca FK entre schemas de módulos distintos

Regla dura ya fijada en `docs/architecture/02 §4` y
`docs/database/01-modelo-conceptual.md §1.5`: las referencias cruzadas entre módulos
de negocio son IDs sueltos (`sales.invoices.customer_id`, sin `REFERENCES
customers.customers`), nunca una FK real de Postgres — es lo que permite separar los
schemas a bases de datos físicas distintas el día de la extracción a microservicio sin
migración de datos ambigua. Verificación práctica al escribir SQL: si un
`CREATE TABLE` de `sales.*` tiene `REFERENCES customers.*`, es una violación, sin
excepción.

## 4. Cómo agregar una tabla nueva (procedimiento)

1. **Resolver el schema dueño** vía
   [NAMING_CONVENTIONS.md §5](./NAMING_CONVENTIONS.md#5-mapeo-módulo-español--schema-inglés) —
   nunca se crea una tabla sin confirmar primero a qué módulo/schema pertenece.
2. **Confirmar el rol de la tabla** (catálogo, maestra, transaccional, línea de
   documento, unión N:M, jerárquica, polimórfica) contra
   `docs/database/02a-restricciones-e-indices.md §4` — el rol determina qué
   restricciones/índices aplican por defecto, no se decide ad-hoc por tabla.
3. **Aplicar las 18 columnas universales** (§2) más los atributos propios de la
   entidad, en `snake_case`, nombre de tabla `<entidad_en_plural_snake_case>`
   (`docs/database/02-modelo-logico.md §2`).
4. **Evaluar los 4 patrones de expansión** (`docs/database/02-modelo-logico.md §1`):
   ¿necesita `_status`/`_status_history` (ciclo de vida transaccional complejo)?
   ¿`_translations` (texto visible al usuario final, traducible)? ¿`_line`/`_detail`
   (documento con líneas)? Se decide en este paso, agregar el patrón después de que la
   tabla ya tiene datos reales es una migración más costosa.
5. **Escribir el archivo SQL** en `docs/database/sql/NN_<schema>.sql` (numerado según
   el módulo, ver índice en `docs/database/README.md`).
6. **Índices**: aplicar la estrategia por tipo de dato/patrón de acceso de
   `docs/database/04-estrategia-indices.md` — un B-tree por defecto en FKs y columnas
   de filtro frecuente, BRIN en tablas de alto volumen append-only filtradas por fecha
   (`02a-restricciones-e-indices.md §5`).
7. **Row-Level Security**: habilitar en la tabla nueva sin excepción (§5 abajo) — no
   es un paso opcional para "agregar después".
8. **Actualizar el inventario** correspondiente en `docs/database/logico/<NN>-<schema>.md`
   con nombre físico, propósito, FKs no-universales — mismo criterio de
   sincronización que el resto del proyecto (`docs/database/02-modelo-logico.md §3`).

## 5. Patrones de tabla por nombre (referencia)

| Patrón                                          | Cuándo                                                                                                       | Ejemplo                                 |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------- |
| `<entidad>_status` / `<entidad>_status_history` | Ciclo de vida transaccional complejo (~20 flujos de mayor complejidad, cada módulo lo indica explícitamente) | Órdenes de venta/compra, facturas       |
| `<entidad>_translations`                        | Texto visible al usuario final, con sentido de traducir                                                      | Nombre de producto, nombre de categoría |
| `<entidad>_line` / `<entidad>_detail`           | Documento transaccional con líneas — nunca array/JSONB                                                       | Factura → `invoice_lines`               |
| Tabla de unión N:M                              | Toda relación muchos-a-muchos, con las 18 columnas completas (nunca "liviana")                               | `role_permissions`                      |

Detalle completo: `docs/database/02-modelo-logico.md §1`.

## 6. Row-Level Security (referencia)

RLS habilitado en las ~498 tablas sin excepción — mecanismo central de aislamiento
multiempresa, no solo disciplina de aplicación (`docs/database/06-estrategia-seguridad.md §1`).
`app.current_tenant_id`/`app.current_company_ids` se setean una vez por conexión desde
`TenantInterceptor`, nunca confiados desde un parámetro que el cliente pueda
manipular. Detalle completo, incluida la política para catálogos globales
(sentinela de tenant): `06-estrategia-seguridad.md §1`. Ver también
[SECURITY_GUIDELINES.md §3](./SECURITY_GUIDELINES.md#3-aislamiento-multiempresa-rls-referencia).

## 7. Roles de base de datos (referencia)

Privilegio mínimo — `gorazus_app` (CRUD sujeto a RLS, sin DDL), `gorazus_migrator`
(DDL completo, solo pipeline de despliegue), `gorazus_readonly` (réplicas/BI),
`gorazus_backup`, `gorazus_audit_writer` (`INSERT`-only en `audit_logs`). Tabla
completa: `docs/database/06-estrategia-seguridad.md §2`. Ningún rol de aplicación
tiene `BYPASSRLS` ni superusuario, sin excepción.

## 8. Migraciones (procedimiento)

1. Toda modificación de schema es un archivo/cambio versionado en `sql/`, nunca un
   `ALTER TABLE` ejecutado a mano contra producción.
2. Aplicado por `gorazus_migrator` vía el pipeline de despliegue
   (`docs/architecture/08-infraestructura-y-despliegue.md`), nunca por la aplicación
   en tiempo de ejecución.
3. Un cambio de columna que rompe compatibilidad con datos existentes requiere
   estrategia explícita de backfill — no se asume `NULL`/default silencioso para
   filas ya existentes sin decidirlo conscientemente.
4. Tras aplicar, `prisma db pull` regenera el cliente tipado — el desarrollador nunca
   edita `schema.prisma` a mano para reflejar el cambio.

## 9. Checklist de salida (toda tabla/columna nueva)

- [ ] Schema dueño confirmado contra [NAMING_CONVENTIONS.md §5](./NAMING_CONVENTIONS.md#5-mapeo-módulo-español--schema-inglés).
- [ ] 18 columnas universales presentes y con el tipo exacto de §2.
- [ ] Sin FK a otro schema de módulo de negocio.
- [ ] RLS habilitado.
- [ ] Índices decididos según rol de tabla, no agregados reactivamente.
- [ ] Inventario de `docs/database/logico/` actualizado en el mismo cambio.

## 10. Trazabilidad

| Punto                        | Ya fijado en                                  | Cerrado/detallado acá        |
| ---------------------------- | --------------------------------------------- | ---------------------------- |
| SQL como fuente de verdad    | `docs/architecture/02 §4`                     | Referencia (§1)              |
| 18 columnas universales      | `docs/database/01-modelo-conceptual.md §1.1`  | Referencia (§2)              |
| Sin FK entre schemas         | `02 §4`, `01-modelo-conceptual.md §1.5`       | Regla de verificación (§3)   |
| Procedimiento de tabla nueva | Disperso en 4 documentos                      | Checklist único (§4)         |
| Patrones de nombre           | `docs/database/02-modelo-logico.md §1`        | Referencia (§5)              |
| RLS                          | `docs/database/06-estrategia-seguridad.md §1` | Referencia (§6)              |
| Roles de BD                  | `06-estrategia-seguridad.md §2`               | Referencia (§7)              |
| Migraciones                  | Ninguno — implícito                           | Procedimiento explícito (§8) |
