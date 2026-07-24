# Technical Debt — GORAZUS ERP

> Actualizado FASE 06, Parte 01 — Punto de Venta (POS) Enterprise. Sesión
> del 2026-07-24, versión **0.11.0**, rama `feature/sales-pos`.
> Consolida deuda técnica ya dispersa en
> `CHANGELOG.md` ("Pendiente conocido") y en los reportes de sesiones
> previas, más lo detectado esta sesión — no repite el detalle completo
> de cada item, referencia la fuente.

## Cómo leer esto

🔴 Bloquea o compromete seguridad/integridad real. 🟠 Afecta escalabilidad
o mantenibilidad a mediano plazo. 🟡 Cosmético o de bajo impacto real.
Ninguno de los ítems de abajo es nuevo esta sesión salvo donde se indica
explícitamente "(nuevo)" — esta sesión sí encontró y corrigió dos
incidentes reales de gravedad 🔴 heredados de Fase 05, ver §0.

## 0. Nuevo esta sesión (FASE 06, Parte 01 — POS)

- 🟢 **(corregido) Doble aplicación de movimientos de stock** — desde Fase 05 Parte 02,
  `MovimientoStockRepositoryPrisma.aplicarMovimiento` escribía `inventory.stock` a mano además del
  trigger `inventory.fn_apply_stock_movement` (que ya lo hace como upsert real) — cada movimiento se
  aplicaba dos veces. Nunca detectado porque Docker llevaba caído ~9 sesiones; el checkout del POS
  fue el primer código que ejercitó este camino contra Postgres real con el trigger activo.
  Corregido: la aplicación ya no escribe `inventory.stock`, solo valida y relee el resultado del
  trigger. Verificado numéricamente (50 entrada − 5 venta = 45 exacto). **Impacto real**: cualquier
  ambiente que haya corrido este código contra Postgres con el trigger activo antes de este fix
  tiene `inventory.stock` con cantidades incorrectas — recomendado auditar si aplica. Ver
  `POS_DATABASE.md §5`, `POS_TEST_REPORT.md §3`.
- 🟢 **(corregido) `operator does not exist: uuid = text`** en `stock-lock.util.ts`
  (Fase 05 Parte 04) — `$queryRawUnsafe` con placeholders posicionales sin cast explícito dentro de
  `IS NOT DISTINCT FROM`. Corregido con `::uuid` explícito en los 3 parámetros. Mismo motivo de
  detección tardía que el ítem anterior.
- 🟠 **(nuevo) Checkout de POS no es una transacción distribuida real** —
  `PosCheckoutService.confirmarVenta` encadena escrituras a `inventario`/`ventas`/`caja` en pasos
  secuenciales, no en una única transacción cross-schema (Prisma no lo soporta entre
  `PrismaClient`s distintos). Si el proceso cae entre pasos puede quedar una factura sin recibo.
  Ver `POS_ARCHITECTURE.md §4.3`, `POS_HEALTH_REPORT.md §3`.
- 🟡 **(nuevo) Sin e2e-spec de NestJS para POS** — la verificación end-to-end fue manual (`curl` +
  Playwright), no un `*.e2e-spec.ts` que corra en CI. Ver `POS_TEST_REPORT.md §5`.
- 🟡 **(nuevo) Búsqueda de productos del POS solo por `sku` (`contains`)** —
  `ProductoLookupRepository` de `modules/pos` no busca por nombre, código de barras real ni QR;
  suficiente para Parte 01, insuficiente para el buscador rápido completo pedido. Ver
  `POS_HEALTH_REPORT.md §4`.
- 🟡 **(nuevo) Sin pruebas de carga/concurrencia (k6) para el nuevo punto de entrada del POS** — el
  bloqueo de fila reutilizado está verificado desde Fase 05 Parte 04, pero no bajo el volumen que
  un POS real generaría. Ver `POS_TEST_REPORT.md §5`.
