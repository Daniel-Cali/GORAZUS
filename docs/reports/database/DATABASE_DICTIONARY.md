# Diccionario de Datos — GORAZUS

> **Nota de alcance (2026-07-25, Database Finalization)**: este archivo tiene dos contenidos
> complementarios, no uno solo. §§1-8 de abajo son el **estándar de nomenclatura en español
> propuesto** (Database Refactor Fase 01, diseño sin ejecutar — ver `DATABASE_SPANISH_STANDARD.md`).
> El **diccionario de datos estructural real** (columna por columna, tipo, nullable, default, PK,
> FK — con los nombres **actuales** en inglés, la base tal como está hoy en producción) vive en
> `docs/database/dictionary/*.md` (21 archivos, uno por schema), generado desde
> `information_schema` contra Postgres real — cada uno de esos 21 archivos referencia a este mismo
> archivo para "metodología", una referencia que ya existía antes de la Fase de Estandarización en
> Español y que este archivo no explicaba — corregido acá: la metodología es introspección directa
> de `information_schema.columns`/`table_constraints`/`key_column_usage`, sin inferencia ni
> documentación de por medio, la misma que se usó para las nuevas entradas del §9.
>
> ## 9. Actualización — Database Finalization (2026-07-25)
>
> La migración `docs/database/sql/35_functional_completion.sql` agregó 2 tablas y 10 columnas
> nuevas — reflejadas en los diccionarios estructurales reales
> (`docs/database/dictionary/01-core.md`, `04-suppliers.md`, `05-products.md`, `06-inventory.md`)
> y resumidas en `DATABASE_COMPLETION_REPORT.md`. El estándar de nomenclatura en español de §§1-8
> de abajo **no se actualizó automáticamente** con estos objetos nuevos — quedan en inglés hasta
> que se retome esa fase de diseño; ver `DATABASE_COMPLETION_REPORT.md §6` para el detalle exacto.

## 1. Esquemas (21 de negocio + `partman` + `public`)

| Esquema actual  | Esquema propuesto                                             | Tablas |
| --------------- | ------------------------------------------------------------- | :----: |
| `accounting`    | `contabilidad`                                                |   28   |
| `assets`        | `activos`                                                     |   10   |
| `banks`         | `bancos`                                                      |   14   |
| `bi`            | `bi` (se mantiene — sigla ya universal)                       |   14   |
| `cash`          | `caja`                                                        |   11   |
| `configuration` | `configuracion`                                               |   23   |
| `core`          | `nucleo`                                                      |   69   |
| `crm`           | `crm` (se mantiene — sigla ya universal)                      |   17   |
| `customers`     | `clientes`                                                    |   18   |
| `hr`            | `rrhh`                                                        |   28   |
| `inventory`     | `inventario`                                                  |   34   |
| `payroll`       | `nomina`                                                      |   22   |
| `products`      | `productos`                                                   |   35   |
| `projects`      | `proyectos`                                                   |   17   |
| `purchases`     | `compras`                                                     |   27   |
| `reports`       | `reportes`                                                    |   11   |
| `sales`         | `ventas`                                                      |   55   |
| `security`      | `seguridad`                                                   |   24   |
| `services`      | `servicios`                                                   |   18   |
| `suppliers`     | `proveedores`                                                 |   13   |
| `taxes`         | `impuestos`                                                   |   13   |
| `partman`       | _(no se toca — infraestructura de la extensión `pg_partman`)_ |   —    |
| `public`        | _(no se toca — esquema por defecto de PostgreSQL)_            |   —    |

## 2. Columnas de `BaseEntity` (17 columnas × 501 tablas = 8.517 de las 10.153 columnas reales)

| Inglés (actual) | Español (propuesto)   |
| --------------- | --------------------- |
| `id`            | `id`                  |
| `local_id`      | `id_local`            |
| `tenant_id`     | `inquilino_id`        |
| `company_id`    | `empresa_id`          |
| `branch_id`     | `sucursal_id`         |
| `created_at`    | `fecha_creacion`      |
| `updated_at`    | `fecha_actualizacion` |
| `deleted_at`    | `fecha_eliminacion`   |
| `created_by`    | `creado_por`          |
| `updated_by`    | `actualizado_por`     |
| `deleted_by`    | `eliminado_por`       |
| `version`       | `version`             |
| `row_version`   | `version_fila`        |
| `is_active`     | `esta_activo`         |
| `is_deleted`    | `esta_eliminado`      |
| `observations`  | `observaciones`       |
| `metadata`      | `metadatos`           |

## 3. Tablas — las 501, completas, por esquema

### accounting → contabilidad — 28 tablas

| Inglés (actual)                       | Español (propuesto)                       |
| ------------------------------------- | ----------------------------------------- |
| `account_reconciliations`             | `conciliaciones_de_cuenta`                |
| `account_types`                       | `tipos_de_cuenta`                         |
| `accounting_dimension_values`         | `valores_de_dimension_contable`           |
| `accounting_dimensions`               | `dimensiones_contables`                   |
| `accounting_rule_lines`               | `lineas_de_regla_contable`                |
| `accounting_rules`                    | `reglas_contables`                        |
| `balance_sheet_snapshots`             | `instantaneas_de_balance_general`         |
| `budget_lines`                        | `lineas_de_presupuesto`                   |
| `budgets`                             | `presupuestos`                            |
| `cash_flow_snapshots`                 | `instantaneas_de_flujo_de_caja`           |
| `chart_of_accounts`                   | `plan_de_cuentas`                         |
| `consolidated_financial_snapshots`    | `instantaneas_financieras_consolidadas`   |
| `cost_centers`                        | `centros_de_costo`                        |
| `currency_revaluations`               | `revaluaciones_de_moneda`                 |
| `fiscal_periods`                      | `periodos_fiscales`                       |
| `fiscal_years`                        | `ejercicios_fiscales`                     |
| `ifrs_adjustments`                    | `ajustes_niif`                            |
| `income_statement_snapshots`          | `instantaneas_de_estado_de_resultados`    |
| `intercompany_transactions`           | `transacciones_entre_empresas`            |
| `journal_entries`                     | `asientos_contables`                      |
| `journal_entry_dimension_values`      | `valores_de_dimension_de_asiento`         |
| `journal_entry_lines`                 | `lineas_de_asiento_contable`              |
| `journal_entry_status`                | `estados_de_asiento_contable`             |
| `journal_entry_status_history`        | `historial_de_estado_de_asiento_contable` |
| `period_closing_logs`                 | `registros_de_cierre_de_periodo`          |
| `profit_centers`                      | `centros_de_utilidad`                     |
| `recurring_journal_entry_generations` | `generaciones_de_asiento_recurrente`      |
| `recurring_journal_entry_templates`   | `plantillas_de_asiento_recurrente`        |

### assets → activos — 10 tablas

| Inglés (actual)              | Español (propuesto)                  |
| ---------------------------- | ------------------------------------ |
| `asset_categories`           | `categorias_de_activo`               |
| `asset_custodian_history`    | `historial_de_custodio_de_activo`    |
| `asset_depreciation_entries` | `entradas_de_depreciacion_de_activo` |
| `asset_disposals`            | `bajas_de_activo`                    |
| `asset_maintenance_types`    | `tipos_de_mantenimiento_de_activo`   |
| `asset_maintenances`         | `mantenimientos_de_activo`           |
| `asset_revaluations`         | `revaluaciones_de_activo`            |
| `asset_transfers`            | `transferencias_de_activo`           |
| `depreciation_methods`       | `metodos_de_depreciacion`            |
| `fixed_assets`               | `activos_fijos`                      |

### banks → bancos — 14 tablas

| Inglés (actual)             | Español (propuesto)               |
| --------------------------- | --------------------------------- |
| `bank_accounts`             | `cuentas_bancarias`               |
| `bank_cards`                | `tarjetas_bancarias`              |
| `bank_deposits`             | `depositos_bancarios`             |
| `bank_payment_batch_lines`  | `lineas_de_lote_de_pago_bancario` |
| `bank_payment_batches`      | `lotes_de_pago_bancario`          |
| `bank_pos_terminals`        | `terminales_pos_bancarios`        |
| `bank_reconciliation_lines` | `lineas_de_conciliacion_bancaria` |
| `bank_reconciliations`      | `conciliaciones_bancarias`        |
| `bank_statement_lines`      | `lineas_de_extracto_bancario`     |
| `bank_statements`           | `extractos_bancarios`             |
| `bank_transfers`            | `transferencias_bancarias`        |
| `checkbooks`                | `chequeras`                       |
| `checks_issued`             | `cheques_emitidos`                |
| `checks_received`           | `cheques_recibidos`               |

### bi (se mantiene) — 14 tablas

| Inglés (actual)        | Español (propuesto)            |
| ---------------------- | ------------------------------ |
| `bi_alert_triggers`    | `disparadores_de_alerta_bi`    |
| `bi_alerts`            | `alertas_bi`                   |
| `data_cube_dimensions` | `dimensiones_de_cubo_de_datos` |
| `data_cube_measures`   | `medidas_de_cubo_de_datos`     |
| `data_cubes`           | `cubos_de_datos`               |
| `data_mart_tables`     | `tablas_de_datamart`           |
| `forecast_models`      | `modelos_de_pronostico`        |
| `forecasts`            | `pronosticos`                  |
| `indicator_snapshots`  | `instantaneas_de_indicador`    |
| `indicators`           | `indicadores`                  |
| `kpi_snapshots`        | `instantaneas_de_kpi`          |
| `kpis`                 | `kpis`                         |
| `metric_snapshots`     | `instantaneas_de_metrica`      |
| `metrics`              | `metricas`                     |

### cash → caja — 11 tablas

| Inglés (actual)          | Español (propuesto)           |
| ------------------------ | ----------------------------- |
| `cash_count_lines`       | `lineas_de_arqueo_de_caja`    |
| `cash_counts`            | `arqueos_de_caja`             |
| `cash_movement_types`    | `tipos_de_movimiento_de_caja` |
| `cash_movements`         | `movimientos_de_caja`         |
| `cash_refunds`           | `reembolsos_de_caja`          |
| `cash_register_closings` | `cierres_de_caja`             |
| `cash_register_openings` | `aperturas_de_caja`           |
| `cash_registers`         | `cajas`                       |
| `cash_transfers`         | `transferencias_de_caja`      |
| `petty_cash_funds`       | `fondos_de_caja_chica`        |
| `petty_cash_vouchers`    | `vales_de_caja_chica`         |

### configuration → configuracion — 23 tablas

| Inglés (actual)               | Español (propuesto)               |
| ----------------------------- | --------------------------------- |
| `banks`                       | `bancos`                          |
| `correlatives`                | `correlativos`                    |
| `countries`                   | `paises`                          |
| `country_translations`        | `traducciones_de_pais`            |
| `currencies`                  | `monedas`                         |
| `currency_translations`       | `traducciones_de_moneda`          |
| `document_number_formats`     | `formatos_de_numero_de_documento` |
| `exchange_rate_types`         | `tipos_de_tasa_de_cambio`         |
| `exchange_rates`              | `tasas_de_cambio`                 |
| `fiscal_document_types`       | `tipos_de_documento_fiscal`       |
| `fiscal_regimes`              | `regimenes_fiscales`              |
| `holidays`                    | `feriados`                        |
| `languages`                   | `idiomas`                         |
| `municipalities`              | `municipios`                      |
| `numbering_series`            | `series_de_numeracion`            |
| `payment_forms`               | `formas_de_pago`                  |
| `payment_methods`             | `metodos_de_pago`                 |
| `price_list_items`            | `items_de_lista_de_precios`       |
| `price_lists`                 | `listas_de_precios`               |
| `sectors`                     | `sectores`                        |
| `state_province_translations` | `traducciones_de_provincia`       |
| `state_provinces`             | `provincias`                      |
| `timezones`                   | `zonas_horarias`                  |

