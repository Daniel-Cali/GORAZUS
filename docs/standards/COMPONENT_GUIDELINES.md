# Component Guidelines — GORAZUS

> EPIC 04 — Implementation Standards. Procedimientos paso a paso para los artefactos
> de UI pedidos explícitamente por el EPIC: componente, tabla, formulario. Complementa
> [MODULE_GUIDELINES.md](./MODULE_GUIDELINES.md) (que cubre hook y página). Cada paso
> cita el documento normativo (`docs/frontend/UI_GUIDELINES.md`,
> `docs/architecture/03,29`) sin repetir su razonamiento. Sin código.

## 1. Cómo decidir si un componente va en `ui-kit/` o en el módulo

Primer paso, antes de escribir cualquier componente — regla ya fijada
(`docs/architecture/03 §2`), repetida acá como pregunta de decisión explícita:

**¿El componente necesita conocer el nombre de una entidad de negocio o llamar a un
hook de un módulo específico?**

- **Sí** → `modules/<x>/frontend/components/` (con conocimiento de negocio).
- **No** (solo recibe props genéricas, no importa nada de `modules/*`) →
  `ui-kit/components/{primitives,form,data-table,charts,layout}/`.

Si la respuesta es ambigua, se construye en el módulo primero — es más barato mover
un componente de un módulo a `ui-kit/` después (cuando un segundo módulo demuestra
necesitarlo) que sacarlo de `ui-kit/` una vez que varios módulos ya dependen de su
forma específica de un caso de uso que resultó no ser genérico.

## 2. Cómo crear un componente de `ui-kit/`

1. Confirmar que no existe ya un componente equivalente — `ui-kit/` no duplica
   variantes del mismo concepto (DRY, `docs/architecture/01 §2`).
2. Si envuelve una primitiva de Shadcn: copiar vía la CLI de shadcn a
   `ui-kit/components/primitives/`, nunca escribir el componente accesible desde
   cero (`docs/architecture/29-frontend-enterprise.md §7`, cadena Radix→shadcn→ui-kit).
3. Aplicar tema vía los tokens de `ui-kit/theme/tailwind-tokens.ts` — nunca un color
   hardcodeado (`29 §6,7`).
