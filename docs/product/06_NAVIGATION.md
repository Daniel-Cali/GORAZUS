# 06 — Navigation

## 1. Objetivo

Definir **cómo** se mueve un usuario entre las pantallas del sitemap ya fijado en `05_INFORMATION_ARCHITECTURE.md` — los mecanismos concretos (sidebar, tabs, breadcrumbs, búsqueda, comandos), no qué contiene cada pantalla (eso es `07_SCREEN_CATALOG.md`).

## 2. Alcance

Patrones de navegación reutilizables en los 25 módulos navegables (`docs/menus/`). El contenido literal del menú (qué formularios/reportes tiene cada módulo) ya está en `docs/menus/<módulo>.md` — este documento no lo repite, define el **mecanismo** que renderiza ese contenido.

## 3. Sidebar (navegación primaria)

```
┌────────────────┐
│ ⌂ Dashboard     │  ← nivel 1, siempre visible
├────────────────┤
│ 💰 Ventas    ▾  │  ← grupo, expandible
│   • Ventas      │
│   • POS         │
│   • CRM         │
├────────────────┤
│ 📦 Compras...▾  │  ← colapsado por defecto
├────────────────┤
│ ...             │
├────────────────┤
│ ⚙ Sistema    ▾  │
└────────────────┘
```

**Reglas:**

- Colapsable a solo-íconos (pantallas angostas / más espacio de trabajo) — estado persistente por usuario, no se resetea entre sesiones.
- El grupo del módulo donde el usuario está activo se expande automáticamente al cargar; los demás quedan colapsados — evita un sidebar de 80 líneas siempre desplegado.
- En mobile/responsive, el sidebar se convierte en un drawer que se abre desde un botón hamburguesa (ver `09_WIREFRAMES.md`, arquetipo responsive).

## 4. Búsqueda global

```
┌─────────────────────────────────────────────────────┐
│ 🔍  fact 1023___________________________              │
├─────────────────────────────────────────────────────┤
│  FACTURAS                                             │
│  📄 FAC-001023 — Ferretería Los Andes — $4.320         │
│  📄 FAC-001023-A (NC) — Ferretería Los Andes           │
├─────────────────────────────────────────────────────┤
│  CLIENTES                                              │
│  👤 Facundo Torres — CLI-00234                         │
├─────────────────────────────────────────────────────┤
│  PRODUCTOS                                              │
│  📦 Tornillo Phillips 1" — SKU TOR-1023                 │
└─────────────────────────────────────────────────────┘
```

**Reglas:**

- Busca **across-módulo** por defecto (clientes, proveedores, productos, documentos por número) — resultados agrupados por tipo de entidad, no una lista plana.
- Resultados en <300ms percibidos (debounce + índice de búsqueda, no un `LIKE %x%` contra la tabla completa — detalle técnico en `docs/architecture/`, no en este documento).
- Atajo `⌘K`/`Ctrl+K` la abre desde cualquier pantalla — ver `10_KEYBOARD_SHORTCUTS.md`.
- Doble función: buscar una entidad existente **y** ejecutar una acción rápida ("nueva venta", "nuevo cliente") — mismo cuadro, resultados mezclados con acciones cuando el texto no matchea una entidad exacta.

## 5. Breadcrumbs

```
Ventas › Facturas › FAC-001023
```

**Regla:** presente en toda pantalla de detalle/edición (nunca en listas de nivel 1 ni en el Dashboard) — cada segmento es un link funcional, no decorativo. El último segmento (pantalla actual) no es clickeable.

## 6. Tabs (navegación secundaria, dentro de una pantalla de detalle)

```
┌─────────────────────────────────────────────────────┐
│ FAC-001023 — Ferretería Los Andes                     │
├─────────────────────────────────────────────────────┤
│ [Detalle] [Pagos] [Documentos relacionados] [Historial]│
├─────────────────────────────────────────────────────┤
│                                                        │
│              (contenido del tab activo)                │
└─────────────────────────────────────────────────────┘
```

**Regla:** el tab "Historial" (transiciones de estado, ver `04_BUSINESS_WORKFLOWS.md §5`) es **obligatorio** en toda pantalla de detalle de un documento con workflow de estados — no opcional por módulo.

## 7. Comando rápido (Command Palette)

```
┌─────────────────────────────────────────────────────┐
│ >  nueva vent_____________________________            │
├─────────────────────────────────────────────────────┤
│  ▸ Nueva venta                              ⌘N        │
│  ▸ Nueva venta POS                          ⌘⇧P       │
│  ▸ Ir a Ventas › Cotizaciones                          │
└─────────────────────────────────────────────────────┘
```

Distinto de la búsqueda global (§4) en intención: la búsqueda encuentra **datos existentes**, el comando rápido ejecuta **acciones** o **navega** — ambos comparten el mismo atajo de apertura (`⌘K`) y el sistema decide cuál mostrar según si el usuario tipea un sustantivo (dato) o un verbo (acción), con ambos tipos de resultado mezclados si es ambiguo.

## 8. Navegación en POS (caso especial — ver persona 3.1)

El POS **no usa sidebar ni breadcrumbs** — es una pantalla de trabajo de pantalla completa, navegación por teclado (ver `10_KEYBOARD_SHORTCUTS.md`), con un botón único de salida ("Cerrar turno / Volver al sistema"). Cualquier otra navegación dentro del turno de POS sería fricción contra el principio de "reducir clics" (`01_PRODUCT_VISION.md §7`) para el perfil de uso de Miguel.

## 9. Navegación responsive / mobile

```
Desktop:                          Mobile:
┌───┬──────────────────┐          ┌──────────────────┐
│Side│                  │          │ ☰  GORAZUS    🔍 👤│
│bar │    Contenido     │          ├──────────────────┤
│    │                  │          │                  │
└───┴──────────────────┘          │    Contenido     │
                                    │   (una columna)  │
                                    ├──────────────────┤
                                    │ ⌂  💰  📦  🔔  ☰  │ ← tab bar inferior
                                    └──────────────────┘   (accesos frecuentes)
```

**Regla:** la tab bar inferior en mobile no replica el sidebar completo — muestra los 4-5 accesos más usados por el rol de la sesión activa (Dashboard siempre presente + los módulos más usados por esa persona, ver `02_USER_PERSONAS.md §4`), con "☰" para el resto.

## 10. Buenas prácticas

- Todo patrón de navegación de este documento se implementa **una sola vez** en `ui-kit/` (`docs/architecture/01-estructura-monorepo.md`) — ningún módulo reimplementa su propio sidebar o su propio sistema de tabs.
- La navegación nunca pierde el contexto de Empresa/Sucursal activo (`05_INFORMATION_ARCHITECTURE.md §5`) al cambiar de pantalla — cambiar de módulo no resetea el alcance seleccionado.

## 11. Reglas

- Toda pantalla nueva del catálogo (`07_SCREEN_CATALOG.md`) declara explícitamente: (a) su posición en el sidebar (grupo/módulo), (b) si tiene tabs internos y cuáles, (c) si aparece en el comando rápido como acción directa.
- Ningún nivel de navegación nuevo se agrega sin verificar primero que no puede resolverse con los 6 mecanismos ya definidos acá (sidebar, breadcrumbs, tabs, búsqueda, comando rápido, tab bar mobile) — evita inventar un séptimo patrón de navegación para un caso que ya tiene solución.
