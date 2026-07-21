# dashboard

**Propósito:** vista consolidada de la operación (persona 3.6,
`docs/product/05_INFORMATION_ARCHITECTURE.md §3`). Tipo de módulo:
"Composición (sin datos propios)" — agrega datos de otros módulos, nunca
los posee.

**Dueño de datos:** ninguno.

**Estado:** placeholder (`modules/dashboard/frontend/pages/dashboard.page.tsx`)
hasta que los módulos fuente reales (Ventas, Caja, Inventario, ...) tengan
`backend/` implementado y expongan lo que este dashboard va a componer.

**Dependencias declaradas:** ninguna todavía — cuando se implemente la
composición real, cada módulo fuente consultado se declara acá.
