# 00 — Convenciones de la especificación de navegación

> Este set de documentos (`docs/menus/`) especifica **toda la
> navegación** del ERP: los 25 menús principales, sus submenús,
> formularios, acciones, reportes, consultas y configuraciones. Es una
> especificación funcional — no contiene código, ni modelos de base de
> datos, ni contratos de API. Se apoya en las decisiones ya fijadas en
> [docs/architecture/](../architecture/README.md) (módulo, dueño de
> datos, esquema por módulo, permisos `<modulo>.<accion>`) y las
> extiende al nivel de pantalla.

## 1. Jerarquía y qué significa cada nivel

```
Menú (módulo de negocio, ej. Ventas)
 └─ Submenú (área funcional dentro del módulo, ej. "Documentos de venta")
     ├─ Formulario   → captura/edita datos (crea o modifica un registro)
     ├─ Acción        → operación sobre un registro existente, sin form propio
     │                   (confirmar, anular, aprobar, imprimir, enviar)
     ├─ Reporte        → salida formal/imprimible, pensada para archivo o auditoría
     ├─ Consulta       → búsqueda/inspección interactiva en pantalla, sin salida formal
     └─ Configuración  → parámetros que cambian el comportamiento del submenú/módulo
```

**Reporte vs. Consulta** — la distinción que se usa en todo el documento:
un _Reporte_ tiene layout fijo, se imprime/exporta y suele ser insumo
para terceros (auditoría, banco, entidad fiscal). Una _Consulta_ es para
uso interno inmediato: filtrar, ordenar, ver el estado de algo, sin
pretensión de formato final. Ejemplo: "Estado de Cuenta del Cliente" es
un _Reporte_ (se envía al cliente); "Buscar Facturas Pendientes de
Cobro" es una _Consulta_ (uso interno del cajero).

## 2. Convención de íconos

Se usa la librería **lucide-react** (la que ya trae Shadcn UI por
defecto, ver [docs/architecture](../architecture/03-arquitectura-modulos-frontend.md)),
referenciando el nombre del ícono en `kebab-case` tal como lo expone
lucide (`layout-dashboard`, `shopping-cart`). Así el ícono sugerido acá
es directamente el nombre de componente que el equipo de frontend
importa, sin traducción intermedia.

## 3. Convención de permisos

