# Auditoría Visual del Frontend — Fase 01

## 1. Alcance real vs. alcance pedido

El master prompt pide revisar 18 pantallas nombradas (Login, Dashboard, POS, Inventario,
Productos, Categorías, Clientes, Proveedores, Ventas, Compras, Caja, Reportes, Usuarios, Roles,
Configuración, Perfil, Auditoría, Notificaciones). La auditoría empezó confirmando cuáles de esas
pantallas **existen de verdad** como UI propia, según `apps/web/src/app/router.tsx` y
`MODULE_REGISTRY` (`apps/web/src/app/app-shell/module-registry.ts`):

| Pantalla real                                                                                      | Módulo              | Estado                                                                                                                                                                                                                                                                         |
| -------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Login                                                                                              | `modules/auth`      | ✅ Auditada                                                                                                                                                                                                                                                                    |
| Dashboard                                                                                          | `modules/dashboard` | ✅ Auditada                                                                                                                                                                                                                                                                    |
| Usuarios (`/seguridad/usuarios`)                                                                   | `modules/seguridad` | ✅ Auditada                                                                                                                                                                                                                                                                    |
| POS (`/pos`, sin `AppShell`)                                                                       | `modules/pos`       | ✅ Auditada                                                                                                                                                                                                                                                                    |
| **Las 18 restantes** (Inventario, Productos, Ventas, Compras, Caja, Reportes, Configuración, etc.) | Todas               | ❌ **No tienen pantalla propia** — el sidebar navega a ellas, pero renderizan el mismo componente compartido `ComingSoonPage` (`ui-kit/components/layout/coming-soon-page.tsx`), sin datos ni layout propio, según `ROADMAP.md` (22 de 27 módulos de negocio sin backend real) |

Auditar "Inventario" o "Reportes" como pantallas individuales habría sido fingir que existen —
en cambio, se auditó **el componente compartido** (`ComingSoonPage`) una sola vez, porque cubre
las 18 pantallas simultáneamente (cualquier mejora ahí se ve reflejada en las 18). Roles, Perfil,
Auditoría y Notificaciones tampoco tienen pantalla propia todavía — `NotificationCenter` existe
como componente (dropdown del topbar), no como página.

**Conclusión de alcance**: 4 pantallas reales con UI propia + 1 componente compartido
(`ComingSoonPage`, cubre 18) + componentes transversales de `AppShell` (sidebar/topbar) que
envuelven a las 4 pantallas reales. Esta es la superficie real auditada, con el mismo criterio de
honestidad que las fases anteriores del proyecto (auditar lo que existe, documentar lo que no).

## 2. Metodología

- Lectura de código de cada pantalla real y de cada primitive/componente compartido de `ui-kit`
  usado por ellas (`Button`, `Card`, `Table`/`DataTable`, `Dialog`, `FormField`, `Sidebar`,
  `Topbar`, `AppShell`).
- Verificación **visual real** con Playwright (Chromium) contra la app corriendo (`nx serve web` +
  `nx serve api`, Postgres/Redis reales), no solo lectura de código — capturas en las 5
  resoluciones pedidas: 1366×768, 1600×900, 1920×1080, 2560×1440, 3840×2160.
- Medición programática de contraste de color (algoritmo de luminancia relativa WCAG 2.1, ver
  `ACCESSIBILITY_REPORT.md`) sobre los tokens reales de `apps/web/src/styles/globals.css`, no una
  estimación visual.
- Inspección de `computedStyle`/`boundingBox` real vía Playwright para confirmar hallazgos antes
  de tocar código (evita "arreglar" algo que en realidad no estaba roto).

## 3. Hallazgos reales y su resolución

Cada hallazgo fue verificado con evidencia (captura o medición) antes y después del fix — no se
"arregló a ojo". Detalle completo de cada uno en `DESIGN_FIXES.md`. Resumen:

| #   | Hallazgo                                                                                                                            | Severidad                                          | Pantallas afectadas                                        | Estado                                                                                                                                 |
| --- | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | El nombre del usuario ("Hola, {nombre}", topbar) desaparece tras cualquier recarga completa de página, aunque la sesión siga activa | 🔴 Alta (defecto visible, confunde al usuario)     | Todas las autenticadas                                     | ✅ Corregido                                                                                                                           |
| 2   | `tailwind.config.ts` no escaneaba `modules/*/frontend/` — clases de Tailwind usadas solo ahí se purgaban en silencio                | 🔴 Alta (raíz sistémica)                           | POS confirmado, riesgo latente en cualquier módulo futuro  | ✅ Corregido                                                                                                                           |
| 3   | Contraste de `--destructive` (rojo de error/destructivo) por debajo del mínimo WCAG AA                                              | 🔴 Alta (accesibilidad, uso activo hoy)            | Todo mensaje de error de formulario                        | ✅ Corregido                                                                                                                           |
| 4   | `DataTable` sin encabezado fijo, sin mostrar/ocultar columnas, sin control de tamaño de página, carga con spinner genérico          | 🟠 Media                                           | Usuarios (única tabla real hoy, base de toda tabla futura) | ✅ Corregido                                                                                                                           |
| 5   | Texto real (descripción/hora de notificaciones) por debajo de 14px                                                                  | 🟡 Baja                                            | `NotificationCenter`                                       | ✅ Corregido                                                                                                                           |
| 6   | Tarjetas del Dashboard muy anchas y con mucho espacio vacío en monitores 4K                                                         | 🟡 Baja (pantalla placeholder, contenido temporal) | Dashboard                                                  | 📝 Documentado, no corregido (ver `LAYOUT_RECOMMENDATIONS.md`)                                                                         |
| 7   | Sin indicador visual de campo obligatorio en formularios                                                                            | 🟡 Baja                                            | Todos los formularios                                      | 📝 Documentado, no corregido (ver `LAYOUT_RECOMMENDATIONS.md`)                                                                         |
| 8   | Sin búsqueda global real en `DataTable`                                                                                             | 🟡 Baja                                            | Usuarios                                                   | 📝 Documentado — requiere agregar un parámetro de query al backend, fuera de alcance de esta fase (regla explícita: no modificar APIs) |

## 4. Qué NO se tocó (regla explícita del master prompt)

Ningún endpoint, contrato de API, tabla de base de datos, regla de negocio ni flujo de trabajo fue
modificado. Todos los cambios son de capa visual (Tailwind, CSS, componentes de presentación de
`ui-kit`) o de una función de sesión puramente de frontend (`RequireAuth`, usa un endpoint ya
existente, `GET /auth/me`, sin tocarlo). Ver `UI_IMPROVEMENTS.md` para el detalle técnico completo
de cada cambio.
