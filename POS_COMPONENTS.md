# Componentes — Punto de Venta (POS)

Inventario de componentes de `ui-kit` reutilizados y componentes nuevos de `modules/pos/frontend`.
Regla del prompt maestro ("reutilizar todo el código posible", "NO duplicar código") aplicada
también al frontend: se auditó `ui-kit/components/` antes de escribir un solo componente nuevo.

## 1. Reutilizados de `ui-kit/` tal cual (sin modificar)

| Componente                                                                 | Uso en el POS                                                              |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `primitives/barcode-scanner-input.tsx`                                     | Buscador de productos — ya soporta lector HID + tipeo manual, sin cambios. |
| `primitives/money-input.tsx`                                               | Monto recibido en el modal de pago, monto de apertura/cierre de caja.      |
| `primitives/card.tsx`, `button.tsx`, `input.tsx`, `label.tsx`, `badge.tsx` | Layout general, grilla de productos, líneas del carrito.                   |
| `primitives/dialog.tsx`                                                    | Modal de cliente, modal de pago, modal de apertura/cierre de caja.         |
| `primitives/drawer.tsx`                                                    | Panel de ventas suspendidas (lista lateral).                               |
| `primitives/confirm-dialog.tsx`                                            | Confirmar cancelación de venta (ESC con carrito no vacío).                 |
| `primitives/toast.tsx` / `use-toast.ts`                                    | Errores de dominio traducidos (`StockInsuficienteException`, etc.).        |
| `primitives/tabs.tsx`                                                      | Categorías de producto en el panel lateral.                                |
| `primitives/loader.tsx`, `route-loading-fallback.tsx`                      | Carga inicial del POS (<2s objetivo, `POS_UX.md §6`).                      |

## 2. Componentes nuevos (`modules/pos/frontend/components/`)

Solo se crean los que no tienen equivalente reutilizable en `ui-kit` — específicos del dominio POS,
no genéricos (por eso viven en el módulo, no en `ui-kit`, mismo criterio que el resto del proyecto:
`ui-kit` es para lo transversal, el módulo es para lo específico del negocio).

| Componente             | Responsabilidad                                                                                                         |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `ProductGrid`          | Grilla de resultados de búsqueda — nombre, precio, stock disponible, click/tap agrega.                                  |
| `CartLine`             | Una línea del carrito: cantidad (+/-), descuento %, subtotal, quitar.                                                   |
| `CartSummary`          | Subtotal/impuestos/total, botón Cobrar (F5).                                                                            |
| `CustomerPickerDialog` | Buscar cliente o "Consumidor Final" (F2).                                                                               |
| `PaymentDialog`        | Forma(s) de pago + monto recibido + cambio (F4), soporta agregar más de una línea (pago mixto).                         |
| `SuspendedSalesDrawer` | Lista de ventas suspendidas para recuperar (F6/recuperar).                                                              |
| `CashRegisterGate`     | Bloquea la pantalla si no hay apertura de caja activa, formulario de apertura.                                          |
| `PosShortcutsProvider` | Hook/contexto que registra los atajos globales de `POS_SHORTCUTS.md` (`useHotkeys` propio, sin librería externa nueva). |

## 3. Árbol de la pantalla principal

```
<PosPage>
  <CashRegisterGate>              (si no hay caja abierta, reemplaza todo lo de abajo)
  <PosShortcutsProvider>
    <TopBar />                    (caja, cajero, hora, F1 ayuda)
    <div class="grid">
      <CategorySidebar />          (categorías reales de products.product_categories)
      <div>
        <BarcodeScannerInput onScan={agregarPorCodigo} />
        <ProductGrid productos={resultados} onSelect={agregarAlCarrito} />
      </div>
    </div>
    <div class="grid">
      <CartLine *N />
      <CartSummary onCobrar={abrirPaymentDialog} />
    </div>
    <QuickActionsBar />            (F2..F8, ESC, ver POS_SHORTCUTS.md)
  </PosShortcutsProvider>
  <CustomerPickerDialog />
  <PaymentDialog />
  <SuspendedSalesDrawer />
</PosPage>
```

## 4. Comprobante / impresión (Parte 01)

`ReceiptView` — componente de solo lectura que renderiza el comprobante de la factura confirmada
(cliente, líneas, totales, forma de pago, número de documento) optimizado para impresión de
navegador (`window.print()`, CSS `@media print`). No integra una impresora térmica ESC/POS
dedicada — eso requeriría un driver nativo fuera del alcance de una SPA (`POS_ARCHITECTURE.md §3`).