- 🟡 **(nuevo) Recibo mixto genera N recibos, no N allocations de un mismo recibo** — un pago con
  varias formas (efectivo + tarjeta) crea una fila en `sales.receipts` por cada una. Funciona, pero
  difiere de lo que un reporte "recibos por cliente" podría esperar. Ver `POS_HEALTH_REPORT.md §3`.

## 1. Seguridad y dependencias

- 🟠 **39 vulnerabilidades de `pnpm audit`** (1 crítica, 19 altas, 18
  moderadas, 1 baja) — todas en dependencias transitivas de tooling/
  observabilidad (Vitest UI, minimatch/picomatch ReDoS, exporters de
  OpenTelemetry, js-yaml), ninguna en runtime de negocio directo.
  `security.yml` corre `pnpm audit` sin bloquear (`|| true`). Ver
  `SECURITY_REPORT.md` para el detalle actual y `CHANGELOG.md` para el
  historial de qué se resolvió ya (nodemailer/multer, cuando eran
  dependencias nuevas de esta sesión) vs qué queda deliberadamente
  diferido (requiere saltos de versión mayores en código ya verificado).
- 🟠 **Detección de reuso de refresh token** no implementada —
  `RefreshTokenUseCase` documenta esto en su propio comentario de
  cabecera: una sola columna `refresh_token_hash` por sesión ya impide
  reusar un token rotado, pero no distingue "reuso detectado" de "nunca
  existió" para registrar el incidente como señal de posible robo de
  token.
- 🟢 **(corregido, FASE 03 Parte 03) Fuga de `password_hash` en 5
  endpoints de `UsuariosController`** — `GET/PATCH /me`, `POST /` crear,
  `activar`/`desactivar`, `GET /` listar devolvían la fila cruda de
  `core.users`. Corregido con `toUsuarioPublico()`. Ver
  `USERS_SECURITY_REPORT.md §1` para el detalle completo — queda acá
  solo como registro de que existió, no como deuda pendiente.
- 🟠 **`POST /seguridad/sesiones/:id/revocar` (admin, `modules/
seguridad`) no marca el `sessionId` en la blacklist de Redis** —
  detectado en FASE 03 Parte 02 al construir el equivalente de
  autoservicio (`POST /auth/revoke`, que sí lo hace). Un access token ya
  emitido de una sesión revocada por un administrador sigue sirviendo
  hasta que expira solo (~15 min) en vez de invalidarse de inmediato.
  Mismo fix que ya tiene `LogoutUseCase`/`RevokeTokenUseCase` en `auth`
  (`cacheService.set(revokedSessionCacheKey(id), true, ttl)`), sin
  aplicar todavía en `seguridad` — fuera de alcance de Parte 02 (módulo
  distinto). Ver `AUTH_REPORT.md §5.1`.
- 🟡 **"Recordar sesión" se infiere por heurística de duración
  (`expires_at - created_at`), sin columna propia** — funciona
  (`RefreshTokenUseCase`, ver `JWT_CONFIGURATION.md §3`) pero es un
  proxy, no un flag explícito. Aceptable mientras el margen de 1.5x no
  produzca falsos positivos/negativos observados en uso real; si eso
  pasara, la solución correcta es agregar la columna (fuera de alcance
  mientras el modelo de datos esté congelado sin necesidad probada).
- 🟡 **Rate limiter global es por IP, sin diferenciar por usuario ni
  endpoint** (salvo `/auth/login`/`/auth/login/2fa`, que ya tienen su
  propio límite más estricto) — un grupo de usuarios reales detrás de un
  NAT/proxy compartido lo alcanza igual. Detectado con `k6` en FASE 05,
  decisión de producto pendiente, no un bug.

## 2. Arquitectura y patrones

- 🟠 **Sin patrón compartido de sort/filter/search** para listados — cada
  controller (`auditoria`, `configuracion/*`) resuelve su propio filtro
  ad hoc por query params. Funciona hoy; se va a fragmentar más con cada
  uno de los 24 módulos de negocio sin backend todavía.
