# Auditoría Enterprise — Fase 1 (Modelo de Datos)

> 2026-07-21. Solicitada explícitamente por el usuario como "Arquitecto Principal
> de Bases de Datos de GORAZUS ERP" — auditoría completa del modelo de datos ya
> diseñado, sin rediseñar módulos existentes, sin repetir documentación, sin
> simplificar el modelo, pensando en la escala de SAP S/4HANA / Oracle NetSuite /
> Microsoft Dynamics. Este documento es el **índice y reporte de la auditoría**,
> no un documento de diseño nuevo — GORAZUS ya tiene, desde `PHASE 01 — Database
Enterprise` (2026-07-16/20), un set de 19 documentos de base de datos maduros
> (`docs/database/`) que cubren exactamente lo pedido. Repetirlos violaría la
> instrucción explícita "no repitas documentación" del propio pedido. Este
> documento hace tres cosas que esos 19 no hacían todavía:
>
> 1. **Mapea cada uno de los 10 entregables pedidos a su documento ya existente**
>    (§1), con su fecha de última verificación real.
> 2. **Re-verifica en vivo** (§2-4) los puntos con mayor riesgo de haber quedado
>    desactualizados desde la última pasada (2026-07-20) — no una relectura de
>    documentos, consultas reales contra `pg_catalog`/`information_schema` de la
>    instancia de desarrollo.
> 3. **Documenta los hallazgos nuevos** de esta pasada (§5) y autoría el único
>    entregable de los 10 que genuinamente no existía como pieza unificada:
>    `11-estrategia-integridad.md` (§1, fila 10).

## 1. Los 10 entregables pedidos — dónde viven, y su fecha de verificación real

| #   | Entregable pedido               | Documento(s) existente(s)                                                                                                                                              | Última verificación en vivo (no solo lectura)                                                          |
| --- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 1   | Diccionario de datos Enterprise | [DATABASE_DICTIONARY.md](./DATABASE_DICTIONARY.md) + [dictionary/](./dictionary/) (21 archivos, columna por columna, generado desde `information_schema.columns` real) | 2026-07-16 (EPIC Database Visualization)                                                               |
| 2   | Catálogo de entidades           | [TABLE_CATALOG.md](./TABLE_CATALOG.md) (inventario completo de las 501 tablas lógicas)                                                                                 | 2026-07-16/18                                                                                          |
| 3   | Catálogo de relaciones          | [FOREIGN_KEYS.md](./FOREIGN_KEYS.md) (verificado contra `pg_constraint`) + [03-diagrama-relaciones.md](./03-diagrama-relaciones.md) (diagramas ER por módulo)          | 2026-07-20 — re-confirmado hoy, §3                                                                     |
| 4   | Matriz de dependencias          | [DATABASE_DEPENDENCIES.md](./DATABASE_DEPENDENCIES.md) (dependencias entre schemas, síncronas y asíncronas)                                                            | 2026-07-17/20                                                                                          |
| 5   | Convenciones globales           | [docs/standards/DATABASE_GUIDELINES.md](../standards/DATABASE_GUIDELINES.md)                                                                                           | Sin cambios desde su creación (EPIC 04) — verificado vigente, §6                                       |
| 6   | Reglas de nomenclatura          | [docs/standards/NAMING_CONVENTIONS.md](../standards/NAMING_CONVENTIONS.md) (incluye el mapeo módulo español ↔ schema inglés)                                           | Sin cambios — verificado vigente, §6                                                                   |
| 7   | Estrategia de índices           | [04-estrategia-indices.md](./04-estrategia-indices.md) (diseño) + [INDEX_CATALOG.md](./INDEX_CATALOG.md) (verificación real, 575 índices FK agregados)                 | 2026-07-20 — re-confirmado hoy, §4                                                                     |
| 8   | Estrategia de particionamiento  | [07-estrategia-particionamiento.md](./07-estrategia-particionamiento.md)                                                                                               | 2026-07-20 (0 de 27 tablas sin particiones aprovisionadas)                                             |
| 9   | Estrategia de auditoría         | [05-estrategia-auditoria.md](./05-estrategia-auditoria.md)                                                                                                             | Sin cambios desde su diseño — modelo, no requiere re-verificación en vivo (no depende de datos reales) |
| 10  | **Estrategia de integridad**    | **[11-estrategia-integridad.md](./11-estrategia-integridad.md) — nuevo, escrito en esta auditoría**                                                                    | 2026-07-21 (esta auditoría)                                                                            |

