# 15 — Shared Kernel

> `Shared Kernel` como componente de `32-core-platform` ya tiene su
> diseño completo (objetivo, gobernanza vía ADR, contenido) en
> [32-core-platform/09 §8](../architecture/32-core-platform/09-base-transaccional-y-modelado-ddd.md#8-shared-kernel)
> y en [06-comunicacion-entre-modulos.md §3](../architecture/06-comunicacion-entre-modulos.md#3-shared-kernel) —
> **no se repite aquí**. Este documento existe solo para satisfacer el
> checklist de entregables de la Fase 6 con un puntero directo, y para
> registrar la única adición real que esta fase propone.

## 1. Inventario actual (referencia, no repetido)

Ya completo en las referencias de arriba: Value Objects universales
(`Money`, `Porcentaje`, `RangoFecha`), contexto transversal (`TenantId`,
`UserContext`, `AuditMeta`), tipos de error base. Vive en
`packages/contracts`, sin dependencia de framework, deliberadamente
pequeño, cada adición requiere ADR
([11-gobernanza-y-adrs.md §4](../architecture/11-gobernanza-y-adrs.md)).

## 2. Candidatos identificados por esta fase (no promovidos automáticamente)

[06_value_objects.md §2](./06_value_objects.md#2-value-objects-nuevos-identificados-por-esta-fase-candidatos-a-shared-kernel-o-locales)
identificó `Dirección`, `Correo` y `Teléfono` como usados
idénticamente por 4+ contextos (`clientes`, `proveedores`, `rrhh`,
`bancos`). Se documentan aquí como **candidatos**, explícitamente sin
promoción automática — la promoción real requiere el proceso de ADR ya
fijado, que esta fase no tiene mandato de ejecutar (es documentación
de arquitectura, no una decisión de gobernanza consumada).

| Candidato   | Contextos que lo usarían igual              | Estado                       |
| ----------- | ------------------------------------------- | ---------------------------- |
| `Dirección` | `clientes`, `proveedores`, `rrhh`, `bancos` | Candidato — pendiente de ADR |
| `Correo`    | `clientes`, `proveedores`, `rrhh`, `crm`    | Candidato — pendiente de ADR |
| `Teléfono`  | `clientes`, `proveedores`, `rrhh`, `crm`    | Candidato — pendiente de ADR |

## 3. Qué explícitamente no entra al Shared Kernel

Reafirmando la regla ya fijada (no se repite el razonamiento completo,
solo se confirma que el catálogo de agregados de esta fase no
introduce ninguna excepción): `Cliente`, `Producto`, `AsientoContable`
y cualquier otro concepto de negocio de un módulo específico
identificado en [04_aggregates.md](./04_aggregates.md) permanecen fuera
del Shared Kernel — se consumen vía proyección o consulta síncrona al
módulo dueño, nunca como tipo compartido.

## 4. Trazabilidad

Cero cambio al Shared Kernel real. La única novedad de este documento
es nombrar tres candidatos ya usados de forma repetida en el modelo de
datos, dejando la decisión de promoción donde ya corresponde (proceso
de ADR).

**Siguiente documento:** [16_domain_policies.md](./16_domain_policies.md).
