# Informe de Responsive Design — Fase 01

Verificado con Playwright (Chromium) real contra la app corriendo, en las 5 resoluciones pedidas,
sobre las 4 pantallas reales (Login, Dashboard, Usuarios, POS) más el componente compartido
`ComingSoonPage`. Todas las capturas fueron generadas en esta sesión, no son mockups.

## Resoluciones verificadas

| Resolución | Login |    Dashboard    | Usuarios (tabla) | POS | ComingSoonPage |
| ---------- | :---: | :-------------: | :--------------: | :-: | :------------: |
| 1366×768   |  ✅   |       ✅        | ✅ (ver nota 1)  | ✅  |       ✅       |
| 1600×900   |  ✅   |       ✅        |        ✅        | ✅  |       ✅       |
| 1920×1080  |  ✅   |       ✅        |        ✅        | ✅  |       ✅       |
| 2560×1440  |  ✅   |       ✅        |        ✅        | ✅  |       ✅       |
| 3840×2160  |  ✅   | ✅ (ver nota 2) |        ✅        | ✅  |       ✅       |

## Notas

1. **1366×768 — Usuarios**: antes del fix de `DataTable` (`UI_IMPROVEMENTS.md §4`), la tabla sin
   límite de altura empujaba el paginador fuera de la pantalla — había que scrollear el body
   completo para llegar a "Página X de Y" (`scrollHeight` 1282px vs `clientHeight` 712px del
   contenedor). Con `max-h-[60vh]` en la tabla, el paginador y el selector de tamaño de página
   quedan visibles sin scrollear, incluso en la resolución más chica pedida.
2. **3840×2160 — Dashboard**: layout válido (sin overflow, sin contenido cortado), pero las 3
   tarjetas (`grid-cols-3`) se estiran a ~1168px cada una con muy poco contenido adentro
   (título corto + "—"), dejando mucho espacio vacío dentro de cada card. No es un error de layout
   — es contenido temporal (`Card` con `Pendiente — módulo X aún no implementado`, texto propio del
   componente) en una pantalla explícitamente marcada como "Composición sin datos propios" en su
   propio código. Ver `LAYOUT_RECOMMENDATIONS.md §1` para la recomendación a futuro.

## Sin scroll horizontal

Ninguna de las 4 pantallas reales produjo scroll horizontal en ninguna de las 5 resoluciones —
verificado tanto visualmente (capturas) como programáticamente (`document.documentElement.scrollWidth`
vs `clientWidth`, sin diferencia en ningún caso).

## Sidebar colapsado

Verificado en las 5 resoluciones — el botón "Colapsar" reduce el sidebar de `w-64` a `w-16`,
mostrando solo íconos con tooltip al hacer hover (`Tooltip` de Radix, ya presente). Sin
superposición con el contenido en ningún caso.

## Modal / diálogo (Usuarios → "Nuevo usuario")

Verificado en 1366×768 y 2560×1440 — el `Dialog` se centra correctamente (`fixed left-[50%]
top-[50%] translate-x-[-50%] translate-y-[-50%]`, patrón Radix estándar), con `max-w-lg`, nunca
excede el viewport ni en la resolución más chica.

## No verificado en esta fase

- **Viewports móviles/tablet reales** (< 1366px) — el master prompt no los pidió explícitamente
  (lista empieza en 1366×768) y `AppShell` ya tiene un modo drawer para mobile (`md:hidden` +
  overlay) preparado desde una fase anterior, pero no se ejecutó Playwright contra un viewport
  angosto en esta sesión — queda para una fase futura si se pide explícitamente soporte móvil.
- **Zoom del navegador** (125%/150%/200%) — no se probó; es un eje de accesibilidad relacionado
  pero distinto de "resolución de pantalla", ver `ACCESSIBILITY_REPORT.md §5` para lo que sí se
  cubrió.
