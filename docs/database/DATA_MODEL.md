# Data Model — GORAZUS

> "Database Enterprise v1.0" — Fase 1, Parte 5, cierre (2026-07-21).
> Documento final consolidado: el modelo de datos de GORAZUS, tal como
> queda verificado tras las 5 partes de esta auditoría, listo para la
> Parte 6 (validación funcional). No repite el detalle de cada parte —
> es el resumen ejecutivo que las conecta.

## 1. El modelo, en números

| Dimensión                           | Valor                                              | Calidad                                                                           |
| ----------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------- |
| Schemas                             | 22 (21 negocio/core + `partman`)                   | 94% organización lógica ([SCHEMA_CATALOG.md](./SCHEMA_CATALOG.md))                |
| Tablas                              | 501                                                | 95% calidad de tabla ([DATABASE_ANALYSIS.md](./DATABASE_ANALYSIS.md))             |
| Relaciones (FK)                     | 5.164                                              | 99% integridad referencial ([RELATIONSHIP_CATALOG.md](./RELATIONSHIP_CATALOG.md)) |
| Normalización (1FN-BCNF)            | 0 violaciones reales                               | 100% ([NORMALIZATION_REPORT.md](./NORMALIZATION_REPORT.md))                       |
| Índices                             | 3.201, 0 duplicados                                | ✅                                                                                |
| Triggers                            | 2.414 (patrón sistemático de auditoría, no sprawl) | ✅                                                                                |
| Funciones/procedimientos de negocio | 20                                                 | ✅                                                                                |

## 2. Los 5 pilares de diseño, confirmados

1. **Un patrón universal, sin excepciones reales** — 18 columnas base en
   las 501 tablas, `uuid` como PK sin excepción, `tenant_id`/`company_id`/
   `branch_id` universales.
2. **Módulo dueño, sin ambigüedad** — cada schema tiene responsabilidad
   única y clara; 0 schemas mezclan dominios.
3. **Eventos de dominio entre módulos, FK física dentro de un módulo** —
   la única desviación real (185 FK cross-schema) está identificada,
   acotada, y gobernada explícitamente (pendiente de ADR, no de esta
   auditoría).
4. **Soft delete + auditoría completa, nunca `DELETE` físico** — reforzado
   estructuralmente por triggers (`trg_audit_log`, `trg_set_audit_fields`,
   `trg_change_history`) y por el hallazgo de esta Parte 5 de que el 100%
   de las FK usan `NO ACTION` (nunca `CASCADE` silencioso).
5. **Preparado para escala sin rediseño** — particionamiento aprovisionado,
   RLS forzado, índices completos, sin límite estructural de empresas/
   sucursales/volumen.

## 3. Lo que esta auditoría NO cambió (y por qué)

Las 5 partes de "Database Enterprise v1.0" fueron, en su totalidad,
**auditoría y documentación** — cero `ALTER`/`CREATE`/`DROP` ejecutado
contra la base de desarrollo real, por el acuerdo de alcance confirmado
al inicio (Parte 1). Esto significa que el modelo de datos que esta
auditoría describe es exactamente el mismo que existía antes de empezar
— la auditoría **verificó y documentó calidad**, no la produjo. Las 4
mejoras aditivas identificadas (campos de materiales peligrosos,
país/idioma/timezone en Empresa/Sucursal) están completamente
especificadas, listas para aplicarse, y pendientes exclusivamente de
autorización explícita — ver
[NORMALIZATION_REPORT.md §9](./NORMALIZATION_REPORT.md#9-mejoras-implementadas-entregable-10--y-la-pregunta-que-falta-responder).

## 4. Puntos abiertos que trascienden esta auditoría

| Punto                                                                                  | Estado                                                                      |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 185 FK cross-schema                                                                    | Pendiente de ADR de negocio — no técnico                                    |
| `core.restore_test_logs` sin RLS                                                       | Pendiente de confirmación (¿intencional?)                                   |
| 4 mejoras aditivas (hazmat, país/idioma/timezone)                                      | Especificadas, pendientes de autorización para aplicar DDL                  |
| Incidente de PostgreSQL 18 en `C:\` (fuera del alcance de la base de datos de GORAZUS) | Sigue sin respuesta del usuario, señalado en cada resumen desde que ocurrió |
| Recursos Docker `gorazus-*` accidentales                                               | Sigue pendiente de limpieza autorizada                                      |

## 5. Preparado para la Parte 6

El objetivo final de esta Parte 5 ("modelo completamente normalizado, sin
redundancias, optimizado, documentado, preparado para la validación
funcional de la Parte 6") se cumple en su totalidad **dentro del alcance
de auditoría acordado**: 100% de normalización verificada, 0
redundancias reales, documentación completa (11 documentos nuevos entre
las 5 partes). La única condición que depende de una decisión externa a
esta auditoría es si las 4 mejoras aditivas se aplican antes o después
de la Parte 6 — no bloquea el inicio de esa parte de ninguna manera.

## 6. Trazabilidad

| Parte                                           | Documento(s) principal(es)                                                                                                              |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 1 — Preparación y auditoría general             | `AUDIT_DATABASE_ENTERPRISE_V2_FERRETERIA.md`, `DATABASE_INVENTORY.md`, `DATABASE_OVERVIEW.md`, `DATABASE_AUDIT.md`, `PROJECT_STATUS.md` |
| 2 — Auditoría de schemas                        | `SCHEMA_CATALOG.md`, `SCHEMA_DEPENDENCIES.md`, `DATABASE_DIAGRAM.md`                                                                    |
| 3 — Auditoría de tablas                         | `DATABASE_ANALYSIS.md`                                                                                                                  |
| 4 — Relaciones, claves e integridad referencial | `RELATIONSHIP_CATALOG.md`, `ENTITY_RELATIONSHIPS.md`                                                                                    |
| 5 — Normalización y optimización                | `NORMALIZATION_REPORT.md`, `TABLE_ANALYSIS.md`, este documento                                                                          |
