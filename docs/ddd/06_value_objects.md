# 06 — Value Objects

> `Value Objects` como componente de `32-core-platform` ya tiene
> objetivo/responsabilidad/dependencias/interfaces completos en
> [32-core-platform/09 §7](../architecture/32-core-platform/09-base-transaccional-y-modelado-ddd.md#7-value-objects) —
> **no se repiten aquí**. Ese documento nombra `Money`, `Porcentaje`,
> `RangoFecha` como Shared Kernel pero señala explícitamente que
> "nunca fueron diseñados en detalle — gap de contenido real". Este
> documento cierra ese gap: el detalle de atributos/validaciones/reglas
> de cada Value Object, del Shared Kernel y de los nuevos identificados
> por el catálogo de agregados ([04](./04_aggregates.md)).

**Regla común a todos:** inmutables (toda "modificación" retorna una
instancia nueva), sin identidad propia (comparables por valor), con
constructor privado + factory estática que valida y puede lanzar
`ValidationException` — regla ya fijada en
[32-core-platform/09 §7](../architecture/32-core-platform/09-base-transaccional-y-modelado-ddd.md#7-value-objects).

## 1. Shared Kernel (cross-módulo — `packages/contracts`)

### 1.1 Dinero (`Money`)

- **Atributos:** `monto` (entero de la unidad menor de la moneda o
  `Decimal`, nunca punto flotante), `moneda` (código ISO 4217).
- **Validaciones:** `moneda` debe existir en `configuration.currencies`;
  `monto` no admite más decimales que los que la moneda permite.
- **Reglas:** `Money.add()`/`Money.subtract()` rechazan operar entre
  monedas distintas sin pasar explícitamente por `Currency Manager`
  (conversión); `Money.multiply(factor)` para cálculos de línea
  (cantidad × precio).
- **Inmutabilidad:** total — cualquier operación retorna un `Money`
  nuevo.
- **Usado por:** todo campo monetario de todo agregado de
  [04_aggregates.md](./04_aggregates.md) (precios, totales, saldos,
  salarios, montos de impuesto).

### 1.2 Porcentaje

- **Atributos:** `valor` (0-100 o 0-1, decisión fija: 0-100 para
  legibilidad en UI y reportes, conversión interna a fracción solo en
  el cálculo).
- **Validaciones:** rango `[0, 100]` salvo casos explícitamente
  marcados como permitiendo recargo (`> 100`, p. ej. impuestos
  acumulativos) — el rango permitido se declara en el punto de uso.
- **Reglas:** `Porcentaje.aplicarSobre(Money)` retorna un `Money`
  nuevo.
- **Usado por:** descuentos de línea, comisiones, tasas de impuesto,
  margen de utilidad.

### 1.3 Rango de Fecha (`RangoFecha`)

- **Atributos:** `desde`, `hasta` (ambas `Date`, `hasta` opcionalmente
  abierta/null para rangos indefinidos).
- **Validaciones:** `desde <= hasta` cuando ambas están presentes.
- **Reglas:** `RangoFecha.contiene(fecha)`, `RangoFecha.seSolapaCon(otroRango)`
  — esta última es la que usan las especificaciones de vigencia
  (`FacturaVigente`, Período Contable abierto).
- **Usado por:** vigencia de Cotización, Contrato de Servicio, Período
  Fiscal, Descuento, Lista de Precios.

### 1.4 Contexto transversal (`TenantId`, `UserContext`, `AuditMeta`)

Ya completos en `06-comunicacion-entre-modulos.md §3` y
`32-core-platform/09 §1` — no son Value Objects de negocio, son
Value Objects técnicos del Shared Kernel; se referencian, no se
repiten aquí.

## 2. Value Objects nuevos identificados por esta fase (candidatos a Shared Kernel o locales)

### 2.1 Dirección

- **Atributos:** `linea1`, `linea2` (opcional), `municipio`,
  `provincia`, `país`, `códigoPostal` (opcional según país).
- **Validaciones:** `país` debe existir en `configuration.countries`;
  `provincia`/`municipio` deben pertenecer al `país` declarado
  (consistencia jerárquica).
- **Inmutabilidad:** total — "editar una dirección" es reemplazar la
  entidad `*_addresses` que la contiene por una nueva versión del VO.
- **Candidato a Shared Kernel:** sí — usado idénticamente por
  `clientes`, `proveedores`, `rrhh`, `bancos` (sucursal). No promovido
  automáticamente: requiere ADR
  ([11-gobernanza-y-adrs.md §4](../architecture/11-gobernanza-y-adrs.md))
  como cualquier adición al Shared Kernel.

### 2.2 Correo

- **Atributos:** `direccion` (string).
- **Validaciones:** formato RFC 5322 válido — la misma regla que ya
  aplica `Validation Engine`
  ([32-core-platform/05 §2](../architecture/32-core-platform/05-motores-de-logica-de-negocio.md#2-validation-engine))
  a nivel de schema Zod; el Value Object la encapsula también a nivel
  de dominio para que no dependa solo de la capa HTTP.
- **Candidato a Shared Kernel:** sí, mismo criterio que Dirección.

### 2.3 Teléfono

- **Atributos:** `código_país`, `número`.
- **Validaciones:** formato E.164 al normalizar.
- **Candidato a Shared Kernel:** sí.

### 2.4 Cantidad

- **Atributos:** `valor` (numérico), `unidad_de_medida` (referencia a
  `products.units_of_measure`).
- **Validaciones:** `valor > 0` en el caso general; el signo negativo
  solo es válido dentro de un Movimiento de reversión (regla del
  agregado, no del VO).
- **Reglas:** `Cantidad.convertirA(otraUnidad)` usa las conversiones ya
  definidas en `products.unit_conversions` — el VO no reimplementa la
  tabla de conversión, la consulta.
- **Local a:** `productos`, `inventario`, `ventas`, `compras`,
  `produccion` — no se promueve a Shared Kernel porque su validación
  depende de una tabla de referencia propia de `productos`.

### 2.5 Impuesto (aplicado a una línea)

- **Atributos:** `tasa` (`Porcentaje`), `monto` (`Money`, ya calculado),
  `tipo` (referencia a `taxes.taxes`).
- **Validaciones:** `monto = tasa.aplicarSobre(baseImponible)`,
  verificado en construcción — nunca se acepta un `monto` que no
  cuadre con `tasa × base`.
- **Local a:** `impuestos`, consumido como VO embebido por
  `ventas`/`compras`/`payroll` en sus líneas.

### 2.6 Peso / Volumen / Medidas

- **Atributos comunes:** `valor` (numérico), `unidad` (kg/lb, l/gal,
  cm/in).
- **Validaciones:** `valor >= 0`.
- **Reglas:** conversión entre unidades del mismo tipo físico.
- **Local a:** `productos` (dimensiones de producto para cálculo
  logístico), `logistica` (capacidad de vehículo, propuesto Fase 5).

### 2.7 Estado (State, respaldado por State Machine)

- **Atributos:** `valor` (string discriminado, p. ej.
  `'borrador' | 'confirmado' | 'anulado'`), específico de cada
  Aggregate Root.
- **Validaciones:** una transición de `Estado` solo es válida si la
  `State Machine` del agregado
  ([32-core-platform/05 §6](../architecture/32-core-platform/05-motores-de-logica-de-negocio.md#6-state-machine))
  la permite — el VO en sí es solo el valor; la regla de transición
  vive en la State Machine, no se duplica en el VO.
- **Decisión de diseño:** no se modela un único VO `Estado` genérico
  compartido entre todos los agregados (tentador, pero incorrecto en
  DDD — los estados de una Factura y los de una Orden de Producción no
  son intercambiables ni deben compartir tipo). Cada agregado declara
  su propio enum de estados en `packages/contracts` del módulo dueño,
  siguiendo el mismo patrón pero sin ser el mismo tipo.

## 3. Tabla resumen

| Value Object             | Ámbito                               | Ya existía (nombrado)                   | Diseño detallado (nuevo en esta fase) |
| ------------------------ | ------------------------------------ | --------------------------------------- | ------------------------------------- |
| Dinero (`Money`)         | Shared Kernel                        | ✅                                      | ✅ (esta fase)                        |
| Porcentaje               | Shared Kernel                        | ✅                                      | ✅ (esta fase)                        |
| Rango de Fecha           | Shared Kernel                        | ✅                                      | ✅ (esta fase)                        |
| Dirección                | Candidato a Shared Kernel            | ❌                                      | 🆕                                    |
| Correo                   | Candidato a Shared Kernel            | ❌                                      | 🆕                                    |
| Teléfono                 | Candidato a Shared Kernel            | ❌                                      | 🆕                                    |
| Cantidad                 | Local (`inventario`/`productos`/...) | ❌                                      | 🆕                                    |
| Impuesto                 | Local (`impuestos`)                  | ❌                                      | 🆕                                    |
| Peso / Volumen / Medidas | Local (`productos`/`logistica`)      | ❌                                      | 🆕                                    |
| Estado                   | Local, por agregado                  | ❌ (patrón implícito vía State Machine) | 🆕 (formalizado como VO)              |

## 4. Trazabilidad

Dinero/Porcentaje/Rango de Fecha estaban **nombrados** pero no
diseñados en detalle — este documento cierra ese gap exacto, señalado
explícitamente por `32-core-platform/09 §7`. Los Value Objects nuevos
(§2) no crean columnas nuevas: son la envoltura de dominio sobre
columnas que ya existen en el modelo de datos (`customer_addresses.pais`,
`products.peso`, etc.) — cero cambio de schema.

**Siguiente documento:** [07_domain_events.md](./07_domain_events.md).
