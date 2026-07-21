# Modelo Lógico — Reports (`reports`)

Consumidor de solo lectura de proyecciones de todos los módulos — nunca
dueño de datos transaccionales (ver
[04-catalogo-modulos-negocio.md](../../architecture/04-catalogo-modulos-negocio.md#reportes-nunca-es-dueño-de-datos)).

| Tabla                          | Propósito                                                                                          | FKs no-universales                                                              |
| ------------------------------ | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `report_definitions`           | Reporte disponible en el catálogo (origen: módulo, query base)                                     | `company_id`                                                                    |
| `report_templates`             | Plantilla de layout de un reporte (encabezado, pie, formato)                                       | `report_definition_id → report_definitions`                                     |
| `report_template_translations` | Traducción de la plantilla por idioma                                                              | `template_id → report_templates`, `language_code`                               |
| `report_parameters`            | Parámetro configurable del reporte (fecha, sucursal, cliente)                                      | `report_definition_id → report_definitions`                                     |
| `report_executions`            | Ejecución concreta de un reporte (quién, cuándo, con qué parámetros)                               | `report_definition_id → report_definitions`, `executed_by_user_id → core.users` |
| `report_exports`               | Archivo generado de una ejecución (PDF/Excel/CSV)                                                  | `execution_id → report_executions`, `file_id → core.files`                      |
| `report_schedules`             | Programación de ejecución periódica                                                                | `report_definition_id → report_definitions`                                     |
| `report_schedule_recipients`   | Destinatarios de la programación                                                                   | `schedule_id → report_schedules`, `user_id → core.users`                        |
| `report_favorites`             | Reportes marcados como favoritos por un usuario                                                    | `report_definition_id → report_definitions`, `user_id → core.users`             |
| `dashboards`                   | Panel armado por el usuario (distinto del Dashboard de inicio, que es de solo lectura del sistema) | `owner_user_id → core.users`                                                    |
| `dashboard_widgets`            | Widget dentro de un dashboard, con su fuente de datos                                              | `dashboard_id → dashboards`, `report_definition_id → report_definitions`        |

**Total: 11 tablas.**
