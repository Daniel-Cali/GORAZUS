# Scalability Report — GORAZUS

> "Database Enterprise v1.0" — Fase 1, Parte 7 (2026-07-21).

## 1. Particionamiento — evaluación (ya implementado, no repetido)

27 tablas ya particionadas por rango de tiempo, aprovisionadas al 100%
(`07-estrategia-particionamiento.md`, re-confirmado sin drift en cada
auditoría de esta sesión). Evaluación de los 8 candidatos pedidos
explícitamente:

| Candidato pedido                                                       | Estado                                                                                                                                                                                       |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ventas (`sales.invoices`)                                              | ✅ Ya particionada                                                                                                                                                                           |
| Movimientos (`inventory.stock_movements`)                              | ✅ Ya particionada                                                                                                                                                                           |
| Inventario                                                             | 🔗 `inventory.stock` (saldo actual) no se particiona — correcto, es una tabla de estado mutable pequeña por diseño, no un log; lo que crece sin límite es `stock_movements`, ya particionada |
| Auditoría (`core.audit_logs`)                                          | ✅ Ya particionada                                                                                                                                                                           |
| Logs (`core.system_logs`, `activity_logs`)                             | ✅ Ya particionadas                                                                                                                                                                          |
| Facturas (`sales.invoices`, `purchases.purchase_invoices`)             | ✅ Ya particionadas                                                                                                                                                                          |
| Pagos (`sales.receipts`, `cash.cash_movements`)                        | ✅ Ya particionadas                                                                                                                                                                          |
| Históricos (`inventory.average_cost_history`, `product_price_history`) | 🟡 No particionadas todavía — candidatas reales si el volumen de recálculos de costo crece mucho, sin evidencia de necesidad hoy                                                             |

**Tipo de particionamiento:** Range (por tiempo) es correcto para el
100% de los casos reales de GORAZUS — ninguna tabla se beneficia de
**List** (no hay una columna de baja cardinalidad fija que particione
naturalmente, `tenant_id` cambia por RLS no por partición física) ni de
**Hash** (sin necesidad de distribuir carga de escritura entre
particiones artificialmente — Range ya distribuye por tiempo de forma
natural). No se recomienda ningún tipo adicional.

**Recomendación (no aplicada):** evaluar particionar
`average_cost_history`/`product_price_history` cuando el volumen real de
recálculos lo justifique — bajo impacto, baja urgencia.

## 2. Concurrencia — por qué no se simula una carga real (decisión explícita)

El pedido pide simular 100 a 10.000 usuarios concurrentes y detectar
bloqueos/deadlocks/esperas/contention. **No se ejecuta una prueba de
carga real contra `docker-postgres-1`** en esta pasada — es la misma
instancia que tiene un contenedor de API corriendo en vivo
(`docker-api-1`) y que sostiene el trabajo de todas las auditorías
anteriores de esta sesión; una prueba de 10.000 conexiones/consultas
concurrentes reales es una **acción con riesgo operativo real** (agotar
`max_connections`, saturar CPU/memoria del contenedor, posible caída del
servicio), no una lectura. Se aplica el mismo criterio de cautela ya
usado en toda esta auditoría para acciones de alto riesgo.

**Análisis estructural (sin ejecutar carga), que sí es seguro y
verificable:**

| Mecanismo de concurrencia                                                  | Ya diseñado en                                       |
| -------------------------------------------------------------------------- | ---------------------------------------------------- |
| Optimistic locking (`version`/`row_version`)                               | Columnas universales, todas las 501 tablas           |
| Transacciones cortas (nunca esperar I/O externo dentro de una transacción) | `docs/ddd/09_repositories.md`, `Transaction Manager` |
| Aislamiento por tenant vía RLS (sin lock adicional entre tenants)          | `06-estrategia-seguridad.md`                         |
| Reserva antes que compromiso físico (evita contención en `stock`)          | Política P12, `docs/ddd/16_domain_policies.md`       |
| Colas por consumidor en eventos asíncronos (RabbitMQ, no bloqueante)       | `06-comunicacion-entre-modulos.md`                   |

