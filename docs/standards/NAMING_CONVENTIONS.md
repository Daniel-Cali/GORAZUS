# Naming Conventions — GORAZUS

> EPIC 04 — Implementation Standards. Consolida en un solo documento las
> convenciones de nombre que hoy están dispersas en `docs/architecture/07-convenciones-y-estandares.md §1-2`,
> `docs/frontend/FOLDER_STRUCTURE.md §2.1`, `docs/frontend/ROUTING.md §2.1` y
> `docs/database/01-modelo-conceptual.md §1.2`/`02-modelo-logico.md §2` — y **cierra un
> gap real que ningún documento anterior tabulaba explícitamente**: el mapeo entre el
> nombre de carpeta de módulo (español) y el nombre de schema de Postgres (inglés),
> ver §5. Sin código.

## 1. Regla madre: dominio en español, técnica en inglés (referencia)

Ya fijado en `docs/architecture/07-convenciones-y-estandares.md §2` y repetido en
`docs/architecture/01-estructura-monorepo.md §6` — no se reabre:

- Nombres de módulos, entidades de dominio, campos de negocio, eventos de dominio,
  mensajes de error de usuario → **español**.
- Términos de arquitectura/infraestructura (`controller`, `service`, `repository`,
  `guard`, nombres de carpetas técnicas) → **inglés**.
- No se mezcla dentro de un mismo identificador.

**La única excepción sistemática a esta regla madre es el nombre físico de schema y
tabla de PostgreSQL, que es siempre inglés** — ver §5. No es una contradicción de la
regla madre, es una capa distinta (infraestructura de datos, no vocabulario de
dominio de aplicación) — se documenta explícitamente porque, sin este mapeo, un
desarrollador que lee `modules/ventas/` y luego `sales.invoices` en el SQL puede
razonablemente pensar que hay una inconsistencia cuando en realidad es una
traducción documentada y deliberada.

## 2. Código TypeScript (referencia, tabla ya fijada)

Tabla completa ya fijada en `07-convenciones-y-estandares.md §1` — repetida acá una
sola vez por ser la tabla más consultada del set completo de estándares:

| Elemento                      | Convención                               | Ejemplo                                     |
| ----------------------------- | ---------------------------------------- | ------------------------------------------- |
| Carpetas de módulo de negocio | kebab-case, español                      | `cuentas-por-cobrar/`                       |
| Carpetas técnicas             | kebab-case, inglés                       | `core/`, `ui-kit/`                          |
| Archivos                      | kebab-case + sufijo de tipo              | `crear-venta.usecase.ts`, `venta.entity.ts` |
| Clases / Componentes React    | PascalCase                               | `CrearVentaUseCase`, `TablaVentas`          |
| Variables, funciones, métodos | camelCase                                | `calcularTotalVenta()`                      |
| Constantes                    | UPPER_SNAKE_CASE                         | `MAX_LINEAS_POR_VENTA`                      |
| Interfaces de repositorio     | sufijo `.repository.ts`, sin prefijo `I` | `venta.repository.ts`                       |
| Eventos de dominio            | sufijo `Event`, participio pasado        | `VentaConfirmadaEvent`                      |
| DTO                           | sufijo `Dto`                             | `CrearVentaDto`                             |
| Schemas Zod                   | sufijo `Schema`                          | `crearVentaSchema`                          |

## 3. Sufijos de archivo por capa (referencia)

**Backend** (`docs/architecture/02-arquitectura-modulos-backend.md §2`):
`.entity.ts`, `.repository.ts` (interfaz) / `.repository.prisma.ts` (implementación),
`.usecase.ts`, `.dto.ts`, `.schema.ts`, `.controller.ts`, `.event.ts`, `.publisher.ts`,
`.module.ts`, `.spec.ts` (test).

**Frontend** (`docs/frontend/FOLDER_STRUCTURE.md §2.1`, tabla completa no repetida
acá): `.page.tsx`, `.layout.tsx`, `.routes.tsx`, prefijo `use-` para hooks, `.store.ts`,
`.test.ts(x)`.

## 4. Permisos, eventos, rutas (referencia consolidada)

