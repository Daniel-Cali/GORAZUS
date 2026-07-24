# Arquitectura — Punto de Venta (POS) Enterprise

FASE 06, Parte 01. Ver `POS_UX.md`, `POS_FLOW.md`, `POS_COMPONENTS.md`, `POS_SHORTCUTS.md` para el
resto del diseño, y `ROADMAP.md`/`PROJECT_STATUS.md` para cómo encaja esta fase con el resto del
proyecto.

## 1. Punto de partida (auditoría previa a escribir código)

Antes de diseñar se auditó el estado real del repositorio (regla permanente del prompt maestro,
"NO comenzar desde cero"):

- **Git**: rama activa `feature/inventory-adjustments` en `ddf52c8` (Fase 05 Parte 04, v0.10.0),
  árbol de trabajo con cambios sueltos previos a esta sesión — ver `NEXT_STEPS.md` para el detalle
  de qué se conservó, qué se revirtió y por qué. Rama de trabajo de esta fase:
  `feature/sales-pos`, creada desde la punta de `feature/inventory-adjustments` (no desde
  `gorazus2`/`master`) porque el POS depende directamente del motor de Inventario construido ahí
  (Stock/Movimientos/Reservas/Kardex) — construir desde el trunk viejo hubiera significado no
  tener ese código disponible.
- **Documentación**: `CHANGELOG.md`, `VERSION.md` (0.10.0), `ROADMAP.md`, `PROJECT_STATUS.md`,
  `TECHNICAL_DEBT.md`, `INVENTORY_STATUS.md`, `INVENTORY_NEXT_PHASE.md` revisados. `ROADMAP.md`
  documenta el orden de fases confirmado: _Inventario Parte 05 (Recepciones/Salidas) → 06 (Costeo)
  → 07 (Series/Lotes) → 08 (Producción) → Clientes → Ventas → Caja → POS_ — este prompt salta
  directo a POS, sin pasar por esas fases intermedias. Se documenta la implicancia en la sección 3.
- **Base de datos**: schema completo de Postgres ya aplicado (34 schemas, incluidos
  `customers`/`sales`/`cash`/`accounting`/`taxes`/`configuration`), pero **sin datos de negocio
  reales** — 0 filas en `products.products` en el tenant demo, 0 en `customers.customers`. Se
  revisaron `docs/database/sql/03_customers.sql` (17 tablas), `07_sales.sql` (55 tablas),
  `09_cash.sql` (11 tablas), `11_accounting.sql` (28 tablas) — 111 tablas diseñadas entre los 4
  schemas que toca un POS completo, de las cuales **0 tenían código antes de esta fase**.
- **Backend/Frontend existente**: `modules/{ventas,pos,clientes,caja,contabilidad}/{backend,frontend,shared}`
  ya existían como carpetas vacías (scaffolding del bootstrap del monorepo), sin ningún archivo
  adentro. `modules/inventario/backend` (Stock/Movimientos/Reservas/Ajustes/Kardex, 15/34 tablas) y
  `modules/productos/backend` (5/35 tablas) sí tienen código real y se reutilizan tal cual, sin
  modificarlos.
- **Prisma**: los 21 clientes por schema (incluidos `PRISMA_CUSTOMERS`/`PRISMA_SALES`/`PRISMA_CASH`)
  ya estaban registrados en `core/database/src/database.module.ts` desde el bootstrap — no hacía
  falta agregar el cliente, solo exportar los tipos de modelo puntuales que esta fase necesita
  (mismo patrón que cada fase anterior, `core/database/src/index.ts`).
- **Impuestos**: `modules/configuracion/backend` ya tiene `ImpuestosService`/`TasasImpuestoService`
  reales (alcance mínimo, Fase 02) sobre `taxes.taxes`/`taxes.tax_rates` — se reutilizan tal cual
  para el cálculo de impuestos de la venta, no se duplica un motor de impuestos dentro de POS.
- **Formas de pago**: `configuration.payment_forms` ya está sembrado (`cash`, `check`, `transfer`,
  `card`, `credit` — `docs/database/sql/22_seed_data.sql`) pero sin repositorio/servicio propio
  todavía — se agrega un lookup mínimo de solo lectura (mismo patrón que
  `ProductoLookupRepository`).

## 2. Objetivo de esta fase

Construir un POS real, de punta a punta, para una ferretería: buscar producto, armar carrito,
cobrar, descontar inventario real, listo para pantalla táctil y lector de código de barras.
Reutilizando el motor de Inventario/Productos ya construido, sin duplicar nada.

