# Informe de Completitud — Base de Datos GORAZUS

> Database Finalization, Fases 3-4 (Detección + Completado). Documenta exactamente qué se agregó,
> por qué, y qué se decidió explícitamente NO agregar. Migración real:
> `docs/database/sql/35_functional_completion.sql`, ejecutada y validada contra PostgreSQL 17.10
> real en esta sesión.

## 1. Principio rector

**"El objetivo NO es crear más tablas."** Cada adición de esta fase viene de un gap **ya
documentado y especificado** por auditorías previas del proyecto (`FUNCTIONAL_GAPS.md`,
`INVENTORY_ARCHITECTURE.md §5.2`) — nada se inventó en esta sesión. Esto es deliberado: inventar
gaps nuevos para "parecer completo" sería exactamente la complejidad innecesaria que el pedido
pide evitar.

## 2. Las 7 adiciones — qué, por qué, impacto

### 2.1 Materiales peligrosos / hoja de seguridad (`FUNCTIONAL_GAPS.md` #1)

**Qué**: 3 columnas nuevas en `products.products` — `is_hazardous_material BOOLEAN`,
`hazmat_classification TEXT`, `safety_data_sheet_file_id UUID→core.files`.
**Por qué**: pinturas, solventes, cemento, químicos — rubros explícitos de una ferretería —
suelen requerir clasificación regulatoria para transporte/almacenamiento.
**Impacto**: bajo — columnas nullable/con default, 0 filas afectadas, 0 código de aplicación roto.

### 2.2 País / idioma / timezone en Empresa y Sucursal (`FUNCTIONAL_GAPS.md` #2)

**Qué**: 6 columnas nuevas (`country_id`/`language_id`/`timezone_id`, nullable, FK a
`configuration.countries`/`languages`/`timezones`) en `core.companies` y `core.branches`.
**Por qué**: una cadena o grupo multipaís necesita saber, sin inferencia indirecta, en qué
país/idioma/zona horaria opera cada Sucursal — hoy solo se podía inferir vía jurisdicción fiscal.
**Impacto**: bajo — mismo criterio, columnas nullable, sin romper nada existente.

### 2.3 Costo Específico — identificación específica (`FUNCTIONAL_GAPS.md` #3)

