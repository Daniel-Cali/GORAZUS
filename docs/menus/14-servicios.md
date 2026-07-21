# 14 — Servicios

**Ícono sugerido:** `wrench`
**Tipo:** Dueño de datos
**Descripción:** Gestión de servicios post-venta: órdenes de servicio,
contratos de mantenimiento, garantías y despacho de técnicos.
**Módulos relacionados:** `clientes` (titular del servicio),
`activos-fijos`/`inventario` (equipo bajo servicio y repuestos),
`ventas` (facturación del servicio), `recursos-humanos` (técnicos).

## Submenú: Órdenes de Servicio

### Formularios

| Formulario                            | Qué hace                                                                               | Tablas principales                         | Permiso                | Documento que genera |
| ------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------ | ---------------------- | -------------------- |
| Orden de Servicio                     | Registra una solicitud de servicio/reparación de un cliente                            | `servicios.orden`, `servicios.orden_linea` | `servicios.crear`      | Orden de Servicio    |
| Tipo de Servicio                      | Cataloga tipos (instalación, mantenimiento preventivo, reparación) con tiempo estándar | `servicios.tipo_servicio`                  | `servicios.configurar` | —                    |
| Parte de Trabajo (Reporte de Técnico) | Registra lo realizado en campo: tiempo, repuestos usados, observaciones                | `servicios.parte_trabajo`                  | `servicios.crear`      | Reporte de Servicio  |

### Acciones

| Acción                    | Qué hace                                                  | Permiso               | Efecto/Evento                                                                  |
| ------------------------- | --------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------ |
| Asignar Técnico           | Despacha la orden a un técnico/cuadrilla disponible       | `servicios.editar`    | Publica `OrdenServicioAsignada`                                                |
| Cerrar Orden de Servicio  | Marca la orden como completada y habilita la facturación  | `servicios.confirmar` | Publica `OrdenServicioCerrada`, consumido por `ventas` para generar la factura |
| Consumir Repuesto         | Descuenta un repuesto de `inventario` asociado a la orden | `servicios.confirmar` | Llamada al comando público de `inventario`                                     |
| Reabrir Orden de Servicio | Reabre una orden cerrada por reclamo del cliente          | `servicios.aprobar`   | —                                                                              |

## Submenú: Contratos de Servicio

### Formularios

| Formulario                       | Qué hace                                                                                | Tablas principales             | Permiso           | Documento que genera |
| -------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------ | ----------------- | -------------------- |
| Contrato de Servicio / SLA       | Define alcance, frecuencia de mantenimiento y nivel de servicio acordado con un cliente | `servicios.contrato`           | `servicios.crear` | Contrato de Servicio |
| Plan de Mantenimiento Preventivo | Define calendario de visitas recurrentes derivado de un contrato                        | `servicios.plan_mantenimiento` | `servicios.crear` | —                    |

### Acciones

| Acción                                  | Qué hace                                                                    | Permiso               | Efecto/Evento |
| --------------------------------------- | --------------------------------------------------------------------------- | --------------------- | ------------- |
| Generar Órdenes de Servicio Programadas | Crea automáticamente las órdenes del período según el Plan de Mantenimiento | `servicios.confirmar` | —             |
| Renovar/Cancelar Contrato               | Extiende o da de baja un contrato vigente                                   | `servicios.aprobar`   | —             |

## Submenú: Garantías

| Elemento                                 | Detalle                                                          |
| ---------------------------------------- | ---------------------------------------------------------------- |
| Formulario — Garantía de Producto/Equipo | Registra cobertura y vigencia de garantía asociada a una venta   | Tablas: `servicios.garantia` | Permiso: `servicios.crear` |
| Consulta — Vigencia de Garantía          | Qué muestra: si un equipo/producto está bajo garantía a la fecha | Permiso: `servicios.ver`     |

## Submenú: Reportes de Servicios

| Reporte                          | Qué muestra                                      | Filtros principales |
| -------------------------------- | ------------------------------------------------ | ------------------- |
| Órdenes de Servicio por Estado   | Abiertas, asignadas, cerradas, atrasadas         | Técnico, período    |
| Cumplimiento de SLA              | Tiempo de respuesta/resolución real vs. acordado | Contrato, período   |
| Productividad por Técnico        | Órdenes cerradas, tiempo promedio                | Técnico, período    |
| Consumo de Repuestos en Servicio | Repuestos más utilizados en órdenes de servicio  | Período             |

## Submenú: Consultas

| Consulta                                 | Qué muestra                                     | Permiso         |
| ---------------------------------------- | ----------------------------------------------- | --------------- |
| Historial de servicio por equipo/cliente | Todas las órdenes previas sobre un mismo equipo | `servicios.ver` |
| Agenda de Técnico                        | Órdenes asignadas a un técnico por día          | `servicios.ver` |

## Configuraciones del módulo

| Parámetro                                      | Qué controla                                                              |
| ---------------------------------------------- | ------------------------------------------------------------------------- |
| SLA por defecto por tipo de servicio           | Tiempo de respuesta/resolución esperado                                   |
| Requiere aprobación para reabrir orden cerrada | Si reabrir necesita `servicios.aprobar`                                   |
| Factura automáticamente al cerrar orden        | Si el cierre dispara la generación de factura en `ventas` sin paso manual |
