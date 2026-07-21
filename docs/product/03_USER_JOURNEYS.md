# 03 — User Journeys

## 1. Objetivo

Documentar los recorridos **de punta a punta** (varias pantallas, a veces varios días) que cada persona de `02_USER_PERSONAS.md` hace para cumplir su objetivo — a diferencia de `08_USER_FLOWS.md`, que documenta interacciones dentro de una sola pantalla o entre 2-3 pantallas contiguas.

## 2. Alcance

8 journeys, uno por persona primaria. Cada uno referencia los módulos/pantallas involucrados (detalle completo de cada pantalla en `docs/menus/<módulo>.md` y `07_SCREEN_CATALOG.md`) y el workflow de estados del documento de negocio que atraviesa (detalle completo en `04_BUSINESS_WORKFLOWS.md`).

## 3. Journey: Miguel — Venta de mostrador completa

**Disparador:** un cliente se acerca al mostrador con productos para comprar.

```
[Apertura de caja]──▶[Buscar producto]──▶[Agregar a venta]──┐
  (una vez al día)    (lector código de      (repetir N       │
                        barras o búsqueda)     veces)          │
                                                                ▼
[Imprimir/enviar comprobante]◀──[Cobrar]◀──[Revisar total]◀──┘
        │                         (efectivo/tarjeta/mixto)
        ▼
[Venta confirmada — stock descontado, caja actualizada]
```

**Pasos:**

1. Al iniciar el turno, Miguel abre la caja (`docs/menus/13-caja.md` — Apertura) con el monto inicial contado. _(una vez al día, no por venta)_
2. Por cada cliente: escanea/busca productos, el sistema muestra precio de la lista vigente y stock disponible en tiempo real.
3. Revisa el total (con impuestos aplicados según régimen del cliente/producto).
4. Cobra — efectivo, tarjeta, o combinación (pago mixto).
5. El sistema imprime/envía el comprobante fiscal y descuenta stock automáticamente (evento `ventas.venta.confirmada` → `inventario` reacciona).
6. Al cerrar turno, cierra caja (`docs/menus/13-caja.md` — Cierre): el sistema propone el monto esperado según movimientos, Miguel cuenta el efectivo físico y registra la diferencia si la hay.

**Estados que atraviesa la venta:** `borrador → confirmada` (ver `04_BUSINESS_WORKFLOWS.md §3.1`) — en POS no hay estado intermedio de "cotización", se confirma en el momento.

**Caso alternativo:** producto sin stock suficiente → el sistema no bloquea la venta por defecto (configurable por producto, `docs/menus/04-inventario.md`) pero alerta — decisión de negocio, no error técnico.

**Métrica de éxito:** <5 interacciones para una venta estándar (persona 3.1 de `02_USER_PERSONAS.md`).

## 4. Journey: Daniela — Cotización en visita a cliente

```
[Visita a cliente]──▶[Abrir Ventas en celular]──▶[Nueva cotización]
                                                          │
                                                          ▼
                                          [Buscar/crear cliente]
                                                          │
                                                          ▼
                                          [Agregar productos + precio
                                           de lista del cliente]
                                                          │
                                                          ▼
                                          [Enviar cotización por
                                           email/WhatsApp desde el
                                           celular, en el momento]
                                                          │
                              ┌───────────────────────────┘
                              ▼
              [CRM: seguimiento de oportunidad, recordatorio]
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
            [Cliente acepta]     [Cliente no responde
                    │              en N días]
                    ▼                   ▼
         [Convertir cotización   [Recordatorio automático
          a pedido, sin           de seguimiento — CRM]
          recapturar datos]
```

**Pasos:** ver `docs/menus/02-ventas.md` (Cotizaciones) y `docs/menus/17-crm.md` (Oportunidades) para el detalle de formularios/acciones.

**Estados de la cotización:** `borrador → enviada → aceptada|rechazada|vencida` (ver `04_BUSINESS_WORKFLOWS.md §3.2`).

**Métrica de éxito:** cotización enviada sin volver a la oficina (persona 3.2).

## 5. Journey: Roberto — Ciclo completo de compra

```
[Alerta de stock bajo]──▶[Revisar sugerencia de
  (proactivo, Dashboard    compra por proveedor
   o notificación)          habitual]
                                    │
                                    ▼
                    [Orden de compra — Compras]
                                    │
                          (proveedor confirma)
                                    ▼
                    [Recepción de mercadería —
                     Inventario, contra la OC]
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                                ▼
        [Cantidad recibida = OC]          [Discrepancia — cantidad
                    │                       distinta o daño]
                    ▼                                ▼
        [Factura de proveedor]          [Registrar discrepancia,
                    │                     no bloquea recepción]
                    ▼
        [Pago — Tesorería/Bancos]
```

**Pasos:** ver `docs/menus/03-compras.md`. El 3-way match (OC ↔ recepción ↔ factura) es responsabilidad del módulo Compras, distinto del movimiento físico que registra Inventario (`docs/architecture/04-catalogo-modulos-negocio.md`, nota sobre `goods_receipt_notes` vs `inventory.goods_receipts`).

**Estados de la orden de compra:** `draft → confirmed → partially_received|received → cancelled` (catálogo real, ver `04_BUSINESS_WORKFLOWS.md §3.3`).

**Métrica de éxito:** orden de compra pre-armada al proveedor habitual, sin que Roberto arme la lista desde cero (persona 3.3).

## 6. Journey: Carla — Conteo cíclico de inventario