### core → nucleo — 69 tablas

| Inglés (actual)                      | Español (propuesto)                           |
| ------------------------------------ | --------------------------------------------- |
| `activity_logs`                      | `registros_de_actividad`                      |
| `api_key_scopes`                     | `alcances_de_clave_de_api`                    |
| `api_keys`                           | `claves_de_api`                               |
| `approval_matrices`                  | `matrices_de_aprobacion`                      |
| `approval_steps`                     | `pasos_de_aprobacion`                         |
| `approvals`                          | `aprobaciones`                                |
| `audit_logs`                         | `registros_de_auditoria`                      |
| `background_jobs`                    | `trabajos_en_segundo_plano`                   |
| `branches`                           | `sucursales`                                  |
| `business_rule_evaluations`          | `evaluaciones_de_regla_de_negocio`            |
| `business_rules`                     | `reglas_de_negocio`                           |
| `change_history`                     | `historial_de_cambios`                        |
| `comments`                           | `comentarios`                                 |
| `companies`                          | `empresas`                                    |
| `consent_records`                    | `registros_de_consentimiento`                 |
| `data_retention_policies`            | `politicas_de_retencion_de_datos`             |
| `data_subject_requests`              | `solicitudes_de_titular_de_datos`             |
| `departments`                        | `departamentos`                               |
| `document_types`                     | `tipos_de_documento`                          |
| `document_versions`                  | `versiones_de_documento`                      |
| `documents`                          | `documentos`                                  |
| `edi_transactions`                   | `transacciones_edi`                           |
| `entity_tags`                        | `etiquetas_de_entidad`                        |
| `export_batches`                     | `lotes_de_exportacion`                        |
| `feature_flags`                      | `banderas_de_funcionalidad`                   |
| `files`                              | `archivos`                                    |
| `group_members`                      | `miembros_de_grupo`                           |
| `groups`                             | `grupos`                                      |
| `import_batch_errors`                | `errores_de_lote_de_importacion`              |
| `import_batches`                     | `lotes_de_importacion`                        |
| `integration_credentials`            | `credenciales_de_integracion`                 |
| `integrations`                       | `integraciones`                               |
| `notification_channels`              | `canales_de_notificacion`                     |
| `notification_delivery_logs`         | `registros_de_envio_de_notificacion`          |
| `notification_preferences`           | `preferencias_de_notificacion`                |
| `notification_recipients`            | `destinatarios_de_notificacion`               |
| `notification_template_translations` | `traducciones_de_plantilla_de_notificacion`   |
| `notification_templates`             | `plantillas_de_notificacion`                  |
| `notifications`                      | `notificaciones`                              |
| `permissions`                        | `permisos`                                    |
| `restore_test_logs`                  | `registros_de_prueba_de_restauracion`         |
| `role_permissions`                   | `permisos_de_rol`                             |
| `roles`                              | `roles`                                       |
| `scheduled_job_runs`                 | `ejecuciones_de_trabajo_programado`           |
| `scheduled_jobs`                     | `trabajos_programados`                        |
| `sessions`                           | `sesiones`                                    |
| `signature_requests`                 | `solicitudes_de_firma`                        |
| `signatures`                         | `firmas`                                      |
| `system_logs`                        | `registros_de_sistema`                        |
| `system_parameters`                  | `parametros_de_sistema`                       |
| `system_settings`                    | `configuraciones_de_sistema`                  |
| `tags`                               | `etiquetas`                                   |
| `template_translations`              | `traducciones_de_plantilla`                   |
| `templates`                          | `plantillas`                                  |
| `tenant_subscription_features`       | `funcionalidades_de_suscripcion_de_inquilino` |
| `tenant_subscriptions`               | `suscripciones_de_inquilino`                  |
| `tenants`                            | `inquilinos`                                  |
| `tokens`                             | `tokens`                                      |
| `user_companies`                     | `empresas_de_usuario`                         |
| `user_devices`                       | `dispositivos_de_usuario`                     |
| `user_profiles`                      | `perfiles_de_usuario`                         |
| `user_roles`                         | `roles_de_usuario`                            |
| `users`                              | `usuarios`                                    |
| `webhook_delivery_logs`              | `registros_de_envio_de_webhook`               |
| `webhook_subscriptions`              | `suscripciones_de_webhook`                    |
| `workflow_instance_steps`            | `pasos_de_instancia_de_flujo`                 |
| `workflow_instances`                 | `instancias_de_flujo`                         |
| `workflow_steps`                     | `pasos_de_flujo`                              |
| `workflows`                          | `flujos_de_trabajo`                           |

### crm (se mantiene) — 17 tablas

| Inglés (actual)            | Español (propuesto)                  |
| -------------------------- | ------------------------------------ |
| `calendar_event_attendees` | `asistentes_de_evento_de_calendario` |
| `calendar_events`          | `eventos_de_calendario`              |
| `call_logs`                | `registros_de_llamada`               |
| `campaign_members`         | `miembros_de_campana`                |
| `campaigns`                | `campanas`                           |
| `email_logs`               | `registros_de_correo`                |
| `follow_up_activities`     | `actividades_de_seguimiento`         |
| `lead_sources`             | `fuentes_de_prospecto`               |
| `lead_status`              | `estados_de_prospecto`               |
| `lead_status_history`      | `historial_de_estado_de_prospecto`   |
| `leads`                    | `prospectos`                         |
| `opportunities`            | `oportunidades`                      |
| `opportunity_lines`        | `lineas_de_oportunidad`              |
| `opportunity_loss_reasons` | `motivos_de_perdida_de_oportunidad`  |
| `sales_funnel_stages`      | `etapas_de_embudo_de_ventas`         |
| `sales_funnels`            | `embudos_de_ventas`                  |
| `whatsapp_logs`            | `registros_de_whatsapp`              |

### customers → clientes — 18 tablas

| Inglés (actual)                 | Español (propuesto)                         |
| ------------------------------- | ------------------------------------------- |
| `customer_addresses`            | `direcciones_de_cliente`                    |
| `customer_bank_accounts`        | `cuentas_bancarias_de_cliente`              |
| `customer_block_history`        | `historial_de_bloqueo_de_cliente`           |
| `customer_categories`           | `categorias_de_cliente`                     |
| `customer_classifications`      | `clasificaciones_de_cliente`                |
| `customer_contacts`             | `contactos_de_cliente`                      |
| `customer_credit_limit_history` | `historial_de_limite_de_credito_de_cliente` |
| `customer_credit_profiles`      | `perfiles_de_credito_de_cliente`            |
| `customer_discounts`            | `descuentos_de_cliente`                     |
| `customer_loyalty_accounts`     | `cuentas_de_fidelidad_de_cliente`           |
| `customer_price_lists`          | `listas_de_precios_de_cliente`              |
| `customer_references`           | `referencias_de_cliente`                    |
| `customer_statements`           | `estados_de_cuenta_de_cliente`              |
| `customer_visits`               | `visitas_de_cliente`                        |
| `customer_wishlist_items`       | `items_de_lista_de_deseos_de_cliente`       |
| `customers`                     | `clientes`                                  |
| `sales_route_customers`         | `clientes_de_ruta_de_venta`                 |
| `sales_routes`                  | `rutas_de_venta`                            |

### hr → rrhh — 28 tablas

| Inglés (actual)                   | Español (propuesto)                            |
| --------------------------------- | ---------------------------------------------- |
| `attendance_devices`              | `dispositivos_de_asistencia`                   |
| `attendance_records`              | `registros_de_asistencia`                      |
| `candidate_stage_history`         | `historial_de_etapa_de_candidato`              |
| `candidate_stages`                | `etapas_de_candidato`                          |
| `candidates`                      | `candidatos`                                   |
| `contract_types`                  | `tipos_de_contrato`                            |
| `disciplinary_action_types`       | `tipos_de_accion_disciplinaria`                |
| `disciplinary_actions`            | `acciones_disciplinarias`                      |
| `employee_asset_assignments`      | `asignaciones_de_activo_a_empleado`            |
| `employee_bank_accounts`          | `cuentas_bancarias_de_empleado`                |
| `employee_contracts`              | `contratos_de_empleado`                        |
| `employee_dependents`             | `dependientes_de_empleado`                     |
| `employee_emergency_contacts`     | `contactos_de_emergencia_de_empleado`          |
| `employee_skills`                 | `habilidades_de_empleado`                      |
| `employees`                       | `empleados`                                    |
| `job_positions`                   | `puestos_de_trabajo`                           |
| `job_vacancies`                   | `vacantes_de_trabajo`                          |
| `leave_request_status`            | `estados_de_solicitud_de_licencia`             |
| `leave_request_status_history`    | `historial_de_estado_de_solicitud_de_licencia` |
| `leave_requests`                  | `solicitudes_de_licencia`                      |
| `leave_types`                     | `tipos_de_licencia`                            |
| `performance_evaluation_criteria` | `criterios_de_evaluacion_de_desempeno`         |
| `performance_evaluation_scores`   | `puntajes_de_evaluacion_de_desempeno`          |
| `performance_evaluations`         | `evaluaciones_de_desempeno`                    |
| `skills_catalog`                  | `catalogo_de_habilidades`                      |
| `training_enrollments`            | `inscripciones_a_capacitacion`                 |
| `trainings`                       | `capacitaciones`                               |
| `vacation_balances`               | `saldos_de_vacaciones`                         |

### inventory → inventario — 34 tablas

| Inglés (actual)                   | Español (propuesto)                          |
| --------------------------------- | -------------------------------------------- |
| `average_cost_history`            | `historial_de_costo_promedio`                |
| `cycle_count_schedules`           | `programaciones_de_conteo_ciclico`           |
| `fifo_cost_layers`                | `capas_de_costo_fifo`                        |
| `goods_issue_lines`               | `lineas_de_salida_de_mercaderia`             |
| `goods_issue_reasons`             | `motivos_de_salida_de_mercaderia`            |
| `goods_issues`                    | `salidas_de_mercaderia`                      |
| `goods_receipt_lines`             | `lineas_de_recepcion_de_mercaderia`          |
| `goods_receipts`                  | `recepciones_de_mercaderia`                  |
| `inventory_lots`                  | `lotes_de_inventario`                        |
| `inventory_serials`               | `series_de_inventario`                       |
| `lifo_cost_layers`                | `capas_de_costo_lifo`                        |
| `physical_count_lines`            | `lineas_de_conteo_fisico`                    |
| `physical_counts`                 | `conteos_fisicos`                            |
| `picking_rules`                   | `reglas_de_picking`                          |
| `production_consumptions`         | `consumos_de_produccion`                     |
| `production_order_components`     | `componentes_de_orden_de_produccion`         |
| `production_order_outputs`        | `salidas_de_orden_de_produccion`             |
| `production_order_status`         | `estados_de_orden_de_produccion`             |
| `production_order_status_history` | `historial_de_estado_de_orden_de_produccion` |
| `production_orders`               | `ordenes_de_produccion`                      |
| `putaway_rules`                   | `reglas_de_ubicacion`                        |
| `replenishment_rules`             | `reglas_de_reposicion`                       |
| `stock`                           | `stock`                                      |
| `stock_adjustment_lines`          | `lineas_de_ajuste_de_stock`                  |
| `stock_adjustment_reasons`        | `motivos_de_ajuste_de_stock`                 |
| `stock_adjustments`               | `ajustes_de_stock`                           |
| `stock_movement_types`            | `tipos_de_movimiento_inventario`             |
| `stock_movements`                 | `movimientos_inventario`                     |
| `stock_reservations`              | `reservas_de_stock`                          |
| `stock_transfer_lines`            | `lineas_de_transferencia_de_stock`           |
| `stock_transfers`                 | `transferencias_de_stock`                    |
| `warehouse_locations`             | `ubicaciones_de_almacen`                     |
| `warehouse_zones`                 | `zonas_de_almacen`                           |
| `warehouses`                      | `almacenes`                                  |

