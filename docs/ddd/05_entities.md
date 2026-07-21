# 05 — Entities

> Documenta las **entidades hijas** (con identidad propia, pero sin
> ciclo de vida independiente de su Aggregate Root — ver
> [04_aggregates.md](./04_aggregates.md)) que representan los patrones
> recurrentes del modelo GORAZUS. No se documentan las 501 tablas
> individualmente (sería una duplicación mecánica de
> [database/TABLE_CATALOG.md](../database/TABLE_CATALOG.md)) — se
> documentan los **patrones de entidad hija**, con un ejemplo real por
> patrón, porque todos los agregados del catálogo anterior los repiten.

Toda entidad de este documento hereda `Base Entity`
([32-core-platform/09 §5](../architecture/32-core-platform/09-base-transaccional-y-modelado-ddd.md#5-base-entity))
— identidad `id UUID`, columnas de auditoría, `version` para
concurrencia optimista. No se repite esa base aquí.

## 1. Patrón: Línea de documento (`*_lines`)

- **Identidad:** `id UUID` propio + posición ordinal dentro del
  documento padre (`line_number`).
- **Responsabilidad:** representar un renglón de detalle de un
  documento comercial (Producto/Servicio, cantidad, precio, impuestos
  de esa línea).
- **Relaciones:** pertenece exclusivamente a su Aggregate Root (p. ej.
  `sales_order_lines` → `sales_orders`); referencia por ID suelto a
  `products.products` (regla ya fijada: FK real solo intra-módulo o
  hacia `core`, cross-módulo es ID suelto — con la salvedad ya
  documentada por la auditoría de tablas de que algunas de estas
  referencias a `products.products` son FK física real, ver
  [database/MODULE_RELATIONSHIPS.md §2](../database/MODULE_RELATIONSHIPS.md)).
- **Ciclo de vida:** nace y muere con el documento padre; nunca se
  crea, edita ni elimina de forma independiente — siempre a través del
  repositorio de la raíz, dentro de la misma transacción.
- **Restricciones:** `cantidad > 0`; el total de la línea es siempre
  `cantidad × precio_unitario - descuento + impuesto` (invariante de
  cálculo, verificada en cada escritura, nunca confiada al cliente
  HTTP).
- **Ejemplos:** `sales_order_lines`, `invoice_lines`,
  `purchase_order_lines`, `quote_lines`, `journal_entry_lines`.

## 2. Patrón: Historial de estado (`*_status_history`)

- **Identidad:** `id UUID` + timestamp.
- **Responsabilidad:** registrar cada transición de estado del
  documento padre — quién, cuándo, de qué estado a qué estado, y por
  qué (si aplica una razón).
- **Relaciones:** pertenece exclusivamente a su Aggregate Root.
- **Ciclo de vida:** **append-only** — nunca se edita ni elimina un
  registro de historial ya escrito, ni siquiera al revertir la
  transición (la reversión genera una fila nueva).
- **Restricciones:** la transición registrada debe ser una transición
  válida según la `State Machine` del documento
  ([32-core-platform/05 §6](../architecture/32-core-platform/05-motores-de-logica-de-negocio.md#6-state-machine)) —
  no se registra un salto de estado no permitido.
- **Ejemplos:** `sales_order_status_history`, `invoice_status_history`,
  `purchase_order_status_history`, `production_order_status_history`.

## 3. Patrón: Movimiento inmutable (`*_movements`)

- **Identidad:** `id UUID` + secuencia temporal estricta.
- **Responsabilidad:** representar un hecho atómico ya ocurrido que
  modificó un saldo (de Inventario, de Caja, de cuenta contable).
- **Relaciones:** referencia al saldo que modifica (`stock`,
  `cash_registers`, `chart_of_accounts`), pero es en sí mismo la raíz
  de su propio Aggregate (ver [04 §1.8](./04_aggregates.md#18-inventario-existencia--movimiento)),
  no una entidad hija de otro.
- **Ciclo de vida:** se crea una sola vez, nunca se actualiza ni se
  elimina — una corrección es siempre un Movimiento nuevo de signo
  contrario (Invariante dura, ver
  [17_invariants.md](./17_invariants.md)).
- **Restricciones:** el saldo resultante después de aplicar el
  Movimiento debe respetar las invariantes del saldo (nunca negativo
  para Inventario disponible, por ejemplo).
- **Ejemplos:** `stock_movements`, `cash_movements`,
  `production_consumptions`.

## 4. Patrón: Dato de contacto/dirección (`*_addresses`, `*_contacts`)

- **Identidad:** `id UUID`.
- **Responsabilidad:** representar un punto de contacto o dirección
  física asociado a un maestro (Cliente, Proveedor, Empleado).
- **Relaciones:** pertenece a su maestro; puede marcarse
  `is_primary`/`is_default` (a lo sumo una por tipo).
- **Ciclo de vida:** editable independientemente del maestro (a
  diferencia de una línea de documento), pero siempre a través del
  repositorio del Aggregate Root del maestro — nunca expuesta como
  repositorio propio fuera del módulo dueño.
- **Restricciones:** el campo de Dirección usa el Value Object
  `Dirección` ([06_value_objects.md](./06_value_objects.md)) para su
  validación estructural.
- **Ejemplos:** `customer_addresses`, `customer_contacts`,
  `supplier_addresses`, `employee_emergency_contacts`.

## 5. Patrón: Perfil/configuración anexa (`*_credit_profiles`, `*_tax_profiles`)

- **Identidad:** `id UUID`, relación 1:1 (o 1:N por Empresa) con el
  maestro.
- **Responsabilidad:** encapsular un conjunto de reglas de negocio
  específicas de un dominio secundario (crédito, impuestos) sin
  contaminar la entidad principal con docenas de columnas opcionales.
- **Relaciones:** pertenece al maestro.
- **Ciclo de vida:** igual que §4 — editable, pero solo vía el
  repositorio del maestro.
- **Ejemplos:** `customer_credit_profiles`, `supplier_credit_profiles`,
  `product_tax_profiles`.

## 6. Patrón: Capa de costo (`fifo_cost_layers`, `average_cost_history`)

- **Identidad:** `id UUID` + orden de entrada (para FIFO).
- **Responsabilidad:** sostener el cálculo de costeo de Inventario —
  cada capa representa una entrada de costo aún no consumida
  completamente (FIFO) o un punto de recálculo de promedio.
- **Relaciones:** pertenece al agregado Existencia
  ([04 §1.8](./04_aggregates.md#18-inventario-existencia--movimiento)).
- **Ciclo de vida:** una capa FIFO se consume parcial o totalmente con
  cada salida, nunca se "recrea"; el historial de promedio es
  append-only.
- **Responsabilidad de cálculo:** ver `CalcularCostoPromedio` /
  `AplicarFIFO` en [08_domain_services.md](./08_domain_services.md) —
  la entidad sostiene el dato, el Domain Service contiene el algoritmo.

## 7. Patrón: Evaluación/histórico de calificación (`supplier_evaluations`, `performance_evaluations`)

- **Identidad:** `id UUID` + período evaluado.
- **Responsabilidad:** registrar una calificación periódica de un
  Proveedor o Empleado.
- **Ciclo de vida:** inmutable una vez cerrado el período que evalúa
  (misma regla que Asiento Contable de período cerrado).

## 8. Trazabilidad

Este documento no introduce ninguna tabla, columna ni relación nueva —
formaliza los 7 patrones de entidad hija que ya existen, repetidos
consistentemente, en las 501 tablas del catálogo real. La consistencia
de estos patrones (misma forma de `*_lines`,
`*_status_history`, `*_movements` en 15+ módulos distintos) es en sí
misma la evidencia de que GORAZUS ya seguía disciplina DDD táctica
antes de que esta fase la nombrara explícitamente.

**Siguiente documento:** [06_value_objects.md](./06_value_objects.md).
