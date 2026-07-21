# 08 — User Flows

## 1. Objetivo

Documentar interacciones **dentro de una pantalla o entre 2-3 pantallas contiguas** — el nivel de detalle entre `03_USER_JOURNEYS.md` (punta a punta, varios días/módulos) y `09_WIREFRAMES.md` (layout estático de una pantalla). Un flujo responde "¿qué pasa clic a clic, campo a campo?".

## 2. Alcance

Flujos transversales que se repiten en múltiples módulos (creación inline, selector con autocompletado, confirmación de acción destructiva, manejo de error de validación) — no un flujo por cada una de las 336 pantallas del catálogo (`07_SCREEN_CATALOG.md`). Un flujo específico de un módulo (p. ej. el flujo exacto de aplicar un pago mixto) se documenta en el propio `docs/menus/<módulo>.md` si hace falta ese nivel de detalle, citando el patrón transversal correspondiente de acá.

## 3. Flujo: Selector de entidad con búsqueda y creación inline

El patrón más repetido del sistema — elegir un cliente/producto/proveedor sin salir de la pantalla actual.

```
┌─────────────────────────────────────┐
│ Cliente: [Buscar cliente...        ]│  ← estado inicial: vacío
└─────────────────────────────────────┘
              │ el usuario tipea 2+ caracteres
              ▼
┌─────────────────────────────────────┐
│ Cliente: [fac___                   ]│
├─────────────────────────────────────┤
│  Facundo Torres — CLI-00234          │  ← resultados en <300ms
│  Fábrica del Sur — CLI-00512         │     (debounce, no busca
│  ➕ Crear "fac" como cliente nuevo   │      letra por letra)
└─────────────────────────────────────┘
              │
      ┌───────┴───────┐
      ▼               ▼
[Selecciona uno    [Clic en "Crear
 existente]         nuevo"]
      │               │
      │               ▼
      │      ┌─────────────────────┐
      │      │ Modal: alta rápida   │  ← solo campos obligatorios,
      │      │ de cliente           │     no el formulario completo
      │      │ (nombre, doc. fiscal,│     de Clientes (ese tiene más
      │      │  teléfono)           │     campos opcionales)
      │      └──────────┬───────────┘
      │                 │ guardar
      │                 ▼
      └────────▶ [Cliente queda seleccionado
                  en la pantalla original,
                  sin perder lo demás ya
                  capturado]
```

**Regla:** la creación inline nunca navega a otra pantalla ni pierde el estado de lo que el usuario ya venía llenando — siempre es un modal que devuelve el control al mismo lugar. Aplica a Cliente, Proveedor, Producto (con menos frecuencia) y Cuenta contable.

## 4. Flujo: Confirmación de acción destructiva/irreversible

Aplica a: anular factura, cerrar período fiscal, eliminar usuario, reabrir período cerrado.

```
[Usuario hace clic en "Anular factura"]
              │
              ▼
┌─────────────────────────────────────┐
│  ⚠ Anular factura FAC-001023         │
│                                       │
│  Esta acción reversa el stock y el   │
│  asiento contable generado. No se    │
│  puede deshacer.                     │
│                                       │
│  Motivo (obligatorio):               │
│  [________________________]          │
│                                       │
│         [Cancelar]  [Anular factura] │  ← el botón de confirmar
└─────────────────────────────────────┘     repite el nombre de la
                                              acción, nunca dice
                                              solo "Confirmar"
```

**Reglas:**

- El motivo es obligatorio siempre que la acción quede en un `_status_history` auditado (`04_BUSINESS_WORKFLOWS.md §5`) — si no hay campo de motivo, la acción no debería ser irreversible.
- El botón de confirmación nunca es el default con foco automático — evita confirmar por error con Enter accidental. Excepción deliberada: POS (persona 3.1, prioriza velocidad sobre este freno — ver `06_NAVIGATION.md §8`).
- Para "cerrar período fiscal" (afecta a toda la empresa, no un documento) el modal agrega un segundo paso: tipear el nombre del período para confirmar — fricción intencional proporcional al impacto.

## 5. Flujo: Error de validación en formulario

