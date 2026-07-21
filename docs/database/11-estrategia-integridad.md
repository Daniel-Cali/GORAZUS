# 11 — Estrategia de Integridad

> Nuevo (auditoría Fase 1, 2026-07-21, solicitada explícitamente por el usuario:
> "Arquitecto Principal de Bases de Datos"). Consolida en un solo lugar algo que
> hasta ahora vivía disperso en 4 documentos distintos — `02a-restricciones-e-indices.md`
> (PK/FK a nivel de diseño), `06-estrategia-seguridad.md` (RLS), `FOREIGN_KEYS.md`
> (verificación real de FK) y `SECURITY.md` (verificación real de RLS/roles). Este
> documento no repite ese contenido — lo cita y responde la pregunta que ninguno de
> los 4 respondía solo: **"¿qué garantiza, en conjunto, que los datos de GORAZUS
> nunca queden en un estado inconsistente?"** Las cuatro capas clásicas de
> integridad de un RDBMS (entidad, dominio, referencial, definida por el usuario) más
> una quinta específica de un ERP multiempresa (integridad transaccional/de tenant).

## 1. Las cinco capas de integridad

| Capa                             | Pregunta que responde                                                                                          | Mecanismo en GORAZUS                                                     |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Entidad**                      | ¿Cada fila es identificable de forma única e inequívoca?                                                       | PK `id UUID` (§2)                                                        |
| **Dominio**                      | ¿Cada columna solo acepta valores válidos para lo que representa?                                              | `NOT NULL`, `CHECK`, `DEFAULT`, tipos exactos (§3)                       |
| **Referencial**                  | ¿Toda referencia a otra fila apunta a una fila que realmente existe?                                           | FK reales (intra-módulo + hacia `core`) + ID suelto (inter-módulo) (§4)  |
| **Definida por el usuario**      | ¿Se cumplen las reglas de negocio que ningún constraint genérico expresa?                                      | Triggers + `core.business_rules`/`business_rule_evaluations` (§5)        |
| **Transaccional / multiempresa** | ¿Puede una fila de un tenant ser leída, modificada o borrada por otro tenant, incluso por error de aplicación? | RLS `FORCE` (§6) + concurrencia optimista (`version`/`row_version`) (§7) |

## 2. Integridad de entidad — llave primaria

