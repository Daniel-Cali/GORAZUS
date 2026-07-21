# Module Relationships — GORAZUS

> Generado 2026-07-17 (PHASE 01 — Database Enterprise). Ángulo distinto a
> [DATABASE_DEPENDENCIES.md](./DATABASE_DEPENDENCIES.md) (que traduce el grafo de
> dependencias de negocio a schemas) y a [FOREIGN_KEYS.md](./FOREIGN_KEYS.md) (que
> cataloga las FK físicas) — este documento responde **quién es dueño de qué
> entidad compartida** y cómo se refleja eso en la base real, patrón ya fijado en
> `docs/architecture/06-comunicacion-entre-modulos.md §4` ("módulo dueño").

## 1. El patrón "módulo dueño" (referencia)

Toda entidad usada por más de un módulo tiene **un único dueño** — el resto la
referencia por ID, nunca la duplica (`06-comunicacion-entre-modulos.md §4`). Tabla
de las entidades compartidas de mayor impacto, con su dueño real verificado y quién
la consume:

| Entidad                     | Schema dueño    | Tabla real                     | Consumida por (según FK real, ver `FOREIGN_KEYS.md §3`) |
| --------------------------- | --------------- | ------------------------------ | ------------------------------------------------------- |
| Cliente                     | `customers`     | `customers.customers`          | `sales`, `crm`, `services`                              |
| Proveedor                   | `suppliers`     | `suppliers.suppliers`          | `purchases`, `banks`                                    |
| Producto                    | `products`      | `products.products`            | `inventory`, `sales`, `purchases`, `services`           |
| Empleado                    | `hr`            | `hr.employees`                 | `payroll`, `projects`                                   |
| Cuenta contable             | `accounting`    | `accounting.chart_of_accounts` | `assets`                                                |
| Configuración fiscal/moneda | `configuration` | Varias                         | `sales`, `customers`, `taxes`                           |
| Venta/Pedido                | `sales`         | `sales.sales_orders`           | `customers`, `crm`, `cash`                              |

## 2. Consumo real: FK vs. patrón documentado

**Divergencia real encontrada en esta fase** (detalle completo:
[FOREIGN_KEYS.md §3](./FOREIGN_KEYS.md#3-hallazgo-real-185-fk-cruzan-schemas-de-módulos-de-negocio)):
el patrón "módulo dueño" está bien resuelto **a nivel de propiedad de escritura**
(cada tabla listada en §1 solo se modifica desde su módulo dueño — no hay evidencia
de un módulo consumidor escribiendo directamente en la tabla de otro), pero **no** a
nivel de mecanismo de referencia: 185 de esas referencias son FK físicas de
Postgres, no "IDs sueltos" como documenta la arquitectura. Consecuencia práctica,
no solo teórica:

- **Lo que SÍ funciona hoy gracias a esto (efecto colateral positivo):** integridad
  referencial real — Postgres impide borrar un `products.products` que todavía
  tenga líneas de `sales.sales_order_lines`/`inventory.stock_movements` apuntándolo,
  sin que la aplicación tenga que implementar esa validación a mano.
- **Lo que esto contradice:** el plan de extracción a microservicios
  (`docs/architecture/10-evolucion-a-microservicios.md`) asume que ningún schema
  tiene una FK física hacia otro módulo de negocio — extraer `products` a un
  servicio separado el día de mañana **rompería** estas 185 FK físicas
  inmediatamente (una FK no puede apuntar a una tabla en otra base de datos). Esto
  es información nueva y relevante para ese documento, no evaluada hasta ahora.

## 3. Relaciones many-to-many entre módulos (tablas de unión cross-schema)

No se detectó ninguna tabla de unión N:M genuina que viva a caballo entre dos
schemas de negocio (una tabla de unión siempre vive en el schema de uno de los dos
lados, con FK/ID suelto hacia el otro) — consistente con
`docs/database/02-modelo-logico.md §1.3`. Las relaciones N:M documentadas
(`role_permissions`, `product_combo_components`, etc.) son todas intra-schema.

## 4. Módulos sin schema propio — cómo se relacionan con el resto

Ya establecido en `docs/standards/NAMING_CONVENTIONS.md §5` — recordatorio aplicado
a este documento: `pos` (orquesta `sales`+`inventory`+`cash`, sin tabla propia),
`tesoreria` (vista sobre `cash`+`banks`+`customers`+`suppliers`, ver
`accounting.v_treasury_position`, corregida en esta fase — §5 de
`DATABASE_HEALTH_REPORT.md`), `dashboard`/`reportes`/`bi` (consumidores de solo
lectura), `documentos`/`administracion` (viven dentro de `core`).

## 5. Trazabilidad

| Punto pedido en la fase                         | Cerrado en                                                                                    |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Revisar relaciones entre módulos                | §1-3                                                                                          |
| Detectar relaciones innecesarias/inconsistentes | §2 — divergencia real FK vs. ID suelto, con impacto identificado en el plan de microservicios |