**Conclusión:** el diseño ya incorpora los mecanismos que previenen
contención a escala (optimistic locking, transacciones cortas,
aislamiento por RLS) — verificarlos bajo carga real es una actividad de
**testing de carga en un entorno de staging dedicado**, no de auditoría
de base de datos, y no debe ejecutarse contra el entorno de desarrollo
compartido sin autorización y sin un entorno aislado para ese propósito.

## 3. Materialized Views

**4 ya existen** (`bi` schema, confirmado en vivo):
`mv_daily_sales_summary`, `mv_inventory_valuation`,
`mv_customer_lifetime_value`, `mv_aging_summary`. De las 8 pedidas
explícitamente:

| Pedida                | Estado                                                                             |
| --------------------- | ---------------------------------------------------------------------------------- |
| Dashboard             | ✅ Cubierta por las 4 existentes combinadas                                        |
| KPIs                  | ✅ `bi.kpis` (tabla, no vista — snapshot ya diseñado)                              |
| Inventario valorizado | ✅ `mv_inventory_valuation`                                                        |
| Ventas mensuales      | ✅ `mv_daily_sales_summary` (agregable a mensual en el reporte)                    |
| Rotación              | ❌ No existe — candidata real                                                      |
| Top Productos         | ❌ No existe — candidata real                                                      |
| Compras               | ❌ No existe (análoga a `mv_daily_sales_summary` pero de compras) — candidata real |
| Utilidad              | ❌ No existe — candidata real (derivable de `mv_daily_sales_summary` + costo)      |

**4 gaps reales, todos de bajo riesgo técnico** (una `CREATE MATERIALIZED
VIEW` no destructiva, refrescable vía el mismo mecanismo ya usado por
`fn_refresh_data_marts`) — no aplicadas en esta pasada, candidatas para
cuando se autorice DDL.

## 4. Caché (Redis) — preparación

Ya diseñado como infraestructura (`08-infraestructura-y-despliegue.md
§3`, contenedor `docker-redis-1` activo) y como componente de Core
Platform (`Cache Framework`,
`32-core-platform/08-frameworks-de-infraestructura.md`). Candidatos
naturales para cachear (consultas frecuentes, catálogos, configuración):
`configuration.currencies`/`countries`/`price_lists`,
`products.units_of_measure`, resultados de `bi.mv_*` — todos catálogos
de baja tasa de cambio, alto reuso. **Sin acción nueva** — el mecanismo
ya existe, solo falta que cada módulo lo adopte al construirse (fuera
del alcance de una auditoría de base de datos).

## 5. Alta disponibilidad

Ya diseñado en detalle en
[10-estrategia-alta-disponibilidad.md](./10-estrategia-alta-disponibilidad.md)
(Streaming Replication, Hot Standby, Failover, RPO/RTO) y
[09-estrategia-replicacion.md](./09-estrategia-replicacion.md) (Read
Replica) — no se repite. Point-in-Time Recovery y Backups ya diseñados
en [08-estrategia-respaldo.md](./08-estrategia-respaldo.md). Sin
hallazgos nuevos.

## 6. Validación de escala — la tabla pedida

| Dimensión pedida            | ¿El modelo lo soporta sin rediseño?                                           |
| --------------------------- | ----------------------------------------------------------------------------- |
| 10 millones de productos    | ✅ Sin límite estructural — `uuid` PK, sin restricción de cardinalidad        |
| 100 millones de movimientos | ✅ Particionamiento por tiempo ya diseñado exactamente para este volumen      |
| 50 millones de ventas       | ✅ `sales.invoices` particionada                                              |
| 10 millones de clientes     | ✅ Sin límite estructural                                                     |
| 500 sucursales              | ✅ `branch_id` universal, sin límite                                          |
| 100 empresas                | ✅ `company_id`/`tenant_id` universal, + Grupo Corporativo para consolidación |

**0 respuestas "No" — ningún rediseño estructural necesario.**

## 7. Trazabilidad

Hallazgos reales de este documento: 4 Materialized Views candidatas
(§3), 1 candidato de particionamiento futuro sin urgencia (históricos de
costo, §1), y la decisión explícita de no ejecutar una prueba de carga
real contra infraestructura compartida (§2) — consistente con el
criterio de cautela de toda esta auditoría ante acciones de riesgo
operativo real.

**Siguiente documento:** [PERFORMANCE_REPORT.md](./PERFORMANCE_REPORT.md).
