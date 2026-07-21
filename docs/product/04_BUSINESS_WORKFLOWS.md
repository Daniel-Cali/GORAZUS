# 04 — Business Workflows

## 1. Objetivo

Documentar las **máquinas de estado** de los documentos de negocio centrales — de dónde a dónde puede moverse un documento, qué dispara cada transición, y qué transiciones están prohibidas. Esto es la vista de producto sobre catálogos que **ya existen en el modelo de datos** (`docs/database/sql/`) — este documento no inventa estados nuevos, los formaliza desde la óptica de "qué ve y qué puede hacer el usuario en cada estado".

## 2. Alcance

Cubre los documentos con mayor volumen/impacto: factura de venta, cotización, pedido de venta, orden de compra, asiento contable, período fiscal, apertura/cierre de caja. No cubre estados de entidades maestras (cliente activo/inactivo, producto discontinuado) — esos son atributos, no workflows con transiciones auditadas.

**Nota de diseño importante:** salvo el período fiscal (`open`/`closed`, `CHECK` cerrado por diseño — es un candado, no un catálogo de negocio), todos los catálogos de estado de este documento son **tablas abiertas** (`docs.database/02-modelo-logico.md`) — un tenant puede agregar un estado propio sin migración. Los valores de abajo son los que vienen precargados (`docs/database/sql/22_seed_data.sql`) y los que la UI estándar debe soportar de fábrica.

## 3. Workflows

### 3.1 Factura de venta (`sales.invoice_status`)

```
                    ┌─────────┐
                    │  draft  │  (editable, no descuenta stock,
                    └────┬────┘   no genera asiento contable)
                         │ confirmar
                         ▼
                    ┌───────────┐
              ┌─────┤ confirmed ├─────┐  (stock descontado,
              │     └───────────┘     │   asiento generado,
      pago    │                       │   ya no editable)
      parcial │                  pago │
              ▼                  total▼
      ┌────────────────┐      ┌──────┐
      │ partially_paid │─────▶│ paid │
      └────────────────┘ pago └──────┘
                          total
                            │
                            │ anular (excepcional, con motivo)
                            ▼
                      ┌─────────┐
                      │ voided  │  (reversa stock y asiento,
                      └─────────┘   nunca se borra el documento)
```

**Reglas de UI:**

- Una factura `confirmed` o posterior **no tiene botón "Editar"** — solo "Anular" (con motivo obligatorio) o "Nota de crédito" para corregir. Editar directo violaría la auditoría fiscal.
- `draft` es el único estado con edición libre — es donde vive una factura mientras se está armando (equivalente a "carrito" en POS, aunque en POS se salta directo a `confirmed`, ver `03_USER_JOURNEYS.md §3`).
- `voided` es terminal — no hay transición de vuelta.

### 3.2 Cotización (`sales.quote_status`)

```
┌─────────┐  enviar   ┌──────┐
│  draft  ├──────────▶│ sent │
└─────────┘           └──┬───┘
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
        ┌──────────┐┌──────────┐┌─────────┐
        │ accepted ││ rejected ││ expired │
        └────┬─────┘└──────────┘└─────────┘
             │ convertir a pedido
             ▼
      (ver §3.3 Pedido de venta,
       sin recapturar datos)
```

**Regla de UI:** `expired` es una transición **automática por tiempo** (vencimiento configurado), no una acción del usuario — la pantalla debe distinguir visualmente "vencida por el sistema" de "rechazada por el cliente", son motivos de negocio distintos aunque ambas sean terminales.

### 3.3 Pedido de venta (`sales.sales_order_status`) y Orden de compra (`purchases.purchase_order_status`)

Misma forma en ambos — venta y compra son espejo:

```
┌─────────┐  confirmar  ┌───────────┐
│  draft  ├────────────▶│ confirmed │
└─────────┘             └─────┬─────┘
                               │ recepción/entrega parcial
                               ▼
                    ┌─────────────────────┐
                    │ partially_received / │  (pedido de venta usa
                    │ reserved             │   "reserved" en su lugar
                    └──────────┬───────────┘   — reserva stock, no
                               │                 entrega física todavía)
                     recepción/entrega
                     completa
                               ▼
                    ┌──────────────────┐
                    │ received /        │
                    │ delivered         │
                    └──────────┬─────────┘
                               │ (venta: factura desde acá)
                               ▼
                         ┌──────────┐
                         │ invoiced │  (solo pedido de venta)
                         └──────────┘

              cancelar (desde draft o confirmed,
              nunca desde recibido/entregado)
                               │
                               ▼
                        ┌───────────┐
                        │ cancelled │
                        └───────────┘
```

