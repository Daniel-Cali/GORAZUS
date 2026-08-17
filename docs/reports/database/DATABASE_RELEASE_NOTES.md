# Notas de Versión — Base de Datos GORAZUS — Database Finalization

## Novedades

- **Materiales peligrosos**: `products.products` ahora puede marcarse como material peligroso
  (`is_hazardous_material`, `hazmat_classification`) y referenciar su hoja de seguridad
  (`safety_data_sheet_file_id`) — relevante para pinturas, solventes, cemento y productos
  químicos.
- **País / idioma / zona horaria por Empresa y Sucursal**: `core.companies` y `core.branches`
  ahora referencian explícitamente `configuration.countries`/`languages`/`timezones` — ya no hace
  falta inferirlo de la jurisdicción fiscal.
- **Costo Específico (identificación específica)**: `products.costing_method` admite un 5º método
  además de FIFO/LIFO/promedio/estándar; `inventory.inventory_serials` puede guardar el costo real
  de cada unidad serializada. Pensado para ítems de alto valor/baja rotación (generadores,
  compresores, equipos industriales).
- **Contratos de Proveedor**: tabla nueva `suppliers.supplier_contracts` — vigencia, plazo de pago
  acordado, SLA de entrega y precios marco a nivel de relación comercial completa con el
  proveedor, no solo por producto.
- **Código QR y RFID**: `products.product_barcodes` ahora acepta estos dos tipos además de
  GTIN/interno/proveedor.
- **Atributos físicos del producto**: tabla nueva `products.product_physical_attributes` — peso,
  dimensiones (largo/ancho/alto), volumen, y si el producto exige fecha de fabricación. Solo
  aplica a productos físicos, no a servicios.
- **Ciclo de vida del producto**: `products.products.lifecycle_status` distingue productos
  activos, descontinuados y obsoletos — a nivel de catálogo, consistente en todas las
  sucursales/almacenes.

## Alcance

Migración puramente aditiva — **0 tablas eliminadas, 0 columnas eliminadas, 0 cambios de tipo, 0
datos perdidos**. Compatible con todo el código de aplicación existente sin cambios (verificado
contra los módulos `productos` y `configuracion`, los únicos con backend real que tocan las
tablas modificadas).

## Qué NO incluye esta versión

- Lógica de negocio para decidir cuándo usar Costo Específico (Domain Service pendiente).
- Consumo de `supplier_contracts` desde un backend de proveedores (el módulo no existe todavía).
- RLS de Empresa/Sucursal, resolución de FK cross-schema — decisiones de arquitectura/producto
  pendientes, no parte de esta migración.

## Cómo aplicar (para otros entornos)

```bash
docker exec -i <contenedor-postgres> psql -U gorazus_superuser -d gorazus \
  -v ON_ERROR_STOP=1 < docs/database/sql/35_functional_completion.sql
```

Seguido de `pnpm db:pull && pnpm db:split && pnpm db:generate` (`core/database/`) para
regenerar el schema y los 21 clientes Prisma por módulo.

## Compatibilidad

- PostgreSQL 17.10 — sin cambios de versión requeridos.
- Prisma 5.22.0 — sin cambios de versión requeridos.
- Ningún endpoint de API cambia de contrato — las tablas/columnas nuevas no tienen consumidor de
  API todavía (por diseño, ver `DATABASE_COMPLETION_REPORT.md §3`).