### payroll → nomina — 22 tablas

| Inglés (actual)                 | Español (propuesto)                        |
| ------------------------------- | ------------------------------------------ |
| `concept_types`                 | `tipos_de_concepto`                        |
| `deductions`                    | `deducciones`                              |
| `employee_benefit_assignments`  | `asignaciones_de_beneficio_a_empleado`     |
| `employee_benefits`             | `beneficios_de_empleado`                   |
| `loan_installments`             | `cuotas_de_prestamo`                       |
| `loans`                         | `prestamos`                                |
| `overtime_records`              | `registros_de_horas_extra`                 |
| `payroll_commission_entries`    | `entradas_de_comision_de_nomina`           |
| `payroll_concepts`              | `conceptos_de_nomina`                      |
| `payroll_entries`               | `entradas_de_nomina`                       |
| `payroll_entry_lines`           | `lineas_de_entrada_de_nomina`              |
| `payroll_novelties`             | `novedades_de_nomina`                      |
| `payroll_periods`               | `periodos_de_nomina`                       |
| `payroll_run_status`            | `estados_de_corrida_de_nomina`             |
| `payroll_run_status_history`    | `historial_de_estado_de_corrida_de_nomina` |
| `payroll_runs`                  | `corridas_de_nomina`                       |
| `salary_structure_concepts`     | `conceptos_de_estructura_salarial`         |
| `salary_structures`             | `estructuras_salariales`                   |
| `severance_calculations`        | `calculos_de_indemnizacion`                |
| `social_security_tables`        | `tablas_de_seguridad_social`               |
| `tax_withholding_tables`        | `tablas_de_retencion_de_impuestos`         |
| `thirteenth_month_calculations` | `calculos_de_aguinaldo`                    |

### products → productos — 35 tablas

| Inglés (actual)                        | Español (propuesto)                             |
| -------------------------------------- | ----------------------------------------------- |
| `bill_of_materials`                    | `listas_de_materiales`                          |
| `bom_components`                       | `componentes_de_lista_de_materiales`            |
| `brand_translations`                   | `traducciones_de_marca`                         |
| `brands`                               | `marcas`                                        |
| `product_attribute_translations`       | `traducciones_de_atributo_de_producto`          |
| `product_attribute_value_translations` | `traducciones_de_valor_de_atributo_de_producto` |
| `product_attribute_values`             | `valores_de_atributo_de_producto`               |
| `product_attributes`                   | `atributos_de_producto`                         |
| `product_barcodes`                     | `codigos_de_barra_de_producto`                  |
| `product_categories`                   | `categorias_de_producto`                        |
| `product_category_translations`        | `traducciones_de_categoria_de_producto`         |
| `product_collections`                  | `colecciones_de_producto`                       |
| `product_combo_components`             | `componentes_de_combo_de_producto`              |
| `product_combos`                       | `combos_de_producto`                            |
| `product_families`                     | `familias_de_producto`                          |
| `product_images`                       | `imagenes_de_producto`                          |
| `product_kit_components`               | `componentes_de_kit_de_producto`                |
| `product_kits`                         | `kits_de_producto`                              |
| `product_lines`                        | `lineas_de_producto`                            |
| `product_models`                       | `modelos_de_producto`                           |
| `product_presentations`                | `presentaciones_de_producto`                    |
| `product_price_history`                | `historial_de_precio_de_producto`               |
| `product_related_products`             | `productos_relacionados`                        |
| `product_reviews`                      | `resenas_de_producto`                           |
| `product_suppliers`                    | `proveedores_de_producto`                       |
| `product_tax_profiles`                 | `perfiles_fiscales_de_producto`                 |
| `product_translations`                 | `traducciones_de_producto`                      |
| `product_variant_attribute_values`     | `valores_de_atributo_de_variante_de_producto`   |
| `product_videos`                       | `videos_de_producto`                            |
| `products`                             | `productos`                                     |
| `recipe_ingredients`                   | `ingredientes_de_receta`                        |
| `recipes`                              | `recetas`                                       |
| `unit_conversions`                     | `conversiones_de_unidad`                        |
| `unit_of_measure_translations`         | `traducciones_de_unidad_de_medida`              |
| `units_of_measure`                     | `unidades_de_medida`                            |

### projects → proyectos — 17 tablas

| Inglés (actual)                | Español (propuesto)                   |
| ------------------------------ | ------------------------------------- |
| `project_billing_milestones`   | `hitos_de_facturacion_de_proyecto`    |
| `project_billing_plans`        | `planes_de_facturacion_de_proyecto`   |
| `project_budget_lines`         | `lineas_de_presupuesto_de_proyecto`   |
| `project_budgets`              | `presupuestos_de_proyecto`            |
| `project_costs`                | `costos_de_proyecto`                  |
| `project_resource_assignments` | `asignaciones_de_recurso_de_proyecto` |
| `project_risks`                | `riesgos_de_proyecto`                 |
| `project_role_rates`           | `tarifas_de_rol_de_proyecto`          |
| `project_status`               | `estados_de_proyecto`                 |
| `project_status_history`       | `historial_de_estado_de_proyecto`     |
| `project_task_dependencies`    | `dependencias_de_tarea_de_proyecto`   |
| `project_task_status`          | `estados_de_tarea_de_proyecto`        |
| `project_tasks`                | `tareas_de_proyecto`                  |
| `project_timesheet_status`     | `estados_de_parte_de_horas`           |
| `project_timesheets`           | `partes_de_horas_de_proyecto`         |
| `project_types`                | `tipos_de_proyecto`                   |
| `projects`                     | `proyectos`                           |

### purchases → compras — 27 tablas

| Inglés (actual)                       | Español (propuesto)                            |
| ------------------------------------- | ---------------------------------------------- |
| `goods_receipt_note_lines`            | `lineas_de_nota_de_recepcion`                  |
| `goods_receipt_notes`                 | `notas_de_recepcion`                           |
| `import_expenses`                     | `gastos_de_importacion`                        |
| `import_status`                       | `estados_de_importacion`                       |
| `import_status_history`               | `historial_de_estado_de_importacion`           |
| `imports`                             | `importaciones`                                |
| `purchase_credit_note_lines`          | `lineas_de_nota_de_credito_de_compra`          |
| `purchase_credit_notes`               | `notas_de_credito_de_compra`                   |
| `purchase_expenses`                   | `gastos_de_compra`                             |
| `purchase_invoice_lines`              | `lineas_de_factura_de_compra`                  |
| `purchase_invoice_matching`           | `conciliacion_de_factura_de_compra`            |
| `purchase_invoice_status`             | `estados_de_factura_de_compra`                 |
| `purchase_invoice_status_history`     | `historial_de_estado_de_factura_de_compra`     |
| `purchase_invoices`                   | `facturas_de_compra`                           |
| `purchase_order_lines`                | `lineas_de_orden_de_compra`                    |
| `purchase_order_status`               | `estados_de_orden_de_compra`                   |
| `purchase_order_status_history`       | `historial_de_estado_de_orden_de_compra`       |
| `purchase_orders`                     | `ordenes_de_compra`                            |
| `purchase_quote_lines`                | `lineas_de_cotizacion_de_compra`               |
| `purchase_quotes`                     | `cotizaciones_de_compra`                       |
| `purchase_requisition_lines`          | `lineas_de_requisicion_de_compra`              |
| `purchase_requisition_status`         | `estados_de_requisicion_de_compra`             |
| `purchase_requisition_status_history` | `historial_de_estado_de_requisicion_de_compra` |
| `purchase_requisitions`               | `requisiciones_de_compra`                      |
| `purchase_return_lines`               | `lineas_de_devolucion_de_compra`               |
| `purchase_returns`                    | `devoluciones_de_compra`                       |
| `purchase_withholdings`               | `retenciones_de_compra`                        |

### reports → reportes — 11 tablas

| Inglés (actual)                | Español (propuesto)                        |
| ------------------------------ | ------------------------------------------ |
| `dashboard_widgets`            | `widgets_de_panel`                         |
| `dashboards`                   | `paneles`                                  |
| `report_definitions`           | `definiciones_de_reporte`                  |
| `report_executions`            | `ejecuciones_de_reporte`                   |
| `report_exports`               | `exportaciones_de_reporte`                 |
| `report_favorites`             | `reportes_favoritos`                       |
| `report_parameters`            | `parametros_de_reporte`                    |
| `report_schedule_recipients`   | `destinatarios_de_programacion_de_reporte` |
| `report_schedules`             | `programaciones_de_reporte`                |
| `report_template_translations` | `traducciones_de_plantilla_de_reporte`     |
| `report_templates`             | `plantillas_de_reporte`                    |

### sales → ventas — 55 tablas

