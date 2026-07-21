# 32.04 — Identidad de datos

> Componentes: Sequence Generator, Document Numbering, Metadata
> Manager, Reference Data, Master Data.

## 1. Sequence Generator

**Trazabilidad:** 📎 Referencia — diseño completo y sustancial ya
existente: `configuration.correlatives` +
`fn_get_next_correlative` con bloqueo pesimista
(`SELECT ... FOR UPDATE`, deliberadamente no optimista) en
[14-modulo-core.md §10](../14-modulo-core.md#10-correlativos).

- **Objetivo:** garantizar números correlativos sin huecos ni
  duplicados bajo concurrencia alta, para toda secuencia que lo
  requiera por ley (numeración fiscal) o por negocio (folios internos).
- **Responsabilidad / Flujo interno:** ver diseño completo en la
  referencia — la decisión de usar bloqueo pesimista en vez de
  optimista ya está justificada ahí y no se reabre aquí.
- **Dependencias:** `core/database` (la función vive en Postgres, no en
  aplicación, precisamente para garantizar atomicidad sin round-trip
  adicional).
- **Interfaces:** `fn_get_next_correlative(series_id)` invocada desde
  `Document Numbering`; ningún módulo de negocio la llama
  directamente.
- **Eventos:** ninguno — la generación de un número es una operación
  síncrona dentro de la misma transacción que crea el documento.
- **Comunicación con otros componentes:** único consumidor de
  plataforma es `Document Numbering` (§2); los módulos de negocio
  nunca invocan el Sequence Generator directamente.
- **Estrategias de seguridad:** la función SQL es la única forma de
  obtener el siguiente número — no existe camino de aplicación que
  pueda generar un número fuera de esta función, cerrando la puerta a
  numeración manual inconsistente.
- **Estrategias de rendimiento:** el `FOR UPDATE` serializa únicamente
  la fila de la secuencia específica (`series_id`), no la tabla
  completa — dos secuencias distintas nunca se bloquean entre sí.
- **Estrategias de escalabilidad:** el cuello de botella es
  inherente al requisito de negocio (correlatividad legal sin huecos
  no es paralelizable) — ver la nota de justificación en
  `14-modulo-core.md §10` sobre por qué no se optó por IDs distribuidos
  para estas series.

## 2. Document Numbering

**Trazabilidad:** 📎 Referencia — diseño completo ya existente:
`numbering_series` + `document_number_formats`, incluyendo por qué
`branch_id` es obligatorio, en
[14-modulo-core.md §9](../14-modulo-core.md#9-series-de-documentos).

- **Objetivo / Responsabilidad / Flujo interno:** ver diseño completo
  en la referencia.
- **Dependencias:** `Sequence Generator`, `Branch Manager`.
- **Interfaces:** `DocumentNumberingService.next(documentType,
branchId)` — capa de aplicación que arma el número final (prefijo +
  correlativo + sufijo) a partir del correlativo crudo devuelto por
  `Sequence Generator`.
- **Eventos:** `document-numbering.series-exhausted` (cuando una
  serie fiscal se acerca a su rango autorizado máximo) — consumido por
  `Notification Center` para alertar al área contable con antelación.
- **Comunicación con otros componentes:** consumido por `ventas`,
  `compras`, `contabilidad`, `caja`, `bancos` — todos con su propio
  documento de arquitectura ya diseñado que lo referencia.
- **Estrategias de seguridad:** el formato de número asignado a
  documentos fiscales no es editable una vez la serie está autorizada
  por el ente fiscal correspondiente (regla de negocio, no técnica).
- **Estrategias de rendimiento / escalabilidad:** heredadas de
  `Sequence Generator`.

## 3. Metadata Manager

**Trazabilidad:** 🔗 Extiende diseño existente — la convención
`metadata JSONB` con reglas explícitas de "cuándo NO usarla" ya existe
([database/01-modelo-conceptual.md §1.3](../../database/01-modelo-conceptual.md#13-metadata-jsonb));
no existía un servicio formal de acceso/validación.

- **Objetivo:** dar acceso tipado y validado a la columna `metadata
JSONB` presente en toda entidad de negocio, sin convertirla en un
  "cajón de sastre" que erosione el modelo relacional (la regla ya
  fijada: si un campo se consulta con `WHERE` o se relaciona con otra
  tabla, es columna real, no metadata).
- **Responsabilidad:** exponer lectura/escritura de metadata con
  validación Zod por `documentType` (cada módulo declara el shape
  esperado de su propia metadata, el Metadata Manager no impone un
  shape global) y prevenir el antipatrón de guardar ahí datos que
  deberían ser columnas o tablas relacionadas.
- **Dependencias:** `core/database`, `Validation Engine`
  ([05-motores-de-logica-de-negocio.md §2](./05-motores-de-logica-de-negocio.md#2-validation-engine)).
- **Interfaces:** `MetadataService.get<T>(entity, schema)`,
  `.set(entity, value, schema)` — el `schema` Zod es obligatorio, no
  hay escritura de metadata sin validación de forma.
- **Eventos:** ninguno.
- **Flujo interno:** en escritura, valida contra el schema declarado
  por el módulo dueño de la entidad antes de persistir; en lectura,
  parsea con el mismo schema y falla explícito si el dato persistido
  no matchea (detecta drift de schema entre versiones de la
  aplicación).
- **Comunicación con otros componentes:** cualquier módulo de negocio
  puede usarlo sobre su propia entidad; el Metadata Manager no conoce
  el contenido semántico de ningún módulo, solo aplica la disciplina
  de validación.
- **Estrategias de seguridad:** metadata nunca almacena datos
  sensibles sin cifrar (regla reforzada: si el dato requiere cifrado,
  es candidato a columna real con `Encryption Utilities` aplicado
  explícitamente, no a JSONB libre).
- **Estrategias de rendimiento:** Postgres indexa JSONB vía GIN
  cuando un módulo declara que necesita consultar dentro de su
  metadata — decisión explícita por tabla, no aplicada globalmente
  (un índice GIN no solicitado es puro costo de escritura).
- **Estrategias de escalabilidad:** no aplica más allá de lo ya
  cubierto por la estrategia general de índices del modelo de datos.

## 4. Reference Data

**Trazabilidad:** 📎 Referencia — sustancial conceptualmente: el
schema `configuration` es explícitamente "catálogo puro" con regla de
no-duplicación ya documentada en
[database/01-modelo-conceptual.md §3](../../database/01-modelo-conceptual.md#3-schema-configuration).

- **Objetivo / Responsabilidad:** ver diseño completo en la
  referencia — countries, currencies, languages, timezones, fiscal
  catalogs y cualquier catálogo de solo-lectura compartido por varios
  módulos vive en `configuration`, con un único dueño y consumo por
  ID desde el resto del sistema.
- **Dependencias:** ninguna — es la base de la pirámide de datos.
- **Interfaces:** consumido vía `configuration.*` directamente (son
  catálogos, no requieren capa de servicio adicional más allá de
  `Cache Framework` para lectura frecuente).
- **Eventos:** ninguno — los catálogos cambian con baja frecuencia y
  típicamente por migración/seed, no por operación de usuario en
  caliente.
- **Comunicación con otros componentes:** es la base que
  `Master Data` (§5), `Localization`
  ([03-localizacion-y-globalizacion.md](./03-localizacion-y-globalizacion.md)),
  y prácticamente todo módulo de negocio consumen por referencia.
- **Estrategias de seguridad:** edición de catálogos restringida a
  roles de configuración global, nunca a roles operativos.
- **Estrategias de rendimiento:** cache agresivo (TTL largo, los
  catálogos casi no cambian) vía `Cache Framework`.
- **Estrategias de escalabilidad:** no aplica — volumen bajo por
  definición de catálogo.

## 5. Master Data

**Trazabilidad:** 📎 Referencia — el patrón "módulo dueño" (un único
módulo autorizado a escribir el estado de una entidad; el resto la
consume por ID o proyección de solo lectura) **es** el diseño de
Master Data Management de GORAZUS, ya completo en
[06-comunicacion-entre-modulos.md §4](../06-comunicacion-entre-modulos.md#4-patrón-módulo-dueño)
y reforzado módulo a módulo en
[04-catalogo-modulos-negocio.md](../04-catalogo-modulos-negocio.md).

- **Objetivo / Responsabilidad:** ver diseño completo en la
  referencia — no se reinventa un "Master Data Hub" centralizado
  separado; el patrón módulo-dueño ya cumple ese objetivo de forma
  distribuida y consistente con el resto de la arquitectura modular.
- **Dependencias:** `Repository Base`, `Domain Events`
  ([09-base-transaccional-y-modelado-ddd.md](./09-base-transaccional-y-modelado-ddd.md),
  [06-eventos-y-mensajeria.md](./06-eventos-y-mensajeria.md)).
- **Interfaces:** cada módulo dueño expone su entidad maestra
  únicamente a través de su `index.ts` público (fachada de solo
  lectura + tipos) — regla ya fijada en
  [01-estructura-monorepo.md §4](../01-estructura-monorepo.md#4-anatomía-de-un-módulo-vista-desde-la-raíz).
- **Eventos:** cualquier cambio a una entidad maestra publica su
  evento de dominio correspondiente (`ClienteActualizado`,
  `ProductoDescontinuado`) para que los módulos consumidores
  actualicen sus proyecciones locales si las mantienen.
- **Comunicación con otros componentes:** es el principio rector que
  conecta prácticamente todos los módulos de negocio entre sí — no se
  repite la enumeración completa aquí, está en
  `04-catalogo-modulos-negocio.md`.
- **Estrategias de seguridad:** un módulo no-dueño nunca tiene permiso
  de escritura sobre la tabla de otro módulo, ni siquiera con rol
  administrativo elevado — la restricción es de arquitectura (fronteras
  de Nx), no solo de RBAC.
- **Estrategias de rendimiento:** los módulos consumidores pueden
  mantener proyecciones de solo lectura localmente (denormalización
  deliberada) para evitar joins cross-schema costosos, sincronizadas
  vía eventos de dominio.
- **Estrategias de escalabilidad:** este patrón es precisamente lo que
  hace viable la extracción futura a microservicios (
  [10-evolucion-a-microservicios.md](../10-evolucion-a-microservicios.md))
  — un módulo dueño ya se comporta como si fuera un servicio remoto.