## 3. Decisión de alcance — por qué Parte 01 no es "todo lo enterprise posible"

El prompt maestro pide un POS "integrado con Inventario, Caja, Clientes, Contabilidad y
Facturación" con cotización/apartado/pedido/devolución/cambio/garantía/promociones/cupones/
lealtad/tarjetas de regalo/venta online/reconocimiento de voz de atajos, más pruebas de
rendimiento/concurrencia/hardware de código de barras. Tomado literalmente, esto son ~111 tablas
nuevas de negocio (ver §1) — varios módulos enteros que hoy no tienen una sola línea de código.
Construir eso completo en una "Parte 01" no es una estimación realista ni honesta; se aplica el
mismo criterio que ya validó el usuario en Fase 05 Parte 04 (motivos de ajuste, tipos de conteo):
**auditar la realidad, construir lo real y mínimo viable, documentar el resto como diseñado pero
no construido, nunca inventar que algo funciona cuando no es así.**

### Construido en Parte 01 (real, con código, tests y endpoints)

| Módulo     | Tablas reales (de las diseñadas)                                                                   | Alcance                                                                                                                                                                                                                                                                                                         |
| ---------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `clientes` | `customers.customers` (1 de 17)                                                                    | CRUD básico + "Consumidor Final" sembrado por tenant. Sin crédito/lealtad/rutas/visitas.                                                                                                                                                                                                                        |
| `caja`     | `cash.cash_registers`, `cash_register_openings`, `cash_movement_types`, `cash_movements` (4 de 11) | Abrir/cerrar caja (una apertura activa por caja), registrar movimiento. Sin arqueo por denominación (`cash_counts`), sin transferencias entre cajas ni caja chica.                                                                                                                                              |
| `ventas`   | `sales.invoice_status`, `invoices`, `invoice_lines`, `receipts`, `receipt_allocations` (5 de 55)   | La venta POS **es** una factura directa (`sales_channel='pos'`) — sin cotización/pedido/remito previos. Descuento manual por línea (columna ya existe). Pago único o mixto vía múltiples recibos. Sin devoluciones/cambios/garantías/promociones/cupones/lealtad/tarjetas de regalo/suscripciones/venta online. |
| `pos`      | (sin tablas propias)                                                                               | Orquestador: valida stock/reserva, arma la factura+líneas, descuenta stock real (`MovimientosService.registrarLote`), registra el cobro en caja — todo en una transacción. Suspender/recuperar venta (factura en estado `draft`).                                                                               |

### Explícitamente diseñado pero NO construido en Parte 01 (documentado, no inventado)

- **Cotización → Pedido → Apartado (layaway) → Remito → Factura**: la venta de mostrador (B2B, no
  POS) necesita este pipeline completo (`sales.quotes`/`sales_orders`/`layaways`/`delivery_notes`);
  el POS lo salta a propósito (venta instantánea = factura directa).
- **Devoluciones, cambios, garantías** (`sales_returns`, `warranties`, `warranty_claims`) — Parte 02.
- **Promociones/cupones/lealtad/tarjetas de regalo/carrito online** (`promotions`, `coupons`,
  `loyalty_programs`, `gift_cards`, `shopping_carts`) — Parte 02+, requieren su propio motor de
  reglas.
- **Clientes a crédito real** (perfil de crédito, límite, estado de cuenta, clasificación
  mayorista/constructor/especial) — el catálogo de clientes de Parte 01 no tiene motor de crédito;
  `credit` ya existe como forma de pago pero sin validación de límite disponible.
- **Asiento contable automático** — `modules/contabilidad` sigue sin una sola línea de código
  (0/28 tablas); el paso "Registrar asiento contable" del flujo del prompt **no se implementa**, se
  documenta como el gap más importante para producción real (ver `TECHNICAL_DEBT.md`). Actualizar
  caja sí ocurre (`cash.cash_movements`), pero no hay partida doble.
- **Facturación electrónica fiscal real** (timbrado/sellos, `electronic_invoice_logs`) — se genera
  un número de documento interno correlativo, no una factura fiscal timbrada.
- **Envío por correo/WhatsApp del comprobante** — `core/notifications` ya tiene un canal de
  WhatsApp real (Fase 01); no se conecta en Parte 01 por alcance, queda como próximo paso trivial
  (el mecanismo ya existe, falta el disparador desde POS).
