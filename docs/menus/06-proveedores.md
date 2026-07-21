# 06 — Proveedores

**Ícono sugerido:** `factory`
**Tipo:** Dueño de datos
**Descripción:** Maestro único de proveedores: datos fiscales,
contactos, condiciones comerciales y situación de cuenta corriente
por pagar.
**Módulos relacionados:** `compras` (facturación), `tesoreria`/
`contabilidad` (cuentas por pagar), `documentos` (adjuntos
contractuales).

## Submenú: Maestro de Proveedores

### Formularios

| Formulario             | Qué hace                                                                                         | Tablas principales                | Permiso                  | Documento que genera |
| ---------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------- | ------------------------ | -------------------- |
| Proveedor              | Alta/edición de proveedor: datos fiscales, condición de pago, cuenta bancaria para transferencia | `proveedores.proveedor`           | `proveedores.crear`      | —                    |
| Contacto de Proveedor  | Registra personas de contacto                                                                    | `proveedores.contacto`            | `proveedores.editar`     | —                    |
| Categoría de Proveedor | Clasifica proveedores (bienes, servicios, importación)                                           | `proveedores.categoria`           | `proveedores.configurar` | —                    |
| Condición Comercial    | Define plazo de pago acordado, forma de pago preferida                                           | `proveedores.condicion_comercial` | `proveedores.configurar` | —                    |

### Acciones

| Acción                          | Qué hace                                         | Permiso              | Efecto/Evento                                                     |
| ------------------------------- | ------------------------------------------------ | -------------------- | ----------------------------------------------------------------- |
| Bloquear/Desbloquear Proveedor  | Impide nuevas órdenes de compra a un proveedor   | `proveedores.editar` | Publica `ProveedorBloqueado`; `compras` valida antes de confirmar |
| Fusionar Proveedores Duplicados | Unifica dos registros detectados como duplicados | `proveedores.editar` | Reasigna historial                                                |

## Submenú: Cuenta Corriente

| Elemento                               | Detalle                                                                                                                                 |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Consulta — Estado de Cuenta            | Qué muestra: saldo y detalle de movimientos con un proveedor. Tablas: proyección de `compras` + `tesoreria`. Permiso: `proveedores.ver` |
| Reporte — Antigüedad de Saldos a Pagar | Saldo por pagar agrupado por rango de vencimiento                                                                                       | `proveedores.ver` |

## Submenú: Reportes de Proveedores

| Reporte                           | Qué muestra                                                                                                 | Filtros principales |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------- |
| Listado de Proveedores            | Ficha resumida de todos los proveedores                                                                     | Categoría, estado   |
| Ranking de Proveedores por Compra | Ver también en [Compras](./03-compras.md#submenú-reportes-de-compras)                                       | Período             |
| Evaluación de Desempeño           | Ver [Compras — Evaluación y Homologación](./03-compras.md#submenú-evaluación-y-homologación-de-proveedores) | Período             |

## Submenú: Consultas

| Consulta         | Qué muestra                                      | Permiso           |
| ---------------- | ------------------------------------------------ | ----------------- |
| Buscar proveedor | Búsqueda libre por nombre, identificación fiscal | `proveedores.ver` |

## Configuraciones del módulo

| Parámetro                           | Qué controla                                                                       |
| ----------------------------------- | ---------------------------------------------------------------------------------- |
| Validación de identificación fiscal | Formato/dígito verificador según país                                              |
| Campos obligatorios de alta         | Qué campos son requeridos para dar de alta un proveedor                            |
| Requiere aprobación de alta         | Si un proveedor nuevo necesita `proveedores.aprobar` antes de poder recibir una OC |
