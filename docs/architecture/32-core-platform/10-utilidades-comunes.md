# 32.10 — Utilidades comunes

> Componentes: Common Utilities, Date Utilities, Money Utilities,
> Number Utilities, String Utilities, Validation Utilities, Encryption
> Utilities, Compression Utilities, Serialization Utilities.
>
> Todas viven en `packages/tooling` o, si requieren tipos del Shared
> Kernel (caso de `Money Utilities`), en `packages/contracts` — nunca
> en `core/*`, porque son funciones puras sin dependencia de
> infraestructura ni de NestJS, consumibles igual desde `backend/` y
> `frontend/` (ver árbol completo en
> [12-arbol-de-carpetas.md](./12-arbol-de-carpetas.md)). Esta es la
> única familia de 72 componentes donde ninguna entrada tenía diseño
> previo dedicado — el gap analysis solo encontró adyacencias
> puntuales, señaladas en cada componente.

## 1. Common Utilities

**Trazabilidad:** 🆕 Diseño nuevo.

- **Objetivo:** ser el paraguas organizativo de las 8 utilidades
  restantes de este documento — no una utilidad en sí misma, sino la
  convención de que toda función pura y reutilizable sin estado vive
  en `packages/tooling/utils/<dominio>` en vez de dispersarse como
  helpers locales duplicados en cada módulo.
- **Responsabilidad:** fijar la regla de qué calidad de función
  aplica para "promoverse" a utilidad común: pura (sin efectos
  secundarios, mismo input siempre mismo output), sin dependencia de
  infraestructura, y usada (o claramente reusable) por más de un
  módulo — una función usada por un solo módulo se queda en ese
  módulo hasta que un segundo caso de uso justifique promoverla
  (evita el antipatrón de una carpeta `utils/` que crece sin
  disciplina).
- **Dependencias:** ninguna.
- **Interfaces:** ninguna propia — es la convención bajo la que se
  organizan las 8 utilidades siguientes.
- **Eventos:** ninguno.
- **Flujo interno:** no aplica.
- **Comunicación con otros componentes:** consumida por cualquier
  módulo de negocio y por prácticamente todo componente de este
  documento (`Date Utilities` desde `Timezone Manager`, `Money
Utilities` desde `Value Objects`/`Currency Manager`, etc.).
- **Estrategias de seguridad:** ninguna función común maneja secretos
  ni estado sensible por diseño (eso es `Encryption Utilities`, con
  reglas propias más estrictas, §7).
- **Estrategias de rendimiento:** al ser funciones puras, son
  trivialmente memoizables donde el perfil de uso lo justifique.
- **Estrategias de escalabilidad:** no aplica — sin estado ni I/O.

## 2. Date Utilities

**Trazabilidad:** 🆕 Diseño nuevo.

- **Objetivo:** centralizar parseo, comparación, aritmética y
  validación de fechas/rangos de fecha con reglas de negocio
  explícitas (día hábil, fin de mes fiscal, rango de período contable)
  sin duplicar esa lógica módulo por módulo.
