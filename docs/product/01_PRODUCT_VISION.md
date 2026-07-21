# 01 — Product Vision

> Primer documento de `docs/product/` — formaliza por escrito la visión de producto que hasta ahora solo existía como directiva del usuario en conversación, no en documentación oficial. Todo documento posterior de `docs/product/` construye sobre este.

## 1. Objetivo de este documento

Fijar **qué es GORAZUS, para quién, por qué existe y contra quién compite** — antes de diseñar una sola pantalla. Sin esto, "reducir clics" o "interfaz moderna" (pedidos ya hechos) no tienen vara de medir: reducir clics ¿para quién, en qué tarea, comparado con qué?

## 2. Alcance

Cubre: declaración de visión, mercado objetivo, propuesta de valor, posicionamiento competitivo, principios de producto, alcance funcional (qué SÍ, qué NO), y criterios de éxito. **No cubre**: personas de usuario (→ `02_USER_PERSONAS.md`), pantallas concretas (→ `07_SCREEN_CATALOG.md`), ni arquitectura técnica (→ `docs/architecture/`).

## 3. Declaración de visión

> **GORAZUS es el ERP web que una ferretería o empresa comercial de Latinoamérica puede empezar a usar en un día, y no necesita abandonar ni reemplazar en los próximos 15 años porque creció.**

Dos mitades de la misma frase, en tensión deliberada:

- **"Empezar a usar en un día"** — la barra de entrada de un ERP tradicional (SAP Business One, Dynamics 365 BC) es semanas de implementación con consultor. GORAZUS es web, sin instalación local, con datos de ejemplo y asistentes de configuración inicial (`docs/menus/21-configuracion.md`).
- **"No reemplazar en 15 años porque creció"** — la razón por la que una PyME migra de un sistema "simple" (Excel, un POS suelto) a otro cada 3-4 años es que el sistema simple no soporta multiempresa, multisucursal, ni el volumen de datos que trae el crecimiento. GORAZUS está diseñado desde el día 1 para cientos de millones de registros (`docs/database/00-modelo-general.md`) — la Enterprise-readiness no es una fase futura, es la base.

## 4. Mercado objetivo

**Vertical primario:** ferreterías y distribuidoras de materiales de construcción — negocio con catálogo de productos grande y heterogéneo (miles de SKU, variantes por medida/color/material), múltiples unidades de medida con conversión, proveedores múltiples por producto, y ventas mixtas mostrador + POS + mayorista.

**Vertical secundario (mismo modelo de datos, sin cambios):** empresas comerciales en general — distribución, retail, servicios con inventario. El diseño no hardcodea nada específico de ferretería a nivel de schema (`docs/database/`) — la especialización es de catálogo de producto y flujos de venta, no de arquitectura.

**Geografía:** Latinoamérica — de ahí `Multiimpuestos`, `Multimoneda` y facturación electrónica como requisitos de primera clase (`docs/architecture/46-modulo-taxes.md`), no como extensión regional tardía.

**Tamaño de empresa:** PyME a mediana empresa — desde una sola sucursal hasta una cadena con varias sucursales y almacenes, un solo tenant por empresa cliente (SaaS multiempresa, `docs/database/00-modelo-general.md §8-9`).

## 5. Propuesta de valor

```
┌─────────────────────────────────────────────────────────────────┐
│                    ¿Por qué GORAZUS y no...?                    │
├─────────────────────┬───────────────────────────────────────────┤
│ ...un Excel + un POS │ No escala pasado ~1 sucursal. Sin        │
│ suelto               │ auditoría, sin trazabilidad, sin cierre   │
│                      │ contable real.                            │
├─────────────────────┼───────────────────────────────────────────┤
│ ...SAP Business One  │ Semanas de implementación, licencia por   │
│ / Dynamics 365 BC    │ usuario cara, interfaz de escritorio      │
│                      │ pensada para 2005. GORAZUS es web, con    │
│                      │ el mismo rigor Enterprise (particionado,  │
│                      │ RLS, HA) sin el costo de entrada.          │
├─────────────────────┼───────────────────────────────────────────┤
│ ...Odoo Enterprise   │ Odoo es genérico — cada módulo es "meh"   │
│                      │ para no ser malo en ninguno. GORAZUS      │
│                      │ empieza especializado en el vertical      │
│                      │ (ferretería) y generaliza desde ahí, no   │
│                      │ al revés.                                  │
├─────────────────────┼───────────────────────────────────────────┤
│ ...un ERP genérico   │ Nace multiempresa/multisucursal/          │
│ "para crecer         │ multialmacén — no hay "edición Pro" que   │
│ después"             │ agregar cuando la empresa crece, ya está.  │
└─────────────────────┴───────────────────────────────────────────┘
```

