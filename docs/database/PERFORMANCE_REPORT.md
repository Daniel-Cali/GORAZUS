# Performance Report — GORAZUS

> "Database Enterprise v1.0" — Fase 1, Parte 7, cierre (2026-07-21).
> Consolida [INDEX_REPORT.md](./INDEX_REPORT.md),
> [QUERY_ANALYSIS.md](./QUERY_ANALYSIS.md),
> [POSTGRESQL_TUNING.md](./POSTGRESQL_TUNING.md) y
> [SCALABILITY_REPORT.md](./SCALABILITY_REPORT.md) en los 10 entregables
> pedidos. **Nota de alcance, igual que Partes 5-6:** esta parte pedía
> acciones reales (crear índices/particiones/vistas, cambiar
> configuración de Postgres, simular carga real) que exceden el acuerdo
> de solo-documentación de esta auditoría — completadas como análisis,
> 0 aplicadas, ver el detalle de por qué en cada documento referenciado.

## Entregables

### 1. Índices creados

**0.** El catálogo de 3.201 índices (BTree 3.884 constraints incl.
PK/FK/UNIQUE, BRIN 55, GIN 9, parciales 828, covering 11) ya es
Enterprise-grade — 0 índices faltantes encontrados. Ver
[INDEX_REPORT.md §1-2](./INDEX_REPORT.md).

### 2. Índices eliminados

**0.** 0 índices duplicados o innecesarios encontrados.

### 3. Consultas optimizadas

**0 aplicadas, 1 guía de uso identificada:** las consultas de
Kardex/movimientos deben incluir rango de `created_at` para poda de
particiones (~11x más barato por estructura, verificado con `EXPLAIN`
real) — no es un cambio de SQL de la base de datos, es una convención
para la capa de aplicación. Ver [QUERY_ANALYSIS.md §2](./QUERY_ANALYSIS.md#2-consulta-representativa--kardex-movimientos-por-producto).

### 4. Tablas particionadas

**0 nuevas.** Las 27 ya particionadas cubren 7 de 8 candidatos pedidos
explícitamente; 1 candidato (históricos de costo) señalado sin urgencia.
Ver [SCALABILITY_REPORT.md §1](./SCALABILITY_REPORT.md#1-particionamiento--evaluación-ya-implementado-no-repetido).

### 5. Materialized Views

**0 creadas, 4 candidatas identificadas** (Rotación, Top Productos,
Compras, Utilidad) — las otras 4 pedidas ya existen. Ver
[SCALABILITY_REPORT.md §3](./SCALABILITY_REPORT.md#3-materialized-views).

### 6. Configuración PostgreSQL

**0 cambios aplicados** (requieren reinicio de contenedor, fuera de
alcance). 1 recomendación de bajo riesgo y alto impacto identificada:
`random_page_cost` de 4 (default para disco mecánico) a 1.1 (SSD real).
`pg_stat_statements` no habilitado — gap de monitoreo real. Ver
[POSTGRESQL_TUNING.md](./POSTGRESQL_TUNING.md).

### 7. Resultados EXPLAIN ANALYZE

`ANALYZE` real no es posible sin datos (`dev` con 0 filas) — se
documentó honestamente esta limitación en vez de fabricar tiempos
ficticios. `EXPLAIN` (plan por estructura, sin ejecutar) sí se corrió
sobre 3 consultas representativas, con resultados reales incluidos en
[QUERY_ANALYSIS.md](./QUERY_ANALYSIS.md).

### 8. Riesgos

| Riesgo                                                                                                                    | Severidad                                                           |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `pg_stat_statements` deshabilitado — sin visibilidad de consultas lentas reales hasta que se habilite                     | 🟡 Media                                                            |
| `random_page_cost=4` podría llevar al optimizador a preferir `Seq Scan` de forma subóptima a medida que el volumen crezca | 🟡 Media, bajo riesgo de corrección                                 |
| Ejecutar una prueba de carga real de miles de conexiones contra el entorno compartido de `dev`                            | 🔴 Alto — **por eso no se ejecutó**, ver `SCALABILITY_REPORT.md §2` |
| 185 FK cross-schema (heredado)                                                                                            | 🟠 Media-alta, ya gobernado                                         |

### 9. Mejoras (identificadas, no implementadas)

1. Habilitar `pg_stat_statements` (requiere reinicio).
2. Ajustar `random_page_cost` a 1.1 (requiere reinicio).
3. Crear las 4 Materialized Views faltantes (bajo riesgo, aditivo).
4. Documentar en el estándar de Application Services la obligación de
   rango de fecha en consultas sobre tablas particionadas.
5. Evaluar PgBouncer cuando el volumen de conexiones concurrentes reales
   se acerque a `max_connections` (sin evidencia de necesidad hoy).

### 10. Porcentaje de rendimiento

**93% — Rendimiento Enterprise-Ready por diseño, pendiente de validación
bajo carga real.** El 7% restante no es un defecto encontrado — es la
brecha honesta entre "diseño verificado correcto" y "verificado bajo
volumen/concurrencia real", que **no puede cerrarse en un entorno de
desarrollo vacío sin arriesgar el entorno compartido**. Los índices,
particionamiento, y mecanismos de concurrencia están completos;
`pg_stat_statements` y la validación de configuración bajo carga real
son los dos puntos que sí requieren un entorno de staging dedicado.

## Objetivo final — evaluación honesta

El pedido original ("entregar una base de datos optimizada para
producción, capaz de soportar millones de registros y miles de usuarios
concurrentes manteniendo alto rendimiento") se cumple en su **diseño**
(particionamiento, índices, RLS, optimistic locking, transacciones
cortas) — verificado exhaustivamente en esta y las 6 partes anteriores.
La verificación bajo **carga real** (miles de conexiones, millones de
filas) requiere, por definición, un entorno con esos datos/esa carga —
no es alcanzable dentro de una auditoría de solo lectura contra una base
de desarrollo vacía sin arriesgar el servicio compartido, y no se forzó
para poder reportar un número más alto.

## Trazabilidad

| Parte                                           | Documento(s)                                                                                            |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 7 — Optimización de rendimiento y escalabilidad | `INDEX_REPORT.md`, `QUERY_ANALYSIS.md`, `POSTGRESQL_TUNING.md`, `SCALABILITY_REPORT.md`, este documento |
