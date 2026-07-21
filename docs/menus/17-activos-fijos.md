# 17 — Activos Fijos

**Ícono sugerido:** `building-2`
**Tipo:** Dueño de datos
**Descripción:** Registro, depreciación, transferencia y baja de bienes
de uso (mobiliario, maquinaria, vehículos, equipos de cómputo).
**Módulos relacionados:** `compras` (alta por adquisición),
`contabilidad` (asiento de depreciación y baja), `servicios` (equipo
bajo mantenimiento), `proyectos` (activo asignado a un proyecto).

## Submenú: Registro de Activos

### Formularios

| Formulario             | Qué hace                                                                                      | Tablas principales                  | Permiso                    | Documento que genera |
| ---------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------- | -------------------------- | -------------------- |
| Activo Fijo            | Alta/edición de un bien: descripción, categoría, valor de adquisición, ubicación, responsable | `activos-fijos.activo`              | `activos-fijos.crear`      | Ficha de Activo      |
| Categoría de Activo    | Define categorías con método y vida útil por defecto (mobiliario, vehículos, equipos)         | `activos-fijos.categoria`           | `activos-fijos.configurar` | —                    |
| Método de Depreciación | Define línea recta, saldos decrecientes u otro método admitido                                | `activos-fijos.metodo_depreciacion` | `activos-fijos.configurar` | —                    |

### Acciones

| Acción                                    | Qué hace                                                           | Permiso                 | Efecto/Evento                                                                                       |
| ----------------------------------------- | ------------------------------------------------------------------ | ----------------------- | --------------------------------------------------------------------------------------------------- |
| Alta desde Compra                         | Genera el Activo Fijo a partir de una Factura de Compra confirmada | `activos-fijos.crear`   | Consume evento `FacturaCompraRegistrada` de `compras` (cuando la línea está marcada como activable) |
| Transferir Activo (ubicación/responsable) | Registra cambio de ubicación física o de responsable               | `activos-fijos.editar`  | —                                                                                                   |
| Revaluar Activo                           | Ajusta el valor contable de un activo                              | `activos-fijos.aprobar` | Publica `ActivoRevaluado`, consumido por `contabilidad`                                             |

## Submenú: Depreciación

| Elemento                                    | Detalle                                                                                          |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Acción — Calcular Depreciación del Período  | Qué hace: corre el cálculo de depreciación de todos los activos activos para el período contable | Permiso: `activos-fijos.confirmar` |
| Acción — Confirmar Depreciación del Período | Cierra el cálculo y lo envía a contabilizar                                                      | `activos-fijos.aprobar`            | Publica `DepreciacionCalculada`, consumido por `contabilidad` (Asiento de Depreciación) |
| Reporte — Cuadro de Depreciación            | Qué muestra: depreciación acumulada y valor neto en libros por activo                            | Filtros: categoría, fecha de corte |

## Submenú: Mantenimiento y Bajas

### Formularios

| Formulario                       | Qué hace                                                            | Tablas principales            | Permiso               | Documento que genera |
| -------------------------------- | ------------------------------------------------------------------- | ----------------------------- | --------------------- | -------------------- |
| Orden de Mantenimiento de Activo | Registra mantenimiento preventivo/correctivo sobre un activo propio | `activos-fijos.mantenimiento` | `activos-fijos.crear` | —                    |
| Baja de Activo                   | Registra venta, donación o desecho de un bien                       | `activos-fijos.baja`          | `activos-fijos.crear` | Comprobante de Baja  |

### Acciones

| Acción         | Qué hace                                            | Permiso                 | Efecto/Evento                                            |
| -------------- | --------------------------------------------------- | ----------------------- | -------------------------------------------------------- |
| Confirmar Baja | Da de baja definitiva el activo y su valor residual | `activos-fijos.aprobar` | Publica `ActivoDadoDeBaja`, consumido por `contabilidad` |

## Submenú: Reportes de Activos Fijos

| Reporte                               | Qué muestra                                  | Filtros principales  |
| ------------------------------------- | -------------------------------------------- | -------------------- |
| Inventario de Activos Fijos           | Listado completo con ubicación y responsable | Categoría, ubicación |
| Cuadro de Depreciación                | Ver submenú Depreciación                     | Período              |
| Activos por Vencer Vida Útil          | Activos próximos a depreciación completa     | Rango de meses       |
| Historial de Mantenimiento por Activo | Mantenimientos realizados sobre un bien      | Activo               |
| Bajas del Período                     | Detalle de activos dados de baja             | Período              |

## Submenú: Consultas

| Consulta                | Qué muestra                                         | Permiso             |
| ----------------------- | --------------------------------------------------- | ------------------- |
| Buscar activo           | Búsqueda libre por código, descripción, responsable | `activos-fijos.ver` |
| Activos por Responsable | Listado de bienes asignados a un empleado           | `activos-fijos.ver` |

## Configuraciones del módulo

| Parámetro                           | Qué controla                                                                  |
| ----------------------------------- | ----------------------------------------------------------------------------- |
| Umbral mínimo de activación         | Monto a partir del cual una compra se activa como bien de uso en vez de gasto |
| Vida útil por defecto por categoría | Años/meses usados si el activo no especifica uno propio                       |
| Requiere aprobación para baja       | Si dar de baja necesita `activos-fijos.aprobar`                               |
