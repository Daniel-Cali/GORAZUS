# 09 — Wireframes

## 1. Objetivo

Definir los **arquetipos de pantalla reutilizables** — cada una de las 336 pantallas del catálogo (`07_SCREEN_CATALOG.md`) es una instancia de uno de estos arquetipos, no un diseño desde cero. Esto es lo que hace posible "consistencia sobre creatividad" (`01_PRODUCT_VISION.md §7`) en los 25 módulos navegables sin que cada uno se vea distinto.

## 2. Alcance

6 arquetipos: Dashboard, Lista/Tabla, Formulario de captura, Detalle de documento, POS, Modal/Diálogo — más su variante responsive. No cubre el diseño visual final (colores, tipografía, spacing exacto) — eso es `packages`/`ui-kit` con Tailwind + Shadcn UI (`docs/architecture/`), este documento fija estructura y comportamiento, no pixeles.

## 3. Arquetipo: Dashboard / Widgets

```
┌──────────────────────────────────────────────────────────────┐
│ Dashboard                                    [Personalizar ⚙] │
├──────────────┬──────────────┬──────────────┬──────────────────┤
│ Ventas hoy    │ Facturas      │ Stock bajo    │ Caja abierta     │
│ $12,450       │ pendientes     │ 14 productos  │ Sucursal Centro  │
│ ▲ 8% vs ayer  │ 6              │ ⚠             │ $3,200            │
├──────────────┴──────────────┴──────────────┴──────────────────┤
│  ┌────────────────────────────┐  ┌──────────────────────────┐  │
│  │ Ventas últimos 7 días        │  │ Top 5 productos            │  │
│  │ [gráfico de línea]           │  │ [gráfico de barras]        │  │
│  └────────────────────────────┘  └──────────────────────────┘  │
├──────────────────────────────────────────────────────────────┤
│ Accesos rápidos: [+ Nueva venta] [+ Nueva compra] [+ Cliente]  │
└──────────────────────────────────────────────────────────────┘
```

**Componentes:** tarjetas de métrica (KPI + variación), gráficos, lista de accesos rápidos configurables por rol.
**Estados:** cargando (skeleton por tarjeta, no toda la pantalla en blanco), sin datos (empresa nueva — mensaje de onboarding, no un dashboard vacío sin explicación), error parcial (una tarjeta falla, el resto de la pantalla sigue funcionando).

## 4. Arquetipo: Lista / Tabla

```
┌──────────────────────────────────────────────────────────────┐
│ Facturas                                    [+ Nueva factura] │
├──────────────────────────────────────────────────────────────┤
│ [🔍 Buscar...] [Estado ▾] [Cliente ▾] [Fecha ▾]    [⇅ Ordenar] │
├──────────────────────────────────────────────────────────────┤
│ ☐ │ N° Factura │ Cliente        │ Fecha    │ Total  │ Estado  │
├───┼────────────┼────────────────┼──────────┼────────┼─────────┤
│ ☐ │ FAC-001023 │ Ferretería...  │ 15/07/26 │ $4,320 │ Pagada  │
│ ☐ │ FAC-001022 │ Fábrica del... │ 15/07/26 │ $1,100 │ Pendiente│
│ …                                                              │
├──────────────────────────────────────────────────────────────┤
│ Mostrando 1-20 de 342          [◀ Anterior] [1 2 3 ... 18] [▶] │
└──────────────────────────────────────────────────────────────┘
```

**Componentes:** barra de filtros, tabla con selección (para acciones masivas, `08_USER_FLOWS.md §6`), paginación **offset+limit** (`page`/`pageSize` — ya fijado en `docs/architecture/07-convenciones-y-estandares.md`, esta pantalla no inventa scroll infinito salvo el módulo de alto volumen que lo justifique explícitamente).
**Estados:** cargando (skeleton de filas), vacío (sin resultados de filtro vs. sin datos en absoluto — mensajes distintos), error de carga (con botón reintentar).
**Responsive:** en mobile, la tabla colapsa a tarjetas apiladas (una por fila), columnas secundarias pasan a un acordeón "Ver más" por tarjeta.

## 5. Arquetipo: Formulario de captura

```
┌──────────────────────────────────────────────────────────────┐
│ ← Nueva factura                                                │
├──────────────────────────────────────────────────────────────┤
│ Cliente: [Buscar cliente...            ]  (ver 08_USER_FLOWS  │
│                                             §3, selector)       │
│ Fecha: [15/07/2026]      Moneda: [USD ▾]                       │
├──────────────────────────────────────────────────────────────┤
│ Líneas:                                                         │
│ ┌──────────────┬──────┬─────────┬─────────┬─────┐              │
│ │ Producto      │ Cant │ Precio   │ Subtotal │ ✖   │              │
│ ├──────────────┼──────┼─────────┼─────────┼─────┤              │
│ │ Tornillo 1"   │ 100  │ $0.15    │ $15.00   │ ✖   │              │
│ └──────────────┴──────┴─────────┴─────────┴─────┘              │
│ [+ Agregar línea]                                                │
├──────────────────────────────────────────────────────────────┤
│                                Subtotal: $15.00                 │
│                                Impuesto: $2.40                  │
│                                Total:    $17.40                 │
├──────────────────────────────────────────────────────────────┤
│                          [Cancelar]  [Guardar como borrador]    │
│                                       [Guardar y confirmar]      │
└──────────────────────────────────────────────────────────────┘
```

