# Database Overview — GORAZUS

> Resumen de una sola página para quien llega por primera vez a
> `docs/database/`. No reemplaza [00-modelo-general.md](./00-modelo-general.md)
> (la vista consolidada completa) ni [README.md](./README.md) (el índice de
> los 13 documentos de diseño) — es el punto de entrada más corto posible,
> pedido explícitamente como entregable propio de esta auditoría
> (2026-07-21, rama `feature/database-audit`).

## 1. Qué es

GORAZUS es un ERP Enterprise pensado para ferreterías y distribuidores, con
capacidad de crecer a cualquier otro rubro de distribución/comercio —
sostenido por una base de datos PostgreSQL 17 diseñada desde el día uno para
multiempresa, multisucursal y millones de registros, no como una extensión
posterior.

## 2. Los tres números que importan

- **21 módulos de negocio + `core`, 22 schemas, 501 tablas.** Cada módulo de
  negocio (`ventas`, `inventario`, `contabilidad`, ...) es dueño de su propio
  schema — regla 1:1 sin excepciones, ver
  [00-modelo-general.md §1](./00-modelo-general.md).
- **Una sola tabla base, aplicada 501 veces.** Toda tabla de negocio nace con
  las mismas 18 columnas universales (identidad, alcance multiempresa,
  auditoría completa, soft delete, versión optimista) — ver
  [01-modelo-conceptual.md §1.1](./01-modelo-conceptual.md#11-columnas-universales).
  No hay una segunda convención "más simple" en ningún módulo.
- **0 hallazgos que bloqueen producción.** Ver
  [DATABASE_AUDIT.md](./DATABASE_AUDIT.md) para el detalle completo — los
  únicos puntos abiertos son decisiones de negocio pendientes (185 FK
  cross-schema, RLS de una tabla de infraestructura), no defectos técnicos.

## 3. Los 21 módulos, en una frase cada uno

| Módulo          | En una frase                                                |
| --------------- | ----------------------------------------------------------- |
| `clientes`      | Maestro único de clientes                                   |
| `proveedores`   | Maestro único de proveedores                                |
| `productos`     | Catálogo de productos/servicios, variantes, BOM             |
| `inventario`    | Único dueño del stock: existencias, movimientos, costeo     |
| `ventas`        | Cotización → pedido → factura                               |
| `compras`       | Requisición → orden → recepción → factura de proveedor      |
| `caja`          | Movimientos de efectivo, apertura/cierre                    |
| `bancos`        | Cuentas, conciliación, transferencias                       |
| `contabilidad`  | Libro mayor, asientos, cierres — consumidor puro de eventos |
| `impuestos`     | Catálogo de impuestos, retenciones, declaraciones           |
| `crm`           | Prospectos, oportunidades                                   |
| `rrhh`          | Legajo del empleado                                         |
| `nomina`        | Cálculo y liquidación de nómina                             |
| `produccion`    | Órdenes de producción, explosión de BOM                     |
| `servicios`     | Órdenes de servicio, contratos/SLA                          |
| `activos-fijos` | Registro y depreciación de activos propios                  |
| `proyectos`     | Planificación, costeo y facturación por hitos               |
| `reportes`      | Agregación de solo lectura cross-módulo                     |
| `bi`            | Dashboards analíticos, KPIs                                 |
| `configuracion` | Datos maestros transversales (monedas, series, precios)     |
| `seguridad`     | Roles, permisos, políticas de acceso                        |

(`auth`, `pos`, `tesoreria`, `dashboard`, `documentos`, `administracion` no
tienen schema propio — orquestan o proyectan otros módulos, ver
[docs/ddd/01_bounded_contexts.md](../ddd/01_bounded_contexts.md).)

## 4. Cómo se sostiene "millones de registros"

- **Particionamiento por tiempo** en las 27 tablas de mayor volumen (logs de
  auditoría, movimientos), vía `pg_partman` — ver
  [07-estrategia-particionamiento.md](./07-estrategia-particionamiento.md).
- **Row-Level Security forzado** para aislar tenants sin depender de la
  disciplina de cada query — ver
  [06-estrategia-seguridad.md](./06-estrategia-seguridad.md).
- **3.201 índices, 0 duplicados**, incluidos 575 índices de soporte para
  Foreign Keys de negocio agregados en la fase de optimización — ver
  [INDEX_CATALOG.md](./INDEX_CATALOG.md).
- **Réplicas de lectura** para BI/Reportes, sin competir con el tráfico
  transaccional — ver
  [09-estrategia-replicacion.md](./09-estrategia-replicacion.md).

## 5. Cómo se decide qué agregar (y qué no)

Cada capacidad candidata se mide contra necesidad de negocio real confirmada,
no contra lo que otro ERP tiene — ver el criterio aplicado explícitamente en
[DATABASE_AUDIT.md §5](./DATABASE_AUDIT.md#5-comparación-funcional-de-referencia)
frente a SAP Business One, Dynamics 365 Business Central, NetSuite, Odoo
Enterprise y ERPNext: se compara el **proceso de negocio**, nunca se copia la
tabla o relación de otro sistema.

## 6. Dónde seguir leyendo

| Si necesitás...                                      | Andá a...                                                |
| ---------------------------------------------------- | -------------------------------------------------------- |
| El inventario numérico completo                      | [DATABASE_INVENTORY.md](./DATABASE_INVENTORY.md)         |
| Los hallazgos de calidad/auditoría                   | [DATABASE_AUDIT.md](./DATABASE_AUDIT.md)                 |
| El estado general del proyecto (docs + código)       | [PROJECT_STATUS.md](../../PROJECT_STATUS.md)             |
| El modelo de datos completo, documento por documento | [README.md](./README.md)                                 |
| Explorar la base real con una herramienta gráfica    | [DATABASE_VISUALIZATION.md](./DATABASE_VISUALIZATION.md) |
