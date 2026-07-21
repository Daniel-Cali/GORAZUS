# 18 — Proyectos

**Ícono sugerido:** `kanban-square`
**Tipo:** Dueño de datos
**Descripción:** Planificación, costeo, seguimiento y facturación de
proyectos (obras, consultoría, implementaciones) que agrupan trabajo de
varios módulos bajo un mismo centro de control.
**Módulos relacionados:** `ventas` (facturación del proyecto),
`compras` (costos del proyecto), `recursos-humanos` (horas de
personal), `produccion` (fabricación bajo proyecto), `contabilidad`
(rentabilidad por proyecto vía centro de costo), `documentos`.

## Submenú: Planificación de Proyectos

### Formularios

| Formulario                 | Qué hace                                                                       | Tablas principales             | Permiso           | Documento que genera |
| -------------------------- | ------------------------------------------------------------------------------ | ------------------------------ | ----------------- | -------------------- |
| Proyecto                   | Alta de proyecto: cliente, fechas, presupuesto, responsable                    | `proyectos.proyecto`           | `proyectos.crear` | —                    |
| Estructura de Tareas (WBS) | Define fases y tareas del proyecto con dependencias                            | `proyectos.tarea`              | `proyectos.crear` | —                    |
| Presupuesto de Proyecto    | Define presupuesto por categoría de costo (materiales, mano de obra, terceros) | `proyectos.presupuesto`        | `proyectos.crear` | —                    |
| Asignación de Recurso      | Asigna empleados/equipos a tareas con dedicación estimada                      | `proyectos.asignacion_recurso` | `proyectos.crear` | —                    |

### Acciones

| Acción           | Qué hace                                                               | Permiso               | Efecto/Evento              |
| ---------------- | ---------------------------------------------------------------------- | --------------------- | -------------------------- |
| Iniciar Proyecto | Pasa el proyecto de planificado a en curso                             | `proyectos.confirmar` | Publica `ProyectoIniciado` |
| Cerrar Proyecto  | Marca el proyecto como finalizado, bloquea nueva carga de horas/costos | `proyectos.confirmar` | Publica `ProyectoCerrado`  |
| Reabrir Proyecto | Habilita nuevamente un proyecto cerrado                                | `proyectos.aprobar`   | —                          |

## Submenú: Seguimiento de Tiempos y Costos

### Formularios

| Formulario                    | Qué hace                                                | Tablas principales      | Permiso           | Documento que genera |
| ----------------------------- | ------------------------------------------------------- | ----------------------- | ----------------- | -------------------- |
| Parte de Horas (Timesheet)    | Registra horas trabajadas por empleado en una tarea     | `proyectos.parte_horas` | `proyectos.crear` | —                    |
| Registro de Costo de Proyecto | Asocia un gasto/factura de compra a un proyecto y tarea | `proyectos.costo`       | `proyectos.crear` | —                    |

### Acciones

| Acción                          | Qué hace                                                                               | Permiso             | Efecto/Evento |
| ------------------------------- | -------------------------------------------------------------------------------------- | ------------------- | ------------- |
| Aprobar Parte de Horas          | Valida las horas cargadas por el empleado antes de habilitarlas para facturación/costo | `proyectos.aprobar` | —             |
| Actualizar % de Avance de Tarea | Registra avance físico reportado                                                       | `proyectos.editar`  | —             |

## Submenú: Facturación de Proyectos

| Elemento                         | Detalle                                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------------------ |
| Formulario — Plan de Facturación | Qué hace: define hitos de facturación (por avance, por tiempo y materiales, por hito fijo) | Tablas: `proyectos.plan_facturacion` | Permiso: `proyectos.crear`                |
| Acción — Generar Factura de Hito | Genera la Factura de Venta en `ventas` según el hito alcanzado                             | `proyectos.confirmar`                | Llamada síncrona a `VentasCommandService` |

## Submenú: Reportes de Proyectos

| Reporte                              | Qué muestra                                                           | Filtros principales         |
| ------------------------------------ | --------------------------------------------------------------------- | --------------------------- |
| Rentabilidad por Proyecto            | Ingresos facturados vs. costos reales (materiales + horas + terceros) | Proyecto, período           |
| Avance de Proyecto vs. Presupuesto   | Comparativo de costo real vs. presupuestado por categoría             | Proyecto                    |
| Horas Cargadas por Empleado/Proyecto | Detalle de timesheets                                                 | Empleado, proyecto, período |
| Cronograma (Gantt)                   | Vista de tareas y dependencias en el tiempo                           | Proyecto                    |
| Proyectos Atrasados                  | Proyectos con tareas vencidas sin completar                           | —                           |

## Submenú: Consultas

| Consulta                 | Qué muestra                                             | Permiso         |
| ------------------------ | ------------------------------------------------------- | --------------- |
| Buscar proyecto          | Búsqueda libre por nombre, cliente, estado              | `proyectos.ver` |
| Tablero Kanban de Tareas | Vista de tareas por estado (pendiente, en curso, hecha) | `proyectos.ver` |

## Configuraciones del módulo

| Parámetro                             | Qué controla                                                                  |
| ------------------------------------- | ----------------------------------------------------------------------------- |
| Requiere aprobación de parte de horas | Si las horas cargadas necesitan `proyectos.aprobar` antes de costear/facturar |
| Centro de costo por proyecto          | Vínculo con `contabilidad` para reportes de rentabilidad                      |
| Tarifa horaria por defecto por rol    | Usada para costear horas cuando no hay una tarifa específica del empleado     |
