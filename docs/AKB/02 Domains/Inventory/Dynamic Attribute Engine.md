---
id: concept-dynamic-attribute-engine
title: Dynamic Attribute Engine
version: 1.0.0
status: proposed
owner: ERP Domain Expert
domain: inventory
subdomain: product-catalog
created: 2026-07-28
updated: 2026-07-28
tags: [concept, product, eav, extensibility, pattern]
related:
  - '[[Product]]'
  - '[[ADR-INV-001]]'
  - '[[Domain Design Heuristics]]'
---

# Purpose

Diseño de la capa de gobierno sobre el modelo EAV real de Productos (`ADR-INV-001 §8`) — responde
cómo distintas industrias definen sus propios atributos sin migración de schema. Patrón reutilizable
más allá de Productos (candidato natural: campos personalizados de CRM, especificaciones de HR).

# Domain Model

- **Estado real hoy**: `product_attributes` (solo `code`) + `product_attribute_values` (solo
  `attribute_id`+`code`) + traducciones — EAV mínimo, ya resuelve la generación de variantes vía
  `product_variant_attribute_values` (`18-modulo-products.md §9`), sin tipo de dato, validación,
  agrupación ni plantillas.
- **Atributos estáticos** — columnas de primera clase de `products` (`sku`, `product_type`,
  `base_unit_id`...), universales a todo producto, requieren migración para cambiar.
- **Atributos dinámicos** — filas de `product_attributes`, específicos de industria/categoría/empresa,
  sin ninguna migración de schema (`18-modulo-products.md §9`: "una empresa puede definir atributos
  propios sin tocar schema").

# Design Decisions

Capa de gobierno propuesta, extensión no reemplazo del EAV real:

1. **Tipo de dato del valor** (texto/número/booleano/fecha/selección) — hoy ausente, sin él no hay
   validación ni ordenamiento numérico correcto posible.
2. **Regla de validación** (rango, regex, longitud) — vive junto a la definición del atributo.
3. **Obligatoriedad contextual por categoría** — un atributo es obligatorio para una categoría,
   irrelevante para otra; no es propiedad global del atributo.
4. **Bandera "genera variante"** — distingue el caso ya real (Color/Talla → nuevo SKU) del caso nuevo
   (Voltaje/Certificación → solo especificación descriptiva), conflados hoy en el mismo mecanismo.
5. **Plantillas de atributos** (`product_attribute_templates`, propuesta) — conjunto nombrado de
   atributos asociado N:M a una categoría — el mecanismo real que responde "cómo una industria nueva
   se auto-atiende": crear filas de `product_attributes`, agruparlas en una plantilla asociada a su
   categoría, sin que ningún otro producto del sistema se vea afectado.

# Related ADRs

[[ADR-INV-001]] §8

# References

[ADR-INV-001 §8 (documento real)](../../../adr/ADR-INV-001-arquitectura-del-catalogo-de-productos.md) ·
`docs/architecture/18-modulo-products.md §9`
