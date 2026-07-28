# ADR-DB-001 — Estrategia de Particionamiento de Base de Datos

|                                 |                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Identificador**               | `ADR-DB-001`                                                                                                                                                                                                                                                                                                                                                                      |
| **Versión**                     | 1.0.0                                                                                                                                                                                                                                                                                                                                                                             |
| **Estado**                      | Aceptada                                                                                                                                                                                                                                                                                                                                                                          |
| **Fecha**                       | 2026-07-27                                                                                                                                                                                                                                                                                                                                                                        |
| **Última revisión**             | 2026-07-28                                                                                                                                                                                                                                                                                                                                                                        |
| **Autor**                       | Chief Software Architect, GORAZUS ERP Enterprise                                                                                                                                                                                                                                                                                                                                  |
| **Ámbito**                      | Modelo de datos completo (22 schemas, Postgres 17)                                                                                                                                                                                                                                                                                                                                |
| **ADRs relacionados**           | `ADR-INV-000` (Bounded Context de Inventario, reutiliza el criterio de particionamiento selectivo), `ADR-INV-001` (Catálogo de Productos, `sales.invoice_lines` referenciado en §4.3), `ADR-INV-002` (Almacenes)                                                                                                                                                                  |
| **Dominios relacionados**       | Database, Inventory (`stock_movements`), Sales (`invoices`), Purchases (`purchase_invoices`), Accounting (`journal_entries`)                                                                                                                                                                                                                                                      |
| **Componentes relacionados**    | `pg_partman` 5.4.3, `core.scheduled_jobs`/`scheduled_job_runs`, `core.data_retention_policies`, MinIO (`archive-cold`)                                                                                                                                                                                                                                                            |
| **Issues relacionados**         | Gap real sin ticket formal todavía: `core.audit_logs`/`system_logs`/`activity_logs`/`notification_delivery_logs`, `security.login_attempts`/`session_activity_logs` sin `PARTITION BY RANGE` ni registro en `pg_partman` pese a tener PK compuesta (§14.1) — ver `docs/AKB/04 Database/Database Maintenance.md`                                                                   |
| **Patrones relacionados (AKB)** | `Partition Manager`, `Data Retention`, `Database Maintenance`, `Partitioning`, `Indexes`                                                                                                                                                                                                                                                                                          |
| **Documentos relacionados**     | [docs/database/07-estrategia-particionamiento.md](../database/07-estrategia-particionamiento.md) (especificación técnica detallada, tabla completa de particiones), [docs/database/04-estrategia-indices.md](../database/04-estrategia-indices.md), [docs/architecture/11-gobernanza-y-adrs.md](../architecture/11-gobernanza-y-adrs.md) (convención de ADRs de este repositorio) |

Este documento formaliza, como decisión de arquitectura, una estrategia que ya está **parcialmente
implementada y verificada en producción de desarrollo** (`sales.invoices`, `accounting.journal_entries`)
y que rige el resto de las tablas de alto volumen del sistema. No introduce una decisión nueva — eleva
a ADR una decisión ya tomada y en ejecución, documenta su razonamiento completo y deja registro
histórico de por qué se llegó a esta estrategia y no a otra.

---

## 1. Propósito

GORAZUS ERP Enterprise no se diseña para el volumen de datos del primer cliente ni del primer año de
operación. Se diseña para sostener, sin reescritura estructural, el siguiente perfil de carga a lo
largo de un horizonte de **más de 15 años de crecimiento continuo**:

- **Miles de empresas** operando en la misma instalación (modelo multiempresa real: aislamiento por
  `tenant_id`/`company_id`/`branch_id` vía Row-Level Security de PostgreSQL sobre tablas
  **compartidas**, no una base de datos ni un schema por cliente — ver
  [09-seguridad-y-multiempresa.md](../architecture/09-seguridad-y-multiempresa.md) y
  [06-estrategia-seguridad.md](../database/06-estrategia-seguridad.md)). Esta elección de aislamiento
  lógico, no físico, es precisamente lo que hace que el particionamiento deje de ser una optimización
  opcional: cada tabla compartida crece con la suma de **todos** los tenants, indefinidamente.
- **Millones de productos** en los catálogos combinados de todas las empresas (`products.products` y
  las ~35 tablas relacionadas de variantes, atributos, combos y kits).
- **Cientos de millones de movimientos de inventario** — el patrón de mayor volumen de escritura del
  sistema: cada venta, recepción, transferencia, ajuste y conteo físico genera al menos una fila en
  `inventory.stock_movements`, de forma continua, sin techo natural.
- **Miles de usuarios concurrentes** ejecutando operaciones transaccionales (ventas, facturación,
  inventario) y analíticas (reportes, dashboards) sobre la **misma** base operacional.
- **Crecimiento continuo, sin ventana de mantenimiento que permita una migración estructural mayor**
  una vez el sistema esté en producción con datos reales de múltiples empresas.

Sin una estrategia de particionamiento decidida **desde el diseño inicial del modelo de datos** —no
como un proyecto de remediación posterior—, este perfil de carga produce, de forma predecible y
documentada en la literatura de sistemas OLTP de gran escala:

1. **Degradación progresiva de consultas**: un `SELECT` que filtra "los movimientos de este mes" deja
   de poder usar un índice eficiente cuando la tabla completa supera los cientos de millones de filas
   y decenas o cientos de gigabytes — el planificador de consultas eventualmente prefiere (o se ve
   forzado a) recorrer un índice B-tree que ya no cabe en memoria.
2. **Mantenimiento no acotado**: `VACUUM`, `REINDEX` y `ANALYZE` sobre una tabla monolítica de
   crecimiento indefinido tardan cada vez más y compiten por I/O con la carga transaccional en curso.