| Inglés (actual)               | Español (propuesto)                      |
| ----------------------------- | ---------------------------------------- |
| `commission_entries`          | `entradas_de_comision`                   |
| `commission_rules`            | `reglas_de_comision`                     |
| `coupon_redemptions`          | `canjes_de_cupon`                        |
| `coupons`                     | `cupones`                                |
| `credit_note_lines`           | `lineas_de_nota_de_credito`              |
| `credit_notes`                | `notas_de_credito`                       |
| `debit_note_lines`            | `lineas_de_nota_de_debito`               |
| `debit_notes`                 | `notas_de_debito`                        |
| `delivery_note_lines`         | `lineas_de_remito`                       |
| `delivery_notes`              | `remitos`                                |
| `discounts`                   | `descuentos`                             |
| `electronic_invoice_logs`     | `registros_de_factura_electronica`       |
| `gift_card_transactions`      | `transacciones_de_tarjeta_de_regalo`     |
| `gift_cards`                  | `tarjetas_de_regalo`                     |
| `invoice_lines`               | `lineas_de_factura`                      |
| `invoice_status`              | `estados_de_factura`                     |
| `invoice_status_history`      | `historial_de_estado_de_factura`         |
| `invoices`                    | `facturas`                               |
| `layaway_lines`               | `lineas_de_apartado`                     |
| `layaway_payments`            | `pagos_de_apartado`                      |
| `layaways`                    | `apartados`                              |
| `loyalty_points_transactions` | `transacciones_de_puntos_de_fidelidad`   |
| `loyalty_program_tiers`       | `niveles_de_programa_de_fidelidad`       |
| `loyalty_programs`            | `programas_de_fidelidad`                 |
| `online_store_configs`        | `configuraciones_de_tienda_en_linea`     |
| `promotion_rules`             | `reglas_de_promocion`                    |
| `promotions`                  | `promociones`                            |
| `quote_lines`                 | `lineas_de_cotizacion`                   |
| `quote_status`                | `estados_de_cotizacion`                  |
| `quote_status_history`        | `historial_de_estado_de_cotizacion`      |
| `quotes`                      | `cotizaciones`                           |
| `receipt_allocations`         | `aplicaciones_de_recibo`                 |
| `receipts`                    | `recibos`                                |
| `recurring_sale_generations`  | `generaciones_de_venta_recurrente`       |
| `recurring_sale_templates`    | `plantillas_de_venta_recurrente`         |
| `sales_contract_lines`        | `lineas_de_contrato_de_venta`            |
| `sales_contracts`             | `contratos_de_venta`                     |
| `sales_order_lines`           | `lineas_de_pedido_de_venta`              |
| `sales_order_status`          | `estados_de_pedido_de_venta`             |
| `sales_order_status_history`  | `historial_de_estado_de_pedido_de_venta` |
| `sales_orders`                | `pedidos_de_venta`                       |
| `sales_return_lines`          | `lineas_de_devolucion_de_venta`          |
| `sales_returns`               | `devoluciones_de_venta`                  |
| `sales_targets`               | `metas_de_venta`                         |
| `sales_team_members`          | `miembros_de_equipo_de_venta`            |
| `sales_teams`                 | `equipos_de_venta`                       |
| `sales_territories`           | `territorios_de_venta`                   |
| `salespeople`                 | `vendedores`                             |
| `shopping_cart_items`         | `items_de_carrito_de_compra`             |
| `shopping_carts`              | `carritos_de_compra`                     |
| `subscription_billing_cycles` | `ciclos_de_facturacion_de_suscripcion`   |
| `subscription_lines`          | `lineas_de_suscripcion`                  |
| `subscriptions`               | `suscripciones`                          |
| `warranties`                  | `garantias`                              |
| `warranty_claims`             | `reclamos_de_garantia`                   |

### security → seguridad — 24 tablas

| Inglés (actual)            | Español (propuesto)                      |
| -------------------------- | ---------------------------------------- |
| `access_control_lists`     | `listas_de_control_de_acceso`            |
| `acl_entries`              | `entradas_de_lista_de_control_de_acceso` |
| `api_key_rate_limits`      | `limites_de_tasa_de_clave_de_api`        |
| `data_encryption_keys`     | `claves_de_encriptacion_de_datos`        |
| `encryption_key_rotations` | `rotaciones_de_clave_de_encriptacion`    |
| `ip_allowlist_entries`     | `entradas_de_lista_blanca_de_ip`         |
| `ip_denylist_entries`      | `entradas_de_lista_negra_de_ip`          |
| `login_attempts`           | `intentos_de_login`                      |
| `oauth_client_scopes`      | `alcances_de_aplicacion_cliente_oauth`   |
| `oauth_clients`            | `aplicaciones_cliente_oauth`             |
| `oauth_scopes`             | `alcances_oauth`                         |
| `oauth_tokens`             | `tokens_oauth`                           |
| `password_history`         | `historial_de_contrasena`                |
| `password_policies`        | `politicas_de_contrasena`                |
| `permission_delegations`   | `delegaciones_de_permiso`                |
| `security_audit_logs`      | `registros_de_auditoria_de_seguridad`    |
| `security_incident_events` | `eventos_de_incidente_de_seguridad`      |
| `security_incidents`       | `incidentes_de_seguridad`                |
| `security_policies`        | `politicas_de_seguridad`                 |
| `session_activity_logs`    | `registros_de_actividad_de_sesion`       |
| `trusted_devices`          | `dispositivos_de_confianza`              |
| `two_factor_backup_codes`  | `codigos_de_respaldo_de_doble_factor`    |
| `two_factor_challenges`    | `desafios_de_doble_factor`               |
| `two_factor_credentials`   | `credenciales_de_doble_factor`           |

### services → servicios — 18 tablas

| Inglés (actual)                | Español (propuesto)                        |
| ------------------------------ | ------------------------------------------ |
| `equipment`                    | `equipos`                                  |
| `equipment_types`              | `tipos_de_equipo`                          |
| `maintenance_plans`            | `planes_de_mantenimiento`                  |
| `scheduled_maintenances`       | `mantenimientos_programados`               |
| `service_contract_types`       | `tipos_de_contrato_de_servicio`            |
| `service_contracts`            | `contratos_de_servicio`                    |
| `service_order_lines`          | `lineas_de_orden_de_servicio`              |
| `service_order_reasons`        | `motivos_de_orden_de_servicio`             |
| `service_order_status`         | `estados_de_orden_de_servicio`             |
| `service_order_status_history` | `historial_de_estado_de_orden_de_servicio` |
| `service_orders`               | `ordenes_de_servicio`                      |
| `service_parts_consumed`       | `repuestos_consumidos_de_servicio`         |
| `service_types`                | `tipos_de_servicio`                        |
| `service_visits`               | `visitas_de_servicio`                      |
| `service_work_reports`         | `reportes_de_trabajo_de_servicio`          |
| `sla_definitions`              | `definiciones_de_sla`                      |
| `technician_assignments`       | `asignaciones_de_tecnico`                  |
| `technicians`                  | `tecnicos`                                 |

### suppliers → proveedores — 13 tablas

| Inglés (actual)                 | Español (propuesto)                           |
| ------------------------------- | --------------------------------------------- |
| `supplier_addresses`            | `direcciones_de_proveedor`                    |
| `supplier_bank_accounts`        | `cuentas_bancarias_de_proveedor`              |
| `supplier_block_history`        | `historial_de_bloqueo_de_proveedor`           |
| `supplier_classifications`      | `clasificaciones_de_proveedor`                |
| `supplier_contacts`             | `contactos_de_proveedor`                      |
| `supplier_credit_limit_history` | `historial_de_limite_de_credito_de_proveedor` |
| `supplier_credit_profiles`      | `perfiles_de_credito_de_proveedor`            |
| `supplier_evaluation_criteria`  | `criterios_de_evaluacion_de_proveedor`        |
| `supplier_evaluation_scores`    | `puntajes_de_evaluacion_de_proveedor`         |
| `supplier_evaluations`          | `evaluaciones_de_proveedor`                   |
| `supplier_history`              | `historial_de_proveedor`                      |
| `supplier_withholding_profiles` | `perfiles_de_retencion_de_proveedor`          |
| `suppliers`                     | `proveedores`                                 |

### taxes → impuestos — 13 tablas

| Inglés (actual)              | Español (propuesto)                  |
| ---------------------------- | ------------------------------------ |
| `tax_declaration_lines`      | `lineas_de_declaracion_de_impuestos` |
| `tax_declarations`           | `declaraciones_de_impuestos`         |
| `tax_exemption_certificates` | `certificados_de_exencion_fiscal`    |
| `tax_exemptions`             | `exenciones_fiscales`                |
| `tax_jurisdictions`          | `jurisdicciones_fiscales`            |
| `tax_perception_rules`       | `reglas_de_percepcion_fiscal`        |
| `tax_perceptions`            | `percepciones_fiscales`              |
| `tax_rates`                  | `tasas_de_impuesto`                  |
| `tax_rules`                  | `reglas_fiscales`                    |
| `tax_translations`           | `traducciones_de_impuesto`           |
| `taxes`                      | `impuestos`                          |
| `withholding_certificates`   | `certificados_de_retencion`          |
| `withholding_rules`          | `reglas_de_retencion`                |

## 4. Columnas — las 728 distintas, agrupadas por categoría

Excluye las 17 de `BaseEntity` (§2, ya cubiertas). Categorización automática por patrón de
nombre — ver `docs/database/spanish-standard/columnas-es.json` para el listado plano completo.

### Identificadores y referencias (FK) — 261 columnas