**Componentes:** cabecera de datos generales, tabla de líneas editable inline, panel de totales calculado (nunca capturado a mano), doble acción de guardado (borrador vs. confirmar — ver `04_BUSINESS_WORKFLOWS.md`, la mayoría de los documentos tienen estado `draft`).
**Estados:** vacío (sin líneas — botón "Agregar línea" es la única acción posible hasta que haya al menos una), validación (`08_USER_FLOWS.md §5`), guardando (botones deshabilitados + spinner, previene doble submit).
**Responsive:** en mobile, la tabla de líneas se convierte en tarjetas apiladas editables (mismo patrón que §4).

## 6. Arquetipo: Detalle de documento

```
┌──────────────────────────────────────────────────────────────┐
│ Ventas › Facturas › FAC-001023                    [Estado:    │
│                                                      Pagada ✔] │
├──────────────────────────────────────────────────────────────┤
│ [Detalle] [Pagos] [Documentos relacionados] [Historial]        │
├──────────────────────────────────────────────────────────────┤
│                    (contenido del tab activo,                  │
│                     de solo lectura salvo acciones              │
│                     explícitas del workflow)                    │
├──────────────────────────────────────────────────────────────┤
│ [Imprimir] [Enviar por email] [Nota de crédito] [Anular]       │
└──────────────────────────────────────────────────────────────┘
```

**Componentes:** breadcrumb (`06_NAVIGATION.md §5`), badge de estado prominente, tabs (`06_NAVIGATION.md §6`), barra de acciones contextual a las transiciones válidas desde el estado actual (`04_BUSINESS_WORKFLOWS.md`) — un documento `paid` no muestra el botón "Confirmar" porque esa transición ya no aplica.
**Estados:** el propio estado del documento (`draft`/`confirmed`/etc.) determina qué acciones se renderizan — no hay un estado de pantalla distinto del estado del documento en sí.

## 7. Arquetipo: POS (caso especial, ver persona 3.1 y `06_NAVIGATION.md §8`)

```
┌──────────────────────────────────────────────────────────────┐
│  Cajero: Miguel  │  Caja: Mostrador 1  │  12:34:07    [Cerrar]│
├───────────────────────────────────┬────────────────────────────┤
│ [🔍 Escanear o buscar producto...] │  TOTAL                     │
├───────────────────────────────────┤                            │
│ Tornillo Phillips 1"     x10  $1.50│  $47.40                    │
│ Martillo 16oz             x1  $8.90│                            │
│ Clavos 2" (caja)          x2  $6.00│  [F2] Producto             │
│                                     │  [F4] Cobrar                │
│                                     │  [F6] Cliente                │
│                                     │  [Esc] Cancelar línea         │
└───────────────────────────────────┴────────────────────────────┘
```

**Componentes:** panel de líneas (izquierda, dominante), panel de total + atajos visibles (derecha — el cajero nuevo aprende los atajos viéndolos en pantalla, no memorizándolos de un manual).
**Estados:** venta en curso (líneas > 0), venta vacía (estado inicial, foco automático en el buscador), cobrando (modal de método de pago, ver abajo).
**Responsive:** el POS asume pantalla de escritorio/tablet grande — no tiene variante mobile de una columna (fuera de alcance, un cajero no opera POS desde un celular).

## 8. Arquetipo: Modal / Diálogo

```
┌───────────────────────────────┐
│  Título de la acción        ✖ │
├───────────────────────────────┤
│                                 │
│   (contenido — formulario       │
│    corto, confirmación, o        │
│    selector de creación inline)  │
│                                 │
├───────────────────────────────┤
│           [Cancelar]  [Acción] │
└───────────────────────────────┘
```

**Regla:** un modal nunca abre otro modal encima (sin diálogos anidados) — si una acción dentro de un modal necesita más pasos, el modal cambia de contenido (wizard de un paso a otro) en vez de apilar una segunda capa.

## 9. Buenas prácticas

- Antes de diseñar una pantalla nueva en `07_SCREEN_CATALOG.md`, identificar cuál de estos 6 arquetipos usa — si ninguno encaja, es señal de que hace falta un arquetipo nuevo (raro) o que la pantalla se puede descomponer en arquetipos existentes (común).
- Todo arquetipo se implementa como componente compuesto en `ui-kit/components/` (`docs/architecture/01-estructura-monorepo.md`) — nunca copiado y modificado pantalla por pantalla.

## 10. Reglas

- Ninguna pantalla nueva introduce un layout que no sea una variación de estos 6 arquetipos sin documentarlo acá primero.
- Los wireframes de este documento son ASCII a propósito — la implementación visual real (Figma, componentes React) es un paso posterior, fuera de alcance de `docs/product/` (ver `01_PRODUCT_VISION.md`, reglas de EPIC: sin código ni implementación en esta fase).