**Qué**: `products.costing_method` admite un 5º valor (`specific_identification`);
`inventory.inventory_serials` gana `unit_cost NUMERIC(18,4)` nullable.
**Por qué**: ítems de alto valor/baja rotación típicos de ferretería industrial (generadores,
compresores) donde cada unidad se compró a un costo real distinto, no un promedio.
**Impacto**: medio — el schema ya lo soporta, pero **la lógica del Domain Service que decida
cuándo usar `unit_cost` en vez de FIFO/promedio NO se construyó en esta fase** (es código de
aplicación, `FUNCTIONAL_GAPS.md` ya advertía explícitamente sobre esto: "no se recomienda aplicar
sin confirmar... el Domain Service necesitaría una rama nueva de lógica, no solo el schema"). El
enum de aplicación de `productos.service.ts` (`METODOS_COSTEO`) sigue restringido a los 4 valores
originales — el 5º valor de base de datos existe pero no es alcanzable todavía vía la API. Esto es
intencional, no un olvido — ver §5.

### 2.4 Contratos de Proveedor (`FUNCTIONAL_GAPS.md` #4)

**Qué**: tabla nueva `suppliers.supplier_contracts` (patrón universal completo + `supplier_id`,
`contract_number`, `starts_on`/`ends_on`, `payment_terms_days`, `delivery_sla_days`,
`framework_pricing_notes`, `status`).
**Por qué**: proveedores recurrentes suelen negociar condiciones a nivel de relación comercial
completa (vigencia, plazo de pago acordado, SLA de entrega), no solo por producto individual
(`product_suppliers.lead_time_days` ya cubre eso, es un caso distinto).
**Impacto**: medio — tabla nueva, aditivo puro, 0 tablas existentes modificadas, 0 backend
existente (el módulo `proveedores` está vacío, confirmado — 0 archivos — así que no hay nada que
pudiera romperse).

### 2.5 QR / RFID en código de barras (`INVENTORY_ARCHITECTURE.md §5.2`)

**Qué**: `products.product_barcodes.barcode_type` admite `qr`/`rfid` además de
`gtin`/`internal`/`supplier`.
**Por qué**: gap explícito ya documentado, el `CHECK` original solo contemplaba 3 tipos.
**Impacto**: mínimo — un `ALTER ... CHECK`, sin columna nueva.

### 2.6 Fecha de fabricación / Peso / Volumen / Dimensiones (`INVENTORY_ARCHITECTURE.md §5.2`)

**Qué**: tabla nueva `products.product_physical_attributes` (1:1 opcional con `products.products`)
— `requires_manufacture_date`, `weight_kg`, `length_cm`, `width_cm`, `height_cm`, `volume_m3`.
**Por qué**: no existía ninguna columna para esto en los 35 productos revisados originalmente.
**Decisión de diseño**: tabla 1:1 aparte, no columnas nuevas en `products.products` — sigue la
recomendación explícita del propio `INVENTORY_ARCHITECTURE.md` ("más limpio, no ensancha la tabla
principal") porque no todos los productos son bienes físicos (`product_type IN ('service', ...)`
no necesita peso/dimensiones).
**Impacto**: bajo — tabla nueva, aditivo puro.

### 2.7 Obsolescencia — ciclo de vida del producto (`INVENTORY_ARCHITECTURE.md §5.2`)

**Qué**: `products.products.lifecycle_status TEXT` (`active`/`discontinued`/`obsolete`,
default `active`).
**Decisión de diseño tomada en esta fase** (el documento original la dejaba abierta): es un
atributo del **producto** (catálogo), no del **stock físico en un almacén puntual** — mismo
criterio que `costing_method`/`tracks_serial`, que ya viven en `products.products`, no en
`inventory.stock`. Justificación: el ciclo de vida de un producto (¿se sigue vendiendo?) es una
decisión de catálogo que aplica igual en todos los almacenes/sucursales de la empresa, no varía
almacén por almacén.
**Impacto**: bajo — columna nueva con default, 0 filas afectadas.

## 3. Lo que explícitamente NO se agregó (y por qué)

| Candidato                                                                                   | Por qué se descartó                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RLS de Empresa/Sucursal                                                                     | Es una decisión de producto sobre el modelo de multiempresa avanzada (`DATABASE_CERTIFICATION.md` hallazgo #1) — no una estructura faltante. Tocar políticas RLS existentes es un cambio de una categoría de riesgo distinta (seguridad, no funcionalidad aditiva) — merece su propia fase dedicada con pruebas específicas de aislamiento, no mezclarse con adiciones funcionales. |
| Resolver 185 FK cross-schema                                                                | Pendiente de ADR explícito (`DATABASE_CERTIFICATION.md` hallazgo #2) — es una decisión de arquitectura, no una construcción.                                                                                                                                                                                                                                                        |
| `core.restore_test_logs` con RLS                                                            | `34_rls_hardening.sql` ya la excluye a propósito, documentado como "plausiblemente intencional" — no se revirtió esa decisión sin entender primero por qué se tomó.                                                                                                                                                                                                                 |
| Garantías (`sales.warranties`)                                                              | La tabla **ya existe** desde el diseño original — el gap real es que ningún módulo de aplicación la consume todavía (`INVENTORY_ARCHITECTURE.md §5.2`: "ninguno construido"). No es un gap de base de datos, es un gap de código — fuera de alcance de "completar la base de datos".                                                                                                |
| Domain Service de Costo Específico                                                          | Es lógica de aplicación (TypeScript), no estructura de base de datos — el schema ya está listo (§2.3), construir el servicio es trabajo de un futuro Backend Core sobre `productos`/`inventario`.                                                                                                                                                                                   |
| Cualquier tabla especulativa no listada en `FUNCTIONAL_GAPS.md`/`INVENTORY_ARCHITECTURE.md` | El pedido explícito es "solo agregar lo verdaderamente necesario" — inventar gaps nuevos sin una auditoría previa que los sustente sería exactamente la complejidad innecesaria que se pidió evitar.                                                                                                                                                                                |

## 4. Verificación de la migración

Ejecutada en una única transacción (`psql -1 -v ON_ERROR_STOP=1`), con un bloque de verificación
final incorporado al propio script (`RAISE EXCEPTION` si cualquier chequeo falla — 0 FK sin
validar, 0 índices inválidos, 0 tablas nuevas sin RLS forzado). Resultado real:
`NOTICE: 35_functional_completion: OK`. Post-migración, confirmado en vivo: 503 tablas (501+2),
datos preexistentes intactos (2 productos, 13 empresas, sin pérdida), 0 FK sin validar, 0 índices
inválidos.

## 5. Compatibilidad con Prisma y backend — verificado, no asumido

- `schema.prisma` regenerado (`prisma db pull`) — ambos modelos nuevos presentes
  (`product_physical_attributes`, `supplier_contracts`).
- Los 21 clientes Prisma por módulo regenerados (`pnpm db:split && pnpm db:generate`) — el cliente
  monolítico (`prisma generate` directo sobre los ~500 modelos juntos) **cuelga** por un límite de
  escala real de Prisma 5.x (WASM `getDMMF`), ya documentado en el propio
  `split-schema-by-module.js` del proyecto — confirmado empíricamente de nuevo en esta sesión (el
  intento directo no terminó en más de 2 minutos, el pipeline de 21 clientes independientes
  terminó en segundos cada uno).
- `modules/productos/backend`: 53 de 57 tests pasan. Los 4 que fallan son **3 bugs preexistentes
  distintos, ninguno causado por esta migración** (ver detalle en §6) — confirmado comparando
  contra el diff real (solo se tocó un archivo de test para agregar un import faltante, ninguna
  aserción de negocio).
- `modules/configuracion/backend`: 20 de 20 tests que pudieron compilar pasan; 4 suites no
  compilan por un error de tipos de `@types/multer` preexistente en `usuarios.controller.ts`
  (`seguridad`), no relacionado con `companies`/`branches`.

## 6. Bugs preexistentes encontrados al verificar (no causados por esta fase, documentados con honestidad)

1. **`modules/productos/backend/controllers/productos.controller.e2e-spec.ts` no compilaba/corría
   en absoluto** — `SeguridadModule` requiere `StorageService` (vía `AvatarUsuarioService`, FASE 03
   Parte 03) que el test nunca importaba. **Corregido** en esta fase (import de `StorageModule` +
   dependencia agregada a `package.json`) porque sin este fix no había forma de verificar que la
   migración no rompiera nada — antes de esto, el test llevaba tiempo indeterminado sin ejecutarse
   ni una sola vez con éxito.
2. **Aserción de tipo incorrecta**: el test espera `list_price` como `number` (199.99) pero Prisma
   serializa columnas `Decimal` como `string` ("199.99") en JSON — bug de la aserción de test, no
   del código de aplicación. No corregido (fuera de alcance — no es la tabla que esta fase tocó
   funcionalmente).
3. **`Producto` (entidad de dominio) lanza `Error` genérico en vez de una excepción de dominio
   apropiada** cuando un producto `service` intenta rastrear serie/lote — el filtro global de
   excepciones lo mapea a 500 en vez de 400. Bug real preexistente en
   `modules/productos/backend/entities/producto.entity.ts:41`, no corregido (es una corrección de
   manejo de errores de un módulo ya construido, fuera del alcance de "completar la base de
   datos").
4. **Mismo gap de `StorageModule` faltante, probable en `almacenes.controller.e2e-spec.ts`**
   (`modules/inventario`) — no verificado en vivo por tiempo, pero mismo patrón exacto (importa
   `SeguridadModule` sin `StorageModule`). No corregido — documentado en `TECHNICAL_DEBT.md`.
5. **`usuarios.controller.ts` no compila en el contexto de test de `configuracion`** —
   `Namespace 'global.Express' has no exported member 'Multer'`, típico de `@types/multer` faltante
   como dependencia declarada donde se hace type-check. No corregido — no relacionado con
   `companies`/`branches`.

Los 5 son deuda técnica real, heredada, descubierta porque esta fase finalmente pudo ejecutar
código que llevaba tiempo sin correr — no defectos introducidos por la migración `35_*`.