| Inglés (actual)                   | Español (propuesto)                     |
| --------------------------------- | --------------------------------------- |
| `account_id`                      | `cuenta_id`                             |
| `account_type_id`                 | `tipo_de_cuenta_id`                     |
| `acl_id`                          | `lista_de_control_de_acceso_id`         |
| `action_type_id`                  | `tipo_de_accion_id`                     |
| `actor_user_id`                   | `usuario_actor_id`                      |
| `adjustment_id`                   | `ajuste_id`                             |
| `alert_id`                        | `alerta_id`                             |
| `api_key_id`                      | `clave_de_api_id`                       |
| `approval_id`                     | `aprobacion_id`                         |
| `approved_by_user_id`             | `aprobado_por_usuario_id`               |
| `approver_role_id`                | `rol_aprobador_id`                      |
| `approver_user_id`                | `usuario_aprobador_id`                  |
| `asset_id`                        | `activo_id`                             |
| `assigned_salesperson_id`         | `vendedor_asignado_id`                  |
| `assigned_to_user_id`             | `asignado_a_usuario_id`                 |
| `attribute_id`                    | `atributo_id`                           |
| `attribute_value_id`              | `valor_de_atributo_id`                  |
| `author_user_id`                  | `usuario_autor_id`                      |
| `avatar_file_id`                  | `archivo_de_avatar_id`                  |
| `bank_account_id`                 | `cuenta_bancaria_id`                    |
| `bank_id`                         | `banco_id`                              |
| `base_unit_id`                    | `unidad_base_id`                        |
| `batch_id`                        | `lote_id`                               |
| `benefit_id`                      | `beneficio_id`                          |
| `billing_plan_id`                 | `plan_de_facturacion_id`                |
| `bom_id`                          | `lista_de_materiales_id`                |
| `brand_id`                        | `marca_id`                              |
| `budget_id`                       | `presupuesto_id`                        |
| `campaign_id`                     | `campana_id`                            |
| `candidate_id`                    | `candidato_id`                          |
| `cart_id`                         | `carrito_id`                            |
| `cash_count_id`                   | `arqueo_de_caja_id`                     |
| `cash_register_id`                | `caja_id`                               |
| `category_id`                     | `categoria_id`                          |
| `channel_id`                      | `canal_id`                              |
| `checkbook_id`                    | `chequera_id`                           |
| `classification_id`               | `clasificacion_id`                      |
| `client_id`                       | `aplicacion_cliente_id`                 |
| `closed_by_user_id`               | `cerrado_por_usuario_id`                |
| `closing_id`                      | `cierre_id`                             |
| `collection_id`                   | `coleccion_id`                          |
| `combo_id`                        | `combo_id`                              |
| `commission_rule_id`              | `regla_de_comision_id`                  |
| `component_product_id`            | `producto_componente_id`                |
| `concept_id`                      | `concepto_id`                           |
| `concept_type_id`                 | `tipo_de_concepto_id`                   |
| `contract_id`                     | `contrato_id`                           |
| `contract_type_id`                | `tipo_de_contrato_id`                   |
| `converted_customer_id`           | `cliente_convertido_id`                 |
| `cost_center_id`                  | `centro_de_costo_id`                    |
| `country_id`                      | `pais_id`                               |
| `coupon_id`                       | `cupon_id`                              |
| `credit_note_id`                  | `nota_de_credito_id`                    |
| `criteria_id`                     | `criterio_id`                           |
| `cube_id`                         | `cubo_id`                               |
| `currency_id`                     | `moneda_id`                             |
| `current_custodian_user_id`       | `usuario_custodio_actual_id`            |
| `current_stage_id`                | `etapa_actual_id`                       |
| `custodian_user_id`               | `usuario_custodio_id`                   |
| `customer_id`                     | `cliente_id`                            |
| `customer_signature_file_id`      | `archivo_firma_cliente_id`              |
| `dashboard_id`                    | `panel_id`                              |
| `data_mart_table_id`              | `tabla_datamart_id`                     |
| `debit_note_id`                   | `nota_de_debito_id`                     |
| `decided_by_user_id`              | `decidido_por_usuario_id`               |
| `declaration_id`                  | `declaracion_id`                        |
| `default_channel_id`              | `canal_predeterminado_id`               |
| `default_depreciation_method_id`  | `metodo_depreciacion_predeterminado_id` |
| `delegate_user_id`                | `usuario_delegado_id`                   |
| `delegator_user_id`               | `usuario_delegante_id`                  |
| `delivery_note_id`                | `remito_id`                             |
| `department_id`                   | `departamento_id`                       |
| `depends_on_task_id`              | `tarea_dependencia_id`                  |
| `destination_register_id`         | `caja_destino_id`                       |
| `destination_warehouse_id`        | `almacen_destino_id`                    |
| `device_id`                       | `dispositivo_id`                        |
| `dimension_id`                    | `dimension_id`                          |
| `dimension_value_id`              | `valor_de_dimension_id`                 |
| `document_id`                     | `documento_id`                          |
| `document_type_id`                | `tipo_de_documento_id`                  |
| `employee_id`                     | `empleado_id`                           |
| `encryption_key_id`               | `clave_encriptacion_id`                 |
| `entity_id`                       | `entidad_id`                            |
| `entry_id`                        | `entrada_id`                            |
| `equipment_id`                    | `equipo_id`                             |
| `equipment_type_id`               | `tipo_de_equipo_id`                     |
| `evaluated_by_user_id`            | `evaluado_por_usuario_id`               |
| `evaluation_id`                   | `evaluacion_id`                         |
| `event_id`                        | `evento_id`                             |
| `executed_by_user_id`             | `ejecutado_por_usuario_id`              |
| `execution_id`                    | `ejecucion_id`                          |
| `exemption_id`                    | `exencion_id`                           |
| `family_id`                       | `familia_id`                            |
| `file_id`                         | `archivo_id`                            |
| `fiscal_document_type_id`         | `tipo_de_documento_fiscal_id`           |
| `fiscal_period_id`                | `periodo_fiscal_id`                     |
| `fiscal_regime_id`                | `regimen_fiscal_id`                     |
| `fiscal_year_id`                  | `ejercicio_fiscal_id`                   |
| `from_branch_id`                  | `sucursal_origen_id`                    |
| `from_currency_id`                | `moneda_origen_id`                      |
| `from_unit_id`                    | `unidad_origen_id`                      |
| `fund_id`                         | `fondo_id`                              |
| `funnel_id`                       | `embudo_id`                             |
| `funnel_stage_id`                 | `etapa_de_embudo_id`                    |
| `gift_card_id`                    | `tarjeta_de_regalo_id`                  |
| `group_id`                        | `grupo_id`                              |
| `import_batch_id`                 | `lote_de_importacion_id`                |
| `import_id`                       | `importacion_id`                        |
| `incident_id`                     | `incidente_id`                          |
| `indicator_id`                    | `indicador_id`                          |
| `ingredient_product_id`           | `producto_ingrediente_id`               |
| `integration_id`                  | `integracion_id`                        |
| `inventory_receipt_id`            | `recepcion_de_inventario_id`            |
| `invoice_id`                      | `factura_id`                            |
| `invoice_line_id`                 | `linea_de_factura_id`                   |
| `issue_id`                        | `problema_id`                           |
| `job_position_id`                 | `puesto_id`                             |
| `journal_entry_id`                | `asiento_contable_id`                   |
| `journal_entry_line_id`           | `linea_de_asiento_id`                   |
| `jurisdiction_id`                 | `jurisdiccion_id`                       |
| `kit_id`                          | `kit_id`                                |
| `kpi_id`                          | `kpi_id`                                |
| `layaway_id`                      | `apartado_id`                           |
| `lead_id`                         | `prospecto_id`                          |
| `leave_request_id`                | `solicitud_de_licencia_id`              |
| `leave_type_id`                   | `tipo_de_licencia_id`                   |
| `line_id`                         | `linea_id`                              |
| `loan_id`                         | `prestamo_id`                           |
| `location_id`                     | `ubicacion_id`                          |
| `loss_reason_id`                  | `motivo_de_perdida_id`                  |
| `loyalty_account_id`              | `cuenta_de_fidelidad_id`                |
| `loyalty_program_id`              | `programa_de_fidelidad_id`              |
| `maintenance_type_id`             | `tipo_de_mantenimiento_id`              |
| `manager_user_id`                 | `usuario_responsable_id`                |
| `matched_transfer_id`             | `transferencia_conciliada_id`           |
| `metric_id`                       | `metrica_id`                            |
| `model_id`                        | `modelo_id`                             |
| `movement_type_id`                | `tipo_de_movimiento_id`                 |
| `municipality_id`                 | `municipio_id`                          |
| `notification_id`                 | `notificacion_id`                       |
| `opened_by_user_id`               | `abierto_por_usuario_id`                |
| `opening_id`                      | `apertura_id`                           |
| `opportunity_id`                  | `oportunidad_id`                        |
| `output_file_id`                  | `archivo_de_salida_id`                  |
| `owner_user_id`                   | `usuario_propietario_id`                |
| `parameter_id`                    | `parametro_id`                          |
| `parent_account_id`               | `cuenta_padre_id`                       |
| `parent_category_id`              | `categoria_padre_id`                    |
| `parent_department_id`            | `departamento_padre_id`                 |
| `parent_location_id`              | `ubicacion_padre_id`                    |
| `parent_product_id`               | `producto_padre_id`                     |
| `parent_task_id`                  | `tarea_padre_id`                        |
| `password_policy_id`              | `politica_contrasena_id`                |
| `payment_form_id`                 | `forma_de_pago_id`                      |
| `payment_gateway_integration_id`  | `integracion_pasarela_de_pago_id`       |
| `payment_method_id`               | `metodo_de_pago_id`                     |
| `payroll_entry_id`                | `entrada_de_nomina_id`                  |
| `perception_id`                   | `percepcion_id`                         |
| `performed_by_user_id`            | `realizado_por_usuario_id`              |
| `period_id`                       | `periodo_id`                            |
| `permission_id`                   | `permiso_id`                            |
| `physical_count_id`               | `conteo_fisico_id`                      |
| `plan_id`                         | `plan_id`                               |
| `price_list_id`                   | `lista_de_precios_id`                   |
| `product_category_id`             | `categoria_de_producto_id`              |
| `product_id`                      | `producto_id`                           |
| `production_order_id`             | `orden_de_produccion_id`                |
| `profit_center_id`                | `centro_de_utilidad_id`                 |
| `program_id`                      | `programa_id`                           |
| `project_id`                      | `proyecto_id`                           |
| `project_type_id`                 | `tipo_de_proyecto_id`                   |
| `promotion_id`                    | `promocion_id`                          |
| `purchase_invoice_id`             | `factura_de_compra_id`                  |
| `purchase_order_id`               | `orden_de_compra_id`                    |
| `quote_id`                        | `cotizacion_id`                         |
| `rate_type_id`                    | `tipo_de_tasa_id`                       |
| `reason_id`                       | `motivo_id`                             |
| `receipt_id`                      | `recibo_id`                             |
| `receipt_note_id`                 | `nota_de_recepcion_id`                  |
| `recipe_id`                       | `receta_id`                             |
| `recipient_user_id`               | `usuario_destinatario_id`               |
| `reconciliation_id`               | `conciliacion_id`                       |
| `register_id`                     | `caja_id`                               |
| `related_product_id`              | `producto_relacionado_id`               |
| `report_definition_id`            | `definicion_de_reporte_id`              |
| `requested_by_entity_id`          | `entidad_solicitante_id`                |
| `requested_by_user_id`            | `solicitado_por_usuario_id`             |
| `required_role_id`                | `rol_requerido_id`                      |
| `requisition_id`                  | `requisicion_id`                        |
| `resource_id`                     | `recurso_id`                            |
| `resulting_sales_order_id`        | `pedido_de_venta_resultante_id`         |
| `resume_file_id`                  | `archivo_de_cv_id`                      |
| `return_id`                       | `devolucion_id`                         |
| `role_id`                         | `rol_id`                                |
| `rotated_by_user_id`              | `rotado_por_usuario_id`                 |
| `route_id`                        | `ruta_id`                               |
| `row_id`                          | `fila_id`                               |
| `rule_id`                         | `regla_id`                              |
| `run_id`                          | `ejecucion_id`                          |
| `sales_order_id`                  | `pedido_de_venta_id`                    |
| `sales_return_id`                 | `devolucion_de_venta_id`                |
| `salesperson_id`                  | `vendedor_id`                           |
| `schedule_id`                     | `programacion_id`                       |
| `scheduled_job_id`                | `trabajo_programado_id`                 |
| `scope_id`                        | `alcance_id`                            |
| `series_id`                       | `serie_id`                              |
| `service_order_id`                | `orden_de_servicio_id`                  |
| `service_type_id`                 | `tipo_de_servicio_id`                   |
| `service_visit_id`                | `visita_de_servicio_id`                 |
| `session_id`                      | `sesion_id`                             |
| `signature_image_file_id`         | `archivo_imagen_firma_id`               |
| `signer_user_id`                  | `usuario_firmante_id`                   |
| `skill_id`                        | `habilidad_id`                          |
| `source_commission_entry_id`      | `entrada_de_comision_origen_id`         |
| `source_company_id`               | `empresa_origen_id`                     |
| `source_entity_id`                | `entidad_origen_id`                     |
| `source_file_id`                  | `archivo_origen_id`                     |
| `source_id`                       | `origen_id`                             |
| `source_journal_entry_id`         | `asiento_contable_origen_id`            |
| `source_purchase_invoice_id`      | `factura_de_compra_origen_id`           |
| `source_purchase_invoice_line_id` | `linea_de_factura_de_compra_origen_id`  |
| `source_receipt_line_id`          | `linea_de_recibo_origen_id`             |
| `source_register_id`              | `caja_origen_id`                        |
| `source_warehouse_id`             | `almacen_origen_id`                     |
| `stage_id`                        | `etapa_id`                              |
| `state_province_id`               | `provincia_id`                          |
| `statement_id`                    | `extracto_id`                           |
| `statement_line_id`               | `linea_de_extracto_id`                  |
| `status_id`                       | `estado_id`                             |
| `structure_id`                    | `estructura_id`                         |
| `subject_id`                      | `sujeto_id`                             |
| `subscription_id`                 | `suscripcion_id`                        |
| `supplier_id`                     | `proveedor_id`                          |
| `tag_id`                          | `etiqueta_id`                           |
| `target_company_id`               | `empresa_destino_id`                    |
| `target_journal_entry_id`         | `asiento_contable_destino_id`           |
| `target_zone_id`                  | `zona_destino_id`                       |
| `task_id`                         | `tarea_id`                              |
| `tax_id`                          | `impuesto_id`                           |
| `team_id`                         | `equipo_id`                             |
| `technician_id`                   | `tecnico_id`                            |
| `template_id`                     | `plantilla_id`                          |
| `territory_id`                    | `territorio_id`                         |
| `to_branch_id`                    | `sucursal_destino_id`                   |
| `to_currency_id`                  | `moneda_destino_id`                     |
| `to_unit_id`                      | `unidad_destino_id`                     |
| `training_id`                     | `capacitacion_id`                       |
| `transfer_id`                     | `transferencia_id`                      |
| `unit_id`                         | `unidad_id`                             |
| `user_id`                         | `usuario_id`                            |
| `vacancy_id`                      | `vacante_id`                            |
| `variant_product_id`              | `producto_variante_id`                  |
| `visited_by_user_id`              | `visitado_por_usuario_id`               |
| `warehouse_id`                    | `almacen_id`                            |
| `warranty_id`                     | `garantia_id`                           |
| `withholding_rule_id`             | `regla_de_retencion_id`                 |
| `workflow_id`                     | `flujo_de_trabajo_id`                   |
| `workflow_instance_id`            | `instancia_de_flujo_id`                 |
| `workflow_step_id`                | `paso_de_flujo_id`                      |
| `yield_unit_id`                   | `unidad_rendimiento_id`                 |
| `zone_id`                         | `zona_id`                               |

