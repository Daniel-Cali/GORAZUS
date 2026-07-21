# 16 — Domain Policies

> Una Domain Policy es una regla de negocio **global**, aplicable a
> través de contextos, que no pertenece a un único Aggregate Root ni
> se expresa como una Specification puntual — es una decisión de
> gobernanza del dominio completo. Se distingue de un Invariante
> ([17_invariants.md](./17_invariants.md)) en que una Policy puede
> tener excepciones configurables por tenant, mientras que un
> Invariante nunca se rompe. La mayoría de estas políticas ya rigen
> GORAZUS de forma implícita en varios documentos — aquí se consolidan
> con nombre explícito por primera vez.

## 1. Políticas de propiedad y escritura

### P1 — Módulo dueño único

Ningún dato de un Aggregate Root se escribe fuera de su módulo dueño,
sin excepción, ni siquiera con rol administrativo elevado — la
restricción es arquitectónica (fronteras de Nx), no solo de RBAC. Ya
fijada en
[06-comunicacion-entre-modulos.md §4](../architecture/06-comunicacion-entre-modulos.md#4-patrón-módulo-dueño-para-entidades-compartidas).

### P2 — Publicación después del commit

Todo Domain Event se publica únicamente después de que la transacción
local que lo originó fue confirmada — nunca antes, nunca dentro de la
transacción. Ya fijada en
[32-core-platform/09 §2](../architecture/32-core-platform/09-base-transaccional-y-modelado-ddd.md#2-transaction-manager).

### P3 — Sin transacciones distribuidas implícitas

La consistencia entre dos contextos distintos siempre es eventual (vía
eventos + compensación), nunca una transacción que abarque dos
schemas. Ya fijada en
[06-comunicacion-entre-modulos.md](../architecture/06-comunicacion-entre-modulos.md).

## 2. Políticas de ciclo de vida de datos

### P4 — Soft delete como única forma de "eliminar"

Ningún registro de negocio se elimina físicamente (`DELETE`) fuera de
los procesos de purga/retención legal explícitamente diseñados — la
única forma de "eliminar" es la columna universal de soft-delete. Ya
fijada en
[32-core-platform/09 §5](../architecture/32-core-platform/09-base-transaccional-y-modelado-ddd.md#5-base-entity).

### P5 — Numeración exclusiva por serie

Un `Correlativo`/`numbering_series` nunca se reutiliza ni se salta
intencionalmente — la exclusividad de la asignación se garantiza por
`Sequence Generator`
([32-core-platform/08 §1](../architecture/32-core-platform/08-frameworks-de-infraestructura.md#1-sequence-generator)),
nunca por lógica de aplicación ad-hoc en un módulo de negocio.

### P6 — Documentos fiscales inmutables tras emisión

Una Factura, Nota de Crédito o Certificado de Retención emitido nunca
se edita — toda corrección es un documento nuevo que referencia al
original (§ ya cubierto como Invariante en
[17_invariants.md](./17_invariants.md); se lista aquí porque además es
una política aplicable a cualquier documento fiscal futuro, no solo a
los 3 ya nombrados).

## 3. Políticas de autoridad y aprobación

### P7 — Ninguna IA escribe directamente

Toda salida de un modelo de IA o agente autónomo es una propuesta que
requiere confirmación humana o paso por `Approval Engine`/`Workflow
Engine`, bajo el `Security Context` de quien aprueba, nunca el del
sistema o el agente. Ya fijada como principio rector en
[47-modulo-ia.md §1](../architecture/47-modulo-ia.md) — es la política
de mayor severidad de todo el dominio, y se reafirma aquí como
política global aplicable a cualquier automatización futura, no
exclusiva del módulo `ia`.

### P8 — Operaciones irreversibles requieren aprobación

Dar de baja un Activo Fijo, anular una Declaración de Impuesto
presentada, o cerrar un Período Contable son operaciones que, una vez
ejecutadas, no tienen "deshacer" — todas pasan por `Approval Engine`
antes de ejecutarse, nunca por un solo clic sin segunda validación. Ya
aplicado módulo a módulo (Bajas de Activos, Fase 5 MRP "nunca se
convierte en orden real automáticamente"); se formaliza aquí como
política transversal.

## 4. Políticas de aislamiento y alcance

### P9 — Aislamiento de tenant inescapable

Ningún dato de negocio es visible ni escribible fuera del alcance de
`tenant_id`[, `company_id`][, `branch_id`] salvo a través del mecanismo
explícito y auditado `@AllowCrossTenant()`. Ya fijada en
[32-core-platform/09 §4](../architecture/32-core-platform/09-base-transaccional-y-modelado-ddd.md#4-repository-base).

### P10 — Pertenencia única a Grupo Corporativo

Una Empresa pertenece a lo sumo a un Grupo Corporativo a la vez — regla
de negocio, no de schema (Fase 5,
[48-erp-enterprise-readiness.md §3](../architecture/48-erp-enterprise-readiness.md)).

## 5. Políticas de costeo e inventario

### P11 — Método de costeo fijo por Producto, no por transacción

Un Producto usa FIFO o Costo Promedio de forma consistente
(`costing_method`) — no se mezclan métodos de costeo para el mismo
Producto entre Movimientos, para no romper la trazabilidad del Kardex.
Ya implícito en
[19-modulo-inventory.md §10-11](../architecture/19-modulo-inventory.md),
formalizado aquí como política explícita.

### P12 — Reserva antes que compromiso físico

Ninguna salida de Inventario ocurre sin que exista una Reserva previa
del documento que la origina (Pedido de Venta, Orden de Producción) —
la Reserva es el mecanismo que hace que `StockDisponible`
([11_specifications.md](./11_specifications.md)) sea confiable en
condiciones de concurrencia.

## 6. Tabla resumen

| Política                                          | Categoría     | Excepciones permitidas                                         |
| ------------------------------------------------- | ------------- | -------------------------------------------------------------- |
| P1 Módulo dueño único                             | Propiedad     | Ninguna                                                        |
| P2 Publicación después del commit                 | Consistencia  | Ninguna                                                        |
| P3 Sin transacciones distribuidas                 | Consistencia  | Ninguna                                                        |
| P4 Soft delete                                    | Ciclo de vida | Purga legal explícita                                          |
| P5 Numeración exclusiva                           | Ciclo de vida | Ninguna                                                        |
| P6 Documentos fiscales inmutables                 | Ciclo de vida | Ninguna                                                        |
| P7 Ninguna IA escribe directamente                | Autoridad     | Ninguna — política de mayor severidad                          |
| P8 Operaciones irreversibles requieren aprobación | Autoridad     | Configurable el umbral, no la existencia del paso              |
| P9 Aislamiento de tenant                          | Alcance       | `@AllowCrossTenant()` auditado                                 |
| P10 Grupo Corporativo único                       | Alcance       | Ninguna                                                        |
| P11 Método de costeo fijo por Producto            | Costeo        | Cambio de método vía proceso de migración explícito, no ad-hoc |
| P12 Reserva antes que compromiso físico           | Inventario    | Ninguna                                                        |

## 7. Trazabilidad

Toda política de este catálogo ya regía GORAZUS de forma dispersa en
al menos un documento existente — la única novedad es el nombre `P1`-`P12`
y la consolidación en un solo lugar navegable.

**Siguiente documento:** [17_invariants.md](./17_invariants.md).
