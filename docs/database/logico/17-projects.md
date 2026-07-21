# Modelo Lógico — Projects (`projects`)

Agrega trabajo de `hr` (horas), `purchases`/`accounting` (costos) y
dispara facturación en `sales` por hito. Las fechas de cronograma viven
directamente en `project_tasks` (sin tabla `project_schedules`
separada — un cronograma es la proyección de las tareas, no un hecho
adicional).

| Tabla                          | Propósito                                                                       | FKs no-universales                                                                                                                                                              |
| ------------------------------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `project_types`                | Catálogo (obra, consultoría, implementación)                                    | `company_id`                                                                                                                                                                    |
| `projects`                     | Proyecto: cliente, fechas, presupuesto, responsable                             | `customer_id → customers.customers`, `project_type_id → project_types`, `manager_user_id → core.users`                                                                          |
| `project_status`               | Catálogo de estados                                                             | `company_id`                                                                                                                                                                    |
| `project_status_history`       | Historial de transición                                                         | `project_id → projects`, `status_id → project_status`                                                                                                                           |
| `project_tasks`                | Tarea/fase del proyecto (WBS, auto-referenciada)                                | `project_id → projects`, `parent_task_id → project_tasks`                                                                                                                       |
| `project_task_dependencies`    | Dependencia entre tareas (predecesora/sucesora)                                 | `task_id → project_tasks`, `depends_on_task_id → project_tasks`                                                                                                                 |
| `project_task_status`          | Catálogo de estados de tarea (pendiente, en curso, hecha)                       | `company_id`                                                                                                                                                                    |
| `project_resource_assignments` | Empleado asignado a una tarea con dedicación estimada y tarifa horaria opcional | `task_id → project_tasks`, `employee_id → hr.employees` (FK real, no ID suelto — corregido, ver [architecture/40-modulo-projects.md](../../architecture/40-modulo-projects.md)) |
| `project_role_rates`           | Tarifa horaria por defecto por rol de costeo                                    | `company_id` (agregada por [architecture/40-modulo-projects.md §3](../../architecture/40-modulo-projects.md#3-recursos-tarifas-y-tareas))                                       |
| `project_budgets`              | Presupuesto por categoría de costo                                              | `project_id → projects`                                                                                                                                                         |
| `project_budget_lines`         | Monto presupuestado por categoría (materiales, mano de obra, terceros)          | `budget_id → project_budgets`                                                                                                                                                   |
| `project_timesheets`           | Horas trabajadas por empleado en una tarea                                      | `task_id → project_tasks`, `employee_id → hr.employees`                                                                                                                         |
| `project_timesheet_status`     | Estado de aprobación de un parte de horas                                       | `company_id`                                                                                                                                                                    |
| `project_costs`                | Gasto/factura de compra asociado a un proyecto y tarea                          | `project_id → projects`, `task_id → project_tasks`, `source_purchase_invoice_id → purchases.purchase_invoices` (FK real, no ID suelto — corregido)                              |
| `project_billing_plans`        | Plan de facturación (por avance, tiempo y materiales, hito fijo)                | `project_id → projects`                                                                                                                                                         |
| `project_billing_milestones`   | Hito de facturación con su factura generada                                     | `billing_plan_id → project_billing_plans`, `invoice_id → sales.invoices` (FK real, no ID suelto — corregido)                                                                    |
| `project_risks`                | Registro de riesgos identificados con probabilidad/impacto                      | `project_id → projects`                                                                                                                                                         |

**Total: 17 tablas** (16 originales + `project_role_rates`).

**Corrección (2026-07-13):** las anotaciones "(ID suelto)" en
`project_resource_assignments.employee_id`,
`project_costs.source_purchase_invoice_id` y
`project_billing_milestones.invoice_id` eran incorrectas — verificado
contra `sql/17_projects.sql`, las tres son constraints `REFERENCES`
reales, no referencias laxas sin FK (a diferencia de, por ejemplo,
`services.technicians.employee_id`, donde "ID suelto" sí es preciso).
También se agregó `projects.cost_center_id →
accounting.cost_centers` y `project_tasks.progress_percentage`, ver
[architecture/40-modulo-projects.md](../../architecture/40-modulo-projects.md).