- **Venta por lote/serie** — Inventario Parte 07 (Series/Lotes) no existe todavía; el flujo de venta
  no puede filtrar por lote o número de serie.
- **Arqueo de caja con desglose por denominación** — se registra el monto total contado al cerrar,
  no el conteo billete por billete (`cash_counts`/`cash_count_lines`).
- **Pruebas de hardware real de lector de código de barras** — se prueba el camino de software (el
  lector emite texto + Enter, indistinguible de tipeo rápido); no hay forma de probar un lector
  físico real en este entorno.
- **Pruebas de carga con k6 a gran escala** — se hacen pruebas de concurrencia moderadas (Jest +
  transacciones simultáneas contra Postgres real), no una campaña de carga sostenida.

## 4. Diseño técnico

### 4.1 Patrón de módulos (idéntico al resto del proyecto)

Cada módulo nuevo (`clientes`, `caja`, `ventas`) sigue Clean Architecture ya establecida:
`entities/` (invariantes de dominio, sin dependencias de framework) → `repositories/` (puerto
abstracto + adaptador Prisma) → `services/` (casos de uso, excepciones de dominio) →
`controllers/` + `validators/` (Zod). `pos` no tiene entidades/repositorios propios — es un
`services/pos-checkout.service.ts` que orquesta los servicios de los otros módulos.

### 4.2 Por qué la venta POS reutiliza `sales.invoices` en vez de una tabla propia

El schema ya definido en `07_sales.sql` incluye `sales_channel TEXT ... CHECK (... IN ('store',
'pos', 'ecommerce', 'phone', 'mobile'))` — el diseño original ya contempla que una factura puede
originarse en el POS. Crear una tabla `pos_sales` paralela hubiera sido exactamente la duplicación
que el prompt prohíbe explícitamente ("NO duplicar código", "NO crear estructuras repetidas").

### 4.3 Transacción de checkout (`PosCheckoutService.confirmarVenta`)

Un único método orquesta, dentro de una transacción de Postgres real (mismo patrón de bloqueo de
filas que `MovimientosService`/`ReservasService` de Inventario, Fase 05 Parte 04):

1. Resolver cliente (o "Consumidor Final" del tenant si no se indica uno).
2. Validar stock disponible por línea (`StockService.obtenerDisponible` — `on_hand - reserved`).
3. Calcular impuestos por línea (`TasasImpuestoService`, tasa vigente del impuesto del producto si
   tiene uno asignado; sin impuesto asignado = 0, no bloquea la venta).
4. Crear la factura (`sales.invoices`, `status='draft'`) + líneas (`sales.invoice_lines`).
5. Descontar stock real: `MovimientosService.registrarLote` (una sola transacción para todas las
   líneas del carrito, `sourceModule='pos'`, `sourceEntityId=invoice.id`) — reutiliza el bloqueo de
   filas (`SELECT ... FOR UPDATE`) ya construido en Fase 05 Parte 04, sin tocarlo.
6. Registrar el/los pago(s): `sales.receipts` + `receipt_allocations` (soporta pago mixto — N
   recibos contra una factura) y `cash.cash_movements` (uno por recibo, `direction='in'`,
   `source_module='pos'`, `source_entity_id=receipt.id`) contra la apertura de caja activa.
7. Marcar la factura `status='issued'`.

"Suspender venta" = crear la factura en `draft` sin líneas de pago y sin descontar stock todavía
(el descuento de stock ocurre recién al confirmar el cobro, no al construir el carrito) —
"recuperar venta" = listar facturas `draft` del cajero/caja activa y continuar el flujo desde el
paso 3.

## 5. Multi-tenant / multi-empresa / multi-sucursal / multi-caja

Nativo desde el día 1 — todas las tablas nuevas heredan `tenant_id`/`company_id`/`branch_id` del
patrón estándar del proyecto, y `cash.cash_registers` soporta N cajas por sucursal sin cambios
adicionales (una apertura activa por caja, `uq_cash_openings_one_active`).

## 6. Riesgo de concurrencia

El checkout reutiliza `registrarLote` (bloqueo de filas real) para el descuento de stock — el mismo
mecanismo ya verificado en Fase 05 Parte 04. La apertura de caja usa el índice único parcial
existente (`uq_cash_openings_one_active`) para evitar dos aperturas simultáneas de la misma caja;
no se agregó un `SELECT ... FOR UPDATE` adicional ahí porque el índice único ya lo resuelve a nivel
de base de datos (conflicto = error de constraint, capturado como excepción de dominio).