### Fechas — 49 columnas

| Inglés (actual)        | Español (propuesto)         |
| ---------------------- | --------------------------- |
| `acquisition_date`     | `fecha_de_adquisicion`      |
| `available_at`         | `fecha_disponible`          |
| `birth_date`           | `fecha_nacimiento`          |
| `checked_at`           | `fecha_verificacion`        |
| `completed_at`         | `fecha_finalizacion`        |
| `confirmed_at`         | `fecha_confirmacion`        |
| `decided_at`           | `fecha_decision`            |
| `due_at`               | `fecha_vencimiento`         |
| `ends_at`              | `fecha_fin`                 |
| `ends_on`              | `termina_el`                |
| `evaluation_date`      | `fecha_evaluacion`          |
| `expires_at`           | `fecha_expiracion`          |
| `expiry_date`          | `fecha_vencimiento`         |
| `filed_at`             | `fecha_de_presentacion`     |
| `finished_at`          | `fecha_finalizacion`        |
| `forecast_date`        | `fecha_pronostico`          |
| `granted_at`           | `fecha_otorgamiento`        |
| `hire_date`            | `fecha_contratacion`        |
| `holiday_date`         | `fecha_feriado`             |
| `issued_at`            | `fecha_emision`             |
| `last_login_at`        | `fecha_ultimo_login`        |
| `last_seen_at`         | `fecha_ultima_conexion`     |
| `locked_at`            | `fecha_bloqueo`             |
| `next_generation_date` | `fecha_proxima_generacion`  |
| `next_run_date`        | `fecha_proxima_ejecucion`   |
| `occurred_at`          | `fecha_ocurrencia`          |
| `planned_date`         | `fecha_planificada`         |
| `posting_date`         | `fecha_contabilizacion`     |
| `rate_date`            | `fecha_tasa`                |
| `read_at`              | `fecha_lectura`             |
| `received_at`          | `fecha_recepcion`           |
| `released_at`          | `fecha_liberacion`          |
| `resolved_at`          | `fecha_resolucion`          |
| `restore_finished_at`  | `fecha_fin_restauracion`    |
| `restore_started_at`   | `fecha_inicio_restauracion` |
| `revoked_at`           | `fecha_revocacion`          |
| `rotated_at`           | `fecha_de_rotacion`         |
| `scheduled_at`         | `fecha_programada`          |
| `scheduled_date`       | `fecha_programada`          |
| `signed_at`            | `fecha_firma`               |
| `snapshot_date`        | `fecha_instantanea`         |
| `started_at`           | `fecha_inicio`              |
| `starts_at`            | `fecha_inicio`              |
| `starts_on`            | `inicia_el`                 |
| `termination_date`     | `fecha_baja`                |
| `transaction_date`     | `fecha_transaccion`         |
| `used_at`              | `fecha_uso`                 |
| `visited_at`           | `fecha_visita`              |
| `work_date`            | `fecha_trabajo`             |

### Montos, precios y saldos — 56 columnas

| Inglés (actual)            | Español (propuesto)         |
| -------------------------- | --------------------------- |
| `acquisition_cost`         | `costo_de_adquisicion`      |
| `agreed_price`             | `precio_acordado`           |
| `amount`                   | `monto`                     |
| `amount_applied`           | `monto_aplicado`            |
| `amount_delta`             | `variacion_de_monto`        |
| `amount_formula`           | `formula_de_monto`          |
| `balance_due`              | `saldo_pendiente`           |
| `base_salary`              | `salario_base`              |
| `budget_amount`            | `monto_presupuestado`       |
| `budgeted_amount`          | `monto_presupuestado`       |
| `closing_balance`          | `saldo_de_cierre`           |
| `cost`                     | `costo`                     |
| `costing_method`           | `metodo_de_costeo`          |
| `counted_amount`           | `monto_contado`             |
| `credit_amount`            | `monto_de_credito`          |
| `current_balance`          | `saldo_actual`              |
| `debit_amount`             | `monto_de_debito`           |
| `difference_amount`        | `monto_de_diferencia`       |
| `discount_amount`          | `monto_de_descuento`        |
| `discrepancy_amount`       | `monto_de_discrepancia`     |
| `employee_rate_percentage` | `porcentaje_tasa_empleado`  |
| `employer_rate_percentage` | `porcentaje_tasa_empleador` |
| `estimated_amount`         | `monto_estimado`            |
| `expected_amount`          | `monto_esperado`            |
| `fund_amount`              | `monto_del_fondo`           |
| `gross_amount`             | `monto_bruto`               |
| `hourly_rate`              | `tarifa_por_hora`           |
| `initial_balance`          | `saldo_inicial`             |
| `last_purchase_cost`       | `ultimo_costo_de_compra`    |
| `list_price`               | `precio_de_lista`           |
| `max_amount`               | `monto_maximo`              |
| `min_amount`               | `monto_minimo`              |
| `net_amount`               | `monto_neto`                |
| `new_average_cost`         | `nuevo_costo_promedio`      |
| `normal_balance`           | `saldo_normal`              |
| `opening_amount`           | `monto_de_apertura`         |
| `override_amount`          | `monto_sobrescrito`         |
| `points_balance`           | `saldo_de_puntos`           |
| `price_type`               | `tipo_de_precio`            |
| `rate`                     | `tasa`                      |
| `rate_multiplier`          | `multiplicador_de_tasa`     |
| `rate_percentage`          | `porcentaje_de_tasa`        |
| `reconciled_balance`       | `saldo_conciliado`          |
| `remaining_balance`        | `saldo_restante`            |
| `salary_band_max`          | `banda_salarial_maxima`     |
| `salary_band_min`          | `banda_salarial_minima`     |
| `standard_cost`            | `costo_estandar`            |
| `strategy`                 | `estrategia`                |
| `subledger_balance`        | `saldo_submayor`            |
| `subtotal_amount`          | `subtotal`                  |
| `target_amount`            | `monto_objetivo`            |
| `tax_amount`               | `impuesto`                  |
| `total_amount`             | `total`                     |
| `total_budget`             | `presupuesto_total`         |
| `unit_cost`                | `costo_unitario`            |
| `unit_price`               | `precio_unitario`           |

### Cantidades — 18 columnas

| Inglés (actual)         | Español (propuesto)       |
| ----------------------- | ------------------------- |
| `actual_quantity`       | `cantidad_real`           |
| `counted_quantity`      | `cantidad_contada`        |
| `estimated_quantity`    | `cantidad_estimada`       |
| `max_quantity`          | `cantidad_maxima`         |
| `min_quantity`          | `cantidad_minima`         |
| `new_quantity`          | `cantidad_nueva`          |
| `original_quantity`     | `cantidad_original`       |
| `output_quantity`       | `cantidad_producida`      |
| `planned_quantity`      | `cantidad_planificada`    |
| `previous_quantity`     | `cantidad_anterior`       |
| `quantity`              | `cantidad`                |
| `quantity_in_base_unit` | `cantidad_en_unidad_base` |
| `quantity_on_hand`      | `cantidad_en_existencia`  |
| `quantity_required`     | `cantidad_requerida`      |
| `quantity_reserved`     | `cantidad_reservada`      |
| `remaining_quantity`    | `cantidad_restante`       |
| `system_quantity`       | `cantidad_de_sistema`     |
| `yield_quantity`        | `cantidad_rendimiento`    |

### Porcentajes — 7 columnas

| Inglés (actual)              | Español (propuesto)                 |
| ---------------------------- | ----------------------------------- |
| `allocation_percentage`      | `porcentaje_de_asignacion`          |
| `commission_percentage`      | `porcentaje_de_comision`            |
| `discount_percentage`        | `porcentaje_de_descuento`           |
| `progress_percentage`        | `porcentaje_de_avance`              |
| `rollout_percentage`         | `porcentaje_de_despliegue`          |
| `weight_percentage`          | `porcentaje_de_peso`                |
| `win_probability_percentage` | `probabilidad_de_cierre_porcentaje` |

### Indicadores booleanos — 25 columnas

| Inglés (actual)       | Español (propuesto)         |
| --------------------- | --------------------------- |
| `accepts_postings`    | `acepta_asientos`           |
| `is_ad_hoc`           | `es_puntual`                |
| `is_blocked`          | `esta_bloqueado`            |
| `is_capitalizable`    | `es_capitalizable`          |
| `is_closed`           | `esta_cerrado`              |
| `is_current`          | `es_actual`                 |
| `is_default`          | `es_predeterminado`         |
| `is_enabled`          | `esta_habilitado`           |
| `is_final`            | `es_definitivo`             |
| `is_main_branch`      | `es_sucursal_principal`     |
| `is_open`             | `esta_abierta`              |
| `is_opted_in`         | `acepto_participar`         |
| `is_paid`             | `esta_pagado`               |
| `is_preferred`        | `es_preferido`              |
| `is_primary`          | `es_principal`              |
| `is_reconciled`       | `esta_conciliado`           |
| `is_system_account`   | `es_cuenta_de_sistema`      |
| `is_system_role`      | `es_rol_de_sistema`         |
| `is_within_tolerance` | `esta_dentro_de_tolerancia` |
| `requires_2fa`        | `requiere_doble_factor`     |
| `requires_number`     | `requiere_numero`           |
| `requires_symbol`     | `requiere_simbolo`          |
| `requires_uppercase`  | `requiere_mayuscula`        |
| `tracks_lot`          | `rastrea_lote`              |
| `tracks_serial`       | `rastrea_serie`             |

### Códigos y números — 32 columnas