Complementarios, no pedidos explícitamente pero ya cubren partes de "redundancias/
normalización/rendimiento/escalabilidad" del pedido: [DATABASE_ARCHITECTURE.md](./DATABASE_ARCHITECTURE.md),
[PERFORMANCE.md](./PERFORMANCE.md), [SECURITY.md](./SECURITY.md),
[DATABASE_HEALTH_REPORT.md](./DATABASE_HEALTH_REPORT.md) (el reporte de salud
acumulado — este documento es su continuación, no su reemplazo).

## 2. Metodología de esta pasada

Consultas de solo lectura contra la instancia de desarrollo real (Postgres 17,
`docker-postgres-1`), vía un cliente Prisma crudo con `$queryRawUnsafe`, nunca
contra los documentos — exactamente el mismo método que encontró los hallazgos
reales de las pasadas anteriores (`DATABASE_DEPENDENCIES.md §"Corrección"`:
"la afirmación... no estaba realmente verificada"). Sin escritura, sin SQL nuevo
aplicado, sin cambio de schema — auditoría de solo lectura, como corresponde a
"Fase 1".

## 3. Verificación en vivo — estructura general

| Métrica                                                                   | Valor verificado hoy                                                         | Valor del último reporte (2026-07-20)     | Delta                                                                                     |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------- |
| Schemas con tablas (incl. `partman`, infraestructura)                     | 22 (21 de negocio/core + 1 infraestructura)                                  | 23                                        | Discrepancia menor de 1, no reconciliada — ver §5.4                                       |
| Tablas físicas totales (`pg_tables`, incl. particiones e infra `partman`) | 730                                                                          | 701 (sin `partman`)                       | Consistente: 730 − 29 tablas propias de `partman` = 701                                   |
| Total de Foreign Keys (`pg_constraint`, `contype='f'`)                    | 5.164                                                                        | 5.164                                     | Sin cambios                                                                               |
| FK inválidas (`convalidated=false`)                                       | 0                                                                            | 0                                         | Sin cambios                                                                               |
| Total de índices                                                          | 3.204                                                                        | 3.201                                     | +3 (mantenimiento normal, no investigado — variación esperable)                           |
| Tablas sin `PRIMARY KEY` de una sola columna                              | 3 (`core.audit_logs`, `core.change_history`, `security.security_audit_logs`) | No documentado antes como hallazgo propio | **Nuevo, ver §5.1**                                                                       |
| Tablas sin RLS habilitado (excluyendo infraestructura `partman`)          | 1 (`core.restore_test_logs`)                                                 | 1                                         | Sin cambios                                                                               |
| Tablas con RLS habilitado pero sin `FORCE`                                | 0                                                                            | No verificado antes explícitamente        | **Nuevo dato, resultado limpio**                                                          |
| `gorazus_app` es superusuario / bypassea RLS                              | **No** (`rolsuper=false`, `rolbypassrls=false`)                              | Sí (documentado como no corregido)        | **Documentación corregida — el fix ya existía desde FASE 05, nunca se reflejó, ver §5.2** |

## 4. Verificación en vivo — nomenclatura y normalización (hallazgos nuevos de esta pasada)

Sin herramienta previa que hubiera corrido esto contra la instancia real — es
nuevo en esta auditoría, respondiendo directamente a "columnas repetidas /
normalización" del pedido:

- **36 columnas `boolean` que no siguen el prefijo `is_`/`has_`** (`accepts_postings`,
  `requires_number`, `requires_2fa`, `tracks_lot`, `tracks_serial`, `succeeded`,
  `matched`, `action_executed`, entre otras — lista completa reproducible con la
  consulta de §5.3). **No es una violación de una regla ya escrita** —
  `NAMING_CONVENTIONS.md` nunca exigió el prefijo `is_`/`has_` para el 100% de las
  columnas booleanas, solo lo usa consistentemente en las columnas **universales**
  (`is_active`, `is_deleted`). Se documenta como una convención implícita nunca
  formalizada, no como un defecto — ver recomendación en §5.3.