**Regla de UI:** el botón "Cancelar" **desaparece** en cuanto hay una recepción/entrega parcial registrada — cancelar algo parcialmente cumplido es una operación de negocio distinta (devolución), no la misma acción.

### 3.4 Período fiscal (`accounting.fiscal_periods.status`)

```
┌──────┐   cerrar   ┌────────┐
│ open │───────────▶│ closed │
└──────┘            └────────┘
   ▲                     │
   └─────────────────────┘
      reabrir (excepcional,
      requiere permiso elevado
      + motivo auditado —
      no es parte del flujo
      normal mensual)
```

**Regla de UI:** el botón "Reabrir período" nunca está en la pantalla de cierre normal — vive en una pantalla separada de administración contable, con confirmación reforzada (ver `08_USER_FLOWS.md`, patrón de confirmación para acciones destructivas/excepcionales).

### 3.5 Asiento contable (`accounting.journal_entry_status`)

```
┌─────────┐  contabilizar  ┌────────┐  reversar  ┌──────────┐
│  draft  ├───────────────▶│ posted ├───────────▶│ reversed │
└─────────┘                └────────┘            └──────────┘
```

**Regla de UI:** un asiento `posted` generado automáticamente por un evento de otro módulo (venta confirmada, nómina aprobada) se muestra como **de solo lectura con origen visible** (link al documento que lo generó) — nunca editable directo, ni siquiera con permiso elevado. La única corrección es un asiento de reversión + uno nuevo, ambos trazables.

### 3.6 Apertura/cierre de caja (`cash.cash_register_openings` / `cash_register_closings`)

No es un catálogo de estados encadenados — es una relación 1 apertura : 0 o 1 cierre, con `is_open BOOLEAN`:

```
[Apertura registrada, is_open=true]
              │
    (movimientos del turno:
     ventas, retiros, depósitos)
              │
              ▼
[Cierre registrado — is_open=false,
 diferencia entre esperado y contado
 queda registrada, no se oculta]
```

**Regla de UI:** mientras `is_open=true`, ninguna otra apertura puede crearse para la misma caja — la pantalla de apertura debe bloquear/avisar en vez de permitir doble apertura.

## 4. Estados de catálogo sin datos semilla (gap conocido, no de producto)

`purchases.purchase_invoice_status`, `purchase_requisition_status` e `import_status` existen como tablas pero **sin valores precargados** en `docs/database/sql/22_seed_data.sql` — antes de diseñar la pantalla de factura de compra en `07_SCREEN_CATALOG.md`, hay que definir esos valores (probablemente espejo de `sales.invoice_status`: `draft/confirmed/paid/partially_paid/voided`) como parte del trabajo de base de datos, no asumirlos acá.

## 5. Buenas prácticas

- Todo estado nuevo que un módulo necesite se agrega al catálogo abierto correspondiente (`<entidad>_status`), nunca hardcodeado en el frontend — la UI lee la lista de estados posibles y sus transiciones válidas desde el backend, no la tiene fija.
- Toda transición de estado queda en la tabla `_status_history` correspondiente — la UI de detalle de un documento siempre tiene una pestaña/sección "Historial" que la muestra (ver `09_WIREFRAMES.md`, arquetipo de pantalla de detalle).

## 6. Reglas

- Ninguna pantalla permite una transición no listada en este documento sin antes actualizarlo — si aparece una necesidad de negocio nueva (p. ej. un estado "en disputa" para facturas), se discute y se agrega acá primero.
- Los nombres de estado en este documento son los valores **técnicos** (`snake_case`, en inglés, tal como están en la base) — la etiqueta que ve el usuario final se traduce en la capa de presentación (español, ver `docs/architecture/07-convenciones-y-estandares.md §2`), nunca se le muestra `partially_paid` en pantalla, se muestra "Pago parcial".
