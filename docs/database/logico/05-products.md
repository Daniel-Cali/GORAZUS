# Modelo Lógico — Products (`products`)

Decisiones de consolidación explícitas (para no fragmentar el mismo
concepto en tablas paralelas):

- **Color / Talla / Material** no son tablas propias — son valores
  predefinidos (`product_attribute_values`) de atributos del sistema
  (`product_attributes`) sembrados en `22_seed_data.sql`. Un color es
  "un atributo llamado Color con sus valores", no una entidad especial.
- **Servicio / Producto compuesto** no son tablas propias — son valores
  de `products.product_type` (`good`, `service`, `kit`, `combo`,
  `composite`). El comportamiento distinto (¿tiene stock?, ¿tiene BOM?)
  lo determina el tipo, no una tabla separada.
- **Categoría / Subcategoría** es una sola tabla auto-referenciada
  (`parent_category_id`), no dos niveles fijos — permite N niveles de
  profundidad sin rediseño.
- Documentos de producto usan `core.documents` (polimórfico), no una
  tabla propia.

## Maestro de productos

| Tabla                           | Propósito                                                                                   | FKs no-universales                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `products`                      | Producto/servicio: SKU, `product_type`, categoría, marca, unidad base, ¿rastrea serie/lote? | `category_id → product_categories`, `brand_id → brands`, `base_unit_id → units_of_measure` |
| `product_translations`          | Nombre/descripción por idioma                                                               | `product_id → products`, `language_code`                                                   |
| `product_categories`            | Categoría jerárquica (auto-referenciada)                                                    | `parent_category_id → product_categories`                                                  |
| `product_category_translations` | Nombre de categoría por idioma                                                              | `category_id → product_categories`, `language_code`                                        |
| `brands`                        | Marca comercial                                                                             | `company_id`                                                                               |
| `brand_translations`            | Nombre/descripción de marca por idioma                                                      | `brand_id → brands`, `language_code`                                                       |
| `product_models`                | Modelo dentro de una marca                                                                  | `brand_id → brands`                                                                        |
| `product_lines`                 | Línea de producto                                                                           | `company_id`                                                                               |
| `product_families`              | Familia de producto                                                                         | `company_id`                                                                               |
| `product_collections`           | Colección (temporada, campaña)                                                              | `company_id`                                                                               |

## Variantes y atributos

| Tabla                                  | Propósito                                               | FKs no-universales                                                               |
| -------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `product_attributes`                   | Atributo definible (Color, Talla, Material, Voltaje...) | `company_id`                                                                     |
| `product_attribute_translations`       | Nombre de atributo por idioma                           | `attribute_id → product_attributes`, `language_code`                             |
| `product_attribute_values`             | Valor posible de un atributo (Rojo, XL, Algodón...)     | `attribute_id → product_attributes`                                              |
| `product_attribute_value_translations` | Valor traducido                                         | `attribute_value_id → product_attribute_values`, `language_code`                 |
| `product_variant_attribute_values`     | Qué valores de atributo definen una variante (N:M)      | `variant_product_id → products`, `attribute_value_id → product_attribute_values` |

**Nota de corrección (2026-07-13):** no existe una tabla
`product_variants` separada — una variante **es** una fila de
`products.products` con `parent_product_id` seteado (auto-referencia),
igual patrón que `product_categories`. Esta tabla se listaba antes por
error como si fuera física y distinta; se corrige acá para que
coincida con [sql/05_products.sql](../sql/05_products.sql), la fuente
de verdad real.

## Unidades de medida

| Tabla                          | Propósito                                                | FKs no-universales                                                                          |
| ------------------------------ | -------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `units_of_measure`             | Unidad (unidad, caja, kg, litro)                         | `company_id`                                                                                |
| `unit_of_measure_translations` | Nombre/abreviatura por idioma                            | `unit_id → units_of_measure`, `language_code`                                               |
| `unit_conversions`             | Factor de conversión entre dos unidades para un producto | `product_id → products`, `from_unit_id → units_of_measure`, `to_unit_id → units_of_measure` |
| `product_presentations`        | Presentación de venta/compra (caja de 12, pallet de 100) | `product_id → products`, `unit_id → units_of_measure`                                       |

## Medios

| Tabla            | Propósito                                             | FKs no-universales                              |
| ---------------- | ----------------------------------------------------- | ----------------------------------------------- |
| `product_images` | Imagen del producto/variante, con orden de despliegue | `product_id → products`, `file_id → core.files` |
| `product_videos` | Video del producto                                    | `product_id → products`, `file_id → core.files` |

## Composición: kits, combos, BOM, recetas

| Tabla                      | Propósito                                                                                | FKs no-universales                                              |
| -------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `product_kits`             | Configuración de un producto tipo `kit` (política de precio: suma de componentes o fijo) | `product_id → products` (1:1)                                   |
| `product_kit_components`   | Componentes de un kit                                                                    | `kit_id → product_kits`, `component_product_id → products`      |
| `product_combos`           | Configuración de un producto tipo `combo` (descuento por combo)                          | `product_id → products` (1:1)                                   |
| `product_combo_components` | Componentes de un combo                                                                  | `combo_id → product_combos`, `component_product_id → products`  |
| `bill_of_materials`        | Lista de materiales para manufactura (consumida por `inventory.production_orders`)       | `product_id → products`                                         |
| `bom_components`           | Componente/insumo de un BOM con cantidad requerida                                       | `bom_id → bill_of_materials`, `component_product_id → products` |
| `recipes`                  | Receta con rendimiento/porciones (variante de BOM para industria alimenticia/servicios)  | `product_id → products`                                         |
| `recipe_ingredients`       | Ingrediente de una receta                                                                | `recipe_id → recipes`, `ingredient_product_id → products`       |

## Abastecimiento y fiscalidad del producto

| Tabla                   | Propósito                                                                                  | FKs no-universales                                           |
| ----------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| `product_suppliers`     | Proveedores habilitados para este producto (multiProveedor), con su SKU, costo y lead time | `product_id → products`, `supplier_id → suppliers.suppliers` |
| `product_barcodes`      | Código de barras/SKU alterno (GTIN, código interno, código del proveedor)                  | `product_id → products`                                      |
| `product_tax_profiles`  | Impuestos aplicables por defecto a este producto                                           | `product_id → products`, `tax_id → taxes.taxes`              |
| `product_price_history` | Historial de cambios de precio de venta/costo estándar                                     | `product_id → products`                                      |

## Interacción del cliente con el catálogo

| Tabla                      | Propósito                                                                               | FKs no-universales                                                       |
| -------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `product_reviews`          | Reseña/calificación de un cliente sobre un producto (canal e-commerce/POS con encuesta) | `product_id → products`, `customer_id → customers.customers` (ID suelto) |
| `product_related_products` | Producto relacionado/sustituto/complementario (venta cruzada, auto-referenciada N:M)    | `product_id → products`, `related_product_id → products`                 |

**Total: 36 tablas.**