- **Responsabilidad:** proveer funciones puras sobre valores ya en UTC
  (nunca resuelve zona horaria — eso es responsabilidad exclusiva de
  `Timezone Manager`,
  [03-localizacion-y-globalizacion.md §3](./03-localizacion-y-globalizacion.md#3-timezone-manager));
  funciones de negocio como `isBusinessDay`, `endOfFiscalPeriod`,
  `daysBetween` con semántica exacta documentada (inclusive/exclusive
  de extremos, explícito en cada firma).
- **Dependencias:** ninguna de infraestructura — sí depende
  conceptualmente de `configuration.holidays`/calendario fiscal
  (dato, no código) para `isBusinessDay`, resuelto vía el módulo que
  la invoque, no cacheado internamente por la utilidad.
- **Interfaces:** funciones puras exportadas desde
  `packages/tooling/utils/date`.
- **Eventos:** ninguno.
- **Flujo interno:** no aplica — funciones puras sin flujo con
  estado.
- **Comunicación con otros componentes:** `Timezone Manager` la usa
  como base de cálculo tras resolver zona horaria; `RangoFecha`
  (Value Object,
  [09-base-transaccional-y-modelado-ddd.md §7](./09-base-transaccional-y-modelado-ddd.md#7-value-objects))
  usa estas funciones internamente para validar que su fecha de inicio
  no sea posterior a la de fin.
- **Estrategias de seguridad:** no aplica.
- **Estrategias de rendimiento:** sin I/O, coste de CPU trivial.
- **Estrategias de escalabilidad:** no aplica.

## 3. Money Utilities

**Trazabilidad:** 🆕 Diseño nuevo — es la capa de funciones puras que
`Money` (Value Object,
[09-base-transaccional-y-modelado-ddd.md §7](./09-base-transaccional-y-modelado-ddd.md#7-value-objects))
usa internamente; se documenta aquí para no duplicar entre ambos.

- **Objetivo:** realizar aritmética decimal exacta sobre montos
  monetarios, eliminando por completo el uso de `number` de punto
  flotante para dinero en cualquier capa del sistema (fuente de bugs
  clásica: `0.1 + 0.2 !== 0.3`).
- **Responsabilidad:** suma, resta, multiplicación, división y
  redondeo de montos representados como `Decimal` (mismo tipo que
  Prisma mapea a `NUMERIC` de Postgres); aplicar la estrategia de
  redondeo correcta por moneda (no todas usan 2 decimales, ver
  `Currency Manager`,
  [03-localizacion-y-globalizacion.md §4](./03-localizacion-y-globalizacion.md#4-currency-manager));
  distribución exacta de un monto entre N partes sin pérdida de
  centavos (p. ej. dividir $100 entre 3 cuotas: 33.34 + 33.33 + 33.33,
  nunca 33.33 × 3 = 99.99 perdiendo un centavo).
- **Dependencias:** ninguna de infraestructura.
- **Interfaces:** funciones puras exportadas desde
  `packages/tooling/utils/money`, consumidas internamente por la clase
  `Money` del Shared Kernel — ningún módulo de negocio llama estas
  funciones directamente, siempre a través de la API del Value Object.
- **Eventos:** ninguno.
- **Flujo interno:** toda operación opera sobre `Decimal`, nunca
  convierte a `number` de JavaScript en un paso intermedio (evita
  pérdida de precisión aunque el resultado final se vuelva a convertir
  a `Decimal` inmediatamente).
- **Comunicación con otros componentes:** `Value Objects` (`Money`),
  `Currency Manager` (conversión, que delega el redondeo final aquí).
- **Estrategias de seguridad:** no aplica — la "seguridad" relevante
  aquí es de corrección numérica, no de acceso.
- **Estrategias de rendimiento:** operaciones con `Decimal` son más
  costosas que `number` nativo, pero el volumen por request es
  siempre pequeño (decenas de operaciones, no miles) — la precisión
  prima sobre el micro-rendimiento en este dominio.
- **Estrategias de escalabilidad:** no aplica — funciones puras sin
  estado.

## 4. Number Utilities

**Trazabilidad:** 🆕 Diseño nuevo.

- **Objetivo:** operaciones numéricas genéricas no monetarias
  (cantidades de inventario, porcentajes, promedios ponderados) con
  las mismas garantías de precisión que `Money Utilities` cuando el
  dominio lo requiere (p. ej. costeo promedio ponderado de inventario
  no puede perder precisión por redondeo intermedio, mismo problema
  que el dinero).
- **Responsabilidad:** redondeo consistente, clamping de rangos,
  cálculo de porcentajes con la misma disciplina decimal que
  `Money Utilities` cuando el resultado alimenta un valor monetario
  aguas abajo (p. ej. un descuento porcentual aplicado a un precio).
- **Dependencias:** ninguna.
- **Interfaces:** funciones puras exportadas desde
  `packages/tooling/utils/number`.
- **Eventos:** ninguno.
- **Flujo interno:** no aplica.
- **Comunicación con otros componentes:** `Porcentaje` (Value Object)
  usa estas funciones internamente; `inventario` (FIFO/Promedio, ver
  `19-modulo-inventory.md`) es consumidor natural para costeo.
- **Estrategias de seguridad:** no aplica.
- **Estrategias de rendimiento / escalabilidad:** no aplica — funciones
  puras.

## 5. String Utilities

**Trazabilidad:** 🆕 Diseño nuevo.

- **Objetivo:** normalización y validación de strings de negocio con
  reglas específicas del dominio local (formato de RNC/RUC/cédula por
  país, slugificación de nombres para búsqueda, normalización de
  espacios/mayúsculas para comparación sin distinguir acentos en
  búsquedas de clientes/productos).
- **Responsabilidad:** funciones puras de normalización (nunca
  validación de negocio pesada — eso es `Validation Engine`, esta
  utilidad provee los bloques que sus predicados usan) y utilidades
  genéricas de manipulación de texto sin lógica de negocio (truncado
  seguro para UI, capitalización, generación de slugs).
- **Dependencias:** ninguna.
- **Interfaces:** funciones puras exportadas desde
  `packages/tooling/utils/string`.
- **Eventos:** ninguno.
- **Flujo interno:** no aplica.
- **Comunicación con otros componentes:** `Validation Engine`
  (predicados de formato de documento fiscal por país),
  `Sequence Generator`/`Document Numbering` (normalización de
  prefijos de serie).
- **Estrategias de seguridad:** las funciones de sanitización de HTML
  usadas por `Notification Center`/`Template Engine` para prevenir
  inyección viven aquí como utilidad compartida, no reimplementadas en
  cada uno de esos dos componentes.
- **Estrategias de rendimiento / escalabilidad:** no aplica.

## 6. Validation Utilities

**Trazabilidad:** 🆕 Diseño nuevo — distinto de `Validation Engine`
([05-motores-de-logica-de-negocio.md §2](./05-motores-de-logica-de-negocio.md#2-validation-engine)):
el Engine orquesta _cuándo y con qué schema_ se valida un DTO
completo; estas utilidades son los _predicados atómicos reusables_
que esos schemas Zod invocan internamente (`.refine()`).

- **Objetivo:** proveer predicados de validación específicos del
  dominio (dígito verificador de documento fiscal por país, formato de
  IBAN/número de cuenta bancaria, rango de fecha válido para un
  período fiscal abierto) que de otro modo se reimplementarían de
  forma inconsistente dentro de distintos schemas Zod de distintos
  módulos.
- **Responsabilidad:** funciones puras `(value) => boolean` (o que
  retornan el motivo de fallo, para mensajes de error específicos),
  sin acceso a base de datos — un predicado que necesita consultar
  datos (p. ej. "¿existe ya este RNC?") no es una Validation Utility,
  es una regla de `Business Rules Engine` o una validación a nivel de
  `service`.
- **Dependencias:** `String Utilities` (normalización previa a
  validar).
- **Interfaces:** funciones puras exportadas desde
  `packages/tooling/utils/validation`, importadas directamente dentro
  de la definición de los schemas Zod de cada módulo.
- **Eventos:** ninguno.
- **Flujo interno:** no aplica.
- **Comunicación con otros componentes:** `Validation Engine` (§2 de
  `05-motores-de-logica-de-negocio.md`) es el consumidor principal;
  `Multi Country`
  ([03-localizacion-y-globalizacion.md §8](./03-localizacion-y-globalizacion.md#8-multi-country))
  determina qué conjunto de predicados de documento fiscal aplica
  según el país de la company.
- **Estrategias de seguridad:** los predicados de formato son la
  primera línea de defensa contra datos malformados antes de que
  lleguen a cualquier capa de persistencia.
- **Estrategias de rendimiento / escalabilidad:** no aplica.

## 7. Encryption Utilities

**Trazabilidad:** 🔗 Extiende diseño existente (adyacente) — cifrado a
nivel de base de datos vía `pgcrypto` ya referenciado para secretos de
2FA e `integration_credentials`
([13-modulo-auth.md §5.1](../13-modulo-auth.md#51-2fa),
apuntando a `database/06-estrategia-seguridad.md §3`). Eso es cifrado
**a nivel de columna de base de datos**; esta entrada documenta la
utilidad **a nivel de aplicación** que decide qué se cifra y cómo
antes de llegar a esa columna — capa distinta, complementaria, no
redundante.

- **Objetivo:** proveer cifrado/descifrado simétrico de aplicación
  para datos sensibles que deben poder recuperarse en texto plano
  cuando se necesitan (a diferencia de contraseñas, que se hashean sin
  posibilidad de recuperación — eso es responsabilidad de
  `13-modulo-auth.md`, no de esta utilidad), como credenciales de
  integración de terceros o números de cuenta bancaria completos.
- **Responsabilidad:** cifrar con una clave gestionada fuera del
  código (nunca hardcodeada, resuelta vía `Configuration Manager` desde
  un secret manager/Kubernetes Secret) usando un algoritmo autenticado
  (AEAD, p. ej. AES-256-GCM) que detecta manipulación del dato
  cifrado, no solo lo oculta.
- **Dependencias:** `Configuration Manager` (clave de cifrado).
- **Interfaces:** `EncryptionUtils.encrypt(plaintext, keyId)`,
  `.decrypt(ciphertext, keyId)` — soporta múltiples `keyId` para
  rotación de claves sin invalidar datos cifrados con la clave
  anterior.
- **Eventos:** ninguno.
- **Flujo interno:** el resultado cifrado incluye metadata de qué
  `keyId` se usó (para permitir rotación); el descifrado falla
  explícito (no silencioso) si el dato fue manipulado, gracias a la
  propiedad de autenticación del algoritmo AEAD.
- **Comunicación con otros componentes:** `integration_credentials`
  (módulo `administracion`), cualquier módulo que almacene un secreto
  de tercero que deba recuperarse en texto plano para uso operativo
  (p. ej. llamar a una API externa).
- **Estrategias de seguridad:** rotación de clave soportada sin
  re-cifrado masivo inmediato (los datos viejos se descifran con la
  clave anterior hasta que se re-cifren de forma perezosa en su
  próxima lectura/escritura); la clave nunca se loguea ni aparece en
  ningún mensaje de error de `Exception Framework`.
- **Estrategias de rendimiento:** cifrado simétrico es barato
  computacionalmente — sin impacto relevante en el camino crítico.
- **Estrategias de escalabilidad:** la clave vive en un secret manager
  compartido entre réplicas (mismo mecanismo que
  `Configuration Manager` usa para el resto de secretos), no en disco
  local de una instancia.

## 8. Compression Utilities

**Trazabilidad:** 🆕 Diseño nuevo.

- **Objetivo:** reducir el tamaño de payloads grandes antes de
  almacenarlos o transportarlos — exports masivos (`Reportes y BI`),
  backups (`Backup Manager`,
  [11-resiliencia-y-continuidad.md §1](./11-resiliencia-y-continuidad.md#1-backup-manager)),
  archivos adjuntos voluminosos antes de subir a `Storage Framework`.
- **Responsabilidad:** comprimir/descomprimir streams (no cargar el
  contenido completo en memoria cuando el tamaño lo desaconseje) con
  un algoritmo estándar (gzip para compatibilidad amplia, con opción
  de un algoritmo de mayor ratio para archivos fríos de backup donde
  la velocidad importa menos que el tamaño final).
- **Dependencias:** ninguna de infraestructura.
- **Interfaces:** `CompressionUtils.compressStream(input)`,
  `.decompressStream(input)`.
- **Eventos:** ninguno.
- **Flujo interno:** procesamiento por streams para archivos grandes,
  nunca `Buffer` completo en memoria cuando el tamaño esperado excede
  un umbral configurable.
- **Comunicación con otros componentes:** `Backup Manager`,
  `File Manager` (adjuntos grandes), módulo `reportes`/`bi` (exports).
- **Estrategias de seguridad:** compresión nunca sustituye cifrado —
  un archivo comprimido que además requiere confidencialidad pasa
  también por `Encryption Utilities` (orden: comprimir primero,
  cifrar después, para no desperdiciar ratio de compresión sobre datos
  ya aleatorizados por el cifrado).
- **Estrategias de rendimiento:** procesamiento por streams evita
  picos de memoria en exports/backups grandes.
- **Estrategias de escalabilidad:** trabajo de compresión pesado se
  delega a `Background Jobs`
  ([08-frameworks-de-infraestructura.md §6](./08-frameworks-de-infraestructura.md#6-background-jobs))
  cuando el tamaño lo justifica, en vez de bloquear un request HTTP.

## 9. Serialization Utilities

**Trazabilidad:** 🔗 Extiende diseño existente (tangencial) — Zod ya
es la fuente de verdad de forma/validación
([07-convenciones-y-estandares.md §7](../07-convenciones-y-estandares.md#7-validación)),
pero serialización (convertir a/desde JSON, CSV, Excel, u otros
formatos de intercambio) es una responsabilidad distinta que Zod no
cubre por sí sola — gap real de contenido. **Ampliación por Fase 5:**
`.toXlsx` se agrega acá — verificado que `reports.report_exports.
export_format` ya incluye `'xlsx'` en su `CHECK`
([28-modulo-reports-bi.md §2](../28-modulo-reports-bi.md)) desde
antes, pero ningún componente tenía asignada la responsabilidad de
producir ese binario; queda asignada acá, no como componente nuevo,
por ser exactamente el mismo tipo de responsabilidad que ya cubre
`.toCsv` — tabular in, archivo de intercambio out.

- **Objetivo:** convertir entidades de dominio a/desde representaciones
  de intercambio (JSON para API REST — ya cubierto implícitamente por
  NestJS —, CSV/Excel para exports/importaciones masivas, y el formato
  de los backups lógicos) de forma consistente, sin que cada módulo
  reimplemente su propio serializador.
- **Responsabilidad:** serializar respetando los Value Objects
  (`Money` serializa como `{ amount: string, currency: string }`, no
  como `number` — para no perder precisión ni el código de moneda en
  el tránsito; en Excel, además, se aplica formato de celda nativo de
  moneda/fecha en vez de texto plano, para que el archivo sea
  utilizable directamente sin post-procesar en la hoja de cálculo), y
  deserializar validando contra el schema Zod correspondiente (nunca
  confiar en un CSV/Excel/JSON externo sin re-validar, incluso si
  viene de un export propio del sistema).
- **Dependencias:** `Validation Engine` (schemas Zod), `Value Objects`,
  `Background Jobs` (generación de Excel grande es CPU/memoria
  intensiva, igual criterio que el renderizado de PDF de `Template
Engine`).
- **Interfaces:** `SerializationUtils.toCsv(records, schema)`,
  `.fromCsv(csvContent, schema)`, `.toXlsx(records, schema, options:
{ sheetName, columnFormats })`, `.toJson`/`.fromJson` (estas últimas
  mayormente triviales dado que NestJS ya serializa JSON de forma
  nativa — se documentan por completitud del contrato, no porque
  requieran código adicional relevante). No se diseña `.fromXlsx`
  (importación) en este alcance — los flujos de importación masiva ya
  identificados en el sistema (`core.import_batches`) son todos
  CSV; agregar Excel como formato de _entrada_ es una extensión futura
  sin caso de uso confirmado hoy, a diferencia de la _salida_, que
  `report_exports.export_format` ya declara como necesaria.
- **Eventos:** ninguno.
- **Flujo interno:** toda deserialización pasa por `Validation Engine`
  antes de que el dato entre al dominio — un CSV importado nunca crea
  entidades directamente desde texto plano sin pasar por el mismo
  schema que valida cualquier otro input. `.toXlsx` genera el libro
  por streams (fila a fila, sin mantener todo el workbook en memoria)
  cuando el volumen excede el umbral configurable — mismo criterio que
  `.toCsv` y que `Template Engine` para PDF.
- **Comunicación con otros componentes:** módulo `reportes`/`bi`
  ([28-modulo-reports-bi.md §2](../28-modulo-reports-bi.md) —
  `report_exports` con `export_format IN ('pdf','xlsx','csv')` invoca
  `Template Engine` para `pdf` y `Serialization Utilities` para
  `xlsx`/`csv`, misma capa de orquestación, dos componentes distintos
  según el formato pedido), cualquier módulo con importación masiva de
  catálogo (p. ej. carga inicial de productos/clientes).
- **Estrategias de seguridad:** un CSV/Excel importado se trata como
  input no confiable en el mismo nivel que un request HTTP — pasa por
  `Validation Engine` completo, nunca por un camino de carga masiva
  que se salte validación "por rendimiento". Un `.xlsx` exportado
  nunca incluye fórmulas activas ni macros — solo valores calculados,
  para no exponer al usuario que abre el archivo a una superficie de
  ataque de "CSV/Excel injection" (fórmula maliciosa interpretada por
  la hoja de cálculo del destinatario).
- **Estrategias de rendimiento:** procesamiento de CSV/Excel grande
  por streams (no cargar el archivo completo en memoria), con
  `Background Jobs` para importaciones/exports por encima de un umbral
  de filas configurable — un `.xlsx` de miles de filas nunca se genera
  de forma síncrona dentro de un request HTTP.
- **Estrategias de escalabilidad:** sin estado compartido — cada
  trabajo de serialización/deserialización es independiente y
  paralelizable entre workers de `Background Jobs`.