| Inglés (actual)            | Español (propuesto)          |
| -------------------------- | ---------------------------- |
| `action_code`              | `codigo_de_accion`           |
| `attempt_number`           | `numero_de_intento`          |
| `barcode`                  | `codigo_de_barras`           |
| `barcode_type`             | `tipo_de_codigo_de_barras`   |
| `check_number`             | `numero_de_cheque`           |
| `code`                     | `codigo`                     |
| `currency_code`            | `codigo_moneda`              |
| `document_number`          | `numero_de_documento`        |
| `ending_number`            | `numero_final`               |
| `event_code`               | `codigo_de_evento`           |
| `functional_currency_code` | `codigo_moneda_funcional`    |
| `installment_number`       | `numero_de_cuota`            |
| `iso_code`                 | `codigo_iso`                 |
| `job_code`                 | `codigo_trabajo`             |
| `language_code`            | `codigo_idioma`              |
| `lot_number`               | `numero_de_lote`             |
| `module_code`              | `codigo_de_modulo`           |
| `next_number`              | `numero_siguiente`           |
| `number_length`            | `longitud_numero`            |
| `period_number`            | `numero_de_periodo`          |
| `plan_code`                | `codigo_de_plan`             |
| `postal_code`              | `codigo_postal`              |
| `preferred_currency_code`  | `codigo_moneda_preferida`    |
| `row_number`               | `numero_de_fila`             |
| `serial_number`            | `numero_de_serie`            |
| `sku`                      | `sku`                        |
| `starting_number`          | `numero_inicial`             |
| `supplier_document_number` | `numero_documento_proveedor` |
| `swift_code`               | `codigo_swift`               |
| `terminal_code`            | `codigo_de_terminal`         |
| `tier_code`                | `codigo_de_nivel`            |
| `version_number`           | `numero_de_version`          |

### Tipo / Estado / Categoría — 34 columnas

| Inglés (actual)            | Español (propuesto)        |
| -------------------------- | -------------------------- |
| `account_type`             | `tipo_de_cuenta`           |
| `action_type`              | `tipo_de_accion`           |
| `address_type`             | `tipo_direccion`           |
| `attempt_status`           | `estado_del_intento`       |
| `card_type`                | `tipo_de_tarjeta`          |
| `category`                 | `categoria`                |
| `channel_type`             | `tipo_de_canal`            |
| `chart_type`               | `tipo_de_grafico`          |
| `check_type`               | `tipo_de_verificacion`     |
| `completion_status`        | `estado_de_finalizacion`   |
| `consent_type`             | `tipo_de_consentimiento`   |
| `data_type`                | `tipo_de_dato`             |
| `device_type`              | `tipo_de_dispositivo`      |
| `disposal_type`            | `tipo_de_baja`             |
| `document_type`            | `tipo_de_documento`        |
| `entity_type`              | `tipo_de_entidad`          |
| `event_type`               | `tipo_de_evento`           |
| `expense_type`             | `tipo_de_gasto`            |
| `http_status`              | `estado_http`              |
| `integration_type`         | `tipo_de_integracion`      |
| `mime_type`                | `tipo_mime`                |
| `product_type`             | `tipo_de_producto`         |
| `reference_type`           | `tipo_de_referencia`       |
| `register_type`            | `tipo_de_caja`             |
| `relation_type`            | `tipo_de_relacion`         |
| `request_type`             | `tipo_de_solicitud`        |
| `requested_by_entity_type` | `tipo_entidad_solicitante` |
| `resource_type`            | `tipo_de_recurso`          |
| `rule_type`                | `tipo_de_regla`            |
| `status`                   | `estado`                   |
| `subject_type`             | `tipo_de_sujeto`           |
| `transaction_type`         | `tipo_de_transaccion`      |
| `trigger_entity_type`      | `tipo_entidad_disparadora` |
| `warehouse_type`           | `tipo_de_almacen`          |

### Seguridad (hashes, tokens, claves) — 24 columnas

| Inglés (actual)            | Español (propuesto)                |
| -------------------------- | ---------------------------------- |
| `access_token_hash`        | `hash_token_acceso`                |
| `account_number_encrypted` | `numero_cuenta_encriptado`         |
| `client_secret_hash`       | `hash_secreto_cliente`             |
| `code_hash`                | `hash_codigo`                      |
| `credential_key`           | `clave_credencial`                 |
| `encrypted_account_number` | `numero_cuenta_encriptado`         |
| `encrypted_secret`         | `secreto_encriptado`               |
| `encrypted_value`          | `valor_encriptado`                 |
| `flag_key`                 | `clave_bandera`                    |
| `job_key`                  | `clave_trabajo`                    |
| `key`                      | `clave`                            |
| `key_hash`                 | `hash_clave`                       |
| `key_prefix`               | `prefijo_de_clave`                 |
| `kms_key_reference`        | `referencia_clave_kms`             |
| `national_id_encrypted`    | `documento_nacional_encriptado`    |
| `parameter_key`            | `clave_parametro`                  |
| `password_hash`            | `hash_contrasena`                  |
| `push_token`               | `token_push`                       |
| `refresh_token_hash`       | `hash_token_actualizacion`         |
| `rule_set_key`             | `clave_conjunto_reglas`            |
| `secret_hash`              | `hash_secreto`                     |
| `storage_key`              | `clave_almacenamiento`             |
| `token_hash`               | `hash_token`                       |
| `transition_rule_set_key`  | `clave_conjunto_reglas_transicion` |

### Texto descriptivo — 25 columnas

| Inglés (actual)          | Español (propuesto)          |
| ------------------------ | ---------------------------- |
| `bank_name`              | `nombre_del_banco`           |
| `base_query_name`        | `nombre_consulta_base`       |
| `beneficiary_name`       | `nombre_del_beneficiario`    |
| `claim_description`      | `descripcion_del_reclamo`    |
| `column_name`            | `nombre_columna`             |
| `comment`                | `comentario`                 |
| `description`            | `descripcion`                |
| `display_name`           | `nombre_visible`             |
| `event_description`      | `descripcion_del_evento`     |
| `full_name`              | `nombre_completo`            |
| `iana_name`              | `nombre_iana`                |
| `job_title`              | `puesto`                     |
| `legal_name`             | `razon_social`               |
| `materialized_view_name` | `nombre_vista_materializada` |
| `name`                   | `nombre`                     |
| `original_name`          | `nombre_original`            |
| `outcome_notes`          | `notas_del_resultado`        |
| `provider_name`          | `nombre_del_proveedor`       |
| `queue_name`             | `nombre_de_la_cola`          |
| `role_name`              | `nombre_del_rol`             |
| `scheme_name`            | `nombre_de_esquema`          |
| `signer_external_name`   | `nombre_firmante_externo`    |
| `table_name`             | `nombre_tabla`               |
| `title`                  | `titulo`                     |
| `trade_name`             | `nombre_comercial`           |

### Otros — 180 columnas

