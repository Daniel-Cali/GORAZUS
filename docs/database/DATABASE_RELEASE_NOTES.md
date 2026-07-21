# GORAZUS Database Enterprise v1.0.0 — Release Notes

> 2026-07-21. Contenido preparado para el GitHub Release
> `database-v1.0.0` (pendiente de publicación — ver nota al final de
> este documento).

## Resumen ejecutivo

Después de 8 partes de auditoría exhaustiva contra Postgres 17 real
(501 tablas, 5.164 relaciones, 22 schemas), el modelo de datos de
GORAZUS ERP queda certificado como **Database Enterprise v1.0.0**, con
una calificación de **94/100**. El modelo está listo para iniciar el
desarrollo completo del Backend Core, con 2 hallazgos de mejora ya
identificados y especificados para una futura migración versionada.

## Nuevas características

Ninguna — esta auditoría fue 100% de solo lectura, sin DDL aplicado.
El modelo de datos es el mismo que existía antes de empezar la
Parte 1; lo que es nuevo es su **verificación y documentación
exhaustiva**.

## Mejoras (documentadas, especificadas, no aplicadas)

- Diseño completo de políticas RLS de Empresa/Sucursal (`RLS_DESIGN.md`).
- 4 gaps funcionales especificados con SQL de referencia
  (`FUNCTIONAL_GAPS.md`, `NORMALIZATION_REPORT.md §9`).
- Recomendación de tuning de PostgreSQL (`random_page_cost`,
  `pg_stat_statements`) — `POSTGRESQL_TUNING.md`.
- 4 Materialized Views candidatas (Rotación, Top Productos, Compras,
  Utilidad) — `SCALABILITY_REPORT.md §3`.

## Correcciones (de documentación, no de schema)

- Resuelto el único FK `CASCADE` que quedaba sin identificar (era de
  `pg_partman`, no de negocio) — `FOREIGN_KEYS.md`.
- Corregida la afirmación de que `company_isolation` ya existía como
  política RLS — no existía, ahora documentado con precisión —
  `RLS_DESIGN.md`.
- Reconciliados varios conteos que estaban ligeramente desactualizados
  entre pasadas (funciones, schemas) — sin impacto real, solo precisión.

## Documentación

**~35 documentos nuevos** en `docs/database/` a lo largo de las 8
partes — inventario completo, catálogo de schemas, análisis de tablas,
catálogo de relaciones, reporte de normalización, validación funcional
de negocio, reporte de rendimiento, y el set de seguridad/auditoría/
multiempresa que incluye el hallazgo de RLS. Índice completo:
[README.md](./README.md).

## Estado de calidad

| Dimensión           | Score  |
| ------------------- | ------ |
| Arquitectura        | 94     |
| Normalización       | 100    |
| Integridad          | 99     |
| Seguridad           | 88     |
| Escalabilidad       | 95     |
| Rendimiento         | 93     |
| Documentación       | 98     |
| Cobertura funcional | 96     |
| Mantenibilidad      | 95     |
| **General**         | **94** |

Detalle completo: [DATABASE_SCORE.md](./DATABASE_SCORE.md). Certificación
formal: [DATABASE_CERTIFICATION.md](./DATABASE_CERTIFICATION.md).

## Hallazgos que acompañan este release (no bloqueantes)

1. RLS de Empresa/Sucursal ausente — real para multiempresa avanzada.
2. 185 FK cross-schema — pendiente de ADR arquitectónico.
3. 4 gaps funcionales aditivos (materiales peligrosos, país/idioma/
   timezone, Costo Específico, Contratos de Proveedor).

## Nota sobre la publicación de este release

Este documento está preparado como contenido para un GitHub Release
(`database-v1.0.0`), pero **publicarlo requiere configurar un remoto
`origin` (no configurado hasta ahora en este repositorio local) y
hacer push de la rama/tag a GitHub** — una acción visible externamente
que no se ejecuta sin confirmación explícita. Ver el resumen de esta
conversación para la pregunta pendiente al respecto.