- 🟠 **`core/messaging` (RabbitMQ) sin un solo productor o consumidor
  real** en todo el backend — `EventBusService` existe y funciona
  (verificado), nadie lo llama. Los Domain Events de `auth` (`events/`,
  Parte 2.1) están preparados con la forma exacta que se publicaría, pero
  tampoco se publican.
- 🟠 **`core/scheduler` sin un solo cron job registrado** — mismo patrón
  que `core/messaging`: infraestructura lista, cero consumidores.
- 🟡 **`core/storage` con un solo consumidor genérico** (`POST/GET/DELETE
/files`) — ningún módulo de negocio asocia todavía un archivo subido a
  uno de sus propios registros (la `key` se guardaría en la columna
  `metadata JSONB` que ya tiene cada entidad).
- 🟡 **185 Foreign Keys reales cruzan schemas de módulos de negocio
  distintos** en el modelo de datos, contradiciendo la regla ya
  documentada ("solo IDs sueltos, nunca FK real entre módulos") —
  requiere un ADR y una decisión de negocio sobre qué reemplaza esa
  integridad referencial. Ver `docs/database/FOREIGN_KEYS.md §3`. Nivel
  de riesgo bajado a 🟡 (no 🔴) porque no es un bug — es deuda de diseño
  ya identificada y documentada con honestidad, no oculta.

## 3. Cobertura funcional (esperado, no "roto")

- 🔴→🟡 **22 de 27 módulos de negocio sin una sola línea de backend**
  (placeholders `ComingSoonPage` en frontend) — es el estado esperado de
  un ERP en construcción incremental, marcado 🟡 (no 🔴) porque está
  documentado con honestidad en `ROADMAP.md`, no oculto ni presentado
  como completo.
- 🟡 **`modules/inventario` solo tiene Almacenes + motor de stock/
  movimientos/reservas/transferencias/ajustes/conteos, no Inventario
  completo** — 19 de las 34 tablas de
  `core/database/prisma/schemas/inventory/` (recepciones/salidas, costeo
  FIFO/LIFO/promedio, series, lotes, producción, reglas de reposición/
  putaway/picking) siguen sin backend. Es el estado esperado del alcance
  de esta parte, ya diseñado en `INVENTORY_ARCHITECTURE.md` y
  secuenciado en `INVENTORY_NEXT_PHASE.md` — no un gap oculto.
- 🟢 **(corregido, Parte 04) Chequeo de stock suficiente sin locking
  explícito** — `MovimientoStockRepositoryPrisma.aplicarMovimiento()`
  ahora bloquea la fila real (`SELECT ... FOR UPDATE`, `lockStockRow()`
  en `repositories/stock-lock.util.ts`) antes de leer el saldo, con
  reintento ante la carrera de inserción que detecta el índice único
  real `uq_inventory_stock`. Aplicado también a reservas
  (`ReservaStockRepositoryPrisma`). Verificado por build/lint/tests
  unitarios — **no** verificado bajo concurrencia real contra Postgres
  (requiere Docker arriba + prueba de carga dedicada, pendiente). Ver
  `INVENTORY_HEALTH_REPORT.md §5.1`. Queda acá solo como registro de que
  existió.
- 🟢 **(corregido, Parte 03) Chequeo de stock suficiente comparaba
  contra `quantity_on_hand`, no contra `quantity_available`** — el
  `TODO` dejado en `0.8.0` se resolvió: ahora compara contra disponible
  real (`on_hand - reserved`), verificado en e2e. Queda acá solo como
  registro de que existió.
- 🟡 **"Conteo doble" (dos capturas independientes por línea) no
  soportado** (nuevo) — `inventory.physical_count_lines` solo tiene una
  columna `counted_quantity`. Requeriría una columna o tabla nueva —
  decisión de migración, no tomada. Ver `INVENTORY_PHYSICAL_COUNTS.md §2`.
