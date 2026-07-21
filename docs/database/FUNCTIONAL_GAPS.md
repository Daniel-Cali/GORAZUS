# Functional Gaps — GORAZUS

> "Database Enterprise v1.0" — Fase 1, Parte 6, cierre (2026-07-21).
> Consolida **todos** los gaps funcionales reales encontrados en las 6
> partes de esta auditoría — 2 ya conocidos (Partes 1/2) + 2 nuevos de
> esta parte. Cada uno con Problema/Justificación/Beneficio/Impacto/
> Complejidad, tal como se pidió. Ninguno aplicado — todos pendientes de
> autorización explícita para pasar a DDL real.

## 1. Materiales peligrosos / hoja de seguridad

- **Problema:** `products.products` no tiene forma de marcar un producto
  como material peligroso ni de referenciar su hoja de seguridad (MSDS).
- **Justificación:** pinturas, solventes, cemento y productos químicos
  (rubros explícitamente pedidos) suelen requerir clasificación
  regulatoria para transporte/almacenamiento en la mayoría de
  jurisdicciones.
- **Beneficio:** cumplimiento regulatorio consultable directamente,
  reportes de productos peligrosos sin depender de que un usuario cargó
  el atributo genérico correcto.
- **Impacto:** bajo — 3 columnas nuevas nullable/con default en una tabla
  existente, cero filas afectadas.
