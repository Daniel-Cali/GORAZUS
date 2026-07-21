# Database Changelog — GORAZUS

> Historial dedicado de la documentación de base de datos, distinto del
> [CHANGELOG.md](../../CHANGELOG.md) de la raíz (que registra cambios de
> **código**). Formato [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

## [1.0.0] — 2026-07-21 — Database Enterprise v1.0.0 (certificación)

Cierre y congelación del modelo de datos tras 8 partes de auditoría
("Database Enterprise v1.0", rama `feature/database-audit` →
`release/database-v1`). 0 DDL aplicado en todo el proceso — el modelo
es idéntico al que existía antes de empezar; lo nuevo es su
verificación y documentación exhaustiva. Ver
[DATABASE_CERTIFICATION.md](./DATABASE_CERTIFICATION.md).

### Parte 1 — Preparación y auditoría general

Formas normales verificadas explícitamente por primera vez (0
violaciones), catálogo de vistas/triggers/funciones/secuencias
re-confirmado sin drift, análisis funcional ferretería/distribución (2
gaps reales), informe final con % de calidad.
Documentos: `AUDIT_DATABASE_ENTERPRISE_V2_FERRETERIA.md`,
`DATABASE_INVENTORY.md`, `DATABASE_OVERVIEW.md`, `DATABASE_AUDIT.md`,
`PROJECT_STATUS.md`.

### Parte 2 — Auditoría de schemas

Inventario y calidad de organización de los 22 schemas, reconciliación
contra la lista de schemas esperada del pedido, verificación de
columnas multiempresa (2 gaps reales: país/idioma/timezone).
Documentos: `SCHEMA_CATALOG.md`, `SCHEMA_DEPENDENCIES.md`,
`DATABASE_DIAGRAM.md`.

### Parte 3 — Auditoría de tablas

Verificación de calidad agregada contra las 501 tablas (CHECK/UNIQUE/
comentarios/outliers de tamaño), validación ferretería a nivel de
tabla (multi-proveedor, historial de costos confirmados).
Documento: `DATABASE_ANALYSIS.md`.

### Parte 4 — Relaciones, claves e integridad referencial

Resuelto el único FK `CASCADE` pendiente de identificar (era de
infraestructura, no de negocio), 0 columnas FK de negocio sin índice
(re-verificado con metodología independiente), cardinalidad
clasificada (0 relaciones 1:1 reales, 10+ tablas puente), las 19
relaciones de ferretería pedidas confirmadas.
Documentos: `RELATIONSHIP_CATALOG.md`, `ENTITY_RELATIONSHIPS.md`.

### Parte 5 — Normalización y optimización

Segunda verificación independiente de 1FN-BCNF (0 violaciones), 0
catálogos duplicados verificado explícitamente, 100% de normalización.
Documentos: `NORMALIZATION_REPORT.md`, `TABLE_ANALYSIS.md`,
`DATA_MODEL.md`.

### Parte 6 — Validación funcional del negocio

Simulación completa de ~95 procesos de ferretería Enterprise, 96% de
cobertura funcional, confirmación de inventario en tránsito y
balance/estado de resultados/flujo de caja/centros de costo, 2 gaps
funcionales nuevos (Costo Específico, Contratos de Proveedor).
Documentos: `BUSINESS_VALIDATION.md`, `BUSINESS_RULES.md`,
`FUNCTIONAL_GAPS.md`.

### Parte 7 — Rendimiento y escalabilidad

Confirmada estrategia de índices ya Enterprise-grade (BTree/BRIN/GIN/
parcial/covering, 0 nuevos necesarios), hallazgo de poda de particiones
en consultas Kardex (~11x más barato con rango de fecha), tuning de
PostgreSQL documentado (`random_page_cost`, `pg_stat_statements`), 93%
de rendimiento.
Documentos: `INDEX_REPORT.md`, `QUERY_ANALYSIS.md`,
`POSTGRESQL_TUNING.md`, `SCALABILITY_REPORT.md`, `PERFORMANCE_REPORT.md`.

### Parte 8 — Seguridad, auditoría, cumplimiento y multiempresa

**Hallazgo principal de toda la auditoría:** verificado contra
`pg_policies` real que solo existe RLS de Tenant — 0 políticas de
Empresa/Sucursal. 88% de seguridad.
Documentos: `RLS_DESIGN.md`, `SECURITY_REPORT.md`, `AUDIT_REPORT.md`,
`MULTITENANT_REPORT.md`.

### Parte 10 — Cierre, certificación y congelación

Re-verificación final (0 drift confirmado contra las 8 partes
anteriores), checklist de 16 puntos, score de 94/100, certificación
formal, política de migraciones versionadas a partir de este release.
Documentos: `DATABASE_FINAL_REPORT.md`, `DATABASE_SCORE.md`,
`DATABASE_CERTIFICATION.md`, `DATABASE_RELEASE_NOTES.md`, este
documento.

## Trazabilidad

Este changelog es el índice cronológico de las 8 partes — el índice
temático completo, con descripción de cada documento, vive en
[README.md](./README.md).
