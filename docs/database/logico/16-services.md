# Modelo Lógico — Services (`services`)

Decisión de no-duplicación: la garantía se emite y es dueña de
`sales.warranties` (al momento de la venta); este módulo solo
referencia `warranty_id` cuando el trabajo realizado es por reclamo de
garantía — no existe una segunda tabla de garantías acá.

## Órdenes de servicio

| Tabla                          | Propósito                                                                                | FKs no-universales                                                                                                                              |
| ------------------------------ | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `service_types`                | Tipo de servicio (instalación, mantenimiento preventivo, reparación) con tiempo estándar | `company_id`                                                                                                                                    |
| `service_order_reasons`        | Catálogo de motivos de solicitud                                                         | `company_id`                                                                                                                                    |
| `service_orders`               | Orden de servicio/reparación                                                             | `customer_id → customers.customers`, `equipment_id → equipment`, `service_type_id → service_types`, `warranty_id → sales.warranties` (opcional) |
| `service_order_lines`          | Repuestos/mano de obra facturable de la orden                                            | `service_order_id → service_orders`, `product_id → products.products`                                                                           |
| `service_order_status`         | Catálogo de estados                                                                      | `company_id`                                                                                                                                    |
| `service_order_status_history` | Historial de transición                                                                  | `service_order_id → service_orders`, `status_id → service_order_status`                                                                         |

## Técnicos y equipos

| Tabla                    | Propósito                               | FKs no-universales                                                         |
| ------------------------ | --------------------------------------- | -------------------------------------------------------------------------- |
| `technicians`            | Técnico habilitado para atender órdenes | `employee_id → hr.employees` (ID suelto)                                   |
| `technician_assignments` | Asignación de un técnico a una orden    | `technician_id → technicians`, `service_order_id → service_orders`         |
| `equipment_types`        | Categoría de equipo bajo servicio       | `company_id`                                                               |
| `equipment`              | Equipo/activo del cliente bajo servicio | `customer_id → customers.customers`, `equipment_type_id → equipment_types` |

## Contratos y mantenimiento preventivo

| Tabla                    | Propósito                                                      | FKs no-universales                                                               |
| ------------------------ | -------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `service_contract_types` | Catálogo de tipos de contrato                                  | `company_id`                                                                     |
| `service_contracts`      | Contrato de servicio/SLA con un cliente                        | `customer_id → customers.customers`, `contract_type_id → service_contract_types` |
| `sla_definitions`        | Nivel de servicio acordado (tiempo de respuesta/resolución)    | `contract_id → service_contracts`                                                |
| `maintenance_plans`      | Calendario de mantenimiento preventivo derivado de un contrato | `contract_id → service_contracts`, `equipment_id → equipment`                    |
| `scheduled_maintenances` | Visita programada según el plan                                | `plan_id → maintenance_plans`                                                    |

## Ejecución en campo

| Tabla                    | Propósito                                                         | FKs no-universales                                                    |
| ------------------------ | ----------------------------------------------------------------- | --------------------------------------------------------------------- |
| `service_visits`         | Visita realizada (geolocalización, hora de inicio/fin)            | `service_order_id → service_orders`, `technician_id → technicians`    |
| `service_work_reports`   | Reporte de trabajo del técnico (observaciones, firma del cliente) | `service_visit_id → service_visits`                                   |
| `service_parts_consumed` | Repuesto consumido en la orden, descontado de `inventory.stock`   | `service_order_id → service_orders`, `product_id → products.products` |

**Total: 18 tablas.**
