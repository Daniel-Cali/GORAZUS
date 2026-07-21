# 05 — Information Architecture

## 1. Objetivo

Definir cómo se organiza y se agrupa **toda la información del sistema** en una jerarquía navegable — el mapa completo antes de decidir cómo se navega entre sus partes (eso es `06_NAVIGATION.md`).

## 2. Alcance

Sitemap completo (los 25 módulos navegables de `docs/menus/` + elementos globales), criterio de agrupación, y el modelo de alcance multiempresa/multisucursal que **condiciona toda la IA** (no es un detalle técnico aislado — determina qué ve el usuario en cada pantalla).

## 3. Sitemap — nivel 1 (grupos de módulo)

```
GORAZUS
│
├── ⌂ Dashboard                          (persona 3.6 — vista consolidada)
│
├── 💰 Ventas
│   ├── Ventas (cotizaciones, pedidos, facturas, NC/ND, devoluciones)
│   ├── POS
│   └── CRM
│
├── 📦 Compras e Inventario
│   ├── Compras
│   ├── Inventario
│   └── Proveedores
│
├── 👥 Clientes
│
├── 🏭 Producción y Servicios
│   ├── Producción
│   └── Servicios
│
├── 💵 Finanzas
│   ├── Caja
│   ├── Bancos
│   ├── Contabilidad          (incluye régimen/tasas de Impuestos —
│   │                          sin menú propio, ver docs/menus/00-convenciones.md §7)
│   └── Tesorería
│
├── 👤 Gente
│   ├── RRHH
│   └── Nómina
│
├── 🏢 Activos y Proyectos
│   ├── Activos Fijos
│   └── Proyectos
│
├── 📊 Análisis
│   ├── Reportes
│   └── Business Intelligence
│
├── 📄 Documentos
│
├── ⚙ Sistema
│   ├── Configuración
│   ├── Seguridad
│   └── Administración
│
└── ❓ Ayuda
```

**Criterio de agrupación:** por **dominio de negocio que el usuario reconoce**, no por schema técnico ni por orden alfabético — "Finanzas" agrupa Caja/Bancos/Contabilidad/Tesorería porque Fernando (persona 3.5) piensa en ellos como un solo territorio, aunque sean schemas distintos en `docs/database/` (Impuestos es uno de esos schemas, pero sin menú propio — vive dentro de la pantalla de Contabilidad, ver `07_SCREEN_CATALOG.md §4.9`).

## 4. Elementos globales (presentes en toda pantalla, no parte del sitemap)

```
┌─────────────────────────────────────────────────────────────────┐
│ [Logo] [Selector Empresa/Sucursal ▾]      [🔍 Buscar] [🔔] [👤]  │ ← Barra superior, global
├──────────┬──────────────────────────────────────────────────────┤
│          │                                                      │
│ Sidebar  │              Contenido de la pantalla actual         │
│ (Sitemap │                                                      │
│  nivel 1)│                                                      │
│          │                                                      │
└──────────┴──────────────────────────────────────────────────────┘
```

| Elemento                  | Presente en   | Detalle                                                                                 |
| ------------------------- | ------------- | --------------------------------------------------------------------------------------- |
| Selector Empresa/Sucursal | Toda pantalla | Ver §5 — condiciona qué datos se ven, no solo un filtro visual                          |
| Búsqueda global           | Toda pantalla | Ver `06_NAVIGATION.md §4`                                                               |
| Notificaciones            | Toda pantalla | Eventos relevantes al usuario (aprobaciones pendientes, alertas de stock, vencimientos) |
| Perfil de usuario         | Toda pantalla | Datos de sesión, cambio de contraseña, cerrar sesión                                    |
| Comando rápido (⌘K)       | Toda pantalla | Ver `10_KEYBOARD_SHORTCUTS.md`                                                          |

## 5. El alcance Empresa/Sucursal condiciona toda la IA

Ya fijado a nivel de datos (`docs/database/00-modelo-general.md §8-9`): jerarquía **Tenant → Company → Branch**, resuelta server-side por `TenantInterceptor` (`docs/architecture/09-seguridad-y-multiempresa.md`) — **el frontend nunca decide el alcance, solo lo refleja y lo cambia quien tiene permiso**.

```
┌─────────────────────────────────────────┐
│ Selector: [Ferretería El Tornillo ▾]     │
│           └─ Sucursal Centro ▾           │
│              └─ (o "Todas las sucursales"│
│                  si el rol lo permite)   │
└─────────────────────────────────────────┘
```

**Regla de IA (no solo de navegación):** cada módulo declara si sus pantallas son:

- **De sucursal** (Caja, POS, Inventario de una ubicación) — requieren sucursal activa seleccionada, no aceptan "todas".
- **Consolidables** (Dashboard, Reportes, BI, Contabilidad) — el selector permite "todas las sucursales" y la pantalla agrega datos.
- **De empresa, sin sucursal** (Configuración, RRHH, Activos Fijos según el caso) — el selector de sucursal se oculta, solo aplica el de empresa.

Esta clasificación por pantalla es la entrada real para el catálogo de `07_SCREEN_CATALOG.md`, campo "Alcance".

**Gap conocido heredado de la capa de datos:** la política de Row-Level Security `branch_isolation` está señalada como pendiente en `docs/database/06-estrategia-seguridad.md` (solo existen `tenant_isolation`/`company_isolation` hoy) — la IA de producto asume que existirá, pero no se puede construir la pantalla de "aislamiento estricto por sucursal" hasta que ese gap técnico se cierre. Se documenta acá para que no se descubra tarde.

## 6. Búsqueda vs. navegación por menú

Dos formas de llegar a la misma información, ambas de primera clase (no una "alternativa oculta" de la otra):

- **Navegación por menú (sitemap):** para cuando el usuario sabe en qué módulo está lo que busca.
- **Búsqueda global:** para cuando el usuario tiene un dato (número de factura, nombre de cliente, código de producto) y no le importa en qué módulo vive — ver `06_NAVIGATION.md §4`.

## 7. Buenas prácticas

- Ningún módulo nuevo se agrega al sitemap sin decidir primero a qué grupo de nivel 1 pertenece (§3) y su clasificación de alcance (§5) — evita que "dónde lo pongo" se decida ad-hoc pantalla por pantalla.
- La profundidad máxima del sitemap es 3 niveles (Grupo → Módulo → Sección) — si una sección necesita un cuarto nivel, es señal de que el módulo necesita su propia sub-navegación (tabs dentro de la pantalla, ver `06_NAVIGATION.md`), no más anidamiento de menú.

## 8. Reglas

- La IA no se basa en el árbol de schemas de Postgres (`docs/database/`) ni en la carpeta `modules/` del monorepo (`docs/architecture/01-estructura-monorepo.md`) — son mapas distintos para audiencias distintas (usuario final vs. base de datos vs. código). Que coincidan en algunos casos es conveniencia, no una regla a mantener artificialmente.
- Todo elemento global (§4) se implementa una sola vez (`ui-kit/`, `core/http` para el backend de sesión/alcance) — ninguna pantalla reimplementa su propio selector de sucursal o su propia búsqueda.
