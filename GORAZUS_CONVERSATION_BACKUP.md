# GORAZUS ERP — BACKUP DE CONVERSACIÓN (SESIÓN DE DESARROLLO ASISTIDO POR IA)

|                                       |                                                                                                                                                                 |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sesión**                            | `47800e4a-abcf-494e-adc8-6adf76befd81`                                                                                                                          |
| **Rango cubierto**                    | Desde la verificación del Second Brain (AKB) hasta la generación de este backup                                                                                 |
| **Fecha de cierre de este documento** | 2026-08-03                                                                                                                                                      |
| **Rama de trabajo**                   | `feature/database-finalization`                                                                                                                                 |
| **Alcance**                           | Documentación técnica limpia y cronológica, no una transcripción literal — ver `GORAZUS_ENTERPRISE_CONTEXT.md` para el estado consolidado del proyecto completo |

> Este documento cubre **esta sesión de trabajo**. El historial de sesiones anteriores está reflejado indirectamente en `CHANGELOG.md` (hasta `v0.24.0`) y en el propio Git — no se reconstruye aquí porque esta sesión no tuvo acceso directo a esas conversaciones previas, solo a su resultado en el repositorio.

---

## Índice

1. [Contexto de arranque de la sesión](#1-contexto-de-arranque-de-la-sesión)
2. [Fase 1 — Verificación del Second Brain (AKB)](#2-fase-1--verificación-del-second-brain-akb)
3. [Fase 2 — Serie de ADRs de Inventario (ADR-INV-004 a 010)](#3-fase-2--serie-de-adrs-de-inventario-adr-inv-004-a-010)
4. [Fase 3 — Consolidación del Second Brain](#4-fase-3--consolidación-del-second-brain)
5. [Fase 4 — Pivote a implementación: Motor de Costeo](#5-fase-4--pivote-a-implementación-motor-de-costeo)
6. [Fase 5 — Incidente de formato/índice de Git y resolución](#6-fase-5--incidente-de-formatoíndice-de-git-y-resolución)
7. [Fase 6 — Documentación exportable](#7-fase-6--documentación-exportable)
8. [Commits reales generados en esta sesión](#8-commits-reales-generados-en-esta-sesión)
9. [Decisiones de arquitectura tomadas](#9-decisiones-de-arquitectura-tomadas)
10. [Deuda técnica detectada durante la sesión](#10-deuda-técnica-detectada-durante-la-sesión)
11. [Errores encontrados y soluciones aplicadas](#11-errores-encontrados-y-soluciones-aplicadas)
12. [Próximos pasos](#12-próximos-pasos)

---

## 1. Contexto de arranque de la sesión

La sesión continuó un trabajo previo ya avanzado (visible en el historial de Git y en `docs/AKB/`, construido por una sesión anterior/concurrente): existía ya una serie de ADRs base de Inventario (`ADR-INV-000` a `ADR-INV-003`, `ADR-INF-001`, `ADR-DB-001`) y un Second Brain / Architecture Knowledge Base (`docs/AKB/`) parcialmente construido, con reportes de madurez ya generados (Levels 1-6 del protocolo Second Brain, GEMM v1.0). El usuario pidió explícitamente **verificar el estado del Second Brain antes de trabajar en el proyecto** — aplicando el protocolo de "reality check antes de código" ya establecido como regla permanente de esta cuenta.

**Hallazgo inicial relevante**: al verificar `git status`, se encontró que una cantidad muy grande de trabajo (reorganización de ~80 archivos `.md` sueltos hacia `docs/reports/*`, cambios de schema Prisma en varios dominios, un módulo `clientes`/`crm` nuevo) estaba **staged en el índice de Git pero sin commitear**, evidentemente de otra sesión de trabajo concurrente sobre el mismo repositorio. Esto se documentó como un riesgo real (trabajo no protegido por commit) y como una restricción operativa: cualquier commit propio de esta sesión debía usar rutas de archivo explícitas, nunca `git commit -m` a secas, para no arrastrar ese trabajo ajeno.

---

## 2. Fase 1 — Verificación del Second Brain (AKB)

Se leyeron y verificaron `Home.md`, `ADR Index.md`, `Issue Register.md` y `Decision Log.md` (`docs/AKB/00 Governance/`). Resultado: el AKB estaba internamente consistente (12 ADRs indexados, 22 issues registrados a esa altura, versión de Issue Register 1.4.0). Único hallazgo menor: el frontmatter `related:` de `Issue Register.md` omitía `[[ADR-INV-001]]` y `[[ADR-INV-007]]` (sí presentes en el cuerpo del documento) — inconsistencia cosmética, no corregida sin autorización.

Se presentó al usuario la elección entre: implementar código sobre un motor ya diseñado, diseñar el siguiente ADR (Compras), o poner en orden el estado de Git primero. El usuario eligió **implementar código de un motor de Inventario**, y luego, ante una segunda pregunta, específicamente el **Motor de Costeo (`ADR-INV-004`)**.

_(Nota de reconstrucción: el detalle exhaustivo de la construcción de la serie completa de ADRs `ADR-INV-004` a `ADR-INV-010` —incluyendo los niveles 1-6 del protocolo Second Brain y el modelo GEMM— ocurrió en la porción de esta sesión que fue resumida por el sistema antes de este punto de backup. Lo que sigue en la Fase 2 es la reconstrucción de esa fase a partir del resumen disponible y de la evidencia real en Git/AKB, no una transcripción palabra por palabra.)_

---

## 3. Fase 2 — Serie de ADRs de Inventario (ADR-INV-004 a 010)

En una secuencia de siete peticiones estructuradas ("PHASE 1" a "PHASE 7"), el usuario pidió el diseño formal, uno por uno, de siete motores/capas de Inventario, cada uno con el mismo estándar: revisión obligatoria del AKB existente antes de diseñar, reutilización de Aggregates/Services/Policies/Events ya existentes, DDL SQL real cuando aplicaba, diagramas Mermaid, y actualización aditiva del Second Brain al cierre.

| ADR           | Título                                  | Hallazgo central                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ADR-INV-004` | Motor de Costeo de Inventario           | LIFO tiene tabla real pero nunca tuvo diseño algorítmico hasta este ADR; `remaining_quantity` sin `CHECK` contra `original_quantity` (`ISSUE-14`); LIFO sin `source_receipt_line_id` (`ISSUE-15`)                                                                                                                                                                                                                                       |
| `ADR-INV-005` | Motor de Disponibilidad de Inventario   | `DisponibilidadDeInventario` diseñado como Value Object calculado, nunca persistido — refuerza la heurística "denormalizar solo con dueño de mantenimiento claro"                                                                                                                                                                                                                                                                       |
| `ADR-INV-006` | Motor de Reabastecimiento de Inventario | Corrección de un hallazgo previo de la misma sesión: `bi.forecasts`/`bi.forecast_models` SÍ son reales (un reporte anterior los había marcado como inexistentes sin evidencia suficiente)                                                                                                                                                                                                                                               |
| `ADR-INV-007` | Motor de Optimización de Almacenes      | Confirmó, leyendo el código real antes de diseñar, que la jerarquía de ubicación auto-referenciada (sin tablas separadas por nivel) ya era la decisión correcta existente                                                                                                                                                                                                                                                               |
| `ADR-INV-008` | Motor de Trazabilidad de Inventario     | 25 tipos de genealogía pedidos resueltos con un único Domain Service parametrizado (`RecorrerGenealogia`) — primera aplicación del patrón "un motor, N puntos de entrada". Extendido después con §15 "Digital Twin" (reconstrucción de inventario en un punto del tiempo), tras un pedido corto y sin encabezado formal del usuario, interpretado correctamente como extensión de este ADR y no como uno nuevo                          |
| `ADR-INV-009` | Motor de Conteo Cíclico de Inventario   | Hallazgo real en código productivo: `conteos.service.ts.completar()` genera un ajuste automático ante cualquier discrepancia, sin tolerancia ni aprobación humana — documentado como `ISSUE-20`, con corrección propuesta (`EvaluarTolerancia`) sin aplicar todavía                                                                                                                                                                     |
| `ADR-INV-010` | Motor de Analítica de Inventario        | Auditoría cruzada de las tablas de KPI de los 6 ADRs anteriores encontró que `ADR-INV-006` y `ADR-INV-009` habían definido, sin saberlo, el mismo KPI ("Inventory Health Score") con fórmulas distintas — resuelto con una jerarquía de composición en vez de elegir un ganador; además el propio ADR estuvo a punto de proponer una tabla `inventory.kpi_snapshots` duplicada antes de verificar que `bi.kpi_snapshots` ya existe real |

Cada ADR se acompañó de una nota puente en `docs/AKB/02 Domains/Inventory/` y una "Engineering Review" en `docs/AKB/00 Governance/`, siguiendo el patrón ya establecido por la sesión concurrente dueña original del AKB (estrategia "complementar, no duplicar" — nunca se reescribieron archivos compartidos, solo ediciones aditivas).

En dos ocasiones durante esta fase el usuario pidió explícitamente **"mete todo en el segundo cerebro"** — consolidar hallazgos dispersos en notas individuales hacia los artefactos canónicos (`Issue Register.md`, `Decision Log.md`), en vez de dejarlos solo documentados en cada ADR por separado.

---

## 4. Fase 3 — Consolidación del Second Brain

Tras cerrar `ADR-INV-010`, el motor de recomendación propio del proceso (declarado explícitamente en la "Engineering Review" de varios de estos ADRs) señaló, **por sexta vez consecutiva**, que la serie de diseño de Inventario había llegado a su cierre natural — un motor de analítica que consolida a los demás es, arquitectónicamente, el techo lógico de la pirámide, no un peldaño más — y recomendó pasar a implementación real o, alternativamente, diseñar el siguiente dominio de mayor evidencia (`ADR-PUR-001`, Compras).

---

## 5. Fase 4 — Pivote a implementación: Motor de Costeo

El usuario confirmó explícitamente pasar a **implementación de código real** sobre `ADR-INV-004` (Fase 1: FIFO/LIFO/Costo Promedio Ponderado — los tres únicos métodos con tabla real en el schema; Standard/Specific/Landed/Replacement Cost quedaron fuera por no tener tabla).

**Investigación previa a escribir código** (research agents en paralelo, sin escribir nada todavía):

- Confirmó que **no existía ningún código de aplicación** para costeo (ni entity, ni service, ni repository, ni controller) — solo las tres tablas ya certificadas en el schema.
- Confirmó que la Parte 05 de Inventario (recepciones/`goods_receipts`) tampoco tenía código — decisión tomada: alimentar el motor con comandos genéricos de entrada/salida en vez de bloquear el trabajo esperando esa fase.
- Extrajo el patrón arquitectónico exacto a replicar leyendo código real maduro (`conteos.service.ts`, `movimiento-stock.repository.prisma.ts`, `stock-lock.util.ts`, `producto-lookup.repository.ts`).

**Plan formal** (vía `EnterPlanMode`/`ExitPlanMode`, aprobado explícitamente por el usuario) delimitó el alcance: solo FIFO/LIFO/Promedio; sin cambios de schema/BD (dado el volumen de trabajo ajeno sin commitear tocando esos mismos archivos); sin conexión automática a `MovimientosService`; solo política de inventario negativo `strict`.

**Archivos creados** (16 nuevos, 3 modificados — detalle completo en el commit `2b1dc60`):

- Repositorios: `costing-method-lookup`, `fifo-cost-layer`, `lifo-cost-layer`, `average-cost-history` (interfaz + adaptador Prisma cada uno), más `cost-layer-lock.util.ts` (bloqueo `SELECT ... FOR UPDATE` para consumo concurrente de capas de costo, mismo patrón que `lockStockRow`).
- `services/costeo.service.ts` — `CosteoService`, con excepciones propias (`MetodoDeCosteoNoSoportadoException`, `CapaDeCostoInsuficienteException`), despachando por `costing_method` del producto.
- `validators/costeo.schema.ts` (Zod), `controllers/costeo.controller.ts` (4 endpoints: registrar entrada, resolver salida, listar capas activas, costo vigente).
- Modificados aditivamente: `core/database/src/index.ts` (exporta los 3 tipos Prisma de costeo que faltaban en el barrel), `inventario.module.ts` (registro DI + extensión del comentario JSDoc de cabecera), `modules/seguridad/backend/scripts/seed-rbac.ts` (permiso nuevo `inventario.gestionar_costeo`).

**Pruebas**: 17 tests unitarios de `CosteoService` (mocks manuales de repositorio, sin `@nestjs/testing`) — todos en verde tras corregir un bug real de tipos (`new_average_cost` es `Decimal` de Prisma, no `number`; el cast directo fallaba en compilación, corregido con `as unknown as`). Un e2e nuevo (`costeo.controller.e2e-spec.ts`) escrito siguiendo el patrón real de `ajustes-conteos.controller.e2e-spec.ts` — compila y corre, pero **no se pudo verificar contra Postgres real**: Docker Desktop no estaba activo en el entorno de desarrollo.

---

## 6. Fase 5 — Incidente de formato/índice de Git y resolución

Al commitear el Motor de Costeo, el hook de pre-commit (`lint-staged`, que hace `git stash` del resto del árbol antes de aplicar `eslint --fix` + `prettier --write` sobre los archivos staged) dejó una diferencia de formato entre el working tree y el commit final en 7 de los 17 archivos — un artefacto conocido de cómo `lint-staged` interactúa con un índice de Git que ya tenía cientos de archivos ajenos staged de la sesión concurrente.

**Diagnóstico y resolución** (sin pérdida de trabajo, ni propio ni ajeno):

1. Se corrió `npx prettier --write` manual sobre los 7 archivos — produjo una versión con wrapping de línea distinto al commit.
2. Se intentó un segundo commit con esa versión "corregida" — `lint-staged` (que corre `eslint --fix` + `prettier --write` juntos, no prettier solo) lo rechazó como **"empty commit"**: confirmó que el commit original ya era, de hecho, la versión canónica según el pipeline real del proyecto; el `prettier --write` manual (sin `eslint --fix`) había introducido una diferencia falsa.
3. Se restauró el working tree exactamente al estado de `HEAD` (`git checkout HEAD -- <7 archivos>`), usando `git reset HEAD -- <7 archivos>` primero para des-stagear sin tocar el resto del índice (que seguía conteniendo el trabajo ajeno, intacto en todo momento).
4. Verificación final: árbol limpio para los 17 archivos del Motor de Costeo; el trabajo de la sesión concurrente (186 entradas de `git status`) permaneció exactamente igual que antes de este incidente.

**Lección documentada** (ya incorporada en `GORAZUS_ENTERPRISE_CONTEXT.md §20`): no dar por sentado que una diferencia de formato post-commit es un error del commit — puede ser que el working tree, no el commit, sea la versión desactualizada; verificar contra el pipeline real (`eslint --fix` + `prettier --write` juntos) antes de "corregir" nada.

---

## 7. Fase 6 — Documentación exportable

El usuario pidió, en tres pasos sucesivos:

1. **Backup de la conversación completa** — resuelto invocando el motor de respaldo por eventos ya establecido (`D:\ClaudeCodeBackups\Scripts\backup-engine.ps1 -Force`, seguido de `-Diagnose` para confirmar). Se verificó primero que el `SessionId`/`TranscriptPath` activo coincidiera con el default hardcodeado del script (bug ya documentado de sesiones anteriores) — coincidía, no hizo falta pasar parámetros explícitos. Resultado: `CONV_000001`, versión 18, delta de 82 mensajes, integridad OK.
2. **Link del repositorio "para GPT"** — se entregó `https://github.com/Daniel-Cali/GORAZUS.git`, con la advertencia explícita de que la rama local está 49 commits por delante de `origin` sin pushear, por lo que ese link no refleja el trabajo reciente de esta sesión a menos que se autorice un `git push` (no realizado — requiere confirmación explícita separada).
3. **Exportador maestro de contexto** (este documento y su compañero `GORAZUS_ENTERPRISE_CONTEXT.md`) — investigación real vía 4 agentes de exploración en paralelo (base de datos, meta-proyecto/roadmap/CI, inventario de módulos backend, frontend/API/seguridad/testing), seguida de redacción de ambos documentos con datos verificados, citando fuente en cada cifra, y señalando explícitamente cada inconsistencia encontrada entre documentos del propio proyecto (versión, % de completitud, changelog desactualizado) en vez de ocultarla o promediarla.

---

## 8. Commits reales generados en esta sesión

```
2b1dc60 feat(inventario): implementar motor de costeo fase 1 (fifo/lifo/promedio)
9ad054e docs(adr): agrega ADR-INV-010 motor de analitica de inventario
778a90c docs(adr): agregar adr-inv-009, motor de conteo ciclico de inventario
e25c549 docs(akb): consolidar deuda y decisiones de la serie ADR-INV-004..008
843894e docs(adr): extender adr-inv-008 con Digital Twin (§15)
1977dbc docs(adr): agregar adr-inv-008, motor de trazabilidad de inventario
70bbac0 docs(adr): agregar adr-inv-007, motor de optimizacion de almacenes
2a7e893 docs(adr): agregar adr-inv-006, motor de reabastecimiento de inventario
7f74bbd docs(adr): agregar adr-inv-005, motor de disponibilidad de inventario
5bbb883 docs(adr): agregar adr-inv-004, motor de costeo de inventario
341d52e docs(akb): gemm v1.0 - enterprise maturity model
```

_(Commits anteriores a `341d52e`, correspondientes a los niveles 1-5 del protocolo Second Brain, fueron generados en la porción de sesión resumida antes de este punto — sus hashes no están disponibles en este backup por esa razón, pero sí están íntegros en `git log` real del repositorio.)_

**Ninguno de estos commits fue pusheado a `origin`** — la rama `feature/database-finalization` permanece 49 commits adelante del remoto durante toda esta sesión, por diseño (regla permanente: `git push` requiere confirmación explícita separada, nunca implícita).

---

## 9. Decisiones de arquitectura tomadas

Ver `GORAZUS_ENTERPRISE_CONTEXT.md §19` para la tabla completa con justificación de cada una. Resumen de las tomadas específicamente durante esta sesión (no heredadas de sesiones anteriores):

- Resolución de la colisión de nombre "Inventory Health Score" (`ADR-INV-006` vs `ADR-INV-009`) mediante jerarquía de composición en `ADR-INV-010`, sin editar retroactivamente ningún ADR ya aceptado.
- Motor de Costeo Fase 1 deliberadamente acotado a FIFO/LIFO/Promedio, sin tocar schema/BD, sin conectar automáticamente a `MovimientosService` — tres límites de alcance explícitos, documentados y aprobados por el usuario antes de escribir código.
- Alimentar el Motor de Costeo con comandos de entrada/salida genéricos en vez de esperar a que exista código de aplicación para `goods_receipts` (Parte 05, todavía sin construir).

---

## 10. Deuda técnica detectada durante la sesión

Además de la deuda ya conocida y heredada (`TECHNICAL_DEBT.md`, `Issue Register.md`), esta sesión detectó y registró:

- **`ISSUE-14`** (Alta/Alta): `fifo_cost_layers`/`lifo_cost_layers` sin `CHECK (remaining_quantity <= original_quantity)` — DDL ya especificado en `ADR-INV-004 §13.3`, no aplicado (fuera del alcance de la Fase 1 de implementación por decisión explícita de no tocar schema).
- **`ISSUE-15`** (Media/Media): `lifo_cost_layers` sin `source_receipt_line_id` — pierde trazabilidad de origen frente a FIFO.
- **`ISSUE-20`** (Alta/Alta): `conteos.service.ts.completar()` real genera ajuste automático ante cualquier discrepancia de conteo, sin tolerancia ni aprobación humana — hallazgo sobre código productivo existente, no sobre diseño nuevo.
- **`ISSUE-22`** (Media/Media): colisión de nombre de KPI entre `ADR-INV-006` y `ADR-INV-009`, resuelta por diseño en `ADR-INV-010` pero no aplicada retroactivamente a los documentos originales.
- Inconsistencia documental transversal (no es un ítem del Issue Register de Inventario, es de gobernanza general del proyecto): `CHANGELOG.md`, `ROADMAP.md`, `PROJECT_STATUS.md`, `NEXT_STEPS.md`, `TECHNICAL_DEBT.md` y `package.json`/`VERSION` están desincronizados entre sí en fecha y número de versión — documentado en detalle en `GORAZUS_ENTERPRISE_CONTEXT.md §16`.

---

## 11. Errores encontrados y soluciones aplicadas

| Error                                                                                                         | Causa                                                                                                                                                           | Solución aplicada                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TS2352` en `costeo.service.spec.ts`: cast directo de `{ new_average_cost: number }` a `average_cost_history` | `new_average_cost` es `Decimal` de Prisma, no `number` — tipos no se solapan lo suficiente para un cast directo                                                 | `as unknown as average_cost_history` en los 4 sitios afectados                                                                                                                          |
| e2e de Costeo falla con `PrismaClientInitializationError: Can't reach database server at localhost:5432`      | Docker Desktop no estaba corriendo en el entorno de desarrollo                                                                                                  | Confirmado como limitación de entorno, no un bug de código — reportado explícitamente como "no verificado en este entorno" en vez de asumir que pasaría                                 |
| Diferencia de formato post-commit en 7 archivos del Motor de Costeo                                           | Interacción de `lint-staged` (stash + `eslint --fix` + `prettier --write`) con un índice de Git que ya tenía cientos de archivos ajenos staged                  | Ver Fase 5 — restaurado desde `HEAD` tras confirmar (vía intento de commit vacío rechazado) que `HEAD` ya era la versión canónica                                                       |
| `git commit <pathspec>` seguido de `git checkout -- <archivo>` restauró una versión distinta a `HEAD`         | `git checkout -- <archivo>` (sin especificar revisión) restaura desde el **índice**, no desde `HEAD` — y el índice tenía un estado intermedio distinto de ambos | Usar siempre `git checkout HEAD -- <archivo>` cuando la intención es "igualar a lo ya commiteado", nunca `git checkout --` a secas en un repositorio con índice en un estado no trivial |

---

## 12. Próximos pasos

En el orden en que quedaron planteados al cierre de esta sesión:

1. **Decidir** (requiere al usuario, no una elección autónoma de la IA): continuar POS Fase 06 Parte 02, o Inventario Fase 05 Parte 05 (Recepciones/Salidas), o seguir implementando la serie de ADRs de Inventario ya diseñados (`ADR-INV-005` Disponibilidad, `ADR-INV-006` Reabastecimiento, `ADR-INV-007` Almacenes, `ADR-INV-008` Trazabilidad, `ADR-INV-009` Conteo Cíclico, `ADR-INV-010` Analítica — los seis siguientes candidatos directos, con el mismo patrón que Costeo).
2. Levantar Docker/Postgres local para correr el e2e del Motor de Costeo pendiente de verificación.
3. Evaluar conectar `CosteoService` a `MovimientosService` una vez validado el e2e.
4. Resolver `ISSUE-14`/`ISSUE-15` (deuda de schema) en una fase de mantenimiento de BD separada, coordinada con la sesión concurrente que tiene cambios de schema propios sin commitear.
5. Sincronizar `CHANGELOG.md`/`ROADMAP.md`/`PROJECT_STATUS.md`/`NEXT_STEPS.md` con el estado real de Git (no hecho en esta sesión — fuera del alcance pedido).
6. Decidir si/cuándo pushear la rama `feature/database-finalization` (49 commits pendientes) — requiere confirmación explícita separada.

---

_Fin del backup de conversación. Complementa a `GORAZUS_ENTERPRISE_CONTEXT.md` (estado consolidado del proyecto) y al backup automático de la conversación completa en `D:\Conversation_Backups\Active\` (JSON + `.txt`, actualizado por `backup-engine.ps1`)._
