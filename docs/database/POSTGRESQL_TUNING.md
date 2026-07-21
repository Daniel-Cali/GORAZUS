# PostgreSQL Tuning — GORAZUS

> "Database Enterprise v1.0" — Fase 1, Parte 7 (2026-07-21). Revisión de
> configuración de Postgres 17 real (`docker-postgres-1`), vía
> `pg_settings` en vivo. **Nota de alcance:** cambiar estos valores
> requiere editar `postgresql.conf`/`infra/docker/docker-compose.yml` y
> **reiniciar el contenedor** — es un cambio de infraestructura, no de
> schema, y sigue fuera del acuerdo de solo-documentación de esta
> auditoría. Se documentan los valores actuales y las recomendaciones,
> sin aplicar ninguna.

## 1. Configuración actual vs. recomendación Enterprise

| Parámetro                      | Valor actual                      | Recomendación Enterprise                                                            | Justificación                                                                                                                                                                                                                                                                     |
| ------------------------------ | --------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shared_buffers`               | 128MB                             | 25% de la RAM disponible del host/contenedor                                        | Valor actual es el default genérico de Postgres, no dimensionado para el contenedor real                                                                                                                                                                                          |
| `effective_cache_size`         | 4GB                               | 50-75% de la RAM disponible                                                         | Valor actual es un default razonable pero no confirmado contra la RAM real asignada al contenedor Docker (`docker inspect` muestra límite de memoria **sin configurar** — el contenedor no tiene tope explícito, hereda del host)                                                 |
| `work_mem`                     | 4MB                               | 16-64MB (ERP con reportes/agregaciones complejas)                                   | Valor actual es el default — insuficiente para `Sort`/`Hash` de reportes con `GROUP BY` sobre volumen alto (Kardex, estados financieros)                                                                                                                                          |
| `maintenance_work_mem`         | 64MB                              | 256-512MB                                                                           | Acelera `VACUUM`/creación de índice en tablas grandes — relevante cuando el volumen real crezca                                                                                                                                                                                   |
| `wal_buffers`                  | 4MB                               | Se autocalcula bien desde `shared_buffers` — subirá junto con ese cambio            | Sin acción independiente necesaria                                                                                                                                                                                                                                                |
| `max_connections`              | 100                               | **No subir a miles** — ver §2                                                       | Ya en un valor razonable para conexión directa; el error sería subirlo, no bajarlo                                                                                                                                                                                                |
| `checkpoint_timeout`           | 300s (default)                    | Mantener, o subir a 900s-15min si `wal` crece mucho con volumen real                | Sin evidencia todavía de necesidad de cambio                                                                                                                                                                                                                                      |
| `max_wal_size`                 | 1024MB                            | 2-4GB con volumen de producción real                                                | Evita checkpoints demasiado frecuentes bajo escritura alta                                                                                                                                                                                                                        |
| `random_page_cost`             | 4 (default, asume disco mecánico) | **1.1** (almacenamiento SSD, el caso real de Docker Desktop/cualquier nube moderna) | 🟠 **El hallazgo más accionable de este documento** — con `random_page_cost=4`, el optimizador subestima sistemáticamente el costo de `Seq Scan` frente a `Index Scan` en almacenamiento SSD, pudiendo preferir escaneos secuenciales innecesarios a medida que el volumen crezca |
| `autovacuum`                   | `on`                              | Mantener `on` — ya correcto                                                         | —                                                                                                                                                                                                                                                                                 |
| `autovacuum_vacuum_cost_limit` | -1 (usa el valor global)          | Revisar cuando haya volumen real — sin evidencia de necesidad de cambio todavía     | —                                                                                                                                                                                                                                                                                 |

## 2. Sobre `max_connections` y 10.000 usuarios concurrentes (aclaración técnica importante)

El pedido pide validar soporte para "100, 500, 1.000, 5.000, 10.000
usuarios" — **la traducción correcta de esto nunca es
`max_connections = 10000`**. Ninguna instancia de Postgres real
(incluida la de SAP/NetSuite/Dynamics detrás de escena) sostiene 10.000
conexiones **directas** simultáneas de forma saludable — cada conexión
de Postgres es un proceso del sistema operativo, con su propio overhead
de memoria; miles de conexiones directas degradan el rendimiento antes
de agotar `max_connections`. El patrón Enterprise correcto — y el que
GORAZUS ya asume implícitamente en su arquitectura de backend
(`docs/architecture/12-backend-enterprise.md`, pool de conexión de
Prisma) — es:

- `max_connections = 100` (valor actual) es razonable para un **pool de
  conexión acotado** (p. ej. 20-50 conexiones por instancia de `apps/api`,
  varias instancias detrás de un balanceador).
- 10.000 usuarios concurrentes se sostienen con **cientos** de
  conexiones reales a Postgres, no con una conexión por usuario — el
  backend NestJS ya usa un pool (`core/database`), y una capa adicional
  de pooling externo (PgBouncer, modo `transaction`) es la extensión
  natural si el volumen real algún día se acerca a ese número.
- **No se recomienda subir `max_connections`** — sería la corrección
  incorrecta al problema correcto.

## 3. `pg_stat_statements` — no habilitado (hallazgo real)

La extensión pedida explícitamente para monitoreo de consultas
(`pg_stat_statements`) **no está instalada** en la instancia real —
verificado contra `pg_extension`. A diferencia de una extensión normal
(`CREATE EXTENSION`), esta requiere que `pg_stat_statements` esté en
`shared_preload_libraries` en `postgresql.conf`, lo que exige **reiniciar
el contenedor** — no se puede activar con una sola sentencia SQL en
caliente. Es el gap de monitoreo más importante de esta pasada.

**Recomendación (no aplicada):**

```
# postgresql.conf o docker-compose (command: ["postgres", "-c", "shared_preload_libraries=pg_stat_statements", ...])
shared_preload_libraries = 'pg_stat_statements'
pg_stat_statements.track = all
```

seguido de `CREATE EXTENSION pg_stat_statements;` tras el reinicio.

## 4. Monitoreo — qué ya está disponible sin cambios (entregable, sin aplicar)

| Métrica pedida                                 | Disponible hoy sin cambios                                                                                                                |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `pg_stat_activity`                             | ✅ Ya consultable (usado en esta misma pasada, §1 de `PERFORMANCE_REPORT.md`)                                                             |
| Locks (`pg_locks`)                             | ✅ Ya consultable                                                                                                                         |
| Vacuum (`pg_stat_user_tables.last_autovacuum`) | ✅ Ya consultable                                                                                                                         |
| Bloat                                          | 🔗 Requiere una consulta específica (`pgstattuple` extension, no instalada) o herramienta externa — no crítico con 0 filas reales todavía |
| Uso de índices (`pg_stat_user_indexes`)        | ✅ Ya consultable (usado en `INDEX_REPORT.md`)                                                                                            |
| Tiempo de consultas                            | ❌ Requiere `pg_stat_statements` — ver §3                                                                                                 |

## 5. Trazabilidad

**0 cambios de configuración aplicados** — todos requieren reinicio del
contenedor, fuera del alcance de esta auditoría de solo documentación.
El hallazgo más accionable (`random_page_cost`) es también el de menor
riesgo de aplicar cuando se autorice (una sola línea de configuración,
efecto inmediato en el planificador, sin downtime más allá del reinicio).

**Siguiente documento:** [SCALABILITY_REPORT.md](./SCALABILITY_REPORT.md).