```
┌─────────────────────────────────────┐
│ Cantidad: [-5___]  ⚠ Debe ser mayor  │  ← error inline, junto al
│                       a 0            │     campo, no en un banner
│                                       │     genérico arriba
│ Precio:   [0____]  ⚠ Requerido       │
│                                       │
│         [Cancelar]  [Guardar]        │  ← "Guardar" queda
└─────────────────────────────────────┘     deshabilitado mientras
                                              haya errores visibles
```

**Reglas:**

- Contrato de error del backend ya fijado (`docs/architecture/07-convenciones-y-estandares.md`, formato `{error:{code, message, details}}`) — el frontend mapea `details` (por campo) a mensajes inline, nunca muestra el `code` técnico al usuario.
- Validación en tiempo real (al salir del campo, `onBlur`) para errores de formato; validación de negocio (p. ej. "stock insuficiente") solo al intentar guardar — no cada tecla, para no penalizar mientras el usuario todavía está escribiendo.

## 6. Flujo: Acción masiva sobre una lista

Aplica donde el volumen lo justifica (`01_PRODUCT_VISION.md §7`) — p. ej. aprobar N órdenes de compra, marcar N facturas como pagadas.

```
┌─────────────────────────────────────────────┐
│ ☑ Seleccionar todo (24)     [Aprobar (3)  ▾] │ ← acción aparece
├─────────────────────────────────────────────┤    recién al
│ ☑ OC-0091 — Proveedor A — $1.200             │    seleccionar 1+
│ ☑ OC-0092 — Proveedor A — $850                │
│ ☐ OC-0093 — Proveedor B — $2.100              │
│ ☑ OC-0094 — Proveedor A — $430                │
└─────────────────────────────────────────────┘
              │ clic en "Aprobar (3)"
              ▼
┌─────────────────────────────────────┐
│ Aprobar 3 órdenes de compra          │
│                                       │
│ ✔ OC-0091 — OK                       │
│ ✔ OC-0092 — OK                       │
│ ✖ OC-0094 — Requiere aprobación de   │  ← resultado por ítem,
│   nivel superior (monto excede       │     no todo-o-nada
│   límite del rol)                    │
│                                       │
│  2 de 3 aprobadas.        [Cerrar]   │
└─────────────────────────────────────┘
```

**Regla:** una acción masiva nunca es transaccional todo-o-nada a nivel de UI — cada ítem se procesa independientemente y el resultado se reporta ítem por ítem, porque una falla individual (permiso, regla de negocio) no debe bloquear al resto.

## 7. Flujo: Cambio de Empresa/Sucursal activa

```
[Usuario hace clic en el selector de sucursal, barra superior]
              │
              ▼
┌─────────────────────────────────────┐
│ Ferretería El Tornillo               │
│  ○ Sucursal Centro                   │
│  ○ Sucursal Norte                    │
│  ○ Todas las sucursales  (si el rol  │
│                            lo permite)│
└─────────────────────────────────────┘
              │ selecciona
              ▼
┌─────────────────────────────────────┐
│ ⚠ Cambiar de sucursal recarga el     │  ← solo si hay cambios sin
│   contexto. Tenés cambios sin        │     guardar en la pantalla
│   guardar en esta pantalla.          │     actual — si no hay
│                                       │     cambios pendientes, el
│  [Cancelar]  [Cambiar de todos modos]│     cambio es inmediato,
└─────────────────────────────────────┘     sin este paso
```

**Regla:** el cambio de alcance nunca pierde datos capturados sin avisar — mismo patrón de confirmación que §4, pero solo se dispara si hay estado local sin guardar.

## 8. Buenas prácticas

- Todo flujo nuevo que se repita en 2+ módulos se documenta acá como patrón transversal — no se redacta de nuevo en cada `docs/menus/<módulo>.md`.
- Los flujos de este documento son el contrato que `ui-kit/` implementa como componentes reutilizables (selector con creación inline, modal de confirmación, tabla con selección masiva) — un componente nuevo en `ui-kit/` que no sigue estos flujos es una inconsistencia a corregir, no una variante válida.

## 9. Reglas

- Ningún flujo transversal se resuelve distinto en dos módulos por conveniencia local — si un módulo necesita desviarse (p. ej. POS saltándose la confirmación de §4), la desviación se documenta explícitamente acá con su motivo, no se decide silenciosamente en el código.
