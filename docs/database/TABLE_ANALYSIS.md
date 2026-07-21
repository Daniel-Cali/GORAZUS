# Table Analysis — GORAZUS

> "Database Enterprise v1.0" — Fase 1, Parte 5 (2026-07-21). Complementa
> [NORMALIZATION_REPORT.md](./NORMALIZATION_REPORT.md) con el análisis de
> **estándares de nomenclatura y tipos** pedido explícitamente en esta
> Parte 5 (prefijos, sufijos, tipos de datos, restricciones, comentarios)
> — la parte del checklist que ni `DATABASE_ANALYSIS.md` (Parte 3) ni
> `NORMALIZATION_REPORT.md` cubrían todavía como verificación dedicada.

## 1. Uniformidad de nombres de tabla

| Estándar                   | Cumplimiento                                                   |
| -------------------------- | -------------------------------------------------------------- |
| snake_case                 | ✅ 501 de 501                                                  |
| Plural                     | ✅ Patrón dominante, 0 excepciones detectadas en el barrido    |
| Sin abreviaturas crípticas | ✅ — nombres completos (`purchase_requisitions`, no `pr_reqs`) |
| Prefijo de vista (`v_`)    | ✅ Las 10 vistas siguen `v_<nombre>` sin excepción             |

## 2. Uniformidad de nombres de columna

| Estándar                                 | Cumplimiento                                                                                                                                                                                                               |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| snake_case                               | ✅ 0 violaciones (re-confirmado)                                                                                                                                                                                           |
| Sufijo `_id` para FK                     | ✅ Consistente en las 5.164 FK                                                                                                                                                                                             |
| Prefijo `is_`/`has_` para booleanos      | 🟡 36 de las columnas booleanas totales no lo siguen (`accepts_postings`, `succeeded`, `matched`, etc.) — cosmético, ya documentado en `AUDIT_FASE1_ENTERPRISE.md §5.3`, sin cambio recomendado sin autorización explícita |
| Sufijo `_at` para timestamps             | ✅ Consistente (`created_at`, `deleted_at`, `occurred_at`)                                                                                                                                                                 |
| Sufijo `_code` para códigos ISO/estándar | ✅ Consistente (`currency_code`, `country_code` donde aplica)                                                                                                                                                              |

## 3. Tipos de datos

| Regla                                                | Cumplimiento                                                                                                   |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| PK/FK siempre `uuid`                                 | ✅ 100% (701/701 PK, ver `RELATIONSHIP_CATALOG.md §1`)                                                         |
| Montos siempre `numeric`, nunca `float`/`double`     | ✅ 0 columnas de dinero/cantidad en tipo de punto flotante encontradas                                         |
| Cantidades fraccionables con precisión suficiente    | ✅ `numeric(18,6)` — 6 decimales, confirmado suficiente para venta por metro/peso/volumen                      |
| Timestamps con zona horaria                          | ✅ `timestamp with time zone` consistente, 0 `timestamp without time zone` encontrados en columnas universales |
| Booleanos como `boolean`, nunca `smallint`/`char(1)` | ✅ 0 excepciones                                                                                               |

## 4. Restricciones

Ver el detalle cuantitativo completo en
[DATABASE_ANALYSIS.md §2](./DATABASE_ANALYSIS.md#2-restricciones--verificación-agregada-nueva-no-hecha-en-pasadas-anteriores)
(201 `CHECK`, 749 `UNIQUE`, 58% `NOT NULL`) — no se repite. Verificación
nueva de esta pasada: **0 restricciones contradictorias** (ningún `CHECK`
entra en conflicto con un `DEFAULT` o con otro `CHECK` de la misma
columna).

## 5. Comentarios

Ver [DATABASE_ANALYSIS.md §2.1](./DATABASE_ANALYSIS.md#21--sobre-la-ausencia-de-comentarios-de-columna-hallazgo-honesto-no-oculto) —
474/501 tablas con `COMMENT ON TABLE`, prácticamente 0 con
`COMMENT ON COLUMN` (documentado externamente en `dictionary/*.md` en su
lugar). No se repite el análisis.

## 6. Columnas — clasificación final (entregable, cierra el checklist de la Parte 5)

| Categoría                     | Cantidad                                                          | Acción                                                         |
| ----------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------- |
| Calculables sin justificación | 0                                                                 | Ninguna                                                        |
| Redundantes                   | 0                                                                 | Ninguna                                                        |
| Sin uso confirmable           | No determinable en `dev`                                          | Reevaluar con datos de producción reales, no en esta auditoría |
| Obsoletas                     | 0                                                                 | Ninguna                                                        |
| Nombres ambiguos              | 1 candidata, revisada y descartada (`core.system_settings.value`) | Ninguna                                                        |

## 7. Trazabilidad

Este documento cierra específicamente la sección "Estándares" del pedido
(uniformar nombres/prefijos/sufijos/tipos/restricciones/comentarios) que
no tenía todavía una verificación dedicada — todo lo demás pedido en esta
Parte 5 vive en [NORMALIZATION_REPORT.md](./NORMALIZATION_REPORT.md).
