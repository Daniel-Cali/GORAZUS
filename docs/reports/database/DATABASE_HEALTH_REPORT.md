# Informe de Salud — Base de Datos GORAZUS

> Database Finalization, Fase 5 (Validación Enterprise). Estado real post-migración, verificado en
> vivo. Reemplaza la versión anterior de este archivo (línea base pre-renombrado de la fase de
> diseño de estandarización en español, que no llegó a ejecutarse) — esta es la foto post-Fase de
> Completado, con cambios reales aplicados.

## 1. Estado general — sano

| Chequeo                          | Resultado                                                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| PostgreSQL corriendo             | ✅ 17.10, saludable                                                                                                            |
| Tablas esperadas presentes       | ✅ 503 de 503 (501 certificadas + 2 nuevas de esta fase)                                                                       |
| FKs no validadas                 | ✅ 0                                                                                                                           |
| Índices inválidos                | ✅ 0                                                                                                                           |
| RLS forzado en tablas de negocio | ✅ 473 preexistentes + 2 nuevas = 475 (`core.restore_test_logs` sigue excluida a propósito)                                    |
| Datos preexistentes              | ✅ 100% preservados — verificado conteo de filas antes/después en `products.products` (2) y `core.companies` (13), sin pérdida |
| Extensiones                      | ✅ 4 — sin cambios                                                                                                             |

## 2. Cambios de esta fase — resumen

7 adiciones (`DATABASE_COMPLETION_REPORT.md`), todas aditivas: 2 tablas nuevas, 10 columnas
nuevas, 3 `CHECK` extendidos, 8 índices nuevos, 5 FK nuevas. **0 tablas eliminadas, 0 columnas
eliminadas, 0 datos perdidos, 0 cambios rompientes.**

## 3. Riesgos identificados

| Riesgo                                                        |           Severidad           | Detalle                                                                                                                                                                                                       |
| ------------------------------------------------------------- | :---------------------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Domain Service de Costo Específico no existe                  |            🟡 Baja            | El schema soporta `specific_identification`, pero el enum de aplicación (`METODOS_COSTEO`) todavía no lo expone — inalcanzable vía API hasta que se construya, no hay riesgo de uso incorrecto mientras tanto |
| 5 bugs preexistentes descubiertos (no causados por esta fase) |         🟡 Baja-media         | Ver `DATABASE_COMPLETION_REPORT.md §6` — 2 corregidos (StorageModule faltante en productos, dependencia agregada), 3 documentados sin corregir (fuera de alcance)                                             |
| RLS de Empresa/Sucursal sigue ausente                         | 🟠 Media (heredado, no nuevo) | Ya certificado como hallazgo conocido — decisión de producto pendiente, no tocado en esta fase                                                                                                                |
| 185 FK cross-schema                                           | 🟠 Media (heredado, no nuevo) | Pendiente de ADR — no tocado                                                                                                                                                                                  |

Ninguno de los riesgos de esta fase es bloqueante ni nuevo en severidad — todos son continuidad de
lo ya certificado, o de complejidad deliberadamente baja (columnas nullable, tabla nueva sin
consumidor todavía).

## 4. Rendimiento — ver `DATABASE_PERFORMANCE_REPORT.md`

Tamaño de la base sin cambio material (79 MB antes y después — 2 tablas nuevas vacías, 10 columnas
nullable en tablas con pocas filas de prueba). Ningún índice nuevo sobre una tabla grande —
`idx_products_products_hazardous`/`idx_products_products_lifecycle_status` son índices parciales
(`WHERE ... = true`/`WHERE ... <> 'active'`), diseñados para mantenerse chicos incluso con el
catálogo completo poblado (la mayoría de los productos no son hazmat ni están descontinuados).

## 5. Puntaje de salud

**Sana — 100% operativa, sin regresiones, con la funcionalidad ampliada verificada de punta a
punta** (migración → Prisma → backend existente). Ver `DATABASE_FINAL_STATUS.md` para la
recomendación de version 1.0 completa.
