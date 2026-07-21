# 10 — Tesorería

**Ícono sugerido:** `banknote`
**Tipo:** Consolidación de solo lectura (sin datos propios) — ver
[04-catalogo-modulos-negocio.md](../architecture/04-catalogo-modulos-negocio.md#tesoreria-vs-caja--bancos-por-qué-son-módulos-distintos)
**Descripción:** Vista consolidada de la posición de liquidez de la
empresa (caja + bancos + cuentas por cobrar + cuentas por pagar) y
proyección de flujo de fondos. No registra movimientos — los movimientos
los registran `caja` y `bancos`; Tesorería solo proyecta el efecto
esperado de `clientes` (CxC) y `proveedores` (CxP).
**Módulos relacionados:** `caja`, `bancos`, `clientes`, `proveedores`,
`contabilidad`, `dashboard`.

## Submenú: Posición de Liquidez

| Elemento                                   | Detalle                                                                                                                                                                             |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Consulta — Posición Consolidada            | Qué muestra: saldo disponible sumando todas las cajas y cuentas bancarias, en tiempo real. Tablas: proyecciones de `caja.movimiento`, `bancos.movimiento`. Permiso: `tesoreria.ver` |
| Consulta — Cuentas por Cobrar Consolidadas | Qué muestra: saldo total a cobrar, por cliente y por antigüedad. Tablas: proyección de `ventas`/`clientes`. Permiso: `tesoreria.ver`                                                |
| Consulta — Cuentas por Pagar Consolidadas  | Qué muestra: saldo total a pagar, por proveedor y por vencimiento. Tablas: proyección de `compras`/`proveedores`. Permiso: `tesoreria.ver`                                          |

## Submenú: Flujo de Fondos Proyectado

| Elemento                                                | Detalle                                                                                                                        |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Formulario — Movimiento Proyectado Manual               | Qué hace: registra un ingreso/egreso esperado que aún no existe como documento formal (p. ej. una venta grande en negociación) | Tablas: `tesoreria.proyeccion_manual`       | Permiso: `tesoreria.crear` |
| Reporte — Flujo de Caja Proyectado (Cash Flow Forecast) | Qué muestra: entradas y salidas esperadas a 30/60/90 días, combinando CxC, CxP y proyecciones manuales                         | Filtros: horizonte de proyección, escenario |
| Reporte — Comparativo Flujo Proyectado vs. Real         | Qué muestra: desvío entre lo proyectado y lo efectivamente ocurrido                                                            | Período                                     |

## Submenú: Planificación de Pagos

| Elemento                                     | Detalle                                                                                                |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Formulario — Propuesta de Pago a Proveedores | Qué hace: preselecciona facturas de compra a pagar según vencimiento y disponibilidad, para aprobación | Tablas: `tesoreria.propuesta_pago` | Permiso: `tesoreria.crear`                                          |
| Acción — Aprobar Propuesta de Pago           | Autoriza la propuesta y la envía a `bancos`/`caja` para ejecutar los pagos                             | Permiso: `tesoreria.aprobar`       | Publica evento consumido por `bancos` para generar el batch de pago |

## Submenú: Reportes de Tesorería

| Reporte                           | Qué muestra                                                | Filtros principales |
| --------------------------------- | ---------------------------------------------------------- | ------------------- |
| Posición Diaria de Tesorería      | Saldo consolidado al cierre de cada día                    | Rango de fechas     |
| Vencimientos Próximos (CxC + CxP) | Cruce de cobros y pagos esperados en los próximos N días   | Rango de días       |
| Indicadores de Liquidez           | Razón corriente, prueba ácida, días de cobro/pago promedio | Período             |

## Configuraciones del módulo

| Parámetro                                          | Qué controla                                                                                     |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Horizonte de proyección por defecto                | 30/60/90 días u otro, para el Cash Flow Forecast                                                 |
| Cajas/cuentas incluidas en la posición consolidada | Qué cajas y cuentas bancarias entran al cálculo (útil si hay cuentas restringidas)               |
| Umbral de alerta de liquidez mínima                | Dispara alerta en [Dashboard](./01-dashboard.md) si la posición proyectada cae debajo del umbral |