- 🟡 **Clasificación ABC/rotación para selección automática de conteos
  cíclicos no soportada** (nuevo) — `inventory.cycle_count_schedules`
  solo tiene `zone_id`/`frequency_days`/`next_run_date`, ninguna columna
  de análisis. Requeriría una tabla de cálculo periódico nueva — fuera
  de alcance, ver `INVENTORY_CYCLE_COUNT.md §3`.
- 🟡 **Cancelar una transferencia ya `in_transit` no está soportado**
  (nuevo) — `TransferenciasService.cancelar()` solo permite la
  transición desde `draft`. Requeriría un movimiento de reversión que
  el pedido original de Parte 03 no especificó — decisión de producto
  pendiente si se necesita, no un bug.
- 🟡 **(nuevo) `modules/clientes`/`caja`/`ventas`/`pos` solo tienen el mínimo real para el checkout
  de contado, no el módulo completo** — de 111 tablas diseñadas entre `customers` (17), `sales`
  (55) y `cash` (11), se construyeron 15 (1+5+5, más el orquestador `pos` sin tablas propias).
  Cotizaciones/pedidos/apartados, devoluciones/cambios/garantías, promociones/cupones/lealtad/
  tarjetas de regalo, crédito real de clientes, asiento contable automático, facturación
  electrónica fiscal, envío de comprobante por correo/WhatsApp, venta por lote/serie y arqueo por
  denominación quedan sin backend. Es el estado esperado del alcance de esta parte, ya diseñado y
  documentado con honestidad en `POS_ARCHITECTURE.md §3` — no un gap oculto.
- 🟡 **`modules/productos` solo tiene el producto base, no el catálogo
  completo** — 30 de las 35 tablas de `core/database/prisma/schemas/products/`
  (variantes, atributos, combos, kits, BOM/recetas, imágenes/videos,
  códigos de barra, historial de precios, reseñas, proveedores, perfiles
  fiscales, líneas/familias/colecciones) siguen sin backend. Es el
  estado esperado del alcance de esta parte, no un gap oculto — ver
  `PRODUCTOS_REPORT.md §4` para el detalle de por qué se acotó así.
- 🟡 **Catálogo de países/jurisdicciones fiscales sin CRUD/UI** — solo
  script de seed mínimo (`seed-tax-jurisdictions.ts`) que desbloquea
  Impuestos.
- 🟡 **Login por username no implementado** — `core.users` no tiene
  columna `username` (solo `email`, único por tenant), y el modelo de
  datos está congelado (`Enterprise v1.0.0`, `VERSION.md`). Agregar la
  columna requiere una migración versionada + una decisión de producto
  (¿obligatorio, único, editable, alias del email?) que no correspondía
  tomar dentro de FASE 03 Parte 02 — login por email ya cubre el caso de
  uso real actual. Ver `AUTH_REPORT.md §4`. Confirmado igual en Parte 03
  (`USERS_REPORT.md §4`): "cambio de nombre de usuario" tampoco se
  implementó, mismo motivo.
- 🟡 **(nuevo) Sin `user_branches`/`user_warehouses`** — `core.user_companies`
  (multiempresa) se wireó en FASE 03 Parte 03, pero no existe una tabla
  equivalente a nivel sucursal ni almacén en el modelo certificado. Un
  usuario sigue teniendo una única sucursal fija (`core.users.branch_id`).
  Para almacenes específicamente, además falta el módulo de negocio
  entero (`modules/inventario`, ver ítem de Almacenes más abajo) — no
  tiene sentido modelar la asignación antes de que existan almacenes
  administrables. Ver `USERS_REPORT.md §4`.

## 4. Calidad de código y CI