## 6. Posicionamiento competitivo

```
                    Complejidad / Costo de implementación
                                    ▲
                                    │
                    SAP Business One│    Oracle NetSuite
                         ●          │         ●
                                    │
                    Dynamics 365 BC │
                         ●          │
   ─────────────────────────────────┼─────────────────────────────▶
   Genérico                         │                    Especializado
                                    │                    (vertical)
                    Odoo Enterprise │
                         ●          │        ★ GORAZUS
                                    │      (objetivo)
                    ERPNext         │
                         ●          │
                                    │
                    Excel + POS suelto
                         ●          (bajo, pero no escala)
                                    ▼
                    Simplicidad / Rapidez de adopción
```

GORAZUS apunta al cuadrante que hoy nadie ocupa bien para este vertical: **rigor Enterprise (eje vertical alto, como SAP/NetSuite) con adopción rápida y foco vertical (eje horizontal, como un producto especializado)**.

## 7. Principios de producto

Directivas ya fijadas por el usuario, formalizadas acá para que todo diseño de pantalla posterior las cite en vez de repetirlas:

1. **Reducir clics, reducir pasos.** Cada flujo de `03_USER_JOURNEYS.md` se mide en número de pantallas/clics contra la alternativa (Excel, POS suelto, o el competidor más cercano).
2. **Automatizar lo automatizable.** Si un dato se puede inferir (precio desde lista de precios, impuesto desde régimen fiscal del cliente), no se le pide al usuario que lo tipee.
3. **Atajos de teclado en todo flujo de alto volumen** (POS, captura de venta/compra) — ver `10_KEYBOARD_SHORTCUTS.md`. Un cajero no debe tocar el mouse en una venta estándar.
4. **Búsqueda instantánea y autocompletado** en todo selector de entidad (cliente, producto, proveedor) — nunca un `<select>` con miles de opciones sin filtrar.
5. **Acciones masivas** donde el volumen lo justifique (aprobar N órdenes de compra, marcar N facturas como pagadas) — no una operación a la vez cuando el usuario claramente repite la misma acción.
6. **Modo oscuro y responsive de fábrica**, no como tema alternativo tardío.
7. **Consistencia sobre creatividad** — un mismo tipo de pantalla (lista, formulario, detalle) se ve y comporta igual en los 27 módulos. Ver `09_WIREFRAMES.md`, arquetipos reutilizables.

## 8. Alcance funcional

### Qué SÍ (los 27 módulos ya diseñados en `docs/architecture/04-catalogo-modulos-negocio.md`)

Core/Seguridad, Clientes, Proveedores, Productos, Inventario, Ventas, Compras, Caja, Bancos, Contabilidad, Impuestos, CRM, RRHH, Nómina, Servicios, Proyectos, Activos Fijos, Reportes, BI, POS, Producción, Documentos, Administración, Tesorería, Dashboard, Configuración.

### Qué NO (todavía — ver `docs/00-roadmap-fases.md`)

- **Integraciones específicas de terceros** (pasarelas de pago, couriers) — la infraestructura genérica existe (`core.integrations`), la integración puntual se construye cuando hay un proveedor real confirmado, no antes.
- **Inteligencia Artificial** — sin alcance definido todavía, no se diseña especulativamente.
- **Aplicación móvil nativa** — pendiente decidir enfoque (nativa / React Native / PWA sobre `apps/web`).

## 9. Criterios de éxito (a nivel producto, no técnico)

- Una empresa nueva puede facturar su primera venta el mismo día que se registra (onboarding).
- Un cajero de POS completa una venta estándar (producto conocido, pago en efectivo) en menos de 5 interacciones.
- Ningún reporte financiero requiere exportar a Excel para ser útil — el reporte en pantalla ya es la fuente de verdad.
- Cero pérdida de datos al cambiar de sucursal, moneda o cerrar el ejercicio fiscal (auditoría/versionado ya diseñados en `docs/database/05-estrategia-auditoria.md`).

## 10. Buenas prácticas para usar este documento

- Todo nuevo documento de `docs/product/` debe poder trazar su justificación a un principio de §7 o a un punto de §8 — si no puede, es una decisión nueva que hay que discutir acá primero, no colarla en un documento de pantallas.
- Este documento no se actualiza por cada feature — se actualiza cuando cambia la **visión**, no la implementación.

## 11. Reglas

- Ningún documento de `docs/product/` puede contradecir `docs/architecture/` ni `docs/database/` sin señalarlo explícitamente como una tensión a resolver (mismo criterio que el resto del proyecto).
- El vocabulario de negocio en estos documentos es **español** (mismo criterio que `docs/architecture/07-convenciones-y-estandares.md §2`).
