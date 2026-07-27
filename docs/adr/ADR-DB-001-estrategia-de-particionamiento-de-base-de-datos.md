# ADR-DB-001 — Estrategia de Particionamiento de Base de Datos

|                             |                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Estado**                  | Aceptada                                                                                                                                                                                                                                                                                                                                                                          |
| **Fecha**                   | 2026-07-27                                                                                                                                                                                                                                                                                                                                                                        |
| **Autor**                   | Chief Software Architect, GORAZUS ERP Enterprise                                                                                                                                                                                                                                                                                                                                  |
| **Ámbito**                  | Modelo de datos completo (22 schemas, Postgres 17)                                                                                                                                                                                                                                                                                                                                |
| **Documentos relacionados** | [docs/database/07-estrategia-particionamiento.md](../database/07-estrategia-particionamiento.md) (especificación técnica detallada, tabla completa de particiones), [docs/database/04-estrategia-indices.md](../database/04-estrategia-indices.md), [docs/architecture/11-gobernanza-y-adrs.md](../architecture/11-gobernanza-y-adrs.md) (convención de ADRs de este repositorio) |

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