| Elemento                | Patrón                                                               | Fuente                                                                                        |
| ----------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Permiso                 | `<modulo>.<accion>`, minúsculas, guión bajo para acciones compuestas | `docs/architecture/09-seguridad-y-multiempresa.md §2`, `docs/menus/00-convenciones.md §3`     |
| Ruta de frontend        | `/<modulo-kebab>`, `/<modulo>/nueva`, `/<modulo>/:id`                | `docs/frontend/ROUTING.md §2.1`                                                               |
| Evento de dominio       | `<Entidad><ParticipioPasado>Event`                                   | `docs/architecture/06-comunicacion-entre-modulos.md §1b`                                      |
| Endpoint REST           | `/api/v1/<recurso-plural-español>`                                   | `docs/architecture/07-convenciones-y-estandares.md §4`                                        |
| Routing key de RabbitMQ | `<modulo>.<entidad>.<evento>`                                        | `docs/architecture/06-comunicacion-entre-modulos.md §1b` (ejemplo: `ventas.venta.confirmada`) |

## 5. Mapeo módulo (español) ↔ schema (inglés)

**Gap cerrado acá — no existía esta tabla en ningún documento anterior.**
`docs/database/00-modelo-general.md §1` fija que "cada módulo de negocio tiene un
schema físico de Postgres del mismo nombre", pero los 27 módulos de
`docs/architecture/04-catalogo-modulos-negocio.md` están en español
(`modules/ventas/`) mientras los 21 schemas reales de
`docs/database/02-modelo-logico.md §3` están en inglés (`sales.*`). "Del mismo
nombre" se refiere al nombre ya traducido — este documento hace esa traducción
explícita por primera vez:

| Módulo (`modules/<x>`, español) | Schema Postgres (inglés)                                                                                       | Nota                                                                                                                                                                                                                                                               |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `auth`                          | _(ninguno — usa `core.*`)_                                                                                     | `docs/architecture/01 §2`                                                                                                                                                                                                                                          |
| `seguridad`                     | `security`                                                                                                     | —                                                                                                                                                                                                                                                                  |
| `configuracion`                 | `configuration`                                                                                                | —                                                                                                                                                                                                                                                                  |
| `clientes`                      | `customers`                                                                                                    | —                                                                                                                                                                                                                                                                  |
| `proveedores`                   | `suppliers`                                                                                                    | —                                                                                                                                                                                                                                                                  |
| `productos`                     | `products`                                                                                                     | —                                                                                                                                                                                                                                                                  |
| `inventario`                    | `inventory`                                                                                                    | —                                                                                                                                                                                                                                                                  |
| `ventas`                        | `sales`                                                                                                        | —                                                                                                                                                                                                                                                                  |
| `compras`                       | `purchases`                                                                                                    | —                                                                                                                                                                                                                                                                  |
| `caja`                          | `cash`                                                                                                         | —                                                                                                                                                                                                                                                                  |
| `bancos`                        | `banks`                                                                                                        | —                                                                                                                                                                                                                                                                  |
| `contabilidad`                  | `accounting`                                                                                                   | —                                                                                                                                                                                                                                                                  |
| `impuestos`                     | `taxes`                                                                                                        | —                                                                                                                                                                                                                                                                  |
| `crm`                           | `crm`                                                                                                          | Mismo nombre en ambos idiomas                                                                                                                                                                                                                                      |
| `recursos-humanos`              | `hr`                                                                                                           | —                                                                                                                                                                                                                                                                  |
| `nomina`                        | `payroll`                                                                                                      | —                                                                                                                                                                                                                                                                  |
| `servicios`                     | `services`                                                                                                     | —                                                                                                                                                                                                                                                                  |
| `proyectos`                     | `projects`                                                                                                     | —                                                                                                                                                                                                                                                                  |
| `activos-fijos`                 | `assets`                                                                                                       | —                                                                                                                                                                                                                                                                  |
| `reportes`                      | `reports`                                                                                                      | —                                                                                                                                                                                                                                                                  |
| `bi`                            | `bi`                                                                                                           | Mismo nombre en ambos idiomas                                                                                                                                                                                                                                      |
| `pos`                           | _(ninguno — orquesta `sales`+`inventory`+`cash`)_                                                              | `docs/architecture/04-catalogo-modulos-negocio.md`, nota "pos no tiene entidades propias"                                                                                                                                                                          |
| `produccion`                    | _(sin schema propio confirmado — BOM en `products`, ejecución en `inventory` según `docs/architecture/01 §2`)_ | **Verificar contra `docs/architecture/38-modulo-production.md` al implementar** — el listado de 21 schemas de `docs/database/02-modelo-logico.md §3` no incluye `production` como schema propio; este documento no resuelve la ambigüedad por su cuenta, la señala |
| `documentos`                    | _(ninguno — usa `core.documents`)_                                                                             | `docs/architecture/04-catalogo-modulos-negocio.md`                                                                                                                                                                                                                 |
| `administracion`                | _(ninguno — usa `core.integrations`/`scheduled_jobs`)_                                                         | ídem                                                                                                                                                                                                                                                               |
| `tesoreria`                     | _(ninguno — vista sobre `cash`+`banks`+`customers`+`suppliers`)_                                               | ídem                                                                                                                                                                                                                                                               |
| `dashboard`                     | _(ninguno — proyecciones de otros módulos)_                                                                    | ídem                                                                                                                                                                                                                                                               |