Regla ya fijada, sin cambios: [02a-restricciones-e-indices.md §2](./02a-restricciones-e-indices.md#2-llave-primaria--regla-única-sin-excepciones)
— `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` + `local_id BIGINT UNIQUE
GENERATED ALWAYS AS IDENTITY` (correlativo legible, nunca usado en FK).

### 2.1 Por qué UUID y no `BIGSERIAL` como PK

- **Generable en el cliente sin round-trip** — un módulo puede construir una fila
  completa (incluida su PK) antes de la primera escritura, útil para transacciones
  distribuidas y para no filtrar volumen de negocio por un ID secuencial
  adivinable (`id=48213` revela cuántas ventas existen; un UUID no).
- **Sin colisión entre entornos** — restaurar un backup de staging sobre
  producción, o fusionar datos de dos instancias (migraciones, adquisiciones),
  nunca choca por PK numérica reutilizada.
- **Costo asumido conscientemente:** un UUID v4 no tiene localidad — inserciones
  concurrentes de alto volumen fragmentan más el índice de PK que un `BIGSERIAL`
  creciente. Mitigado por `local_id` (BIGINT secuencial) cubriendo el caso de uso
  que sí necesita orden de inserción barato (paginación por cursor, "últimos N
  registros") sin pagar el costo en la PK real.

### 2.2 Regla de integridad de `local_id`

`local_id` es único **global** (no por tenant) — es un correlativo técnico de
depuración/paginación, no un número de documento de negocio (factura, orden de
compra). Los números de documento visibles al usuario son responsabilidad de cada
módulo (`sales.invoices.invoice_number`, con su propio contador por
tenant+sucursal+serie) y quedan fuera del alcance de esta regla universal.

### 2.3 Excepción real: 3 tablas particionadas sin `PRIMARY KEY` de una sola columna

**Hallazgo de esta auditoría**, verificado contra `information_schema.table_constraints`
en la instancia real: `core.audit_logs`, `core.change_history` y
`security.security_audit_logs` **no tienen ningún `PRIMARY KEY` declarado** — la
única unique real es compuesta (`local_id` + la columna de partición, p. ej.
`(local_id, occurred_at)`).

**Causa raíz:** las 3 son tablas particionadas por rango de tiempo (ver
[07-estrategia-particionamiento.md](./07-estrategia-particionamiento.md)) y
Postgres exige, sin excepción, que **toda** `PRIMARY KEY`/`UNIQUE` de una tabla
particionada incluya la columna de partición. `id` (UUID, sin relación con el
tiempo) no puede ser PK de una tabla particionada por `occurred_at` a menos que
`occurred_at` también forme parte de esa PK — lo que rompería la promesa "`id`
solo, sin más columnas" que exige toda FK universal hacia estas 3 tablas (ninguna
existe: son tablas hoja, nadie las referencia por FK, ver §4.1).

**Por qué no es un defecto:** `id` sigue siendo `NOT NULL` con una constraint
`UNIQUE` propia a nivel de columna (no compuesta) en las 3 — la garantía de
"identificador global inequívoco" (§1, capa de entidad) se mantiene igual, solo
que Postgres no lo etiqueta internamente como `PRIMARY KEY`. Es la única
combinación posible que preserva **ambas** garantías (UUID global + partición por
tiempo) para las 3 tablas de mayor volumen de escritura append-only del sistema.

**Acción recomendada para Fase 2:** documentar esta excepción explícitamente en
`02a-restricciones-e-indices.md §2` (ya hecho en esta misma auditoría) y en el
`schema.prisma` maestro (comentario junto a cada uno de los 3 modelos) — para que
un desarrollador nuevo no lo lea como un bug al generar el cliente Prisma y ver
`@@unique([...])` sin `@id`. No se propone ningún cambio de schema: es
arquitectónicamente correcto tal cual está.

## 3. Integridad de dominio

- **`NOT NULL` por defecto** en toda columna de negocio salvo que el `NULL`
  tenga un significado explícito y documentado (p. ej. `company_id NULL` = "aplica
  a todo el tenant", ya fijado en `01-modelo-conceptual.md §1.1`).
- **`CHECK` para enums cerrados** en vez de tablas de catálogo de una sola columna
  cuando el conjunto de valores es estable y pequeño (p. ej.
  `core.tokens.purpose CHECK (purpose IN ('email_verification','password_reset','invitation'))`,
  `taxes.taxes.tax_kind`, `core.audit_logs.operation`) — evita un JOIN
  innecesario para validar un valor que no va a crecer con datos de negocio.
  Cuando el conjunto **sí** puede crecer por decisión de un usuario final
  (monedas, países, unidades de medida), es tabla de catálogo real, no `CHECK`.
- **`DEFAULT` explícito** en las columnas universales (`version DEFAULT 1`,
  `row_version DEFAULT 0`, `is_active DEFAULT true`, `metadata DEFAULT '{}'::jsonb`)
  — ninguna fila nueva depende de que la aplicación recuerde fijarlas.
- **Tipos exactos, nunca `TEXT` genérico para datos estructurados**: `UUID` para
  identificadores, `NUMERIC(p,s)` para dinero/cantidades (nunca `FLOAT`/`REAL` —
  ya fijado en `docs/standards/DATABASE_GUIDELINES.md`), `TIMESTAMPTZ` (nunca
  `TIMESTAMP` sin zona) para toda fecha/hora.

**No auditado en este pase** (no bloqueante): un barrido columna por columna de
las ~7,300 columnas reales para confirmar 100% de adherencia a estas 3 reglas
excede el alcance de "Fase 1 — solo documentación"; el `dictionary/` ya generado
(columna por columna, 21 archivos) es la fuente para hacerlo en una fase futura
con una consulta dirigida contra `information_schema.columns`.

## 4. Integridad referencial

### 4.1 Las tres formas válidas de referencia (ya fijadas, resumen)

| Forma                               | Cuándo se usa                                                                                             | Mecanismo físico                 |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------- |
| FK real **dentro** del mismo schema | Relación entre dos tablas del mismo módulo de negocio                                                     | `REFERENCES` + índice de soporte |
| FK real **hacia `core`**            | Toda tabla de negocio referencia `core.tenants`/`companies`/`branches`/`users`                            | `REFERENCES core.*`              |
| **ID suelto, sin FK física**        | Relación entre dos módulos de negocio distintos (`sales.invoices.customer_id` → `customers.customers.id`) | Columna `UUID`, sin `REFERENCES` |

Razón de la tercera fila, ya fijada en
`docs/architecture/02-arquitectura-modulos-backend.md §4`: una FK física entre
schemas de módulos distintos acopla su ciclo de vida de despliegue/migración —
contradice el objetivo de extracción a microservicios sin reescritura
(`docs/architecture/10-evolucion-a-microservicios.md`).

### 4.2 Hallazgo real, ya documentado, re-confirmado en esta auditoría: 185 FK cruzan schemas de negocio

**Sin cambios respecto a lo ya encontrado en `FOREIGN_KEYS.md §3`** (verificado de
nuevo hoy contra `pg_constraint`: **5,164 FK totales**, 0 en estado `NOT VALID`).
No se repite el detalle tabla-por-tabla acá — vive en
[FOREIGN_KEYS.md §3](./FOREIGN_KEYS.md#3-hallazgo-real-185-fk-cruzan-schemas-de-módulos-de-negocio).
Este documento solo agrega el ángulo de **integridad**: mientras la decisión de
negocio/ADR pendiente no se resuelva, esas 185 FK físicas **hoy proveen** una
garantía de integridad referencial real (ningún `customer_id` huérfano es posible
en las tablas donde existen) que el patrón "ID suelto" documentado **no provee por
sí solo** — la única forma de que un ID suelto no quede huérfano es disciplina de
aplicación (nunca borrar físicamente una fila referenciada, siempre soft-delete) o
un job de reconciliación asíncrono, ninguno de los dos implementado todavía a
nivel de módulo. Retirar esas 185 FK sin reemplazo primero **degradaría**
integridad referencial real hoy existente — el ADR pendiente debe decidir el
reemplazo antes de tocar el schema, no después.

### 4.3 Comportamiento ante borrado — ya fijado, sin cambios

`ON DELETE` real casi nunca se ejecuta en producción porque el patrón universal es
soft-delete (`deleted_at`) — el comportamiento `ON DELETE` de cada FK
(`NO ACTION`/`RESTRICT`/`SET NULL`) importa solo para el caso raro de purga física
autorizada. Detalle ya fijado, sin repetir:
[02a-restricciones-e-indices.md §3.3](./02a-restricciones-e-indices.md#33-comportamiento-ante-borrado-on-delete).

**Consecuencia de integridad no documentada antes, real:** el soft-delete universal
significa que una FK real `ON DELETE NO ACTION` **no impide** que la fila "padre"
quede lógicamente borrada (`deleted_at IS NOT NULL`) mientras un "hijo" activo
sigue apuntándole — Postgres no tiene forma nativa de expresar "no permitir un
UPDATE que ponga `deleted_at` si existen hijos activos". Hoy esa garantía, cuando
existe, vive en la capa de aplicación (`docs/architecture/02 §3`, casos de uso), no
en el schema. Riesgo real documentado, sin corrección propuesta en Fase 1 (requiere
decidir si se agrega un trigger `BEFORE UPDATE` genérico que la aplique a nivel de
base — evaluar en Fase 2).

## 5. Integridad definida por el usuario (reglas de negocio)

`core.business_rules` + `core.business_rule_evaluations` (ambas ya modeladas,
la segunda particionada por tiempo) son el mecanismo genérico ya diseñado para
reglas que ningún `CHECK`/FK puede expresar (p. ej. "una factura no puede
confirmarse si el cliente superó su límite de crédito", que requiere agregar
sobre otras filas, no solo mirar la fila actual). Sin auditoría de contenido en
este pase — 0 filas de negocio real en la instancia de desarrollo todavía, nada
que verificar más allá de que las 2 tablas existen y tienen su FK/partición
correctas (confirmado, ver §2.3 para `business_rule_evaluations`).

## 6. Integridad transaccional / multiempresa — RLS como mecanismo de integridad

RLS no es solo control de acceso — en un modelo donde **todas** las tablas de
negocio comparten el mismo espacio físico entre tenants (`tenant_id` como columna,
no schema-por-tenant ni base-por-tenant), RLS **es** el mecanismo que impide que
una fila de un tenant sea accesible o modificable desde el contexto de otro. Sin
`FORCE ROW LEVEL SECURITY` activo, un simple bug de aplicación (olvidar un
`WHERE tenant_id = ...`, que con RLS activo es estructuralmente imposible porque
Postgres lo agrega solo) se convierte en una fuga de datos entre empresas —
la peor clase de incidente posible en un ERP multiempresa.

**Estado real, verificado hoy** (auditoría Fase 1, 2026-07-21):

| Verificación                                                           | Resultado                                                                                                                                                               |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tablas con RLS habilitado                                              | 500 de 501 tablas de negocio (`core.restore_test_logs` es la única excepción, ya documentada — [SECURITY.md §1](./SECURITY.md#1-row-level-security--verificado))        |
| Tablas con RLS habilitado **pero sin `FORCE`** (dueño podría evadirlo) | **0** — ninguna                                                                                                                                                         |
| `gorazus_app` (rol de `DATABASE_URL` de `apps/api`) es superusuario    | **No** (`rolsuper=false`) — corregido, ver [SECURITY.md §2.1](./SECURITY.md#-21--corregido-más-tarde-el-mismo-día-fase-05-2026-07-20--re-verificado-en-vivo-2026-07-21) |
| `gorazus_app` bypassea RLS                                             | **No** (`rolbypassrls=false`)                                                                                                                                           |

Con estos 4 puntos verificados en conjunto, RLS hoy protege genuinamente el
tráfico real de la API — no solo en el papel del diseño (`06-estrategia-seguridad.md`).

## 7. Concurrencia optimista

`version INTEGER DEFAULT 1` + `row_version BIGINT DEFAULT 0` en toda tabla
(patrón universal, `01-modelo-conceptual.md §1.1`) son la garantía de integridad
frente a **actualizaciones concurrentes perdidas** ("lost update") — dos usuarios
editando la misma fila de negocio (p. ej. una factura) al mismo tiempo. Ningún
`UPDATE` real del código de aplicación debe escribir sin comparar `row_version`
primero (`UPDATE ... WHERE id = $1 AND row_version = $2`); si 0 filas se
actualizan, la aplicación debe interpretar eso como conflicto de concurrencia, no
como "no existe". **No auditado en este pase** si los repositorios reales
(`BaseRepository` de `core/database`, `modules/*/backend`) ya implementan esta
comparación — es una verificación de código de aplicación, fuera del alcance
"solo base de datos" de esta Fase 1; queda como pregunta abierta para la
siguiente auditoría de capa de aplicación.

## 8. Resumen de hallazgos de esta auditoría (todos nuevos, ninguno en documentos previos)

| #   | Hallazgo                                                                                                                                                    | Severidad                                             | Acción                                                     |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| 1   | 3 tablas particionadas sin PK de una sola columna, contradice literalmente "sin excepciones" de `02a §2`                                                    | 🟡 Documentación desactualizada, diseño correcto      | Corregido en esta auditoría (§2.3 + `02a §2`)              |
| 2   | `SECURITY.md`/`DATABASE_HEALTH_REPORT.md` documentaban `gorazus_app` como superusuario — ya estaba corregido desde FASE 05, nunca se actualizó el documento | 🟡 Documentación desactualizada, estado real correcto | Corregido en esta auditoría (§6 + ambos documentos)        |
| 3   | Soft-delete universal no impide lógicamente que un padre quede borrado con hijos activos — sin trigger que lo bloquee                                       | 🟢 Riesgo real, sin incidentes conocidos              | Documentado (§4.3), evaluar en Fase 2                      |
| 4   | Concurrencia optimista (`row_version`) no verificada a nivel de código de aplicación                                                                        | 🟢 Pregunta abierta                                   | Documentado (§7), fuera de alcance de auditoría de solo-BD |

## 9. Trazabilidad

| Punto pedido en la fase                             | Cerrado en                                                                                    |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Estrategia de integridad (consolidada)              | Este documento — primera vez que existe como pieza única, referencia las 4 fuentes previas    |
| Redundancias/inconsistencias detectadas             | §8 — 2 de las 4 son documentación desactualizada corregida, 2 son riesgos reales documentados |
| Verificación en vivo, no solo lectura de documentos | §2.3, §6 — ambas contra `information_schema`/`pg_roles`/`pg_class` reales, 2026-07-21         |