Se reutiliza la convención fijada en
[09-seguridad-y-multiempresa.md](../architecture/09-seguridad-y-multiempresa.md#2-autorización-seguridad):
`<modulo>.<accion>`, en minúsculas, con guión bajo para acciones
compuestas. Acciones estándar que se repiten en casi todo módulo:

| Sufijo        | Significa                                                           |
| ------------- | ------------------------------------------------------------------- |
| `.ver`        | Puede listar/consultar el submenú                                   |
| `.crear`      | Puede dar de alta un registro nuevo                                 |
| `.editar`     | Puede modificar un registro existente no confirmado                 |
| `.confirmar`  | Puede pasar un documento de borrador a estado definitivo            |
| `.anular`     | Puede anular/revertir un documento ya confirmado                    |
| `.aprobar`    | Puede aprobar algo que otro usuario generó (flujo de doble control) |
| `.exportar`   | Puede exportar reportes/consultas a archivo                         |
| `.configurar` | Puede modificar parámetros del submenú/módulo                       |

Cada opción documentada abajo indica su permiso específico; cuando el
permiso es simplemente `<modulo>.ver` para toda una consulta o reporte
de solo lectura, se indica una sola vez a nivel de submenú en vez de
repetirlo fila por fila.

## 4. Convención de tablas

Los nombres de tabla referidos son **nombres lógicos de dominio**, no un
modelo físico (eso corresponde a Prisma/migraciones, fuera del alcance
de este documento). Siguen el patrón `<schema_modulo>.<entidad>`, donde
`schema_modulo` es el nombre del schema de Postgres del módulo dueño
(ver [02-arquitectura-modulos-backend.md](../architecture/02-arquitectura-modulos-backend.md#4-base-de-datos-prisma-con-schema-por-módulo)).
Una tabla listada con un prefijo de otro módulo (`clientes.cliente`
citada desde `ventas`) significa que esa pantalla la **consulta** vía la
fachada pública de ese módulo — nunca la escribe directamente (ver
[06-comunicacion-entre-modulos.md](../architecture/06-comunicacion-entre-modulos.md)).

## 5. Glosario de documentos generados

Tipos de documento que se repiten a lo largo del catálogo, con su
naturaleza (interno vs. fiscal/legal):

| Documento                    | Naturaleza                                      |
| ---------------------------- | ----------------------------------------------- |
| Cotización / Presupuesto     | Interno, sin efecto contable                    |
| Pedido / Orden de Venta      | Interno, compromete stock                       |
| Orden de Compra              | Interno, compromete presupuesto                 |
| Remito / Nota de Entrega     | Interno, mueve stock físico                     |
| Factura de Venta             | Fiscal — puede requerir Facturación Electrónica |
| Factura de Compra            | Fiscal, ingresa como CxP                        |
| Nota de Crédito / Débito     | Fiscal, ajusta una factura previa               |
| Recibo de Caja / Cobro       | Interno con valor probatorio                    |
| Comprobante de Egreso / Pago | Interno con valor probatorio                    |
| Asiento Contable             | Fiscal/legal, libro oficial                     |
| Comprobante de Retención     | Fiscal, según régimen local                     |

## 6. Relación con `docs/architecture/`

Los 25 menús de este documento **no son 1 a 1 con los 14 módulos** del
[catálogo de módulos de negocio](../architecture/04-catalogo-modulos-negocio.md)
original. Esta especificación amplía el catálogo con dominios de negocio
adicionales pedidos explícitamente para esta versión del ERP (Producción,
Servicios, RRHH, Nómina, Activos Fijos, Proyectos, Documentos, BI,
Administración, Tesorería, Dashboard). Cada uno de ellos sigue exactamente
el mismo patrón arquitectónico ya fijado (módulo con `backend/`,
`frontend/`, `shared/`, schema propio, comunicación por fachada pública +
eventos) — ver la actualización correspondiente en
[04-catalogo-modulos-negocio.md](../architecture/04-catalogo-modulos-negocio.md).
`auth` no aparece como menú porque no es una pantalla de navegación (es
la puerta de entrada — login); su contraparte visible en el menú es
`Seguridad`.

## 7. Índice de los 25 menús

| #   | Menú                                         | Ícono              | Tipo de módulo                           |
| --- | -------------------------------------------- | ------------------ | ---------------------------------------- |
| 01  | [Dashboard](./01-dashboard.md)               | `layout-dashboard` | Composición (sin datos propios)          |
| 02  | [Ventas](./02-ventas.md)                     | `shopping-cart`    | Dueño de datos                           |
| 03  | [Compras](./03-compras.md)                   | `truck`            | Dueño de datos                           |
| 04  | [Inventario](./04-inventario.md)             | `boxes`            | Dueño de datos                           |
| 05  | [Clientes](./05-clientes.md)                 | `users`            | Dueño de datos                           |
| 06  | [Proveedores](./06-proveedores.md)           | `factory`          | Dueño de datos                           |
| 07  | [Caja](./07-caja.md)                         | `wallet`           | Dueño de datos                           |
| 08  | [Bancos](./08-bancos.md)                     | `landmark`         | Dueño de datos                           |
| 09  | [Contabilidad](./09-contabilidad.md)         | `book-text`        | Dueño de datos                           |
| 10  | [Tesorería](./10-tesoreria.md)               | `banknote`         | Consolidación (Caja+Bancos+CxC+CxP)      |
| 11  | [CRM](./11-crm.md)                           | `handshake`        | Dueño de datos                           |
| 12  | [POS](./12-pos.md)                           | `store`            | Composición (usa Ventas+Inventario+Caja) |
| 13  | [Producción](./13-produccion.md)             | `cog`              | Dueño de datos                           |
| 14  | [Servicios](./14-servicios.md)               | `wrench`           | Dueño de datos                           |
| 15  | [Recursos Humanos](./15-recursos-humanos.md) | `contact`          | Dueño de datos                           |
| 16  | [Nómina](./16-nomina.md)                     | `receipt`          | Dueño de datos                           |
| 17  | [Activos Fijos](./17-activos-fijos.md)       | `building-2`       | Dueño de datos                           |
| 18  | [Proyectos](./18-proyectos.md)               | `kanban-square`    | Dueño de datos                           |
| 19  | [Documentos](./19-documentos.md)             | `folder-archive`   | Dueño de datos (transversal)             |
| 20  | [Reportes](./20-reportes.md)                 | `file-bar-chart`   | Consumidor de solo lectura               |
| 21  | [BI](./21-bi.md)                             | `line-chart`       | Consumidor de solo lectura               |
| 22  | [Configuración](./22-configuracion.md)       | `settings`         | Dueño de datos                           |
| 23  | [Seguridad](./23-seguridad.md)               | `shield`           | Dueño de datos                           |
| 24  | [Administración](./24-administracion.md)     | `server-cog`       | Infraestructura/sistema                  |
| 25  | [Ayuda](./25-ayuda.md)                       | `circle-help`      | Estático/soporte                         |