- 🟠 **(nuevo) `nx run web:test` no arranca — `vite-tsconfig-paths`
  resuelve como ESM, algo en la cadena de Vitest lo carga con `require`**
  — detectado en el diagnóstico de FASE 03 Parte 03.1 (continuidad):
  `web:build` (mismo `vite.config.ts`, vía `vite build`) compila
  perfecto, así que no es un problema de la app — es una discrepancia de
  resolución de módulos específica del executor de test. Nunca se había
  corrido `web:test` explícitamente en una sesión anterior, por eso no
  estaba detectado. Cero tests de frontend corren hasta que se arregle.
  Ver `PROJECT_HEALTH_REPORT.md §4`.
- 🟡 **ESLint type-aware/strict (`recommendedTypeChecked`) evaluado y
  revertido** — causó `heap out of memory` corriendo sobre el monorepo
  completo en el sandbox de desarrollo usado hasta ahora, incluso
  secuencialmente. No se pudo confirmar cuántos errores de tipo reales
  existirían — queda como recomendación para una sesión dedicada con más
  memoria disponible o corriendo proyecto por proyecto.
- 🟡 **`docs/api/openapi.json`'s `info.version` hardcodeado a `"0.1.0"`**
  (nuevo, detectado esta auditoría) — `core/kernel/bootstrap.ts`,
  `DocumentBuilder().setVersion('0.1.0')` — no sigue la versión real del
  proyecto (`0.3.1` en `package.json`/`VERSION.md`). Cosmético (no afecta
  el contenido real del spec), pero confuso para quien lo lea aislado.
- 🟡 **CI sin contenedores de servicio real** — `pr-validation.yml` corre
  `nx affected -t test` sin Postgres/Redis/RabbitMQ/MinIO en el runner;
  si un PR afecta un `*.e2e-spec.ts` (que sí corren contra infraestructura
  real en local), ese paso fallaría en GitHub Actions por falta de
  infraestructura. Documentado desde la sesión de infraestructura previa,
  sin resolver — mismo prerequisito que la validación automática de
  OpenAPI en CI (tampoco existe).
- 🟡 **`dist/*/package.json` de los paquetes `core/*` conserva `"main":
"./index.ts"`** en vez de `.js` — warning cosmético, Node lo resuelve
  igual por fallback, no bloqueante (documentado desde FASE 05).

## 5. Infraestructura no verificada esta sesión

- Kubernetes (`infra/kubernetes/`) — manifiestos validados con `kubectl
kustomize` en su momento, sin cluster real de prueba todavía.
- 🟡 **Docker Desktop no disponible durante FASE 03 completa (Partes 01,
  02 y 03) y la sesión de Backend Core anterior** (`failed to connect to
the docker API` — nivel host de Windows, fuera del control de este
  entorno de agente). No es deuda del proyecto — es una nota operativa:
  los tests e2e reales de `auth`/`seguridad`/`configuracion`, incluidos
  los que ejercitarían la funcionalidad nueva de Parte 02/03 contra
  Postgres/Redis/MinIO real, no se pudieron correr. Ver `TEST_REPORT.md`/
  `AUTH_TEST_REPORT.md`/`USERS_TEST_REPORT.md`/`BACKEND_HEALTH_REPORT.md`
  para el detalle de qué sí se verificó sin infraestructura (build/lint/
  unitarios con fakes) y qué queda pendiente de re-confirmar la próxima
  vez que Docker esté arriba.

## 6. Explícitamente NO es deuda (decisiones ya tomadas, no revisitar)

- Stack Node/TypeScript en vez de PHP — decisión ya confirmada con el
  usuario en la primera sesión de esta fase, no un error.
- `packages/tooling/utils` sin DI (Clock/UUID/Hash/TOTP como funciones
  puras) — decisión de arquitectura documentada
  (`docs/architecture/32-core-platform/10-utilidades-comunes.md §1`).
- Sin CQRS real (Command/Query/Handler separados) — cada caso de uso ya
  es una clase de responsabilidad única; forzar la separación ahora
  crearía inconsistencia con los módulos ya construidos, sin beneficio
  claro todavía.