4. Diseñar y probar en **ambos** temas (claro/oscuro) antes de darlo por completo
   ([docs/frontend/UI_GUIDELINES.md §3](../frontend/UI_GUIDELINES.md#3-tema-claroscuro-y-tokens)).
5. Verificar accesibilidad: rol ARIA correcto, navegable 100% por teclado, contraste
   validado contra los tokens de tema — objetivo WCAG 2.1 AA
   ([docs/frontend/UI_GUIDELINES.md §5](../frontend/UI_GUIDELINES.md#5-accesibilidad-nuevo--no-estaba-fijado-como-compromiso-explícito)).
6. Verificar los 4 breakpoints (`sm`/`md`/`lg`/`xl`,
   [docs/frontend/UI_GUIDELINES.md §4](../frontend/UI_GUIDELINES.md#4-breakpoints-responsive-nuevo--no-estaba-fijado-en-valores-concretos))
   si el componente aparece en pantallas de listado/formulario.
7. Test de comportamiento + accesibilidad
   ([docs/frontend/TESTING.md §2](../frontend/TESTING.md#2-qué-se-testea-en-cada-capa-nuevo--no-estaba-definido)).

## 3. Cómo crear un componente de módulo (con conocimiento de negocio)

1. Ubicar en `modules/<x>/frontend/components/<nombre>.tsx` (naming: PascalCase el
   componente exportado, kebab-case el archivo — [NAMING_CONVENTIONS.md §2](./NAMING_CONVENTIONS.md#2-código-typescript-referencia-tabla-ya-fijada)).
2. Componer sobre `ui-kit/` — un componente de módulo nunca reimplementa un
   `Button`/`Dialog`/`DataTable` propio, siempre envuelve el de `ui-kit/`.
3. Si el componente necesita datos de negocio de **otro** módulo (ejemplo real ya
   documentado: `SelectorCliente` de `clientes` usado desde `ventas`), verificar que
   `clientes` lo expone explícitamente en su `index.ts`/`shared/` — nunca importar el
   archivo interno directamente (`docs/architecture/03 §2`,
   [docs/frontend/FEATURES.md §2-3](../frontend/FEATURES.md#2-qué-expone-una-feature)).
4. Si el componente encapsula un flujo transversal ya catalogado
   (`docs/product/08_USER_FLOWS.md`), usar el componente de `ui-kit/` que ya lo
   implementa (tabla completa en
   [docs/frontend/UI_GUIDELINES.md §10](../frontend/UI_GUIDELINES.md#10-patrones-transversales-de-docsproduct08_user_flowsmd)) —
   nunca reimplementarlo desde cero para "este caso puntual".

## 4. Cómo crear una tabla (Lista/Tabla — arquetipo de `docs/product/09_WIREFRAMES.md §4`)

1. Usar siempre `ui-kit/components/data-table/DataTable` (motor TanStack Table,
   `docs/architecture/29 §8`) — nunca una tabla HTML a mano ni una segunda librería de
   tablas.
2. Definir columnas + hook de datos de servidor (paginado offset+limit,
   `docs/architecture/07-convenciones-y-estandares.md §4`) siguiendo
   [MODULE_GUIDELINES.md §5](./MODULE_GUIDELINES.md#5-cómo-crear-un-hook).
3. Filtros: whitelist explícita por endpoint contra el schema Zod del módulo — nunca
   un filtro nuevo sin verificar primero que la columna está indexada para ese patrón
   (`docs/architecture/30-api-completa.md §7`, ver
   [API_GUIDELINES.md §4](./API_GUIDELINES.md#4-filtros-referencia)).
4. Si el volumen esperado supera ~500 filas sin paginación de servidor (Kardex,
   Movimientos, Libro Diario): activar el modo virtualizado del `DataTable`
   ([docs/frontend/PERFORMANCE.md §3](../frontend/PERFORMANCE.md#3-virtualización-de-listas-largas)) —
   se decide en este paso, no se agrega reactivamente cuando la pantalla ya es lenta
   en producción.
5. Estados obligatorios: cargando (skeleton de filas), vacío (sin resultados de
   filtro vs. sin datos — mensajes distintos), error con botón reintentar
   (`docs/product/09_WIREFRAMES.md §4`).
6. Si necesita selección para acción masiva: usar
   `ui-kit/components/data-table/BulkActionBar`, patrón ya fijado en
   `docs/product/08_USER_FLOWS.md §6` — resultado por ítem, nunca todo-o-nada.
7. Responsive: verificar el colapso a tarjetas apiladas en `md`
   (`docs/product/09_WIREFRAMES.md §4`, [docs/frontend/UI_GUIDELINES.md §4](../frontend/UI_GUIDELINES.md#4-breakpoints-responsive-nuevo--no-estaba-fijado-en-valores-concretos)).

## 5. Cómo crear un formulario (Formulario de captura — arquetipo de `docs/product/09_WIREFRAMES.md §5`)

1. El schema Zod **ya existe** en `modules/<x>/shared/contracts/` (es el mismo que
   valida el backend, `docs/architecture/02 §3`/`03 §4`) — un formulario nunca define
   su propio schema de validación paralelo. Si el schema todavía no existe, se crea
   primero en `shared/contracts/`, nunca directamente en el componente de formulario.
2. `useForm` (React Hook Form) + `zodResolver(schema)` — patrón único, sin excepción
   (`docs/architecture/03 §4`).
3. Cabecera de datos generales + tabla de líneas editable inline (si aplica,
   documento transaccional) + panel de totales **siempre calculado, nunca capturado a
   mano** (`docs/product/09_WIREFRAMES.md §5`).
4. Errores: `ui-kit/components/form/FormField`/`FormError` para todo mensaje —
   validación de formato en `onBlur`, validación de negocio solo al intentar guardar
   (`docs/product/08_USER_FLOWS.md §5`, mecanismo técnico completo en
   [docs/frontend/ERROR_HANDLING.md §2](../frontend/ERROR_HANDLING.md#2-errores-de-validación-de-formulario)).
5. Selector de entidad relacionada (cliente, producto, proveedor): usar
   `ui-kit/components/form/EntitySelector` con creación inline, nunca un `<select>`
   con miles de opciones sin filtrar (`docs/product/08_USER_FLOWS.md §3`,
   [docs/frontend/UI_GUIDELINES.md §10](../frontend/UI_GUIDELINES.md#10-patrones-transversales-de-docsproduct08_user_flowsmd)).
6. Doble acción de guardado si el documento tiene estado `draft` (la mayoría, ver
   `docs/product/04_BUSINESS_WORKFLOWS.md`): "Guardar como borrador" vs. "Guardar
   y confirmar" — nunca un solo botón "Guardar" ambiguo (`docs/product/09_WIREFRAMES.md §5`).
7. Botones deshabilitados + spinner mientras se guarda — previene doble submit
   (`docs/product/09_WIREFRAMES.md §5`).
8. Si el formulario captura datos de un documento con workflow de estados: verificar
   que la barra de acciones solo muestra transiciones válidas desde el estado actual
   (arquetipo Detalle de documento, `docs/product/09_WIREFRAMES.md §6`).
9. Atajos de teclado de edición de tabla (`Tab`/`Shift+Tab`/`Ctrl+↵`/`Alt+Delete`) se
   heredan automáticamente del componente de `ui-kit/` — no se reimplementan por
   formulario (`docs/product/10_KEYBOARD_SHORTCUTS.md §5`).

## 6. Checklist de salida (todo componente/tabla/formulario nuevo)

- [ ] ¿Podría vivir en `ui-kit/` en vez de duplicarse en 2+ módulos? (§1)
- [ ] Ambos temas (claro/oscuro) verificados.
- [ ] Accesibilidad: navegable por teclado, rol ARIA correcto.
- [ ] Responsive verificado en al menos `md` y `lg`.
- [ ] Si es tabla: paginación/filtros/estados de §4 cubiertos.
- [ ] Si es formulario: schema Zod compartido con backend, no paralelo (§5, paso 1).
- [ ] Test escrito en el mismo cambio.

## 7. Trazabilidad

| Procedimiento pedido en el EPIC | Cerrado en |
| ------------------------------- | ---------- |
| Cómo crear un componente        | §2, §3     |
| Cómo crear una tabla            | §4         |
| Cómo crear un formulario        | §5         |