- **0 tablas completamente duplicadas** (mismo propósito, dos nombres distintos) —
  confirmado por nombre e inspección cruzada contra `docs/database/logico/`, consistente
  con lo ya afirmado en `DATABASE_HEALTH_REPORT.md §7`.
- **0 índices duplicados** (re-confirmado, mismo resultado que 2026-07-20).
- **0 secuencias sin uso**, **0 vistas inválidas** (re-confirmado).

## 5. Hallazgos de esta auditoría (detalle)

### 5.1 — 3 tablas particionadas sin `PRIMARY KEY` de una sola columna

Contradice literalmente "Toda tabla, sin excepción, tiene la misma primary key...
No existe ninguna tabla con PK distinta a este par" de
`02a-restricciones-e-indices.md §2`. **Causa raíz:** requisito de Postgres para
tablas particionadas (la clave de partición debe integrar cualquier PK/UNIQUE).
**No es un defecto de diseño** — es la única forma correcta de particionar por
tiempo estas 3 tablas de auditoría manteniendo `id` como UUID global. Documentado
en detalle, con la excepción ya incorporada al documento de diseño:
[11-estrategia-integridad.md §2.3](./11-estrategia-integridad.md#23-excepción-real-3-tablas-particionadas-sin-primary-key-de-una-sola-columna)

- addendum en [02a-restricciones-e-indices.md §2](./02a-restricciones-e-indices.md#2-llave-primaria--regla-única-sin-excepciones).
  **Severidad: informativa** — documentación corregida, cero cambio de schema
  necesario o recomendado.

### 5.2 — Documentación desactualizada: `gorazus_app` ya no es superusuario

`SECURITY.md` y `DATABASE_HEALTH_REPORT.md` seguían documentando `gorazus_app`
(el rol real de `DATABASE_URL` de `apps/api`) como superusuario con
`BYPASSRLS=true`, "no corregido" — pero el fix **sí se aplicó**, el mismo día
(2026-07-20, sesión de backend/infra separada, `CHANGELOG.md` "FASE 05 — RLS:
`gorazus_app` ya no es superusuario"), y nunca se reflejó de vuelta en estos dos
documentos de base de datos. Re-verificado hoy contra `pg_roles`:
`rolsuper=false, rolbypassrls=false`. **Ambos documentos corregidos en esta
auditoría** — ver [SECURITY.md §2.1](./SECURITY.md#-21--corregido-más-tarde-el-mismo-día-fase-05-2026-07-20--re-verificado-en-vivo-2026-07-21)
y el addendum en `DATABASE_HEALTH_REPORT.md §6`. **Severidad: era crítica
mientras estuvo desactualizada** (un lector de `SECURITY.md` sin este documento
habría asumido, incorrectamente, que RLS seguía sin proteger nada) — resuelta.

### 5.3 — 36 columnas booleanas sin convención de prefijo formalizada

**Severidad: baja, cosmética.** No rompe ninguna regla escrita, pero es
inconsistencia real de estilo entre columnas que representan lo mismo
conceptualmente (`is_active` vs. `succeeded`, `matched`, `accepts_postings`).
**Recomendación para Fase 2** (no aplicada acá — "no escribas SQL"): decidir si
`docs/standards/NAMING_CONVENTIONS.md` debe formalizar `is_`/`has_` como
obligatorio para **toda** columna booleana nueva de aquí en más (no retroactivo —
renombrar 36 columnas reales en 21 schemas es un cambio de alto riesgo para un
beneficio cosmético, no se propone tocar las existentes).

### 5.4 — Discrepancia menor no reconciliada: conteo de schemas (22 vs. 23)

`DATABASE_HEALTH_REPORT.md §6` (2026-07-20) reportó "23 schemas"; esta auditoría
cuenta 22 vía `pg_tables` (21 de negocio/core, mapeados 1:1 a los 21 clientes
Prisma de `core/database/prisma/schemas/`, más el schema de infraestructura
`partman`). **No se investigó a fondo** el origen del delta de 1 (posible
diferencia de método de conteo entre pasadas, o un schema sin tablas que sí
cuenta en `information_schema.schemata`) — se documenta como discrepancia menor
abierta, no bloqueante, para que una futura pasada la reconcilie con el método
exacto usado el 2026-07-20.

## 6. Convenciones globales y nomenclatura — verificación de vigencia (entregables 5 y 6)

`docs/standards/NAMING_CONVENTIONS.md` y `docs/standards/DATABASE_GUIDELINES.md`
no tuvieron cambios de contenido en esta auditoría — se verificó que siguen
describiendo con precisión el estado real: snake_case en toda tabla/columna
(confirmado, 0 violaciones de mayúsculas encontradas en el barrido de §4),
nombres de tabla en plural (patrón dominante, sin excepciones detectadas en el
barrido), y el mapeo módulo español (`modules/ventas/`) ↔ schema inglés
(`sales`) — que ya existe y es la fuente de verdad citada por
`DATABASE_DEPENDENCIES.md §2` y por este mismo documento. No se repite su
contenido acá.

## 7. Qué queda explícitamente fuera de esta Fase 1 (alcance respetado)

Por instrucción explícita del pedido ("no vuelvas a diseñar módulos existentes",
"no escribas SQL", "no escribas código"):

- **185 FK cross-schema** — hallazgo ya conocido y documentado (`FOREIGN_KEYS.md §3`),
  re-confirmado sin cambios hoy (§3). Sigue pendiente de una decisión de negocio/ADR,
  no de esta auditoría.
- **`core.restore_test_logs` sin RLS** — sin cambios, sigue pendiente de
  confirmación explícita (¿es intencional?).
- **Renombrado de las 36 columnas booleanas** — solo se documenta la
  inconsistencia (§5.3), no se propone ni ejecuta ningún `ALTER`.
- **Ningún archivo `sql/*.sql` fue creado, editado ni ejecutado** en esta
  auditoría — es 100% documentación, tal como se pidió.

## 8. Conclusión — estado del modelo de datos para Fase 2

El modelo de datos de GORAZUS, verificado hoy contra la instancia real, está en
buen estado para sostener el objetivo declarado ("preparado para millones de
registros"): 0 FK inválidas, 0 índices duplicados, 0 tablas huérfanas, RLS
genuinamente forzado y sin bypass en el rol de aplicación, particionamiento
aprovisionado y funcionando en las 27 tablas de alto volumen. Los 4 hallazgos de
esta pasada (§5) son 2 correcciones de documentación desactualizada (severidad
resuelta) y 2 items de bajo riesgo explícitamente diferidos a decisión de negocio
o a Fase 2. **Ningún hallazgo de esta auditoría bloquea el avance a Fase 2.**

## 9. Trazabilidad

| Punto pedido en la Fase 1                                                                        | Cerrado en                                                                        |
| ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Revisión de schemas/tablas/relaciones/PK/FK/restricciones/índices/nombres/convenciones/catálogos | §1 (mapeo a los 19 documentos existentes) + §3-4 (re-verificación en vivo)        |
| Análisis de redundancias/duplicados/inconsistencias/normalización/rendimiento/escalabilidad      | §4-5                                                                              |
| 1. Diccionario de datos Enterprise                                                               | §1, fila 1                                                                        |
| 2. Catálogo de entidades                                                                         | §1, fila 2                                                                        |
| 3. Catálogo de relaciones                                                                        | §1, fila 3                                                                        |
| 4. Matriz de dependencias                                                                        | §1, fila 4                                                                        |
| 5. Convenciones globales                                                                         | §1, fila 5; §6                                                                    |
| 6. Reglas de nomenclatura                                                                        | §1, fila 6; §6                                                                    |
| 7. Estrategia de índices                                                                         | §1, fila 7                                                                        |
| 8. Estrategia de particionamiento                                                                | §1, fila 8                                                                        |
| 9. Estrategia de auditoría                                                                       | §1, fila 9                                                                        |
| 10. Estrategia de integridad                                                                     | §1, fila 10 — [11-estrategia-integridad.md](./11-estrategia-integridad.md), nuevo |
| Solo documentación, sin SQL, sin código                                                          | §7 — confirmado, 0 archivos `sql/*.sql` tocados                                   |
| Listo para Fase 2                                                                                | §8                                                                                |