```
[Programar conteo]──▶[Contar con lector de código
 (por zona/categoría,   de barras, desde celular]
  no todo el almacén            │
  de una vez)                   ▼
                    [Sistema compara contra stock
                     teórico en tiempo real]
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
          [Coincide — sin acción]   [Discrepancia — ajuste
                                      propuesto]
                                            │
                                            ▼
                              [Carla aprueba o corrige el
                               ajuste, con motivo obligatorio]
                                            │
                                            ▼
                              [Ajuste de inventario confirmado
                               — auditado, con motivo]
```

**Pasos:** ver `docs/menus/04-inventario.md` (Conteos, Ajustes).

**Regla:** ningún ajuste de inventario se confirma sin motivo — es dato de auditoría (`docs/database/05-estrategia-auditoria.md`), no un campo opcional.

**Métrica de éxito:** conteo y ajuste sin transcripción manual desde papel/Excel (persona 3.4).

## 7. Journey: Fernando — Cierre de mes

```
[Fin de mes]──▶[Conciliación bancaria]──▶[Revisar asientos
                 (contra extracto del      automáticos generados
                  banco)                    por eventos de otros
                        │                    módulos]
                        ▼                          │
              [Diferencias — investigar]            ▼
                        │                [Asientos manuales de
                        ▼                 ajuste/cierre]
              [Conciliado]                          │
                        └──────────┬─────────────────┘
                                   ▼
                    [Cerrar período fiscal — bloquea
                     nuevos asientos en el período]
                                   │
                                   ▼
                    [Generar Estados Financieros:
                     Balance, Estado de Resultados,
                     Flujo de Efectivo]
```

**Pasos:** ver `docs/menus/09-contabilidad.md`, `docs/menus/08-bancos.md`.

**Punto crítico de UX (ver persona 3.5):** desde cualquier cifra de un Estado Financiero, drill-down hasta el asiento y de ahí hasta el documento origen (factura, recibo) — sin eso, Fernando no puede investigar una diferencia sin salir del sistema.

**Estados del período fiscal:** `open → closed` (catálogo cerrado por `CHECK`, ver `04_BUSINESS_WORKFLOWS.md §3.4`) — reabrir un período cerrado es una operación excepcional auditada, no un tercer estado del flujo normal.

## 8. Journey: Patricia — Revisión diaria multisucursal

```
[Abre GORAZUS en el celular]──▶[Dashboard consolidado
  (varias veces al día,          — todas las sucursales
   sesión de <2 minutos)          por defecto]
                                        │
                        ┌───────────────┴───────────────┐
                        ▼                                ▼
            [Todo normal — cierra la app]    [Alguna métrica fuera
                                               de rango — drill-down
                                               a la sucursal/módulo
                                               específico]
```

**Pasos:** ver `docs/menus/01-dashboard.md`, `docs/menus/20-bi.md`.

**Regla de diseño:** el dashboard carga con la vista consolidada por defecto (no "sucursal actual") porque Patricia rara vez opera una sucursal — el selector de sucursal es para filtrar, no el estado inicial.

**Métrica de éxito:** <2 segundos de carga, sin pedir el dato a nadie (persona 3.6).

## 9. Journey: Iván — Onboarding de una sucursal nueva

```
[Alta de sucursal]──▶[Configurar almacén(es)
                        asociados]
                              │
                              ▼
                    [Dar de alta usuarios]
                              │
                              ▼
                    [Asignar roles — matriz de
                     permisos visible, no
                     checkboxes sueltos]
                              │
                              ▼
                    [Verificar acceso — Iván
                     puede "ver como" el rol
                     nuevo antes de confirmar]
```

**Pasos:** ver `docs/menus/24-administracion.md`, `docs/menus/22-seguridad.md`.

**Métrica de éxito:** sucursal operativa sin ticket a soporte externo (persona 3.7).

## 10. Journey: Sofía — Nómina mensual

```
[Cierre de mes]──▶[Revisar asistencia/ausencias
                    del período — ya cargadas
                    día a día, no a capturar
                    de una vez]
                          │
                          ▼
              [Sistema calcula nómina: sueldo
               base, horas extra, deducciones,
               retenciones — automático]
                          │
                          ▼
              [Sofía revisa casos excepcionales
               (adelantos, faltas, licencias)]
                          │
                          ▼
              [Aprobar y generar recibos de pago]
                          │
                          ▼
              [Exportar a banco para pago masivo]
```

**Pasos:** ver `docs/menus/19-nomina.md`, `docs/menus/18-rrhh.md`.

**Métrica de éxito:** nómina corrida en menos de media jornada, sin calculadora aparte (persona 3.8).

## 11. Buenas prácticas

- Todo journey nuevo debe nombrar la persona de `02_USER_PERSONAS.md` que lo protagoniza — un journey sin persona asociada probablemente está mezclando dos casos de uso distintos.
- Los diagramas ASCII de este documento son de **alto nivel** (journey completo) — el detalle pantalla-por-pantalla va en `08_USER_FLOWS.md`.

## 12. Reglas

- Un journey no se considera completo si termina en una pantalla sin salida clara (¿qué hace el usuario después? ¿vuelve al dashboard? ¿sigue al siguiente paso del proceso?).
- Todo journey que cruza módulos (p. ej. Compras → Inventario → Contabilidad) debe citar el evento de dominio que dispara la transición (ya documentado en `docs/architecture/06-comunicacion-entre-modulos.md`) — no inventar un mecanismo de integración nuevo a nivel de producto.