| Inglés (actual)              | Español (propuesto)                |
| ---------------------------- | ---------------------------------- |
| `abbreviation`               | `abreviatura`                      |
| `accrual_rule`               | `regla_de_devengo`                 |
| `accrued_days`               | `dias_devengados`                  |
| `action`                     | `accion`                           |
| `action_executed`            | `accion_ejecutada`                 |
| `action_on_expiry`           | `accion_al_expirar`                |
| `action_payload`             | `contenido_de_la_accion`           |
| `ad_hoc_config`              | `configuracion_ad_hoc`             |
| `address_line`               | `linea_direccion`                  |
| `aggregation`                | `agregacion`                       |
| `algorithm`                  | `algoritmo`                        |
| `all_checks_passed`          | `todas_las_verificaciones_pasaron` |
| `attempts`                   | `intentos`                         |
| `backup_source`              | `origen_del_respaldo`              |
| `batch_purpose`              | `proposito_del_lote`               |
| `billing_cutoff_day`         | `dia_de_corte_de_facturacion`      |
| `billing_cycle`              | `ciclo_de_facturacion`             |
| `billing_frequency`          | `frecuencia_de_facturacion`        |
| `billing_method`             | `metodo_de_facturacion`            |
| `block_reason`               | `motivo_de_bloqueo`                |
| `body`                       | `cuerpo`                           |
| `bracket_max`                | `tramo_maximo`                     |
| `bracket_min`                | `tramo_minimo`                     |
| `calculation_detail`         | `detalle_de_calculo`               |
| `calculation_formula`        | `formula_de_calculo`               |
| `changed_columns`            | `columnas_modificadas`             |
| `check_results`              | `resultados_de_verificacion`       |
| `checksum_sha256`            | `suma_verificacion_sha256`         |
| `cidr_range`                 | `rango_cidr`                       |
| `color_hex`                  | `color_hexadecimal`                |
| `condition_expression`       | `expresion_de_condicion`           |
| `consolidation_label`        | `etiqueta_de_consolidacion`        |
| `contact_email`              | `correo_contacto`                  |
| `context`                    | `contexto`                         |
| `context_snapshot`           | `instantanea_de_contexto`          |
| `conversion_factor`          | `factor_de_conversion`             |
| `coverage_months`            | `meses_de_cobertura`               |
| `credit_limit`               | `limite_de_credito`                |
| `cron_expression`            | `expresion_cron`                   |
| `decimal_places`             | `cantidad_de_decimales`            |
| `decision`                   | `decision`                         |
| `default_useful_life_months` | `vida_util_predeterminada_meses`   |
| `default_value`              | `valor_predeterminado`             |
| `denomination_value`         | `valor_de_denominacion`            |
| `details`                    | `detalles`                         |
| `direction`                  | `sentido`                          |
| `display_order`              | `orden_de_visualizacion`           |
| `document_kind`              | `clase_de_documento`               |
| `domain`                     | `dominio`                          |
| `duration_seconds`           | `duracion_segundos`                |
| `effect`                     | `efecto`                           |
| `effective_from`             | `vigente_desde`                    |
| `effective_to`               | `vigente_hasta`                    |
| `email`                      | `correo`                           |
| `email_attempted`            | `correo_intentado`                 |
| `entry_side`                 | `lado_del_asiento`                 |
| `error_message`              | `mensaje_de_error`                 |
| `evaluation_mode`            | `modo_de_evaluacion`               |
| `execution_mode`             | `modo_de_ejecucion`                |
| `expires_after_days`         | `expira_despues_de_dias`           |
| `export_format`              | `formato_de_exportacion`           |
| `external_email`             | `correo_externo`                   |
| `findings`                   | `hallazgos`                        |
| `fiscal_folio`               | `folio_fiscal`                     |
| `fiscal_year_start_month`    | `mes_inicio_ejercicio_fiscal`      |
| `formula`                    | `formula`                          |
| `frequency`                  | `frecuencia`                       |
| `frequency_days`             | `frecuencia_en_dias`               |
| `history_count`              | `cantidad_de_historial`            |
| `hours`                      | `horas`                            |
| `ifrs_standard_reference`    | `referencia_norma_niif`            |
| `impact`                     | `impacto`                          |
| `installment_count`          | `cantidad_de_cuotas`               |
| `ip_address`                 | `direccion_ip`                     |
| `last_error`                 | `ultimo_error`                     |
| `last_four_digits`           | `ultimos_cuatro_digitos`           |
| `latitude`                   | `latitud`                          |
| `layout_html`                | `plantilla_html`                   |
| `lead_time_days`             | `dias_de_entrega`                  |
| `level`                      | `nivel`                            |
| `line_total`                 | `total_de_linea`                   |
| `line1`                      | `linea_1`                          |
| `line2`                      | `linea_2`                          |
| `locked_by`                  | `bloqueado_por`                    |
| `lockout_duration_minutes`   | `duracion_bloqueo_minutos`         |
| `longitude`                  | `longitud`                         |
| `matched`                    | `conciliado`                       |
| `max_attempts`               | `intentos_maximos`                 |
| `max_branches`               | `sucursales_maximas`               |
| `max_companies`              | `empresas_maximas`                 |
| `max_login_attempts`         | `intentos_maximos_de_login`        |
| `max_redemptions`            | `canjes_maximos`                   |
| `max_users`                  | `usuarios_maximos`                 |
| `max_warehouses`             | `almacenes_maximos`                |
| `message`                    | `mensaje`                          |
| `message_body`               | `cuerpo_del_mensaje`               |
| `method`                     | `metodo`                           |
| `min_length`                 | `longitud_minima`                  |
| `min_points`                 | `puntos_minimos`                   |
| `model`                      | `modelo`                           |
| `new_limit`                  | `limite_nuevo`                     |
| `new_value`                  | `valor_nuevo`                      |
| `new_values`                 | `valores_nuevos`                   |
| `observed_value`             | `valor_observado`                  |
| `old_values`                 | `valores_anteriores`               |
| `operation`                  | `operacion`                        |
| `outcome`                    | `resultado`                        |
| `overall_score`              | `puntaje_general`                  |
| `parameters_used`            | `parametros_utilizados`            |
| `payload`                    | `contenido`                        |
| `payment_terms_days`         | `dias_de_plazo_de_pago`            |
| `period_end`                 | `fin_de_periodo`                   |
| `period_start`               | `inicio_de_periodo`                |
| `phone`                      | `telefono`                         |
| `points_delta`               | `variacion_de_puntos`              |
| `points_per_currency_unit`   | `puntos_por_unidad_de_moneda`      |
| `position_order`             | `orden_de_posicion`                |
| `predicted_value`            | `valor_predicho`                   |
| `preferred_language`         | `idioma_preferido`                 |
| `preferred_timezone`         | `zona_horaria_preferida`           |
| `prefix`                     | `prefijo`                          |
| `previous_limit`             | `limite_anterior`                  |
| `previous_value`             | `valor_anterior`                   |
| `pricing_policy`             | `politica_de_precios`              |
| `priority`                   | `prioridad`                        |
| `probability`                | `probabilidad`                     |
| `proficiency_level`          | `nivel_de_competencia`             |
| `provider_response`          | `respuesta_del_proveedor`          |
| `purpose`                    | `proposito`                        |
| `rating`                     | `calificacion`                     |
| `raw_payload`                | `contenido_bruto`                  |
| `raw_row_data`               | `datos_de_fila_bruta`              |
| `reason`                     | `motivo`                           |
| `redirect_uris`              | `uris_de_redireccion`              |
| `refresh_frequency`          | `frecuencia_de_actualizacion`      |
| `relationship`               | `relacion`                         |
| `requests_per_minute`        | `solicitudes_por_minuto`           |
| `residual_value`             | `valor_residual`                   |
| `resolution_time_hours`      | `tiempo_de_resolucion_horas`       |
| `response_time_hours`        | `tiempo_de_respuesta_horas`        |
| `retention_period_months`    | `periodo_de_retencion_meses`       |
| `sales_channel`              | `canal_de_venta`                   |
| `score`                      | `puntaje`                          |
| `season`                     | `temporada`                        |
| `session_timeout_minutes`    | `tiempo_espera_sesion_minutos`     |
| `severity`                   | `severidad`                        |
| `size_bytes`                 | `tamano_en_bytes`                  |
| `slug`                       | `slug`                             |
| `snapshot`                   | `instantanea`                      |
| `snapshot_data`              | `datos_de_instantanea`             |
| `snapshot_value`             | `valor_instantanea`                |
| `source_module`              | `modulo_origen`                    |
| `stage_order`                | `orden_de_etapa`                   |
| `standard_duration_minutes`  | `duracion_estandar_minutos`        |
| `step_order`                 | `orden_de_paso`                    |
| `storage_bucket`             | `bucket_almacenamiento`            |
| `subject`                    | `asunto`                           |
| `succeeded`                  | `tuvo_exito`                       |
| `success_rows`               | `filas_exitosas`                   |
| `suffix`                     | `sufijo`                           |
| `supplier_sku`               | `sku_proveedor`                    |
| `symbol`                     | `simbolo`                          |
| `table_schema`               | `esquema_tabla`                    |
| `target_module`              | `modulo_destino`                   |
| `target_url`                 | `url_destino`                      |
| `target_value`               | `valor_objetivo`                   |
| `tax_kind`                   | `tipo_de_impuesto`                 |
| `tax_regime`                 | `regimen_fiscal`                   |
| `threshold_operator`         | `operador_de_umbral`               |
| `threshold_value`            | `valor_umbral`                     |
| `total_rows`                 | `filas_totales`                    |
| `trusted_until`              | `confiable_hasta`                  |
| `used_days`                  | `dias_utilizados`                  |
| `user_agent`                 | `agente_usuario`                   |
| `valid_until`                | `valido_hasta`                     |
| `value`                      | `valor`                            |
| `visit_order`                | `orden_de_visita`                  |
| `year`                       | `anio`                             |
| `year_label`                 | `etiqueta_de_anio`                 |
| `zone_function`              | `funcion_de_zona`                  |

## 5. Vistas y vistas materializadas — las 13, completas

| Tipo                | Esquema      | Actual                        | Propuesto                               |
| ------------------- | ------------ | ----------------------------- | --------------------------------------- |
| Vista               | `accounting` | `v_general_ledger`            | `v_libro_mayor`                         |
| Vista               | `accounting` | `v_treasury_position`         | `v_posicion_de_tesoreria`               |
| Vista               | `accounting` | `v_trial_balance`             | `v_balance_de_comprobacion`             |
| Vista               | `customers`  | `v_accounts_receivable_aging` | `v_antiguedad_de_cuentas_por_cobrar`    |
| Vista               | `inventory`  | `v_available_stock`           | `v_stock_disponible`                    |
| Vista               | `inventory`  | `v_kardex`                    | `v_kardex` (ya en español, se mantiene) |
| Vista               | `suppliers`  | `v_accounts_payable_aging`    | `v_antiguedad_de_cuentas_por_pagar`     |
| Vista               | `taxes`      | `v_purchase_tax_ledger`       | `v_libro_de_impuestos_de_compras`       |
| Vista               | `taxes`      | `v_sales_tax_ledger`          | `v_libro_de_impuestos_de_ventas`        |
| Vista materializada | `bi`         | `mv_aging_summary`            | `mv_resumen_de_antiguedad`              |
| Vista materializada | `bi`         | `mv_customer_lifetime_value`  | `mv_valor_de_vida_del_cliente`          |
| Vista materializada | `bi`         | `mv_daily_sales_summary`      | `mv_resumen_diario_de_ventas`           |
| Vista materializada | `bi`         | `mv_inventory_valuation`      | `mv_valuacion_de_inventario`            |

## 6. Funciones y procedimientos propios de GORAZUS — las 20, completas

**No incluye** las 67 funciones propias de las extensiones `pg_trgm`/`pgcrypto` (schema `public`,
p. ej. `similarity`, `pgp_sym_encrypt`, `gtrgm_compress`) — esas nunca se renombran, son parte del
contrato de la extensión, ver `DATABASE_SPANISH_STANDARD.md §8`.

| Tipo          | Esquema         | Actual                               | Propuesto                                      |
| ------------- | --------------- | ------------------------------------ | ---------------------------------------------- |
| Función       | `accounting`    | `fn_is_journal_entry_balanced`       | `fn_es_asiento_contable_balanceado`            |
| Función       | `accounting`    | `fn_prevent_unbalanced_posting`      | `fn_prevenir_asiento_desbalanceado`            |
| Procedimiento | `accounting`    | `sp_close_fiscal_period`             | `sp_cerrar_periodo_fiscal`                     |
| Función       | `bi`            | `fn_refresh_data_marts`              | `fn_actualizar_datamarts`                      |
| Función       | `configuration` | `fn_business_days_between`           | `fn_dias_habiles_entre`                        |
| Función       | `configuration` | `fn_convert_currency`                | `fn_convertir_moneda`                          |
| Función       | `configuration` | `fn_generate_document_number`        | `fn_generar_numero_documento`                  |
| Función       | `configuration` | `fn_get_next_correlative`            | `fn_obtener_siguiente_correlativo`             |
| Función       | `core`          | `fn_anonymize_non_production_data`   | `fn_anonimizar_datos_no_productivos`           |
| Función       | `core`          | `fn_audit_log`                       | `fn_registrar_auditoria`                       |
| Función       | `core`          | `fn_change_history_snapshot`         | `fn_instantanea_historial_cambios`             |
| Función       | `core`          | `fn_export_detached_partition`       | `fn_exportar_particion_desprendida`            |
| Función       | `core`          | `fn_set_audit_fields`                | `fn_establecer_campos_auditoria`               |
| Función       | `core`          | `fn_set_tenant_export_context`       | `fn_establecer_contexto_exportacion_inquilino` |
| Función       | `core`          | `fn_verify_restore_integrity`        | `fn_verificar_integridad_restauracion`         |
| Procedimiento | `core`          | `sp_provision_new_tenant`            | `sp_aprovisionar_nuevo_inquilino`              |
| Función       | `customers`     | `fn_get_available_credit`            | `fn_obtener_credito_disponible`                |
| Función       | `inventory`     | `fn_apply_stock_movement`            | `fn_aplicar_movimiento_stock`                  |
| Procedimiento | `sales`         | `sp_confirm_sales_order`             | `sp_confirmar_pedido_venta`                    |
| Procedimiento | `sales`         | `sp_generate_due_recurring_invoices` | `sp_generar_facturas_recurrentes_vencidas`     |

## 7. Triggers — los 5 nombres distintos (aplicados 982 veces sobre tablas/particiones)

| Actual                           | Propuesto                            | Función que ejecuta                                               |
| -------------------------------- | ------------------------------------ | ----------------------------------------------------------------- |
| `trg_audit_log`                  | `trg_registro_auditoria`             | `fn_registrar_auditoria`                                          |
| `trg_change_history`             | `trg_historial_cambios`              | `fn_change_history_snapshot` → `fn_instantanea_historial_cambios` |
| `trg_prevent_unbalanced_posting` | `trg_prevenir_asiento_desbalanceado` | `fn_prevenir_asiento_desbalanceado`                               |
| `trg_set_audit_fields`           | `trg_establecer_campos_auditoria`    | `fn_establecer_campos_auditoria`                                  |
| `trg_apply_stock_movement`       | `trg_aplicar_movimiento_stock`       | `fn_aplicar_movimiento_stock`                                     |

## 8. Índices, constraints y secuencias

No se listan los ~2.948 índices + 4.752 constraints + 501 secuencias individualmente acá — se
**derivan mecánicamente** de las tablas (§3) y columnas (§4) de este mismo diccionario siguiendo el
patrón documentado en `DATABASE_SPANISH_STANDARD.md §7`. El detalle de los 112 casos que
superarían el límite de 63 bytes de PostgreSQL y su mitigación está en
`DATABASE_MIGRATION_REPORT.md §4`.