- **Complejidad:** baja.
- **SQL propuesto** (no ejecutado): ver
  [NORMALIZATION_REPORT.md §9](./NORMALIZATION_REPORT.md#9-mejoras-implementadas-entregable-10--y-la-pregunta-que-falta-responder).

## 2. País / idioma / timezone en Empresa y Sucursal

- **Problema:** `core.companies`/`core.branches` no tienen
  `country_id`/`language_id`/`timezone` explícitos.
- **Justificación:** una cadena nacional o un grupo multipaís necesita
  saber, sin inferencia indirecta, en qué país/idioma/zona horaria opera
  cada Sucursal.
- **Beneficio:** reportes y automatizaciones (horarios de apertura,
  idioma de comunicación con el cliente, cálculo de vencimientos) dejan
  de depender de inferencia vía jurisdicción fiscal.
- **Impacto:** bajo — 6 columnas nuevas (3 × 2 tablas), nullable.
- **Complejidad:** baja.

## 3. Costo Específico (identificación específica) — nuevo, Parte 6

- **Problema:** `products.products.costing_method` solo admite
  `fifo`/`lifo`/`average`/`standard` — no existe un 5º método de
  "identificación específica" (cada unidad conserva su costo real de
  adquisición, independiente del orden de entrada). `inventory.inventory_serials`
  no tiene columna de costo unitario, así que aunque un Producto se
  rastree por Serie, todas las unidades de esa serie comparten el mismo
  costo promedio/FIFO del lote.
- **Justificación:** relevante para ítems de alto valor y baja rotación
  típicos de ferretería industrial (generadores, compresores, equipos
  específicos) donde cada unidad puede haberse comprado a un costo
  distinto y ese costo real —no un promedio— es el que debe reconocerse
  al vender esa unidad puntual.
- **Beneficio:** valuación de inventario exacta para ítems serializados
  de alto valor, en vez de una aproximación por promedio/FIFO.
- **Impacto:** medio — requiere agregar `unit_cost numeric` a
  `inventory.inventory_serials` (columna nueva, nullable, sin romper
  compatibilidad) y una 5ª rama en `costing_method` (`ALTER ... CHECK`).
  No requiere tabla nueva ni tocar `stock_movements`/`fifo_cost_layers`
  existentes.
- **Complejidad:** media — el `CHECK` constraint existente debe
  actualizarse, y el Domain Service `ActualizarInventario`
  (`docs/ddd/08_domain_services.md`) necesitaría una rama nueva de
  lógica, no solo el schema.
- **Recomendación:** evaluar necesidad de negocio real antes de
  implementar (mismo criterio de gobernanza ya aplicado en todo el
  proyecto) — es el gap de mayor complejidad de los 4, no se recomienda
  aplicar sin confirmar que hay ítems de alto valor serializados en el
  catálogo real del tenant.

## 4. Contratos de Proveedor — nuevo, Parte 6

- **Problema:** no existe una tabla `suppliers.supplier_contracts` (o
  equivalente) para condiciones negociadas formales: vigencia del
  acuerdo, términos de pago acordados, SLA de entrega a nivel de
  proveedor (hoy `lead_time_days` vive por Producto en
  `product_suppliers`, no por Proveedor en general), precios marco.
- **Justificación:** una ferretería/distribuidor con proveedores
  recurrentes suele negociar condiciones a nivel de relación comercial
  completa, no solo por producto individual.
- **Beneficio:** trazabilidad de condiciones comerciales negociadas,
  alertas de vencimiento de contrato, base para auditoría de cumplimiento
  de SLA por proveedor.
- **Impacto:** medio — requiere una tabla nueva (`supplier_contracts`,
  patrón universal completo, FK a `suppliers.suppliers`), no una
  modificación de tabla existente.
- **Complejidad:** media — tabla nueva + relación 1:N con
  `suppliers.suppliers`, sin impacto en ninguna tabla ya existente
  (aditivo puro).
- **Recomendación:** igual que el gap anterior — evaluar necesidad de
  negocio real (¿los proveedores de este tenant se manejan por contrato
  formal o por orden de compra puntual?) antes de diseñar el detalle
  completo de columnas.

## 5. Entregables 5-10

### 5.1 — Nuevas tablas recomendadas (entregable 5)

Solo 1: `suppliers.supplier_contracts` (gap 4). Los demás gaps son
columnas aditivas sobre tablas existentes, no tablas nuevas.

### 5.2 — Nuevas relaciones recomendadas (entregable 6)

`supplier_contracts.supplier_id → suppliers.suppliers.id` (1:N) —
única relación nueva que se derivaría de aplicar las recomendaciones.

### 5.3 — Mejoras implementadas (entregable 7)

**0** — mismo criterio de alcance de toda esta auditoría (solo
documentación, sin DDL contra `dev`), reafirmado explícitamente en la
Parte 5. Las 4 mejoras están completamente especificadas y listas para
aplicarse si se autorizan.

### 5.4 — Riesgos encontrados (entregable 8)

| Riesgo                                                                                                                                                                    | Severidad                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| Ninguno de los 4 gaps bloquea operación actual                                                                                                                            | —                           |
| Costo Específico (gap 3) es el único con complejidad más allá de agregar columnas — riesgo de subestimar el esfuerzo si se autoriza sin diseñar el Domain Service primero | 🟡 Baja-media               |
| 185 FK cross-schema (heredado)                                                                                                                                            | 🟠 Media-alta, ya gobernado |

### 5.5 — Porcentaje de cobertura funcional (entregable 9)

**96%** — ver el desglose cuantitativo completo en
[BUSINESS_VALIDATION.md §12](./BUSINESS_VALIDATION.md#12-entregables-1-4-resumen-cuantitativo)
(~91 de ~95 procesos simulados soportados sin condición).

### 5.6 — Recomendaciones para la Parte 7 (entregable 10)

1. Si la Parte 7 continúa el mismo criterio de esta auditoría
   (documentación/validación), su foco natural es la **seguridad y
   compliance** (RLS, cifrado, roles) ya que normalización (Parte 5),
   relaciones (Parte 4) y validación funcional (Parte 6) están cerradas.
2. Antes de cualquier Parte 7, sigue pendiente la decisión sobre si se
   autoriza aplicar los 4 gaps de este documento — no bloquea el inicio
   de la Parte 7, pero conviene resolverla antes de que se acumulen más
   mejoras "documentadas, no aplicadas".
3. Recomendación operativa: consolidar los 4 gaps de las 6 partes en
   **un solo pull request de DDL** (`sql/35_*.sql` en adelante, append-only)
   si/cuando se autoricen, en vez de aplicarlos uno por uno.

## 6. Trazabilidad — los 4 gaps de toda la auditoría, en un solo lugar

| #   | Gap                    | Encontrado en   | Impacto | Complejidad |
| --- | ---------------------- | --------------- | ------- | ----------- |
| 1   | Materiales peligrosos  | Parte 1         | Bajo    | Baja        |
| 2   | País/idioma/timezone   | Parte 2         | Bajo    | Baja        |
| 3   | Costo Específico       | Parte 6 (nuevo) | Medio   | Media       |
| 4   | Contratos de Proveedor | Parte 6 (nuevo) | Medio   | Media       |