**Regla práctica:** al escribir `modules/ventas/backend/repositories/venta.repository.prisma.ts`,
la query real apunta al schema `sales`, no a un schema `ventas` que no existe — esta
tabla es la referencia para no adivinar.

## 6. Nombres en SQL (referencia)

- **Tabla:** `<schema>.<entidad_en_plural_snake_case>` — `sales.sales_orders`,
  `products.product_translations`. Fijado en `docs/database/02-modelo-logico.md §2`.
- **Por qué `snake_case` y no `PascalCase`:** tres razones técnicas (Postgres pliega
  identificadores no citados, es la convención idiomática de Postgres/MySQL/MariaDB,
  SQL Server tampoco distingue mayúsculas por defecto) — ya fijado en
  `docs/database/01-modelo-conceptual.md §1.2`, no se repite el detalle.
- **Columnas universales** (18, idénticas en las ~498 tablas — `id`, `local_id`,
  `tenant_id`, `company_id`, `branch_id`, `created_at/by`, `updated_at/by`,
  `deleted_at/by`, `version`, `row_version`, `is_active`, `is_deleted`, `observations`,
  `metadata`): tabla completa en `docs/database/01-modelo-conceptual.md §1.1`, ver
  también [DATABASE_GUIDELINES.md §2](./DATABASE_GUIDELINES.md#2-las-18-columnas-universales-referencia).
- **Patrones de nombre por rol de tabla** (ya fijados en `docs/database/02-modelo-logico.md §1`):
  `<entidad>_status` / `<entidad>_status_history` (estado con historial),
  `<entidad>_translations` (i18n de dato), `<entidad>_line` / `<entidad>_detail`
  (línea de documento).

## 7. Git (referencia)

Ya fijado en `docs/architecture/07-convenciones-y-estandares.md §3`, no repetido
completo — solo la síntesis de nombre: ramas `feat/<módulo>-<descripción-corta>`,
`fix/<módulo>-<descripción-corta>`; commits Conventional Commits
(`feat(ventas): agregar confirmación de venta`). Detalle completo en
[CODE_REVIEW.md §2](./CODE_REVIEW.md#2-git-referencia-y-checklist).

## 8. Trazabilidad

| Punto                     | Ya fijado en                                      | Cerrado/detallado acá                              |
| ------------------------- | ------------------------------------------------- | -------------------------------------------------- |
| Regla madre idioma        | `07-convenciones-y-estandares.md §2`              | Referencia + excepción explícita de SQL (§1)       |
| Naming TypeScript general | `07-convenciones-y-estandares.md §1`              | Repetido una vez, tabla de referencia central (§2) |
| Sufijos por capa (BE/FE)  | `02 §2`, `docs/frontend/FOLDER_STRUCTURE.md §2.1` | Referencia consolidada (§3)                        |
| Permisos, eventos, rutas  | Dispersos en 4 documentos                         | Tabla única (§4)                                   |
| **Mapeo módulo↔schema**   | **Ninguno — nunca tabulado**                      | **Tabla completa de 27 módulos (§5)**              |
| Naming SQL                | `docs/database/01,02`                             | Referencia (§6)                                    |
| Git                       | `07-convenciones-y-estandares.md §3`              | Referencia (§7)                                    |
