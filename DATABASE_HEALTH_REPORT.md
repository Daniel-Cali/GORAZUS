# Informe de Salud — Línea Base Antes del Renombrado

> Estado real de la base de datos verificado en esta misma sesión, **antes de cualquier ejecución**
> del plan de `DATABASE_MIGRATION_REPORT.md`. Sirve como línea base — si en el futuro se ejecuta la
> migración, este es el estado exacto contra el que se compara "no rompí nada" (mismo criterio que
> `DATABASE_SETUP_REPORT.md`, verificado de nuevo acá porque ya pasaron varias sesiones).

## 1. Estado general — sano, sin cambios desde la última verificación

| Chequeo                                         | Resultado                                                                 |
| ----------------------------------------------- | ------------------------------------------------------------------------- |
| PostgreSQL corriendo                            | ✅ 17.10, contenedor `docker-postgres-1`, saludable                       |
| Tablas esperadas presentes                      | ✅ 501 de 501                                                             |
| FKs no validadas                                | ✅ 0 de ~5.164                                                            |
| Índices inválidos                               | ✅ 0                                                                      |
| RLS forzado                                     | ✅ 473 tablas (mismo número que la verificación anterior — sin regresión) |
| `gorazus_app` sin superusuario ni bypass de RLS | ✅ confirmado de nuevo                                                    |
| Extensiones                                     | ✅ 4 — `pg_partman`, `pg_trgm`, `pgcrypto`, `plpgsql`                     |

Ningún cambio de estado desde `DATABASE_SETUP_REPORT.md` — coherente con que esta fase no ejecutó
ningún DDL (regla explícita: no modificar schemas).

## 2. Riesgos que esta fase de diseño identificó para la fase de ejecución futura

| Riesgo                                                                      | Severidad | Detalle                                                                                                                                                       |
| --------------------------------------------------------------------------- | :-------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 112 nombres de índice superarían 63 bytes con el patrón mecánico            | 🟠 Media  | Mitigación diseñada, pendiente de aprobación — `DATABASE_MIGRATION_REPORT.md §4`                                                                              |
| 8 archivos backend con SQL crudo no protegidos por `@map`/`@@map`           | 🟠 Media  | Requieren edición manual sin importar el camino elegido — `DATABASE_COMPATIBILITY_REPORT.md §2.1`                                                             |
| Sin test suite 100% confiable hoy para validar una migración de este tamaño | 🟠 Media  | `nx run web:test` roto (deuda ya documentada, no nueva), e2e depende de Docker arriba                                                                         |
| Vocabulario de 728 términos sin revisión de hablante nativo humano          |  🟡 Baja  | Riesgo de matiz regional (México/Argentina/España), no de corrección funcional — `DATABASE_VALIDATION_REPORT.md §6`                                           |
| `core.restore_test_logs` sigue sin RLS ni mapeo en `schema.prisma`          |  🟡 Baja  | Hallazgo preexistente (`DATABASE_SETUP_REPORT.md §6`, `TECHNICAL_DEBT.md`), no nuevo de esta fase, no corregido acá (fuera de alcance — no modificar schemas) |

Ninguno de estos riesgos **bloquea** aprobar la ejecución — todos tienen mitigación diseñada o son
de severidad baja. Se listan para que la decisión de ejecutar se tome con información completa.

## 3. Qué NO cambió en esta fase (confirmación explícita)

- 0 tablas creadas, eliminadas o alteradas.
- 0 columnas renombradas.
- 0 líneas de `schema.prisma` modificadas.
- 0 archivos de `modules/*/backend` modificados.
- 0 endpoints de API modificados.
- Los únicos archivos nuevos de esta fase son de documentación (7 entregables +
  `docs/database/spanish-standard/*.json`) y las actualizaciones de
  `CHANGELOG.md`/`ROADMAP.md`/`PROJECT_STATUS.md`/`TECHNICAL_DEBT.md`.

## 4. Puntaje de salud de la base (antes de cualquier renombrado)

**Sana — apta para servir de base a la fase de ejecución futura sin ningún problema estructural
propio.** Los riesgos de §2 son todos del _proceso de migración propuesto_, no de la base actual.