3. **Retención y purga operacionalmente inviables**: borrar filas antiguas de una tabla no particionada
   de cientos de millones de registros mediante `DELETE` fila por fila genera bloat masivo, WAL
   desproporcionado y contención de bloqueos — una operación de negocio legítima ("purgar movimientos
   de hace más de 7 años") se vuelve, en la práctica, imposible de ejecutar sin una ventana de
   mantenimiento extensa.
4. **Backups y restauración cada vez más lentos**, sin la posibilidad de excluir selectivamente datos
   históricos ya archivados.

El particionamiento resuelve estos cuatro problemas de forma nativa en PostgreSQL, sin sacrificar la
simplicidad del modelo relacional único que el resto de la arquitectura de GORAZUS asume (un solo
clúster Postgres, RLS para aislamiento multiempresa, sin sharding de aplicación). Es, por lo tanto, una
decisión de arquitectura de datos fundacional, no un ajuste de rendimiento táctico que se pueda diferir.

---

## 2. Principios de Diseño

### 2.1 No toda tabla debe particionarse

Particionar indiscriminadamente es un error de diseño tan real como no particionar en absoluto. El
particionamiento no es gratuito: introduce complejidad estructural (definición de clave de partición,
restricciones que deben incluirla, límites reales de PostgreSQL sobre claves foráneas hacia tablas
particionadas — ver §4.5) y complejidad operativa (rotación de particiones, más objetos que respaldar,
más objetos que el planificador debe considerar). Esa complejidad solo se justifica cuando el beneficio
—poda de particiones en las consultas dominantes y purga barata por antigüedad— es real y medible.

### 2.2 El particionamiento tiene un costo de mantenimiento real, no solo un beneficio de consulta

Cada tabla particionada exige: automatización confiable de creación de particiones futuras (nunca
manual, nunca reactiva — ver §5.3), una política de retención explícita, y disciplina en el modelo
lógico para que las claves foráneas y los índices se declaren correctamente sobre la tabla raíz. Tratar
el particionamiento como "gratis" porque PostgreSQL lo soporta nativamente es subestimar ese costo.

### 2.3 Solo se particionan tablas de alto crecimiento con un patrón de acceso que se beneficia realmente

El criterio de selección no es "esta tabla es grande" sino la combinación de tres condiciones
simultáneas:

1. **Volumen de escritura de tipo append-only** (o predominantemente así) — auditoría, movimientos,
   asientos contables, líneas de factura, bitácoras de sesión.
2. **Las consultas dominantes filtran por un rango de fecha reciente** — "los movimientos de este mes",
   "el libro diario del período fiscal actual" — de modo que la poda de particiones (_partition
   pruning_) elimina la mayoría de las particiones antes de tocar disco.
3. **La retención/purga por antigüedad es una necesidad de negocio real**, no solo una conveniencia
   técnica — cumplimiento fiscal, políticas de archivado de auditoría, ciclos contables cerrados.

### 2.4 Mantener el esquema simple cuando el particionamiento no aporta valor

Los catálogos maestros (`products.products`, `customers.customers`, `configuration.*`) y las tablas de
saldo actual (`inventory.stock`, que representa la existencia _vigente_, no un histórico) crecen con el
**número de entidades de negocio**, no con el tiempo, y sus consultas no siguen un patrón de rango
reciente — un `SELECT` por `product_id` no se beneficia de particionar por fecha de creación. Forzar
particionamiento sobre estas tablas añadiría toda la complejidad de §2.2 sin ganar nada a cambio. Se
mantienen como tablas simples, con indexación B-tree/GIN convencional
(ver [04-estrategia-indices.md](../database/04-estrategia-indices.md)).

### 2.5 Optimizar específicamente para PostgreSQL, no para el mínimo común denominador de SQL

GORAZUS fija PostgreSQL 17 como motor de base de datos (ver §3.4) y la estrategia de particionamiento
se diseña para explotar sus capacidades reales — particionamiento declarativo nativo, propagación
automática de RLS e índices a particiones hijas, índices BRIN sobre columnas de partición append-only,
y `pg_partman` como extensión de facto para automatización — en vez de limitarse a un subconjunto
portable entre motores. Las implicancias de portabilidad, para cuando surjan, se documentan aparte
(§4.7) sin condicionar el diseño de hoy.

---

## 3. Métodos de Particionamiento

PostgreSQL ofrece tres estrategias nativas de particionamiento declarativo (desde la versión 10, con
mejoras sustanciales de rendimiento y funcionalidad hasta la versión 17 que usa GORAZUS). Las tres están
disponibles y se evalúan a continuación; la decisión de cuál usar por defecto y cuáles quedan como
técnica secundaria se documenta en la §4.

### 3.1 `RANGE` (particionamiento por rango)

**Cómo funciona**: cada partición hija cubre un rango contiguo y no superpuesto de valores de la
columna de partición — típicamente una fecha o marca de tiempo (`created_at`, `posting_date`,
`issued_at`). PostgreSQL enruta cada `INSERT` a la partición correspondiente automáticamente, y el
planificador de consultas descarta en tiempo de planificación (y, si el valor límite es dinámico, en
tiempo de ejecución) toda partición que no pueda contener filas que satisfagan el filtro de la consulta
— esto es _partition pruning_.

**Ventajas**:

- Poda de particiones extremadamente efectiva para el patrón de consulta más común en un ERP: "dame los
  registros de este período" — una consulta sobre el mes actual toca una sola partición, no la tabla
  completa, sin importar cuántos años de historia existan.
- Purga y archivado por antigüedad se vuelven operaciones de metadatos (`DETACH PARTITION`), no
  operaciones de I/O masivo (ver §5).
- Se alinea naturalmente con la semántica de negocio de un ERP: ejercicios fiscales, períodos contables,
  ciclos de auditoría.

**Desventajas**:

- Requiere que la columna de partición forme parte de toda clave primaria/única de la tabla —
  reestructura la forma en que otras tablas pueden referenciarla por clave foránea (ver §4.5).
- Sin automatización de creación de particiones futuras, una carga puede fallar por falta de partición
  destino — la disciplina operativa (§5.3) no es opcional.
- No ayuda en absoluto a consultas que no filtran por la columna de partición.

**Caso de uso típico**: tablas append-only de alto volumen cuyo acceso dominante es por recencia —
auditoría, movimientos de inventario, asientos contables, bitácoras de sesión.

### 3.2 `LIST` (particionamiento por lista)

**Cómo funciona**: cada partición hija se define por un conjunto explícito y discreto de valores de la
columna de partición (por ejemplo, un código de región, de país, de estado de un documento, o de tipo
de entidad).

**Ventajas**:

- Natural cuando existe una dimensión categórica de baja cardinalidad, estable en el tiempo, y con
  patrones de acceso genuinamente distintos por categoría (por ejemplo, aislar el procesamiento de una
  jurisdicción fiscal con reglas y volumen propios).
- Permite reglas de retención o de almacenamiento distintas por categoría (una partición en
  almacenamiento más rápido, otra en almacenamiento frío).

**Desventajas**:

- No resuelve el problema de crecimiento no acotado en el tiempo — una partición por categoría sigue
  creciendo indefinidamente si esa categoría es de alto volumen y no se combina con `RANGE` (ver
  particionamiento compuesto, §4.4).
- Exige mantener la lista de valores explícitamente sincronizada con la realidad del negocio; un valor
  nuevo sin partición asignada rompe la carga si no hay partición `DEFAULT`.
- Menos natural para el patrón de acceso dominante de un ERP transaccional, que es temporal, no
  categórico.

**Caso de uso típico**: multi-región con procesamiento y cumplimiento normativo genuinamente distintos
por región, o segmentación por un estado de ciclo de vida de bajísima cardinalidad y muy desbalanceado
en volumen.

### 3.3 `HASH` (particionamiento por hash)

**Cómo funciona**: PostgreSQL aplica una función hash determinística sobre la columna de partición y
distribuye las filas uniformemente entre un número fijo de particiones, sin relación semántica entre el
valor y la partición que lo recibe.

**Ventajas**:

- Distribución de volumen y de carga de escritura uniforme y predecible, independiente de si los datos
  tienen o no una dimensión temporal o categórica útil.
- Reduce la contención de escritura concurrente cuando muchas conexiones insertan simultáneamente en el
  mismo rango de valores (por ejemplo, muchos `INSERT` con la misma marca de tiempo reciente en una
  tabla particionada solo por `RANGE` mensual).

**Desventajas**:

- **No ofrece poda de particiones útil para el patrón de consulta típico de un ERP.** Nadie construye
  un reporte que pregunte "los movimientos cuyo hash es 7" — la ventaja de poda que sí ofrece `RANGE`
  para consultas por fecha simplemente no existe en `HASH`.
- Dificulta la retención por antigüedad: los datos de un mismo período quedan distribuidos entre todas
  las particiones hash, así que no se puede desconectar una partición completa para archivar "todo lo
  de 2019".

**Caso de uso típico en GORAZUS**: no como estrategia primaria, sino como técnica de **segundo nivel**
dentro de un particionamiento compuesto `RANGE` + `HASH` — ver §4.4.

### 3.4 Por qué PostgreSQL es el motor preferido para GORAZUS

La estrategia completa de este documento asume y depende de capacidades específicas de PostgreSQL que
no todos los motores relacionales ofrecen de forma equivalente:

- **Particionamiento declarativo nativo** (desde la v10, con `partition pruning` en tiempo de
  planificación y de ejecución maduro desde la v11-v13) — sin necesidad de vistas con `UNION ALL` ni de
  lógica de enrutamiento manual en la capa de aplicación.
- **Propagación automática de políticas de Row-Level Security e índices** desde la tabla particionada
  raíz hacia cada partición hija — crítico porque GORAZUS usa RLS como mecanismo de aislamiento
  multiempresa en **todas** las tablas de negocio (ver
  [06-estrategia-seguridad.md](../database/06-estrategia-seguridad.md)); sin esta propagación, cada
  partición nueva sería un vector de fuga de datos entre tenants si se olvidara redefinir la política.
- **Índices BRIN** (_Block Range Index_), muy livianos frente a B-tree, ideales exactamente para
  columnas de fecha en tablas append-only ordenadas físicamente por inserción — ya en uso real en este
  proyecto (55 índices BRIN verificados sobre columnas de fecha de tablas de alto volumen, ver
  [DATABASE_HEALTH_REPORT.md](../database/DATABASE_HEALTH_REPORT.md)).
- **`pg_partman`**, la extensión de facto de la comunidad PostgreSQL para automatizar creación y
  rotación de particiones, ya instalada y verificada activa en la infraestructura real del proyecto
  (ver [DATABASE_ARCHITECTURE.md](../database/DATABASE_ARCHITECTURE.md)).
- **Particionamiento compuesto nativo** (`RANGE` de un nivel + `HASH` de un segundo nivel dentro de cada
  partición de rango) sin necesidad de tablas intermedias artificiales.
- Motor de código abierto, sin costo de licenciamiento por núcleo ni por volumen de datos — relevante
  para una instalación que debe escalar a miles de empresas sin que el costo de la base de datos escale
  linealmente con ellas.
- Ecosistema maduro de replicación lógica y herramientas de alta disponibilidad, coherente con los
  requisitos de continuidad de un sistema pensado para 15+ años de operación (ver
  [10-estrategia-alta-disponibilidad.md](../database/10-estrategia-alta-disponibilidad.md)).

---

## 4. Estrategia Global

### 4.1 Estrategia seleccionada

**`RANGE` sobre una columna de fecha/marca de tiempo es la estrategia por defecto** para toda tabla que
cumpla los tres criterios de selección de §2.3. La granularidad se decide por el patrón de retención y
el volumen esperado de cada tabla, no de forma uniforme:

- **Granularidad mensual** para tablas de alto volumen de ejecución operativa sin atadura a un ciclo
  fiscal: bitácoras de auditoría y de sistema, movimientos de inventario, intentos de login, actividad
  de sesión, bitácoras de comunicación de CRM, evaluaciones del motor de reglas de negocio, trabajos en
  segundo plano, consumos de producción, visitas de servicio, partes de horas de proyecto.
- **Granularidad anual, alineada al ejercicio fiscal**, para tablas cuyo ciclo de vida de negocio real
  es el año contable: asientos contables (`accounting.journal_entries` / `journal_entry_lines`) y
  entradas de depreciación de activos.

`HASH` **no se adopta como estrategia por defecto** en ninguna tabla — se reserva exclusivamente como
técnica de mitigación de segundo nivel (§4.4). `LIST` se evaluó y **no se adopta hoy**: ninguna tabla
del modelo actual combina una dimensión categórica de baja cardinalidad con un patrón de acceso que se
beneficie de ella más que un índice convencional. Queda documentada como técnica disponible si en el
futuro emerge una dimensión de negocio real que la justifique (por ejemplo, una expansión con
procesamiento fiscal genuinamente distinto por país).

**No se particionan** los catálogos maestros ni las tablas de saldo/estado actual (§2.4) — esta
exclusión es tan parte de la estrategia como la inclusión de las tablas de alto volumen.

La lista completa y actualizada de tablas particionadas, su granularidad y su columna de clave vive en
[07-estrategia-particionamiento.md §1](../database/07-estrategia-particionamiento.md#1-qué-se-particiona-y-qué-no)
— este ADR no la duplica para evitar que ambos documentos diverjan; documenta el _por qué_, la
especificación técnica documenta el _qué_, exactamente la separación de responsabilidades que define
[11-gobernanza-y-adrs.md](../architecture/11-gobernanza-y-adrs.md).

### 4.2 Justificación técnica

1. El patrón de consulta dominante de un ERP transaccional sobre las tablas de alto volumen es
   temporal, no categórico ni uniformemente distribuido: "el libro diario de este período", "los
   movimientos de inventario del mes", "la bitácora de auditoría de la última semana". `RANGE` es la
   única de las tres estrategias que convierte ese patrón en poda real de particiones.
2. La retención y el archivado por antigüedad —una obligación real de cumplimiento en varias de estas
   tablas, no una preferencia técnica— se resuelven con `DETACH PARTITION`, una operación de
   metadatos casi instantánea que no bloquea el resto de la tabla, en vez de un `DELETE` masivo (§5).
3. Alinear la granularidad al ciclo de negocio real (mensual para operación, anual-fiscal para
   contabilidad) evita tanto el extremo de particiones demasiado finas (sobrecarga de planificación por
   exceso de particiones) como el de particiones demasiado gruesas (poda poco efectiva).

### 4.3 Evidencia real de implementación

Esta estrategia no es solo un diseño en papel: dos tablas centrales del sistema ya la implementan y
están verificadas en la base de datos certificada del proyecto:

- **`sales.invoices`**, particionada `RANGE` por `issued_at` — toda factura del sistema, de todas las
  empresas, vive en esta única tabla lógica.
- **`accounting.journal_entries`**, particionada `RANGE` por `posting_date` (alineada a ejercicio
  fiscal) — todo asiento contable generado, manual o automáticamente por el motor de reglas contables,
  vive en esta tabla.

Ambas confirman en la práctica un patrón estructural real que se documenta aquí porque condiciona el
modelo lógico de cualquier tabla de detalle asociada (§4.5): la tabla de líneas correspondiente
(`invoice_lines`, `journal_entry_lines`) **no está particionada ella misma** — es una tabla simple que
referencia a su encabezado particionado mediante un identificador sin restricción de clave foránea
formal, validado en la capa de aplicación en el momento de la escritura. Encabezado y líneas se escriben
en la misma transacción de base de datos, en dos sentencias separadas, nunca mediante una inserción
anidada de Prisma/ORM que asuma una relación declarativa inexistente a nivel de motor.

> **Nota de consistencia documental**: la tabla de §1 de
> [07-estrategia-particionamiento.md](../database/07-estrategia-particionamiento.md#1-qué-se-particiona-y-qué-no)
> lista actualmente `sales.invoice_lines` con clave de partición `created_at` "vía la fecha de la
> factura padre". La verificación directa contra el esquema físico certificado confirma que
> `invoice_lines` **no** es, en sí misma, una tabla particionada (clave primaria simple, sin la columna
> de partición incluida) — es `sales.invoices` la que está particionada, y `invoice_lines` se relaciona
> con ella por identificador suelto, exactamente el patrón descrito arriba. Se registra acá como
> hallazgo real para una corrección de redacción de esa fila en una revisión documental posterior — no
> se corrige en este ADR para no mezclar la decisión de arquitectura con el mantenimiento de un
> documento distinto.

### 4.4 Sub-particionamiento por tenant — técnica de escape, no comportamiento por defecto

Dado que GORAZUS aísla tenants mediante RLS sobre tablas **compartidas** (§1), existe un riesgo
estructural real de "vecino ruidoso": una empresa cliente con un volumen de operación
desproporcionadamente alto frente al resto podría concentrar la mayoría de las filas de una partición de
rango de fecha, degradando la experiencia de las demás empresas que comparten esa misma partición.

La mitigación decidida es **particionamiento compuesto**: `RANGE(fecha)` como nivel primario,
sub-particionado por `HASH(tenant_id)` dentro de cada partición de rango — soportado nativamente por
PostgreSQL desde la versión 11. Esta técnica **no se activa preventivamente** sobre las tablas
particionadas del modelo; se activa quirúrgicamente, tabla por tabla y solo cuando datos reales de
producción demuestren el desbalance, no de forma especulativa sobre una situación hipotética.

### 4.5 Interacción con claves foráneas, índices y RLS

- Las políticas de RLS se definen una única vez sobre la tabla particionada raíz y se heredan
  automáticamente a cada partición — nunca se redefinen partición por partición, eliminando la
  posibilidad de que una partición nueva quede sin protección de aislamiento multiempresa.
- Los índices declarados sobre la tabla raíz se propagan como índices locales a cada partición
  automáticamente.
- PostgreSQL exige que cualquier clave foránea **hacia** una tabla particionada incluya la columna de
  partición como parte de la clave referenciada — una limitación real del motor, no una elección de
  diseño de GORAZUS. Es precisamente esta limitación la que produce el patrón descrito en §4.3
  (encabezado particionado + detalle no particionado referenciado por identificador suelto, validado en
  la capa de aplicación) en cualquier tabla de detalle de un documento particionado.

### 4.6 Automatización, retención y archivado

Ninguna partición se crea manualmente. La creación de la partición siguiente se ejecuta con antelación
de un período completo mediante `pg_partman` — nunca de forma reactiva el mismo día que se necesita
(evita el riesgo de que una carga falle por ausencia de partición destino). Cuando una partición sale de
la ventana de retención activa (definida por política explícita, no por convención tácita), se
desconecta con `DETACH PARTITION` — una operación de metadatos, no de I/O masivo sobre los datos— y se
archiva a almacenamiento frío antes de su eliminación definitiva. Nunca se ejecuta un `DELETE` fila por
fila sobre un volumen histórico masivo.

### 4.7 Notas de portabilidad

Esta estrategia está deliberadamente optimizada para PostgreSQL (§2.5) y no para el mínimo común
denominador entre motores. MySQL/MariaDB ofrecen `RANGE`/`HASH` nativos con sintaxis distinta pero
conceptos equivalentes, con restricciones más estrictas sobre claves únicas en tablas particionadas que
PostgreSQL. SQL Server resuelve el mismo problema con un paradigma distinto (función y esquema de
partición separados) pero un resultado funcionalmente comparable. `pg_partman` es exclusivo de
PostgreSQL — una eventual migración de motor requeriría reimplementar la automatización de rotación de
particiones con el mecanismo nativo del motor destino (`pg_cron` no aplica fuera de Postgres; MySQL usa
`information_schema` más eventos programados; SQL Server usa SQL Agent). Esta nota se deja registrada
como consecuencia aceptada de la decisión, no como una limitación que condicione el diseño de hoy.

### 4.8 Ventajas de la estrategia elegida

- Poda de particiones real y medible en el patrón de consulta dominante del dominio (reportes y
  operación por período reciente), sobre las tablas de mayor volumen del sistema.
- Retención y archivado por antigüedad convertidos en operaciones de metadatos casi instantáneas, no en
  proyectos de mantenimiento extensos.
- Consistencia estructural entre todas las tablas particionadas del modelo (mismo patrón de clave, misma
  herramienta de automatización, misma relación con RLS) — reduce la carga cognitiva de mantener el
  sistema a largo plazo frente a tener criterios distintos tabla por tabla.
- Escape hatch disponible y ya diseñado (`RANGE` + `HASH` compuesto) para el escenario real de
  crecimiento desigual entre tenants, sin necesidad de rediseñar el modelo cuando ese escenario ocurra.
- No compromete la simplicidad del resto del modelo: las tablas de catálogo y de saldo actual permanecen
  simples, sin el costo operativo del particionamiento donde no aporta valor.

### 4.9 Desventajas y trade-offs aceptados

- Cualquier tabla de detalle de un documento particionado (líneas de factura, líneas de asiento) pierde
  la posibilidad de una clave foránea declarativa real hacia su encabezado — la integridad referencial
  se aplica en la capa de aplicación, no en el motor, con el riesgo residual que eso implica si un
  camino de escritura futuro omitiera esa validación (mitigado hoy por que toda escritura pasa por el
  repositorio del módulo dueño, nunca por acceso directo a la tabla).
- El particionamiento por `HASH(tenant_id)` como sub-nivel, cuando se active, complica el modelo mental
  de esa tabla específica frente al resto del sistema (dos niveles de partición en vez de uno) — se
  acepta como costo puntual y localizado, no generalizado.
- Depender de `pg_partman` introduce una dependencia operativa real: su ausencia o mal funcionamiento
  (ya ocurrió una vez durante la construcción de la infraestructura — la imagen base de Postgres no lo
  incluía por defecto, corregido en la imagen del proyecto) puede detener silenciosamente la creación de
  particiones futuras si no se monitorea explícitamente.
- La estrategia asume PostgreSQL como motor permanente; una migración de motor futura (hoy no planeada)
  pagaría el costo de portabilidad descrito en §4.7.

---

## 5. Alternativas Consideradas

- **No particionar y confiar en índices B-tree convencionales sobre columnas de fecha.** Descartada:
  no resuelve el costo de `VACUUM`/`REINDEX` sobre una tabla monolítica de cientos de millones de filas,
  ni permite retención barata por antigüedad (§1, puntos 2 y 3).
- **Particionar por `tenant_id` (esquema o tabla por empresa).** Descartada como estrategia primaria:
  contradice el modelo de aislamiento por RLS ya adoptado en todo el sistema
  ([06-estrategia-seguridad.md](../database/06-estrategia-seguridad.md)), y con miles de empresas
  esperadas produciría miles de particiones (o schemas) de tamaño muy desigual, la mayoría triviales —
  el problema real no es "aislar por tenant" sino "acotar el volumen por tiempo". Se conserva como
  técnica de sub-partición quirúrgica (§4.4), no como criterio primario.
- **`HASH` como estrategia por defecto para distribuir carga de escritura uniformemente.** Descartada
  como comportamiento general: sacrifica la poda de particiones que sí ofrece `RANGE` para el patrón de
  consulta dominante de un ERP, a cambio de un beneficio (distribución de escritura) que no es el cuello
  de botella real de este dominio hoy.
- **Sharding a nivel de aplicación (múltiples instancias de Postgres, enrutamiento manual por tenant).**
  Descartada para esta fase: añade una capa completa de complejidad operativa y de aplicación que el
  particionamiento nativo de un único clúster Postgres resuelve de forma más simple para el volumen
  proyectado; queda documentada como posible evolución futura en
  [10-evolucion-a-microservicios.md](../architecture/10-evolucion-a-microservicios.md) si el crecimiento
  real algún día lo justificara, no como parte de esta decisión.

## 6. Consecuencias

- Todo módulo de negocio nuevo que introduzca una tabla de alto volumen de escritura debe evaluar contra
  los tres criterios de §2.3 antes de decidir si se particiona, y documentarlo en
  [07-estrategia-particionamiento.md](../database/07-estrategia-particionamiento.md) siguiendo el mismo
  formato — este ADR es la referencia de _por qué_, esa tabla sigue siendo la fuente única de verdad de
  _qué_ está particionado.
- Todo repositorio de aplicación que escriba sobre una tabla particionada y su tabla de detalle asociada
  debe seguir el patrón ya establecido en `FacturaRepository`/`AsientoRepository`: dos escrituras
  explícitas en la misma transacción, nunca una escritura anidada que asuma una relación declarativa
  inexistente a nivel de motor (§4.5).
- La operación del sistema depende de que `pg_partman` esté activo y monitoreado — su falla silenciosa
  es un riesgo operativo real y debe tener alerta propia (fuera del alcance de este ADR, referenciado
  para seguimiento en la estrategia de observabilidad de la plataforma).
- La fila de `sales.invoice_lines` en
  [07-estrategia-particionamiento.md §1](../database/07-estrategia-particionamiento.md#1-qué-se-particiona-y-qué-no)
  queda señalada (§4.3) para corrección de redacción en una revisión documental posterior.

## 7. Catálogo Detallado de Particionamiento por Tabla

Esta sección aplica los principios de §2 a cada tabla candidata del sistema, tabla por tabla. Cada
fila distingue explícitamente entre **estado actual** (verificado contra el schema Prisma
certificado, `core/database/prisma/schemas/`) y **recomendación de este ADR** cuando ambos no
coinciden — ninguna fila afirma como implementado algo que no lo está.

Nomenclatura de "Tipo de partición": todas las entradas de este catálogo usan `RANGE` (§3.1), el
método por defecto de GORAZUS (§4.1). Ninguna tabla de este catálogo requiere `LIST` o `HASH` como
estrategia primaria — `HASH` solo aparece como sub-partición quirúrgica opcional de segundo nivel
(§4.4), señalada donde aplica.

| Tabla real                         | Crecimiento esperado                                                                                            | Tipo de partición                    | Clave de partición | Frecuencia                         | Justificación técnica                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ------------------ | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `core.audit_logs`                  | No acotado — una fila por cada operación mutante auditable, de por vida del sistema, en todos los tenants.      | RANGE (implementado)                 | `occurred_at`      | Mensual                            | Append-only puro, nunca se actualiza ni se borra fila a fila (retención vía `DETACH PARTITION`, §4.6). Consulta dominante es "auditoría de una tabla/fila en un rango de fechas reciente" — la poda de particiones evita escanear el historial completo.                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `core.activity_logs`               | No acotado — una fila por acción de usuario relevante (no toda petición HTTP), por tenant.                      | RANGE (implementado)                 | `created_at`       | Mensual                            | Mismo patrón que `audit_logs`: append-only, consulta dominante acotada a una ventana de tiempo reciente por usuario o tenant.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `core.system_logs`                 | No acotado — logging técnico interno del propio sistema (nivel/mensaje/contexto), volumen ligado al tráfico.    | RANGE (implementado)                 | `created_at`       | Mensual                            | Append-only, valor decae rápido con el tiempo — candidato natural también a retención agresiva (ver §4.6, `DETACH` + archivado en frío antes que `audit_logs`, cuyo valor legal/de cumplimiento es más duradero).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `inventory.stock_movements`        | No acotado — una fila por cada entrada/salida/ajuste/transferencia de inventario, en todos los almacenes.       | RANGE (implementado)                 | `created_at`       | Mensual                            | Tabla de mayor volumen esperado del dominio operativo (no contable): con miles de empresas y catálogos grandes, cientos de millones de filas en pocos años. `inventory.v_kardex` (ver fila siguiente) depende de que esta tabla soporte poda de particiones para no degradar con el tiempo.                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `inventory.v_kardex`               | No aplica — es una **vista**, no una tabla física.                                                              | No particionable                     | No aplica          | No aplica                          | `inventory.v_kardex` es una `VIEW` sobre `stock_movements` con saldo corrido (`docs/database/sql/24_views.sql`), documentada explícitamente como sustituto de una tabla física `inventory.kardex_entries` que nunca se materializó. Una vista no se particiona: hereda el beneficio de la poda de particiones de `stock_movements`, su única tabla base. "Kardex" y "movimientos de inventario" son, en GORAZUS, la misma tabla física — no dos tablas distintas.                                                                                                                                                                                                                                               |
| `sales.invoices`                   | No acotado — una fila por factura de venta emitida, por tenant.                                                 | RANGE (implementado)                 | `issued_at`        | Mensual                            | Documento transaccional de alto volumen con fuerte localidad temporal de consulta ("facturas del mes/trimestre actual"). PK compuesta `(id, issued_at)` ya certificada en el schema (§4.3).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `sales.invoice_lines`              | No acotado — de 1 a N filas por cada fila de `sales.invoices`, mismo orden de magnitud multiplicado.            | Regular (no particionada) — ver nota | No aplica (hoy)    | No aplica (hoy)                    | Estado real verificado: PK simple `id`, sin clave de partición, referencia suelta a `invoices` por UUID sin FK declarada (§4.3/§4.5 — Postgres exige que la clave de partición forme parte de cualquier PK/UNIQUE referenciada por FK). Nota de consistencia documental ya registrada en §4.3: `07-estrategia-particionamiento.md` la describe como particionada "vía la fecha de la factura padre", lo cual no es literalmente cierto a nivel de motor — es la misma tabla, sin partición física propia. Este ADR no cambia esa decisión de diseño (mantenerla sin particionar es válida, igual que `journal_entry_lines`/`purchase_invoice_lines` abajo); solo dejamos constancia de la redacción a corregir. |
| `purchases.purchase_invoices`      | No acotado — una fila por factura de compra recibida, por tenant.                                               | RANGE (implementado)                 | `received_at`      | Mensual                            | Mismo patrón que `sales.invoices`: PK compuesta `(id, received_at)` ya certificada.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `purchases.purchase_invoice_lines` | No acotado — de 1 a N filas por cada fila de `purchase_invoices`.                                               | Regular (no particionada)            | No aplica          | No aplica                          | Mismo patrón exacto que `sales.invoice_lines`: PK simple `id`, referencia suelta por UUID sin FK declarada. Tercer módulo independiente donde se confirma el mismo criterio de diseño consistente (§4.3): la tabla "encabezado" se particiona, la tabla "línea" no.                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `accounting.journal_entries`       | No acotado — un asiento contable por cada evento de negocio contabilizable, por tenant.                         | RANGE (implementado)                 | `posting_date`     | Anual, alineada a ejercicio fiscal | El libro diario es el registro contable de mayor volumen y de mayor exigencia de integridad e inmutabilidad del sistema. Partición anual (no mensual) porque los reportes contables dominantes son por ejercicio fiscal completo (§4.1) — cerrar/archivar un año fiscal completo mapea 1:1 a una operación de partición.                                                                                                                                                                                                                                                                                                                                                                                        |
| `accounting.journal_entry_lines`   | No acotado — de 2 a N filas (partida doble) por cada fila de `journal_entries`.                                 | Regular (no particionada)            | No aplica          | No aplica                          | Mismo patrón "encabezado particionado / línea no particionada" que las dos filas anteriores — la partida doble exige que las líneas de un mismo asiento permanezcan agrupables sin fragmentación adicional por partición propia.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `core.notifications`               | Alto — una fila por notificación generada hacia un usuario destinatario, por tenant.                            | RANGE (recomendado, no implementado) | `created_at`       | Mensual                            | Estado real verificado: PK simple `id`, sin clave de partición hoy. Es una tabla append-only con fuerte localidad temporal de consulta ("notificaciones no leídas recientes") y candidata clara a retención agresiva (una notificación de más de N meses rara vez se consulta). Su tabla hija `core.notification_delivery_logs` **ya está particionada** (mensual, según `07-estrategia-particionamiento.md`) — se recomienda cerrar la misma brecha en la cabecera para evitar que `notifications` se convierta en el cuello de botella no particionado del subsistema.                                                                                                                                        |
| `core.background_jobs`             | No acotado — una fila por trabajo asíncrono encolado (`queue_name`/`status`/reintentos), por tenant.            | RANGE (implementado)                 | `created_at`       | Mensual                            | PK compuesta `(id, created_at)` ya certificada. Tabla de cola de trabajos de alto volumen y vida corta por fila (se completa o falla en minutos/horas) — la retención agresiva de particiones vencidas evita que la cola de ejecución activa comparta partición física con millones de trabajos ya completados hace meses.                                                                                                                                                                                                                                                                                                                                                                                      |
| `core.scheduled_jobs`              | Acotado — una fila por definición de trabajo programado (cron), no por ejecución.                               | Regular (no particionar)             | No aplica          | No aplica                          | Es una tabla de **configuración**, no de eventos: crece con la cantidad de trabajos programados distintos que existan en el sistema (decenas, no millones), nunca con el tiempo. Ver `core.scheduled_job_runs` en la fila siguiente para el historial de ejecuciones, que sí es de alto volumen.                                                                                                                                                                                                                                                                                                                                                                                                                |
| `core.scheduled_job_runs`          | No acotado — una fila por cada ejecución de cada `scheduled_job`, indefinidamente.                              | RANGE (recomendado, no implementado) | `started_at`       | Mensual                            | Estado real verificado: PK simple `id`, sin clave de partición hoy. Es el historial de ejecución real (no la definición) — crece sin límite con el tiempo, exactamente el patrón que justifica RANGE mensual en el resto del catálogo. No estaba en la lista de tablas solicitadas explícitamente, pero es la contraparte real de alto volumen de `scheduled_jobs` y se incluye por completitud.                                                                                                                                                                                                                                                                                                                |
| `core.edi_transactions`            | No acotado — una fila por transacción de intercambio de datos (EDI) entrante o saliente por integración activa. | RANGE (recomendado, no implementado) | `created_at`       | Mensual                            | Es el equivalente real más cercano al "integration_logs" solicitado: GORAZUS no tiene una tabla genérica con ese nombre, pero `edi_transactions` cumple exactamente ese rol (bitácora de tráfico de integración, con `raw_payload`). PK simple `id` hoy, sin clave de partición — mismo patrón append-only de alto volumen que justifica la recomendación.                                                                                                                                                                                                                                                                                                                                                      |
| `core.webhook_delivery_logs`       | No acotado — una fila por cada intento de entrega de webhook (incluye reintentos), por suscripción activa.      | RANGE (recomendado, no implementado) | `created_at`       | Mensual                            | Es el equivalente real de "webhook_logs": el volumen escala con `eventos × suscripciones activas × reintentos`, potencialmente el subsistema de más rápido crecimiento de integración. PK simple `id` hoy — mismo criterio de recomendación que `edi_transactions`.                                                                                                                                                                                                                                                                                                                                                                                                                                             |

**Tablas solicitadas sin equivalente real distinto en el schema certificado** (se documentan
explícitamente en vez de inventar una tabla que no existe):

- **`api_logs`** — no existe una tabla dedicada a bitácora de peticiones HTTP/API en el schema
  certificado. El logging técnico general vive en `core.system_logs` (ya en el catálogo, ya
  particionada). Si en el futuro se introduce un logging de peticiones API dedicado y de alto
  volumen, debe seguir el mismo criterio RANGE mensual por `created_at` de esta sección.
- **`inventory_transactions`** — mismo concepto físico que `inventory_movements`; en GORAZUS ambos
  nombres genéricos mapean a la única tabla real `inventory.stock_movements`, ya cubierta arriba.
- **`stock_kardex`** — ver `inventory.v_kardex` en la tabla: es una vista derivada, no una tabla
  independiente.
- **`queue_jobs`** — mapea a `core.background_jobs`, ya cubierta arriba.
- **`integration_logs`** — sin tabla genérica con ese nombre; el rol real lo cumple
  `core.edi_transactions`, ya cubierta arriba.

## 8. Tablas Que NO Deben Particionarse

Estas tablas se evaluaron explícitamente contra los tres criterios de §2.3 (crecimiento no acotado
en el tiempo, patrón de acceso dominante por rango temporal reciente, tamaño proyectado que
degrade índices/`VACUUM` convencionales) y **no cumplen ninguno** — son tablas de catálogo o de
estado maestro, cuyo tamaño crece con el número de entidades de negocio (usuarios, empresas,
productos, reglas fiscales), no con el paso del tiempo. Aplicarles RANGE por fecha no reduciría el
volumen físico por consulta (siguen siendo, en la práctica, una sola partición "caliente" con todo
el catálogo activo) y sí añadiría el costo real descrito en §2.2: más objetos que planificar,
vigilar e indexar, sin beneficio de poda.

| Tabla real                                         | Por qué permanece como tabla regular                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `core.users`                                       | Crece con la cantidad de usuarios humanos del sistema (miles por tenant, no millones). Es el destino de decenas de claves foráneas en todo el schema (`created_by`/`updated_by`/`deleted_by` en prácticamente cada tabla) — necesita una PK simple, estable y de búsqueda puntual O(1) por índice, que una clave de partición por fecha no aportaría.                               |
| `core.roles`                                       | Tabla de configuración de seguridad — decenas de filas por tenant como máximo. Consultada en cada verificación de permiso (ruta caliente de autorización); debe permanecer como el índice B-tree más simple y compacto posible.                                                                                                                                                     |
| `core.permissions`                                 | Catálogo global de permisos del sistema — cientos de filas en total, no por tenant. No tiene componente temporal en absoluto.                                                                                                                                                                                                                                                       |
| `core.companies`                                   | Crece con la cantidad de empresas por tenant (decenas, no millones) — es una tabla de identidad organizacional, no de eventos. Es además el ancla de RLS (`company_id`) referenciada por prácticamente toda tabla particionada del catálogo de §7; debe resolverse con una búsqueda puntual, no con poda temporal.                                                                  |
| `core.branches`                                    | Igual criterio que `companies`, un nivel más abajo en la jerarquía organizacional — decenas por empresa.                                                                                                                                                                                                                                                                            |
| `inventory.warehouses`                             | Crece con la cantidad de almacenes físicos por sucursal (unidades a decenas) — tabla de configuración operativa, referenciada constantemente por `stock_movements` (§7) pero ella misma no genera eventos.                                                                                                                                                                          |
| `products.products`                                | Crece con el tamaño del catálogo de productos (puede llegar a millones de SKU en escenarios grandes, pero por **cantidad de productos**, no por tiempo) — el patrón de acceso dominante es búsqueda puntual por SKU/código de barras/nombre, no por rango de fecha de creación; particionar por fecha de alta fragmentaría exactamente ese patrón de búsqueda sin reducir su costo. |
| `products.product_variant_attribute_values`        | Solicitada genéricamente como "product_variants" — el nombre real en GORAZUS es distinto (variantes se modelan como valores de atributo por producto, no como una tabla `product_variants` independiente). Mismo criterio que `products`: crece con el catálogo, no con el tiempo.                                                                                                  |
| `products.brands`                                  | Catálogo de marcas — cientos de filas típicamente, sin componente temporal relevante para la consulta.                                                                                                                                                                                                                                                                              |
| `products.product_categories`                      | Solicitada genéricamente como "categories" — el nombre real es `product_categories`. Es una jerarquía (árbol) de categorías, consultada por estructura, no por fecha — particionar por fecha rompería la localidad de una consulta jerárquica típica ("todas las categorías bajo X").                                                                                               |
| `configuration.payment_methods` / `.payment_forms` | Solicitada como "payment_methods" — GORAZUS certifica **dos** tablas de configuración de pago distintas (`payment_methods` y `payment_forms`), ambas catálogos pequeños y casi estáticos (efectivo, tarjeta, transferencia, crédito, contado, etc.), sin componente temporal.                                                                                                       |
| `configuration.currencies`                         | Catálogo casi estático de monedas (ISO 4217) — decenas de filas en total, prácticamente de solo lectura.                                                                                                                                                                                                                                                                            |
| `taxes.taxes` / `taxes.tax_rates`                  | Catálogo de impuestos y sus tasas vigentes — crece con la cantidad de reglas fiscales configuradas por jurisdicción/tenant (decenas a cientos), no con el volumen de transacciones que las referencian (eso vive en las tablas de facturación/contabilidad ya particionadas en §7).                                                                                                 |

## 9. Diagramas de Particionamiento

Diagramas conceptuales de la estructura física resultante de aplicar §4 y §7. No representan
sintaxis SQL — solo la relación entre la tabla lógica y sus particiones físicas.

### 9.1 Particiones mensuales (patrón por defecto — logs, movimientos, colas)

Aplica a: `audit_logs`, `activity_logs`, `system_logs`, `stock_movements`, `invoices`,
`purchase_invoices`, `background_jobs`, `notifications` (recomendada), `scheduled_job_runs`
(recomendada), `edi_transactions` (recomendada), `webhook_delivery_logs` (recomendada).

```text
                         core.audit_logs (tabla particionada, lógica)
                                          │
        ┌───────────────┬────────────────┼────────────────┬───────────────┐
        │                │                │                │               │
 audit_logs_2026_04  audit_logs_2026_05  audit_logs_2026_06  audit_logs_2026_07  audit_logs_2026_08
 (may. cerrada,       (jun. cerrada,      (jul. cerrada,      (mes actual,        (partición futura,
  solo lectura /       solo lectura /      solo lectura /      lectura+escritura)  creada de antemano
  candidata a          candidata a         candidata a                            por pg_partman,
  DETACH)               DETACH)             DETACH)                               §4.6 — vacía)
                                                                    ▲
                                                                    │
                                                         100% de los INSERT
                                                         nuevos llegan aquí
```

Puntos clave del diagrama:

- Solo la partición del mes en curso recibe escrituras — todas las anteriores son, en la práctica,
  de solo lectura (§4.1).
- `pg_partman` mantiene siempre al menos una partición futura ya creada antes de que empiece el mes
  (§4.6) — nunca se crea una partición de forma reactiva ante el primer `INSERT` que fallaría.
- Las particiones más antiguas se `DETACH`an según la política de retención de cada tabla (§4.6),
  no se `DELETE`an fila por fila.

### 9.2 Particiones anuales alineadas a ejercicio fiscal (patrón contable)

Aplica a: `accounting.journal_entries` (y, por el mismo criterio ya documentado en
`07-estrategia-particionamiento.md`, `assets.asset_depreciation_entries`).

```text
                    accounting.journal_entries (tabla particionada, lógica)
                                          │
              ┌───────────────────────────┼───────────────────────────┐
              │                            │                            │
  journal_entries_2024        journal_entries_2025        journal_entries_2026
  (ejercicio fiscal            (ejercicio fiscal            (ejercicio fiscal
   cerrado y auditado —         cerrado y auditado —         en curso —
   candidato a archivado        candidato a archivado        lectura+escritura,
   en frío tras el plazo        en frío tras el plazo        crece mes a mes
   legal de retención,          legal de retención,          dentro de la misma
   §4.6)                        §4.6)                        partición anual)
```

Puntos clave del diagrama:

- La frecuencia es **anual**, no mensual, porque el patrón de consulta dominante del libro diario es
  el ejercicio fiscal completo (cierres, estados financieros, auditoría) — una partición mensual
  fragmentaría innecesariamente un reporte que casi siempre cruza los 12 meses del año (§4.1).
- `journal_entry_lines` (partida doble) permanece sin particionar (§7) — todas las líneas de un
  asiento del ejercicio 2026 se consultan junto a su encabezado en `journal_entries_2026` por el
  UUID de referencia, sin necesidad de que la tabla de líneas tenga su propia partición.

### 9.3 Jerarquía multinivel (compuesta): RANGE por fecha + HASH por tenant

Aplica solo como **escape quirúrgico** (§4.4) para el caso específico de un tenant "vecino
ruidoso" dentro de una tabla ya particionada por RANGE — no es el diseño por defecto de ninguna
tabla del catálogo de §7. Ejemplo ilustrativo sobre `inventory.stock_movements`:

```text
                    inventory.stock_movements (tabla particionada, lógica)
                                          │
              ┌───────────────────────────┼───────────────────────────┐
              │                            │                            │
  stock_movements_2026_06      stock_movements_2026_07      stock_movements_2026_08
  (partición RANGE mensual,     (partición RANGE mensual,     (partición RANGE mensual,
   caso normal: sin              caso normal: sin              MES CON TENANT DE ALTO
   sub-partición, un solo         sub-partición)                 VOLUMEN — sub-particionada
   segmento físico)                                              por HASH(tenant_id))
                                                                          │
                                                    ┌─────────────────────┼─────────────────────┐
                                                    │                     │                     │
                                        stock_movements_2026_08   stock_movements_2026_08   stock_movements_2026_08
                                            _hash_0                   _hash_1                   _hash_2
                                        (subconjunto de           (subconjunto de           (subconjunto de
                                         tenants, incluye          tenants, incluye          tenants normales,
                                         al tenant ruidoso          tenants normales)          sin el ruidoso)
                                         aislado en su propio
                                         segmento de escritura)
```

Puntos clave del diagrama:

- El primer nivel (RANGE por fecha) es idéntico al patrón por defecto de §9.1 — se mantiene igual
  para todos los meses y todos los tenants.
- El segundo nivel (HASH por `tenant_id`) solo se activa dentro del mes/los meses donde un tenant
  específico satura la partición mensual normal con un volumen de escritura desproporcionado al
  resto — es una decisión operativa puntual, no una política general aplicada a todas las
  particiones desde el diseño (§4.4, §5 — descartado como estrategia primaria).
- Los meses sin ese problema (`2026_06`, `2026_07` en el diagrama) permanecen como una sola
  partición física, sin el costo adicional de gestionar sub-particiones que no aportan beneficio
  ahí.

## 10. Gestor de Particiones (Partition Manager)

Esta sección define el componente de arquitectura responsable del ciclo de vida completo de una
partición, desde su creación anticipada hasta su archivado y eliminación definitiva. Se documenta
distinguiendo, para cada responsabilidad, el **estado real de hoy** (verificado contra la
infraestructura certificada) de la **recomendación de este ADR** donde ambos difieren — mismo
criterio de honestidad que el catálogo de §7.

### 10.1 Naturaleza del componente

El Gestor de Particiones **no es un servicio nuevo e independiente que GORAZUS deba construir desde
cero**: es la combinación, ya parcialmente real, de dos piezas certificadas del sistema —

- `pg_partman` (extensión nativa de PostgreSQL, versión 5.4.3, ya instalada) como motor mecánico de
  bajo nivel: crea y elimina particiones según configuración declarativa (`p_premake`, ventana de
  retención).
- `core.scheduled_jobs` / `core.scheduled_job_runs` (tablas reales del schema `core`, §7) como el
  mecanismo de orquestación de más alto nivel que GORAZUS ya usa para ejecutar trabajos periódicos —
  la creación de particiones se dispara desde aquí, no desde un cron externo al sistema.

Este ADR recomienda formalizar esta combinación como un **componente lógico único** ("Gestor de
Particiones") con siete responsabilidades explícitas, en vez de dejarlas implícitas y dispersas
entre la configuración de `pg_partman` y trabajos programados ad hoc. Formalizarlo no implica
reescribir la mecánica ya real — implica nombrarla, darle un contrato de responsabilidades
explícito, y cerrar las brechas de monitoreo/validación que hoy no tienen dueño.

### 10.2 Las siete responsabilidades

| #   | Responsabilidad                  | Estado real hoy                                    | Mecanismo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --- | -------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Crear particiones futuras        | ✅ Implementado                                    | `pg_partman` con `p_premake` — la evidencia real más directa: la infraestructura certificada ya muestra **~1.200 particiones físicas creadas** sobre **27 tablas particionadas declaradas**, un crecimiento de ~6x observado con el tiempo, consistente con la premisa de "siempre al menos un período por delante" (§4.6). Nunca reactivo.                                                                                                                                                             |
| 2   | Eliminar particiones vencidas    | 🟡 Mecanismo real, política incompleta             | `pg_partman` soporta la eliminación automática vía configuración de retención por tabla, y `core.data_retention_policies` (tabla real, `entity_type` + `retention_period_months` + `action_on_expiry`) existe como el lugar certificado para declarar esa política — pero no hay evidencia de que las 7 tablas de §11.3 tengan hoy una fila poblada en esa tabla. La mecánica existe; los valores de política, no confirmados.                                                                          |
| 3   | Archivar datos antiguos          | ✅ Implementado (a nivel de diseño certificado)    | Exportación a MinIO (bucket `archive-cold`) en formato comprimido antes de eliminación definitiva, con metadatos suficientes para reimportación (`08-estrategia-respaldo.md §4`) — ejecutado después de que `pg_partman` desconecta (`DETACH`) la partición vencida.                                                                                                                                                                                                                                    |
| 4   | Monitorear tamaño de particiones | 🔴 No implementado                                 | No existe hoy un job ni un dashboard que reporte el tamaño físico de cada partición individual ni alerte sobre crecimiento anómalo de una partición específica (p. ej. un mes con volumen 10x el promedio, señal de abuso o de bug de un tenant). Recomendado como brecha a cerrar (§10.4).                                                                                                                                                                                                             |
| 5   | Validar índices                  | 🟡 Correcto en diseño, sin verificación recurrente | Los índices declarados en la tabla particionada raíz se propagan automáticamente a cada partición nueva (propiedad nativa de Postgres, §4.5) — la auditoría de índices más reciente confirmó 0 índices faltantes y 0 duplicados sobre el diseño declarado. Lo que falta es un chequeo periódico que confirme que esa propagación se mantiene íntegra partición por partición a medida que `pg_partman` crea nuevas — hoy se confía en la garantía del motor, sin una verificación explícita programada. |
| 6   | Verificar consistencia           | 🔴 No implementado                                 | No existe hoy un job que reconcilie, por ejemplo, que el conteo/suma de un documento particionado (`sales.invoices`) case con el de su tabla de detalle no particionada (`sales.invoice_lines`) — relevante precisamente porque esa relación no tiene FK declarativa a nivel de motor (§4.5/§4.9) y depende de disciplina de aplicación.                                                                                                                                                                |
| 7   | Detectar particiones faltantes   | 🔴 No implementado                                 | No existe hoy una alerta explícita si `pg_partman` fallara silenciosamente y no lograra crear la partición del período siguiente a tiempo — el riesgo ya está identificado como aceptado en §4.9 ("puede detener silenciosamente la creación de particiones futuras si no se monitorea explícitamente"), pero la mitigación (detección proactiva) todavía no tiene mecanismo.                                                                                                                           |

### 10.3 Ciclo operativo automático

El Gestor de Particiones, una vez formalizadas sus siete responsabilidades, opera en un ciclo
continuo sin intervención manual:

1. **Anticipación** — para cada tabla particionada, con la frecuencia que le corresponda (mensual o
   anual, §9.1/§9.2), se confirma que exista ya la partición del próximo período completo antes de
   que el período actual termine. Esta es la única responsabilidad ya cerrada de punta a punta hoy.
2. **Verificación de integridad** — inmediatamente después de crear una partición nueva, se
   confirma que heredó los índices y las políticas RLS de la tabla raíz (responsabilidad 5), y que
   no quedó ningún vacío de rango entre la partición anterior y la nueva (responsabilidad 7).
3. **Monitoreo continuo** — mientras una partición está activa (recibiendo escritura), se observa su
   tamaño físico y su tasa de crecimiento (responsabilidad 4), comparándola contra el promedio
   histórico de particiones equivalentes, para detectar anomalías tempranas.
4. **Transición a solo lectura** — cuando el período de una partición termina, deja de recibir
   escrituras nuevas por construcción (la clave de partición ya no cae en su rango) — no requiere
   una acción explícita del gestor, es una propiedad del particionamiento `RANGE` en sí.
5. **Evaluación de retención** — el gestor evalúa, contra la política de `core.data_retention_policies`
   (responsabilidad 2), si la partición ya superó su ventana de vida activa.
6. **Archivado y desconexión** — si superó la ventana, se exporta a almacenamiento frío
   (responsabilidad 3) y luego se ejecuta `DETACH PARTITION` — nunca en el orden inverso, para
   nunca perder una partición que todavía no terminó de archivarse.
7. **Verificación de consistencia post-archivado** — se confirma que el archivo frío es recuperable
   e íntegro (responsabilidad 6) antes de considerar el ciclo de esa partición cerrado.

### 10.4 Alertas y fallos silenciosos

La lección operativa real ya documentada en §4.9 —la imagen base de Postgres del proyecto no
incluía `pg_partman` por defecto, un gap real que existió hasta corregirse— es la justificación
directa de por qué las responsabilidades 4, 6 y 7 no pueden quedar solo "confiadas" al
funcionamiento correcto de la extensión: un fallo silencioso de automatización ya ocurrió una vez en
la historia real de este proyecto, a nivel de infraestructura. Se recomienda que el Gestor de
Particiones emita una alerta operativa (fuera del alcance de este ADR definir el canal exacto —
referenciado para la estrategia de observabilidad de la plataforma, igual que en §6) ante cualquiera
de estas condiciones: ausencia de la partición del próximo período a menos de 7 días de necesitarse,
crecimiento de una partición activa que excede 3x el promedio histórico sin explicación de negocio
conocida, o una partición vencida que no logró completar su archivado dentro de su ventana de
gracia.

## 11. Estrategia de Retención de Datos

### 11.1 Hot, Warm y Cold Data — los tres estados de un mismo dato

Todo dato de una tabla particionada de GORAZUS atraviesa, con el tiempo, tres estados operativos
distintos. No son tres copias del dato ni tres tablas distintas — son tres **etapas del ciclo de
vida de la misma fila**, definidas por su antigüedad y su patrón de acceso real, no por su
contenido:

- **Hot Data (dato caliente)**: vive en la partición del período actual (el mes o año en curso), es
  el destino de prácticamente el 100% de las escrituras nuevas y de la gran mayoría de las lecturas
  operativas del día a día (dashboards, operación en curso, validaciones en tiempo real). Debe
  residir en el almacenamiento más rápido disponible del clúster, completamente indexado, sin
  compromiso de latencia.
- **Warm Data (dato tibio)**: vive en particiones de períodos recientes ya cerrados pero todavía
  dentro de la ventana de consulta operativa habitual (por ejemplo, los 3-12 meses anteriores, según
  la tabla) — se consulta con frecuencia decreciente pero real: reportes comparativos
  período-contra-período, auditorías recientes, reimpresión de documentos. Permanece **adjunta**
  (`ATTACH`) a la tabla particionada y con sus índices activos, pero es candidata a residir en un
  nivel de almacenamiento más económico si la infraestructura lo permite (p. ej. un tablespace
  separado sobre disco más lento), sin que la aplicación note la diferencia.
- **Cold Data (dato frío)**: superó la ventana de retención activa definida en
  `core.data_retention_policies` — se **desconecta** (`DETACH PARTITION`) de la tabla particionada
  activa y se archiva comprimida en almacenamiento frío (bucket MinIO `archive-cold`,
  `08-estrategia-respaldo.md §4`). Deja de ser consultable en línea por la aplicación; se conserva
  únicamente por el mínimo legal de retención del país/régimen fiscal aplicable, con metadatos
  suficientes para una reimportación puntual si una auditoría años después lo exige.

### 11.2 Cuándo un dato debe moverse entre etapas

La transición **no se basa en el contenido del dato ni en una decisión caso por caso** — se basa
exclusivamente en la antigüedad de la partición completa a la que pertenece, aplicada de forma
uniforme:

- **Hot → Warm** ocurre automáticamente y sin ninguna acción explícita en el instante en que el
  período de la partición termina (por ejemplo, el 1 de cada mes para las tablas de partición
  mensual) — es una consecuencia directa de que la clave `RANGE` ya no admite nuevas filas de ese
  período, no una operación separada que el Gestor de Particiones deba ejecutar.
- **Warm → Cold** ocurre cuando la antigüedad de la partición supera el `retention_period_months`
  configurado para ese `entity_type` en `core.data_retention_policies` — la transición es una
  operación del Gestor de Particiones (§10.3, pasos 5-7): evaluación de política, archivado,
  `DETACH`. El piso duro nunca configurable por debajo del mínimo legal (regla ya establecida en
  `05-estrategia-auditoria.md §6` y `08-estrategia-respaldo.md §4`): los datos fiscales/contables se
  retienen según el mínimo legal del país de la empresa, nunca menos, sin excepción operativa.

### 11.3 Tabla de políticas de retención

Las siguientes siete tablas fueron solicitadas explícitamente. Se documentan con su nombre real de
GORAZUS (mapeo ya establecido en §7) y con una **propuesta de política** — ninguna de estas siete
tiene hoy una fila confirmada y poblada en `core.data_retention_policies` (§10.2, responsabilidad
2), así que los valores de esta tabla son la recomendación de este ADR para poblar esa
configuración, no un valor ya vigente en producción.

| Tabla solicitada      | Tabla real GORAZUS                                                      | Hot                       | Warm                           | Cold (retención total propuesta)                                                                                                                                                                                                  | Justificación                                                                                                                                                                                                                          |
| --------------------- | ----------------------------------------------------------------------- | ------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `audit_logs`          | `core.audit_logs`                                                       | Mes en curso              | 24 meses                       | Mínimo legal de auditoría del régimen fiscal/de cumplimiento aplicable (nunca menos) — propuesto 7 años como piso conservador típico de retención de auditoría empresarial, ajustable por país vía `configuration.fiscal_regimes` | Valor de cumplimiento/legal, no técnico — es la tabla con el criterio de retención más largo del catálogo por diseño.                                                                                                                  |
| `activity_logs`       | `core.activity_logs`                                                    | Mes en curso              | 6 meses                        | 18 meses                                                                                                                                                                                                                          | Valor operativo (soporte a usuario, investigación de incidentes), no de cumplimiento legal — retención más corta que `audit_logs` porque no sustituye la pista de auditoría formal.                                                    |
| `api_logs`            | Sin tabla real distinta — el rol lo cumple `core.system_logs` (§7)      | Mes en curso              | 1 mes                          | 3 meses                                                                                                                                                                                                                           | El logging técnico decae en valor más rápido que cualquier otra tabla del catálogo — es el candidato natural a la ventana de retención más corta.                                                                                      |
| `notifications`       | `core.notifications`                                                    | Mes en curso              | 3 meses                        | 12 meses                                                                                                                                                                                                                          | Una notificación pierde valor operativo rápido tras ser leída/expirar, pero se conserva un año como respaldo de soporte al usuario ("¿por qué no me llegó esta notificación?").                                                        |
| `queue_jobs`          | `core.background_jobs` (§7)                                             | Día/semana en curso       | 1 mes                          | 6 meses                                                                                                                                                                                                                           | Vida útil por fila muy corta (se completa o falla en minutos/horas) — la retención existe para diagnóstico de fallos recientes, no para historial de largo plazo.                                                                      |
| `inventory_movements` | `inventory.stock_movements`                                             | Mes en curso              | 12 meses                       | Mínimo legal contable/fiscal del país (nunca menos) — propuesto igual criterio que `journal_entries` por su vínculo directo con costo de venta y valuación de inventario                                                          | Es la tabla de mayor volumen físico del sistema (§7) y a la vez tiene valor de cumplimiento real (soporta el costo de venta reportado) — no puede tratarse solo como log técnico.                                                      |
| `journal_entries`     | `accounting.journal_entries` (+ `journal_entry_lines`, no particionada) | Ejercicio fiscal en curso | 2 ejercicios fiscales cerrados | Mínimo legal contable del país de la empresa, nunca menos (regla ya establecida)                                                                                                                                                  | El libro diario es, por definición legal en la mayoría de jurisdicciones, el registro contable de mayor exigencia de retención de todo el sistema — nunca se purga por política técnica, solo tras confirmar el mínimo legal cumplido. |

## 12. Mantenimiento de Base de Datos

Esta sección documenta las operaciones de mantenimiento de PostgreSQL relevantes para un modelo
particionado, distinguiendo en cada una el estado real ya verificado en la instancia certificada de
GORAZUS (Postgres 17, `docker-postgres-1`, ver `docs/database/POSTGRESQL_TUNING.md` e
`INDEX_REPORT.md`) de la recomendación aplicable cuando el volumen de producción real lo justifique.

### 12.1 `VACUUM`

Recupera el espacio de filas muertas (actualizadas o eliminadas) sin devolverlo al sistema
operativo, y actualiza los mapas de visibilidad que aceleran `Index-Only Scan`. En un modelo
particionado, `VACUUM` opera **por partición individual**, no sobre la tabla lógica completa — esta
es una de las ventajas operativas centrales del particionamiento (§4.8): una partición histórica ya
en `Warm` casi no genera filas muertas nuevas (no recibe escritura), por lo que su costo marginal de
`VACUUM` tiende a cero con el tiempo, mientras que la partición `Hot` del período actual concentra
prácticamente todo el trabajo real de `VACUUM` del sistema — exactamente donde el costo debe
concentrarse.

### 12.2 `ANALYZE`

Actualiza las estadísticas que el planificador de consultas usa para elegir el plan óptimo (por
ejemplo, decidir entre `Index Scan` y `Seq Scan`). Igual que `VACUUM`, opera por partición — una
partición `Hot` con cambios frecuentes necesita estadísticas frescas con mayor regularidad que una
partición `Cold` ya desconectada, cuyo contenido es, por definición, inmutable.

### 12.3 `REINDEX`

Reconstruye un índice desde cero, típicamente para revertir fragmentación acumulada (§12.8) o tras
una corrupción puntual. El particionamiento reduce drásticamente el escenario en que `REINDEX` sea
necesario sobre el sistema completo: si un índice de una partición histórica se fragmenta, se
reconstruye **esa partición únicamente**, sin bloquear ni tocar el índice de la partición `Hot` en
escritura activa — la alternativa sin particionar (una tabla monolítica de cientos de millones de
filas) convertiría la misma operación en una ventana de mantenimiento extensa sobre el sistema
completo.

### 12.4 `CHECK` constraints

GORAZUS ya certifica **6.102 `CHECK` constraints** reales sobre el modelo completo
(`docs/database/DATABASE_STRUCTURE.md`) — validaciones declarativas a nivel de motor (rangos,
enumeraciones, formatos) que no dependen de que la capa de aplicación las repita correctamente en
cada camino de escritura. En una tabla particionada, un `CHECK` declarado en la tabla raíz se
propaga a cada partición nueva de la misma forma que los índices (§4.5) — el Gestor de Particiones
(§10.2, responsabilidad 5) debe incluir esta propagación dentro de su verificación de integridad,
no solo la de índices.

### 12.5 `AutoVacuum`

Verificado activo (`autovacuum = on`) en la instancia real — configuración correcta, sin cambio
recomendado en el parámetro en sí. El punto de atención real para un modelo particionado no es
"activarlo" sino **ajustar su agresividad de forma diferenciada por edad de partición**: una
partición `Hot` con escritura constante se beneficia de un `autovacuum` más agresivo (umbral de
filas muertas más bajo antes de disparar) que una partición `Warm` casi estática, donde el valor por
defecto ya es suficiente. `autovacuum_vacuum_cost_limit` permanece hoy en el valor global (`-1`),
sin evidencia todavía de necesidad de ajuste — a revisar cuando el volumen real de producción lo
justifique (mismo criterio ya documentado en `POSTGRESQL_TUNING.md §1`).

### 12.6 Monitoreo

Lo que ya está disponible hoy sin cambios de infraestructura: `pg_stat_activity` (actividad y
consultas en curso), `pg_locks` (contención de bloqueos) y `pg_stat_user_tables.last_autovacuum`
(última ejecución de autovacuum por tabla) — las tres ya confirmadas consultables contra la
instancia real (`POSTGRESQL_TUNING.md §4`). El gap real más importante identificado: la extensión
`pg_stat_statements` (estadísticas agregadas de consultas, la fuente estándar para identificar
consultas costosas) **no está instalada** — requiere agregarla a `shared_preload_libraries` y
reiniciar el contenedor, no es un cambio en caliente. Sin ella, el monitoreo de qué consultas
específicas presionan más a una tabla particionada (por ejemplo, para decidir cuándo activar la
sub-partición por `tenant_id` de §4.4) depende de observación manual en vez de datos agregados.

### 12.7 Alertas

No existe hoy un sistema de alertas de base de datos dedicado — el monitoreo actual es de
consulta activa (§12.6), no de notificación proactiva. Para un modelo particionado en producción
real, se recomienda que la capa de observabilidad de la plataforma (fuera del alcance de este ADR)
cubra, como mínimo, las condiciones ya identificadas en §10.4 (partición futura ausente,
crecimiento anómalo, archivado incompleto) más las señales estándar de motor: fallo de
`autovacuum` sobre cualquier partición `Hot`, y `random_page_cost` mal calibrado para el
almacenamiento real (hallazgo ya documentado como el más accionable de `POSTGRESQL_TUNING.md §1`:
el valor actual, `4`, asume disco mecánico sobre una infraestructura real en SSD).

### 12.8 Fragmentación

La fragmentación de índices (páginas parcialmente vacías tras muchas actualizaciones/eliminaciones)
es, igual que `VACUUM`/`ANALYZE`, un fenómeno que el particionamiento **acota naturalmente**: una
partición `Warm`/`Cold` que ya no recibe escritura no se fragmenta más allá del punto en que quedó
al cerrarse su período — toda la fragmentación nueva del sistema se concentra, por diseño, en la
partición `Hot` activa. Esto convierte un problema que en una tabla monolítica crecería sin límite en
uno acotado a un volumen de datos conocido y estable (el de un solo período), independientemente de
cuántos años de historia acumule el sistema.

### 12.9 Optimización

La auditoría de índices más reciente confirma que GORAZUS ya opera en un estado de índices
Enterprise-grade sin brechas pendientes: 3.884 índices `BTree` (PK/FK/`UNIQUE`, la mayoría), 55
`BRIN` ya aplicados exactamente donde corresponde (tablas append-only ordenadas por tiempo —
`activity_logs`/`audit_logs` y sus particiones, el caso de uso textual de `BRIN`), 9 `GIN` para
búsqueda por trigram y `JSONB`, 828 índices parciales (`WHERE is_deleted = false`, manteniendo los
índices activos pequeños) y 11 índices `covering` sobre consultas de alta frecuencia ya
identificadas — con 0 índices faltantes, 0 duplicados y 0 innecesarios confirmados
(`INDEX_REPORT.md §1-2`). La recomendación de optimización de este ADR para el modelo particionado
específicamente es extender el mismo criterio de `BRIN` ya aplicado en `activity_logs`/`audit_logs`
a toda tabla particionada por fecha del catálogo de §7 que todavía no lo tenga confirmado — un
índice `BRIN` sobre la columna de partición es, por construcción, órdenes de magnitud más compacto
que un `BTree` equivalente para el patrón de escritura append-only y ordenada por tiempo que define
a estas tablas.

## 13. Escalabilidad

Esta sección explica qué palanca arquitectónica de las ya descritas en este ADR sostiene cada orden
de magnitud de crecimiento, y en qué punto cada palanca deja de ser suficiente por sí sola y activa
la siguiente. Ninguno de estos umbrales implica un rediseño estructural — es la misma arquitectura
de §4 operando con distinta intensidad de cada mecanismo ya definido.

### 13.1 100 GB

Volumen correspondiente aproximadamente a los primeros meses de operación real de un número
moderado de tenants. El particionamiento por `RANGE` ya está activo desde el primer día (§2.1 — la
decisión se toma en el diseño, no se difiere), pero a este volumen su beneficio es principalmente
preventivo, no correctivo: cada partición mensual individual es pequeña, `VACUUM`/`ANALYZE` no son
todavía un problema medible en ninguna tabla, y la configuración de Postgres por defecto documentada
en `POSTGRESQL_TUNING.md` (`shared_buffers` 128MB, `work_mem` 4MB) sigue siendo funcionalmente
suficiente. El valor real en esta etapa es no tener que migrar el modelo de datos más adelante.

### 13.2 1 TB

Las tablas de mayor volumen de escritura del catálogo de §7 (`stock_movements`, `audit_logs`,
`invoices`) empiezan a mostrar la poda de particiones como beneficio medible en reportes de rango
reciente. Es el punto en el que las recomendaciones ya documentadas en `POSTGRESQL_TUNING.md §1`
dejan de ser preventivas y pasan a ser necesarias: `maintenance_work_mem` a 256-512MB (acelera
`VACUUM` en las particiones más grandes), `random_page_cost` corregido a `1.1` para el
almacenamiento SSD real, y `max_wal_size` ampliado a 2-4GB para absorber la escritura sin
checkpoints excesivamente frecuentes. El Gestor de Particiones (§10) pasa de ser una formalización
conveniente a una necesidad operativa real — es el punto en que un fallo silencioso de creación de
partición futura (§4.9, §10.4) empieza a tener consecuencia visible para el negocio.

### 13.3 5 TB

Las políticas de retención de §11 dejan de ser una buena práctica y se convierten en la única forma
sostenible de mantener el tamaño operativo del sistema acotado: sin `Warm → Cold` real y regular, el
volumen de particiones activas (adjuntas) crecería sin límite. Es también el umbral típico en el que
`pg_stat_statements` (§12.6, hoy no instalado) deja de ser opcional — identificar qué consultas
específicas presionan cada tabla particionada requiere datos agregados, no observación manual. El
pooling de conexión externo (PgBouncer en modo `transaction`, ya anticipado como "extensión natural"
en `POSTGRESQL_TUNING.md §2`) se vuelve la vía recomendada para sostener miles de usuarios
concurrentes sin subir `max_connections` directamente.

### 13.4 10 TB

Primer umbral en que la técnica de escape de §4.4/§9.3 (sub-particionamiento `HASH(tenant_id)`)
deja de ser puramente teórica: a este volumen es razonablemente esperable que exista ya al menos un
tenant "vecino ruidoso" cuyo volumen individual dentro de una tabla particionada por fecha justifique
la sub-partición quirúrgica — la decisión sigue siendo puntual, tabla por tabla y tenant por tenant
(§5 — descartada como default), no una migración general del modelo. El archivado a almacenamiento
frío (§11.1, MinIO `archive-cold`) pasa de reducir costo de almacenamiento a ser, además, un
requisito de rendimiento: mantener adjuntas particiones que ya no aportan valor operativo empieza a
tener costo medible sobre el planificador de consultas, incluso con poda de particiones activa.

### 13.5 50 TB

El volumen empieza a exigir separación física de almacenamiento por temperatura de dato (§11.1):
particiones `Hot`/`Warm` recientes en el almacenamiento más rápido del clúster, particiones `Warm`
más antiguas movidas a un tablespace de menor costo dentro del mismo clúster antes de su
desconexión definitiva — una extensión operativa de la infraestructura ya prevista, no un cambio de
estrategia. El monitoreo de tamaño de partición (§10.2, responsabilidad 4, hoy no implementada) deja
de ser una mejora deseable y se convierte en una condición de operación segura: a este volumen, una
partición individual con crecimiento anómalo no detectado puede degradar el sistema completo antes
de que un operador humano lo note por otros medios.

### 13.6 100 TB

Umbral en el que conviene revisar explícitamente si la arquitectura de clúster único con RLS para
aislamiento multiempresa (la decisión fundacional de §1, reafirmada como alternativa preferida en
§5) sigue siendo la correcta para la totalidad de la base, o si algunos tenants de volumen
extremo justifican una excepción puntual de aislamiento físico más fuerte — sin que esto implique
abandonar el modelo para el resto del sistema. Es, explícitamente, el mismo umbral en el que
`10-evolucion-a-microservicios.md` (ya referenciado en §5 como alternativa descartada "para esta
fase", no permanentemente) se vuelve la conversación arquitectónica relevante a reabrir — este ADR
no toma esa decisión por adelantado ni la considera necesaria hoy; solo documenta en qué orden de
magnitud dejaría de ser prematura. El particionamiento, la retención y el Gestor de Particiones
descritos en este documento siguen siendo la base necesaria incluso si esa conversación ocurriera —
ninguna evolución hacia un modelo distribuido elimina la necesidad de particionar cada nodo
individual del mismo modo aquí descrito.

---

## Guía Técnica de Implementación

Las secciones §1-§13 son el registro de **decisión** de arquitectura (el "por qué"). Las secciones
§14-§17 son la guía de **implementación** técnica (el "cómo") — a diferencia de las anteriores, esta
parte del documento sí incluye SQL real de PostgreSQL, verificado contra el script certificado del
proyecto (`docs/database/sql/29_partitioning.sql`) y contra el schema Prisma real, no ejemplos
genéricos de manual.

## 14. Implementación en PostgreSQL

### 14.1 Cómo debe implementarse el particionamiento `RANGE`

PostgreSQL exige que `PARTITION BY RANGE (<columna>)` se declare **en el momento del
`CREATE TABLE`** — a diferencia de un índice o una restricción, no existe un `ALTER TABLE` que
convierta una tabla regular ya creada en particionada. Esta es la razón técnica exacta por la que
§2.1 insiste en que la decisión de particionar se tome en el diseño inicial del modelo, no como
proyecto de remediación: remediarla después no es un ajuste incremental, es una migración de datos
completa. El procedimiento correcto tiene dos caminos, según el estado de la tabla:

- **Tabla nueva, cluster sin datos todavía**: se declara `PARTITION BY RANGE` directamente en el
  `CREATE TABLE` original. Es el camino usado por toda tabla particionada correctamente declarada
  hoy en GORAZUS (`inventory.stock_movements`, `sales.invoices`, `purchases.purchase_invoices`,
  `accounting.journal_entries`, entre otras — ver §14.4/§14.5).
- **Tabla ya poblada en producción**: requiere el runbook de conversión ya documentado en
  `29_partitioning.sql §5` — crear una tabla nueva particionada (`LIKE <tabla> INCLUDING ALL`),
  migrar los datos por lotes, recrear las FK que apunten a ella, y renombrar bajo una ventana de
  mantenimiento controlada. No es una operación que deba ejecutarse sin planificación explícita de
  downtime o de migración en caliente.

**Hallazgo real verificado en esta revisión** (no corregido en este documento, señalado para
corrección en el script correspondiente): `29_partitioning.sql` **ya se autodocumenta** como
incompleto en un punto concreto — seis tablas (`core.audit_logs`, `core.system_logs`,
`core.activity_logs`, `core.notification_delivery_logs`, `security.login_attempts`,
`security.session_activity_logs`) están descritas como "particionada mensualmente" en comentarios y
tienen ya, en el schema Prisma certificado, la clave primaria compuesta que una tabla particionada
necesita (`@@id([id, occurred_at])` en `audit_logs`, por ejemplo) — pero su `CREATE TABLE` real en
`01_core.sql`/`02_security.sql` **todavía no declara `PARTITION BY RANGE`**, y ninguna de las seis
tiene todavía su llamada `partman.create_parent()` en la sección 1 de `29_partitioning.sql`. Una
clave primaria compuesta por sí sola no crea una tabla particionada — es una condición necesaria,
no suficiente. En la práctica: si el cluster se aprovisionara desde cero hoy con los scripts tal
como están, estas seis tablas se crearían como tablas regulares, no particionadas, a pesar de que el
resto del sistema (este ADR incluido, §7) las trata como si ya lo estuvieran. El ejemplo de §14.3
es, exactamente, la corrección concreta de esta brecha para `audit_logs` — no un ejemplo ilustrativo
desconectado de un problema real.

### 14.2 Cuándo deben usarse sub-particiones

La sub-partición compuesta (`RANGE` por fecha + `HASH` por `tenant_id`, §4.4/§9.3) no se implementa
preventivamente sobre ninguna tabla del catálogo de §7. Se implementa cuando se cumplen, con datos
reales de producción (no proyectados), **las dos condiciones a la vez**:

1. Un tenant específico concentra un volumen de escritura sobre una tabla particionada que es
   desproporcionado frente al resto de los tenants en la misma partición de fecha (orden de magnitud
   mayor, no una diferencia marginal).
2. Ese volumen concentrado ya genera contención medible (bloqueos, latencia de escritura, tiempo de
   `VACUUM` de esa partición específica) — no como preocupación teórica sino como métrica observada
   vía el monitoreo de §12.6/§10.2 (responsabilidad 4).

Implementarla antes de que ambas condiciones ocurran es exactamente el error que §2.1/§5 ya
descartan explícitamente (particionar sin beneficio medible, "por si acaso").

### 14.3 Ejemplo real: `core.audit_logs` (corrección de una brecha real, §14.1)

Columnas verificadas contra el schema Prisma certificado. El siguiente `CREATE TABLE` es la
corrección concreta a aplicar en `01_core.sql` **antes** del primer aprovisionamiento de un cluster
nuevo (para una base ya poblada, seguir el runbook de conversión de §14.1):

```sql
CREATE TABLE core.audit_logs (
    id                  UUID        NOT NULL DEFAULT gen_random_uuid(),
    local_id            BIGINT      NOT NULL GENERATED ALWAYS AS IDENTITY,
    tenant_id           UUID        NOT NULL REFERENCES core.tenants(id),
    company_id          UUID        REFERENCES core.companies(id),
    branch_id           UUID        REFERENCES core.branches(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ,
    created_by          UUID        REFERENCES core.users(id),
    updated_by          UUID        REFERENCES core.users(id),
    deleted_by          UUID        REFERENCES core.users(id),
    version             INTEGER     NOT NULL DEFAULT 1,
    row_version         BIGINT      NOT NULL DEFAULT 0,
    is_active           BOOLEAN     NOT NULL DEFAULT true,
    is_deleted          BOOLEAN     GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    observations        TEXT,
    metadata            JSONB       NOT NULL DEFAULT '{}',
    table_schema        TEXT        NOT NULL,
    table_name          TEXT        NOT NULL,
    row_id              UUID        NOT NULL,
    operation           TEXT        NOT NULL,
    old_values          JSONB,
    new_values          JSONB,
    changed_columns     TEXT[],
    actor_user_id       UUID        REFERENCES core.users(id),
    occurred_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (id, occurred_at),
    UNIQUE (local_id, occurred_at)
) PARTITION BY RANGE (occurred_at);

-- Índices locales — se propagan automáticamente a cada partición nueva (§4.5):
CREATE INDEX idx_core_audit_logs_actor_user_id ON core.audit_logs (actor_user_id);
CREATE INDEX idx_core_audit_logs_occurred_brin ON core.audit_logs USING BRIN (occurred_at);

-- Registro con pg_partman — cierra la brecha real de §14.1 (falta hoy en 29_partitioning.sql §1):
SELECT partman.create_parent(
    p_parent_table => 'core.audit_logs', p_control => 'occurred_at',
    p_interval => '1 month', p_premake => 3
);

-- Retención (§11.3 propone 7 años como piso conservador de cumplimiento — validar contra
-- configuration.fiscal_regimes del país antes de aplicar en producción, ver §11.2):
UPDATE partman.part_config
SET retention = '7 years', retention_keep_table = true
WHERE parent_table = 'core.audit_logs';
```

### 14.4 Ejemplo real: `inventory.stock_movements` (ya implementado — patrón de referencia)

A diferencia de `audit_logs`, esta tabla **ya declara `PARTITION BY RANGE` correctamente** desde su
`CREATE TABLE` real (`29_partitioning.sql`, nota inicial) y ya está registrada con `pg_partman`. Se
incluye como el patrón de referencia correcto — la forma en que las seis tablas de §14.1 deberían
quedar una vez corregidas:

```sql
CREATE TABLE inventory.stock_movements (
    id                  UUID           NOT NULL DEFAULT gen_random_uuid(),
    local_id            BIGINT         NOT NULL GENERATED ALWAYS AS IDENTITY,
    tenant_id           UUID           NOT NULL REFERENCES core.tenants(id),
    company_id          UUID           NOT NULL REFERENCES core.companies(id),
    branch_id           UUID           REFERENCES core.branches(id),
    created_at          TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ    NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ,
    created_by          UUID           REFERENCES core.users(id),
    updated_by          UUID           REFERENCES core.users(id),
    deleted_by          UUID           REFERENCES core.users(id),
    version             INTEGER        NOT NULL DEFAULT 1,
    row_version         BIGINT         NOT NULL DEFAULT 0,
    is_active           BOOLEAN        NOT NULL DEFAULT true,
    is_deleted          BOOLEAN        GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    observations        TEXT,
    metadata             JSONB         NOT NULL DEFAULT '{}',
    product_id          UUID           NOT NULL REFERENCES products.products(id),
    warehouse_id        UUID           NOT NULL REFERENCES inventory.warehouses(id),
    movement_type_id    UUID           NOT NULL REFERENCES inventory.stock_movement_types(id),
    quantity            DECIMAL(18,6)  NOT NULL,
    unit_cost           DECIMAL(18,4),
    source_module       TEXT,
    source_entity_id    UUID,
    PRIMARY KEY (id, created_at),
    UNIQUE (local_id, created_at)
) PARTITION BY RANGE (created_at);

CREATE INDEX idx_inventory_stock_movements_product
    ON inventory.stock_movements (product_id, warehouse_id, created_at);
CREATE INDEX idx_inventory_stock_movements_created_brin
    ON inventory.stock_movements USING BRIN (created_at);
CREATE INDEX idx_inventory_stock_movements_movement_type_id
    ON inventory.stock_movements (movement_type_id);
CREATE INDEX idx_inventory_stock_movements_warehouse_id
    ON inventory.stock_movements (warehouse_id);

-- Ya presente y activo en 29_partitioning.sql §1 (verbatim, tabla de mayor volumen del sistema):
SELECT partman.create_parent(
    p_parent_table => 'inventory.stock_movements', p_control => 'created_at',
    p_interval => '1 month', p_premake => 3
);
```

### 14.5 Ejemplo real: `accounting.journal_entries` (ya implementado — partición anual fiscal)

Misma situación que `stock_movements`: ya correctamente particionada desde su `CREATE TABLE` y ya
registrada. Se diferencia de los dos ejemplos anteriores en la frecuencia (anual, no mensual — §9.2)
y en que `posting_date` es `DATE`, no `TIMESTAMPTZ` (alineado a día de ejercicio fiscal, no a
instante de escritura):

```sql
CREATE TABLE accounting.journal_entries (
    id                  UUID        NOT NULL DEFAULT gen_random_uuid(),
    local_id            BIGINT      NOT NULL GENERATED ALWAYS AS IDENTITY,
    tenant_id           UUID        NOT NULL REFERENCES core.tenants(id),
    company_id          UUID        NOT NULL REFERENCES core.companies(id),
    branch_id           UUID        REFERENCES core.branches(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ,
    created_by          UUID        REFERENCES core.users(id),
    updated_by          UUID        REFERENCES core.users(id),
    deleted_by          UUID        REFERENCES core.users(id),
    version             INTEGER     NOT NULL DEFAULT 1,
    row_version         BIGINT      NOT NULL DEFAULT 0,
    is_active           BOOLEAN     NOT NULL DEFAULT true,
    is_deleted          BOOLEAN     GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    observations        TEXT,
    metadata            JSONB       NOT NULL DEFAULT '{}',
    document_number     TEXT        NOT NULL,
    fiscal_period_id    UUID        NOT NULL REFERENCES accounting.fiscal_periods(id),
    status_id           UUID        NOT NULL REFERENCES accounting.journal_entry_status(id),
    source_module       TEXT,
    source_entity_id    UUID,
    posting_date        DATE        NOT NULL DEFAULT CURRENT_DATE,
    description         TEXT,
    PRIMARY KEY (id, posting_date),
    UNIQUE (local_id, posting_date)
) PARTITION BY RANGE (posting_date);

CREATE INDEX idx_accounting_journal_entries_fiscal_period_id
    ON accounting.journal_entries (fiscal_period_id);
CREATE INDEX idx_accounting_journal_entries_posting_brin
    ON accounting.journal_entries USING BRIN (posting_date);
CREATE INDEX idx_accounting_journal_entries_status_id
    ON accounting.journal_entries (status_id);

-- Ya presente y activo en 29_partitioning.sql §1 (verbatim, RANGE anual — §9.2):
SELECT partman.create_parent(
    p_parent_table => 'accounting.journal_entries', p_control => 'posting_date',
    p_interval => '1 year', p_premake => 1
);
```

## 15. Estrategia de Indexación

### 15.1 Principio de diseño para tablas particionadas

Un índice declarado sobre la tabla particionada raíz se propaga automáticamente como índice local a
cada partición nueva (§4.5) — el diseño de índices se decide **una vez, a nivel de la tabla lógica**,
no partición por partición. La regla que gobierna cada tabla del catálogo de §7 es: la columna de
partición siempre lleva un índice `BRIN` (§15.5), las columnas de búsqueda de negocio de alta
selectividad llevan `BTree` (§15.2), y ninguna tabla particionada debería depender de un `Seq Scan`
completo de una partición individual para su patrón de consulta dominante.

### 15.2 Índices `B-Tree`

El tipo de índice por defecto de PostgreSQL y el que domina el modelo de GORAZUS — **3.884** de los
índices certificados del sistema (`INDEX_REPORT.md §1`). Correcto para igualdad y rango sobre
columnas de cardinalidad media-alta: claves primarias, claves foráneas, `UNIQUE`, y toda columna de
búsqueda de negocio (`document_number`, códigos, emails). Es el índice que debe usarse por defecto
salvo que el patrón de acceso específico justifique otro tipo — los siguientes cinco tipos son la
excepción documentada, no la alternativa general.

### 15.3 Índices `GIN`

Correcto para búsqueda dentro de una estructura de datos compuesta: texto libre (trigram, vía
`pg_trgm`) y documentos `JSONB`. GORAZUS ya certifica **9** índices `GIN` reales: búsqueda por
nombre en `customers.customers`, `hr.employees`, `suppliers.suppliers`, `products.products`,
`crm.leads`, más columnas `metadata JSONB` en `core.system_settings`, `products.products` y
`configuration.price_list_items` (`INDEX_REPORT.md §1`). En una tabla particionada, un `GIN` sobre
`metadata` tiene sentido cuando existe un patrón de búsqueda real dentro de ese JSON — no se aplica
preventivamente a la columna `metadata JSONB` presente en prácticamente todas las tablas del sistema
(patrón de auditoría estándar), solo donde hay una consulta real que lo justifique.

### 15.4 Índices `GiST`

Correcto para tipos de datos con noción de proximidad u orden parcial: rangos (`tsrange`,
`daterange`), datos geoespaciales (`PostGIS`), búsqueda de vecino más cercano. GORAZUS certifica
**0** índices `GiST` — ausencia correcta, no un gap: el sistema no maneja datos geoespaciales ni
tiene un caso de uso real de rangos superpuestos que se beneficie de este tipo de índice
(`INDEX_REPORT.md §1`). Se documenta explícitamente para que quede registrado como decisión evaluada
y descartada, no como una omisión no considerada — si en el futuro GORAZUS incorporara, por ejemplo,
geolocalización de entregas o rutas, sería el candidato natural a revisar.

### 15.5 Índices `BRIN`

El tipo de índice más directamente relevante para el modelo particionado de este ADR. Un `BRIN`
(Block Range Index) almacena únicamente el valor mínimo y máximo por bloque físico de página, no una
entrada por fila — órdenes de magnitud más compacto que un `BTree` equivalente, a costa de una
selectividad menor. Es la elección correcta exactamente para el patrón que define a toda tabla
particionada por `RANGE` de este ADR: datos append-only, físicamente escritos en orden creciente de
la misma columna que define la partición (`created_at`/`occurred_at`/`posting_date`) — el orden
físico en disco y el orden lógico de la columna coinciden, la condición que hace a `BRIN` efectivo.
GORAZUS ya certifica **55** índices `BRIN` reales, aplicados sobre `core.activity_logs`/`audit_logs`
y sus particiones. La recomendación de este ADR (ya anticipada en §12.9) es extender el mismo
criterio a toda tabla particionada del catálogo de §7 — los tres ejemplos de §14.3-§14.5 ya incluyen
su `BRIN` correspondiente sobre la columna de partición.

### 15.6 Índices compuestos

Correctos cuando una consulta filtra por más de una columna a la vez de forma consistente — el
orden de las columnas importa: las columnas de igualdad exacta van primero, la columna de rango
(típicamente la de partición) va última. El ejemplo real del propio catálogo de §7:
`idx_inventory_stock_movements_product` sobre `(product_id, warehouse_id, created_at)` — soporta
"movimientos de este producto en este almacén, en un rango de fechas" con un único índice, en vez de
tres índices simples que Postgres tendría que combinar con un `BitmapAnd` más costoso.

### 15.7 Índices parciales

Correctos cuando una fracción minoritaria y estable de las filas de una tabla concentra
prácticamente todas las consultas reales — el caso de uso dominante en GORAZUS es
`WHERE is_deleted = false` / `WHERE is_active = true` (soft-delete), ya aplicado en **828** índices
reales (`INDEX_REPORT.md §1`), el tipo de índice más numeroso después de `BTree`. Sobre una tabla
particionada, un índice parcial se propaga a cada partición igual que cualquier otro (§15.1) — su
beneficio es adicional al de la poda de particiones, no un sustituto: la poda reduce cuántas
particiones se tocan, el índice parcial reduce cuántas filas dentro de cada partición tocada se
consideran.

## 16. Mejores Prácticas

### 16.1 Prácticas recomendadas

- Declarar `PARTITION BY RANGE` desde el `CREATE TABLE` original de toda tabla candidata identificada
  en el diseño — nunca como una fase posterior "cuando haga falta" (§14.1, la lección directa de la
  brecha real encontrada en `audit_logs`).
- Mantener siempre al menos un período completo de particiones futuras ya creado (`p_premake`, §4.6)
  — nunca crear una partición de forma reactiva.
- Preferir `DETACH PARTITION` + archivado sobre `DELETE` fila por fila para toda purga de datos
  históricos masivos (§4.6, §11.1).
- Incluir siempre un índice `BRIN` sobre la columna de partición de toda tabla append-only ordenada
  por tiempo (§15.5) — es de bajo costo de mantenimiento y alto beneficio en este patrón específico.
- Documentar la relación "encabezado particionado / línea no particionada" (§4.3, §7) explícitamente
  en el repositorio de aplicación correspondiente, para que un desarrollador nuevo no asuma una FK
  declarativa que no existe a nivel de motor.

### 16.2 Errores comunes

- **Particionar sin declarar `PARTITION BY RANGE` desde el `CREATE TABLE`, confiando en que una clave
  primaria compuesta por sí sola ya implica partición física** — el error real encontrado en esta
  misma revisión (§14.1). Una clave compuesta es condición necesaria, no suficiente.
- **Usar `HASH` como estrategia general por defecto** — ya descartado como comportamiento general en
  §5: sacrifica la poda de particiones real a cambio de un beneficio (distribución de escritura) que
  no es el cuello de botella dominante de un ERP.
- **Particionar tablas de catálogo/maestras** (§8) — no reduce el volumen físico por consulta porque
  su patrón de acceso no es por rango temporal reciente, y sí añade el costo operativo de §2.2 sin
  contrapartida.
- **Convertir una tabla ya poblada sin seguir el runbook de migración** (§14.1) — un intento de
  "particionar en caliente" sin planificación de ventana de mantenimiento arriesga inconsistencia de
  datos y bloqueos prolongados sobre una tabla en producción activa.
- **Dejar la creación de particiones futuras a un proceso manual o a la memoria de un operador** — la
  causa raíz exacta del riesgo ya identificado en §4.9/§10.4 (fallo silencioso de `pg_partman` sin
  monitoreo).

### 16.3 Recomendaciones de rendimiento

- Corregir `random_page_cost` de `4` (default, asume disco mecánico) a `1.1` sobre almacenamiento
  SSD real — el hallazgo más accionable ya identificado en `POSTGRESQL_TUNING.md §1`, con impacto
  directo en si el planificador prefiere `Index Scan` sobre las particiones correctas.
- Ajustar `maintenance_work_mem` a 256-512MB a medida que el volumen real de cada partición crece —
  acelera `VACUUM` y la creación de índices sobre particiones grandes (§12.1, §12.5).
- Habilitar `pg_stat_statements` (hoy no instalado, requiere reinicio del contenedor —
  `POSTGRESQL_TUNING.md §3`) antes de que el volumen alcance el umbral de 5TB de §13.3, donde deja de
  ser opcional para identificar qué consultas presionan cada tabla particionada.
- Adoptar `BRIN` sistemáticamente sobre la columna de partición de toda tabla del catálogo de §7
  (§15.5) — la ganancia de rendimiento por tamaño de índice es mayor cuanto más crece la tabla.

### 16.4 Recomendaciones de mantenimiento

- `VACUUM`/`ANALYZE` se concentran, por diseño, en la partición `Hot` activa (§12.1, §12.2) — no
  requieren intervención manual adicional sobre particiones `Warm`/`Cold` ya inactivas.
- `REINDEX` se ejecuta por partición individual cuando la fragmentación (§12.8) lo justifique, nunca
  sobre la tabla lógica completa — evita ventanas de mantenimiento extensas innecesarias.
- Revisar trimestralmente que las políticas de `core.data_retention_policies` (§10.2, §11.3) sigan
  alineadas con el mínimo legal vigente de cada país/régimen fiscal — un cambio normativo puede mover
  ese piso sin que el sistema lo detecte automáticamente.
- Verificar, como parte del ciclo del Gestor de Particiones (§10.3), que toda partición nueva heredó
  correctamente sus índices, sus `CHECK` constraints y sus políticas RLS — no asumirlo solo porque es
  el comportamiento nativo esperado de Postgres.

## 17. Checklist de Producción

### 17.1 Despliegue

- [ ] Toda tabla candidata del catálogo de §7 declara `PARTITION BY RANGE` en su `CREATE TABLE`
      original — verificado explícitamente, no asumido por tener clave compuesta (§14.1).
- [ ] `CREATE EXTENSION pg_partman` ejecutada en el schema dedicado (`partman`, no `public` — el bug
      real ya documentado y corregido en `29_partitioning.sql`).
- [ ] Cada tabla particionada tiene su llamada `partman.create_parent()` correspondiente, con el
      intervalo correcto (mensual vs. anual, §9.1/§9.2) y `p_premake` configurado.
- [ ] Cada tabla particionada tiene su política de retención configurada en `partman.part_config`
      (§11.3) — con el valor validado contra el mínimo legal aplicable si es una tabla contable/fiscal.
- [ ] El job `partition_maintenance` está registrado en `core.scheduled_jobs` y confirmado en
      ejecución (§10.1, `29_partitioning.sql §3`).
- [ ] Índices `BRIN`/`BTree`/parciales de cada tabla particionada verificados presentes en la
      definición de la tabla raíz (se propagan solos, pero la definición debe estar completa desde el
      inicio).

### 17.2 Monitoreo

- [ ] `pg_stat_activity`, `pg_locks` y `pg_stat_user_tables.last_autovacuum` confirmados
      consultables (§12.6, ya verificado hoy).
- [ ] `pg_stat_statements` instalado y habilitado antes de alcanzar el umbral de 5TB (§13.3, §16.3).
- [ ] Alerta activa ante ausencia de la partición del próximo período a menos de 7 días de
      necesitarse (§10.4).
- [ ] Alerta activa ante crecimiento de una partición activa que excede 3x el promedio histórico
      (§10.4).
- [ ] Tamaño físico por partición reportado periódicamente (§10.2, responsabilidad 4).

### 17.3 Mantenimiento

- [ ] `autovacuum` confirmado activo y sin fallos recientes sobre toda partición `Hot` (§12.5, §12.7).
- [ ] Verificación periódica de que las particiones nuevas heredaron índices, `CHECK` constraints y
      RLS (§10.3, §16.4).
- [ ] Revisión trimestral de las políticas de retención contra el mínimo legal vigente (§16.4).
- [ ] Consistencia entre tabla "encabezado" particionada y su tabla de "línea" no particionada
      verificada periódicamente, dado que no existe FK declarativa entre ambas (§10.2,
      responsabilidad 6, §4.9).

### 17.4 Respaldo (Backup)

- [ ] Estrategia de respaldo confirmada compatible con tablas particionadas — un respaldo lógico
      (`pg_dump`) debe incluir la tabla raíz y todas sus particiones activas de forma consistente.
- [ ] Particiones ya archivadas a MinIO (`archive-cold`) excluidas del respaldo activo diario, sin
      quedar huérfanas de todo respaldo (verificar que el propio proceso de archivado cumple la
      función de respaldo de esos datos, `08-estrategia-respaldo.md §4`).
- [ ] Metadatos de archivado (tenant, empresa, rango de fechas, tabla origen) verificados suficientes
      para una reimportación real, no solo declarados en la documentación (§11.1).

### 17.5 Recuperación ante Desastres (Disaster Recovery)

- [ ] Procedimiento de restauración probado incluye la reconstrucción correcta de la jerarquía de
      particiones (tabla raíz + particiones hijas), no solo de los datos.
- [ ] Tiempo de restauración medido específicamente sobre la partición `Hot` primero (prioridad de
      recuperación operativa inmediata) antes que sobre el historial `Warm`/`Cold` completo.
- [ ] Runbook de conversión de tabla no particionada a particionada (§14.1, `29_partitioning.sql §5`)
      validado como parte de los procedimientos documentados de recuperación, no solo de
      aprovisionamiento inicial.
- [ ] Confirmado que un fallo total del clúster no deja las particiones ya `DETACH`adas pero aún no
      archivadas en un estado ambiguo (ni en la base activa ni en `archive-cold`).

### 17.6 Validación de rendimiento

- [ ] Poda de particiones (`partition pruning`) confirmada activa en el plan de ejecución (`EXPLAIN`)
      de las consultas dominantes de cada tabla particionada — no asumida solo por estar particionada.
- [ ] `random_page_cost` corregido a `1.1` antes de cualquier prueba de rendimiento sobre
      almacenamiento SSD real (§16.3) — de lo contrario los resultados subestiman sistemáticamente el
      beneficio real de los índices.
- [ ] Tiempo de `VACUUM`/`ANALYZE` medido por partición individual, no como promedio de la tabla
      completa — una partición `Hot` grande puede ocultar que el resto ya es prácticamente gratis
      (§12.1, §12.2).
- [ ] Prueba de carga incluye el escenario de "vecino ruidoso" (§4.4/§14.2) para confirmar que el
      criterio de activación de sub-partición `HASH` está correctamente instrumentado, aun si no se
      activa todavía.

---

## Conclusión Arquitectónica

GORAZUS ERP Enterprise se diseñó, desde el modelo de datos, para sostener sin reescritura
estructural el perfil de carga descrito en §1: miles de empresas sobre una base compartida con
aislamiento lógico por RLS, millones de productos, cientos de millones de movimientos de inventario,
y más de 15 años de crecimiento continuo. La estrategia documentada en este ADR es la razón técnica
concreta por la que ese objetivo es alcanzable sin un rediseño futuro, no una aspiración:

1. **El particionamiento `RANGE` por fecha convierte "cientos de millones de filas" en "un conjunto
   acotado de particiones de tamaño estable y conocido"**, cada una del orden de magnitud de un solo
   período de actividad — la tabla lógica crece indefinidamente, pero ninguna operación individual
   (`VACUUM`, `REINDEX`, una consulta de reportes de rango reciente) opera jamás sobre el total, solo
   sobre las particiones relevantes al período que realmente se consulta (§12.1-§12.3, §15.5).
2. **La retención por antigüedad, ya modelada como ciclo Hot/Warm/Cold (§11) y ejecutada como
   operaciones de metadatos (`DETACH`) en vez de purgas masivas de I/O (§4.6)**, garantiza que el
   tamaño operativo activo del sistema no crece al mismo ritmo que su historial acumulado — un
   sistema con 15 años de historia puede seguir operando con el volumen activo de solo su ventana de
   retención reciente.
3. **La técnica de escape de sub-partición por `HASH(tenant_id)` (§4.4, §9.3, §14.2)**, disponible y
   ya diseñada pero deliberadamente no aplicada preventivamente, cierra el único escenario de
   crecimiento que el `RANGE` por fecha por sí solo no resuelve — el tenant individual
   desproporcionadamente grande — sin necesidad de rediseñar el modelo cuando ese escenario ocurra
   con datos reales.
4. **El Gestor de Particiones (§10)**, formalizando responsabilidades que hoy están parcialmente
   implementadas (creación anticipada, archivado) y parcialmente pendientes (monitoreo,
   verificación de consistencia, detección de fallos silenciosos), cierra el riesgo operativo real
   que un sistema de este volumen no puede permitirse ignorar: que la automatización de la que
   depende toda esta estrategia falle sin que nadie lo note — la misma clase de fallo que ya ocurrió
   una vez, a nivel de infraestructura, en la historia real de este proyecto (§4.9).
5. **La estrategia de indexación (§15) no compite con el particionamiento, lo complementa**: `BRIN`
   sobre la columna de partición explota exactamente la propiedad física que el particionamiento por
   `RANGE` ya garantiza (orden de escritura append-only), a una fracción del costo de almacenamiento
   de un `BTree` equivalente — la combinación de ambos es más eficiente que cualquiera de los dos por
   separado.

Ninguna de estas cinco piezas depende de una arquitectura distribuida, de sharding a nivel de
aplicación, ni de abandonar el modelo relacional único que el resto de GORAZUS asume (§4.2, §5). Es,
deliberadamente, la combinación más simple que resuelve el problema real de escala de un ERP
multiempresa: un solo clúster PostgreSQL, RLS para aislamiento lógico, y particionamiento nativo para
acotar el costo de cada operación individual al tamaño de un período, no al tamaño de toda la
historia del sistema. Escalar de cientos de gigabytes a decenas de terabytes (§13) no exige, bajo
esta estrategia, ninguna decisión estructural nueva — exige, únicamente, que las palancas ya
diseñadas en este documento (frecuencia de partición, retención, sub-partición por tenant,
monitoreo del Gestor de Particiones) se activen con la intensidad que cada orden de magnitud
requiera. Esa es, precisamente, la propiedad que distingue una arquitectura de datos diseñada para
durar 15 años de una optimizada solo para el primer año de operación.
