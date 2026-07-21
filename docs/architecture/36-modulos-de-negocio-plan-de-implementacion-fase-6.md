# 36 — Módulos de negocio: Plan de implementación (Fase 6)

> Plan técnico de construcción — versión 1.0, 2026-07-13. Mismo
> criterio que las Fases 2-5, con una diferencia real de escala: acá
> "construir" no es secuenciar componentes de infraestructura ya
> diseñados — son 20 módulos de negocio, cada uno del tamaño de un
> documento como
> [20-modulo-sales.md](./20-modulo-sales.md) (miles de líneas,
> múltiples flujos, gaps propios). Este documento mapea, ordena por
> dependencia real, y **señala explícitamente** los 4 puntos que no se
> pueden secuenciar todavía porque no tienen documento de arquitectura
> — diseñarlos no es del tamaño de este plan, es del tamaño de 4
> documentos nuevos como los ya existentes.

## 1. Mapeo: los 20 módulos pedidos → estado real

| #   | Pedido (orden dado) | Estado                                | Documento / aclaración                                                                                                                                                                                                                                 |
| --- | ------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Customers           | ✅ Completo                           | [16-modulo-customers.md](./16-modulo-customers.md)                                                                                                                                                                                                     |
| 2   | Suppliers           | ✅ Completo                           | [17-modulo-suppliers.md](./17-modulo-suppliers.md)                                                                                                                                                                                                     |
| 3   | Products            | ✅ Completo                           | [18-modulo-products.md](./18-modulo-products.md)                                                                                                                                                                                                       |
| 4   | Inventory           | ✅ Completo                           | [19-modulo-inventory.md](./19-modulo-inventory.md)                                                                                                                                                                                                     |
| 5   | Sales               | ✅ Completo                           | [20-modulo-sales.md](./20-modulo-sales.md)                                                                                                                                                                                                             |
| 6   | POS                 | 🟡 Parcial                            | Cubierto como canal dentro de [20-modulo-sales.md §4](./20-modulo-sales.md#4-facturas-pos--no-es-tabla-propia-confirmado-en-el-schema-real) — falta UI de mostrador, hardware (impresora fiscal, lector de código de barras), tolerancia a desconexión |
| 7   | Purchases           | ✅ Completo                           | [21-modulo-purchases.md](./21-modulo-purchases.md)                                                                                                                                                                                                     |
| 8   | Cash                | ✅ Completo                           | [23-modulo-cash.md](./23-modulo-cash.md)                                                                                                                                                                                                               |
| 9   | Banks               | ✅ Completo                           | [24-modulo-banking.md](./24-modulo-banking.md)                                                                                                                                                                                                         |
| 10  | Accounting          | ✅ Completo                           | [22-modulo-accounting.md](./22-modulo-accounting.md)                                                                                                                                                                                                   |
| 11  | Finance             | ⚪ No es un módulo pendiente — ver §2 | Mapea a `tesoreria`: vista de consolidación sin schema propio                                                                                                                                                                                          |
| 12  | CRM                 | ✅ Completo                           | [27-modulo-crm.md](./27-modulo-crm.md)                                                                                                                                                                                                                 |
| 13  | Projects            | ❌ Pendiente — ver §3                 | Modelo de datos completo ([database/logico/17-projects.md](../database/logico/17-projects.md)), sin documento de arquitectura                                                                                                                          |
| 14  | HR                  | ✅ Completo                           | [25-modulo-hr.md](./25-modulo-hr.md)                                                                                                                                                                                                                   |
| 15  | Payroll             | ✅ Completo                           | [26-modulo-payroll.md](./26-modulo-payroll.md)                                                                                                                                                                                                         |
| 16  | Production          | ❌ Pendiente — ver §3                 | Modelo dividido entre `products` (BOM) e `inventory` (ejecución), sin documento propio                                                                                                                                                                 |
| 17  | Warehouse           | ⚪ No es un módulo separado — ver §2  | Ya cubierto íntegramente por Inventory (§4/19) — jerarquía almacén→zona→ubicación, picking/shipping                                                                                                                                                    |
| 18  | Logistics           | ⚪ No existe como módulo — ver §2     | Sin schema ni fase propia — distribuido a propósito entre Inventory (zonas), Purchases (fletes de importación), Customers/Suppliers (direcciones de envío)                                                                                             |
| 19  | Service             | ❌ Pendiente — ver §3                 | Modelo de datos completo ([database/logico/16-services.md](../database/logico/16-services.md)), sin documento de arquitectura                                                                                                                          |
| 20  | Assets              | ❌ Pendiente — ver §3                 | Modelo de datos completo ([database/logico/18-assets.md](../database/logico/18-assets.md)), sin documento de arquitectura                                                                                                                              |

**Resumen:** 12 de 20 ya completos, 1 parcial (POS), 3 no son gaps
reales sino aclaraciones de mapeo (Finance/Warehouse/Logistics), y 4
son módulos de negocio completos todavía sin diseñar (Projects,
Production, Service, Assets).

## 2. Tres aclaraciones (no son trabajo pendiente)

- **Finance → `tesoreria`:** no tiene schema propio ni falta uno —
  es una vista de consolidación (`accounting.v_treasury_position`)
  sobre Caja + Bancos + cuentas por cobrar de Clientes + cuentas por
  pagar de Proveedores, diseño ya justificado en
  [04-catalogo-modulos-negocio.md](./04-catalogo-modulos-negocio.md)
  ("por qué `tesoreria` y `caja`+`bancos` son módulos distintos"). No
  tiene fase propia en el roadmap porque no le corresponde una —
  construirlo es, en la práctica, construir la vista SQL una vez que
  Cash/Banks/Customers/Suppliers ya existen (§4, Hito H5).
- **Warehouse → ya es Inventory:** verifiqué el árbol completo de
  `modules/` en
  [01-estructura-monorepo.md](./01-estructura-monorepo.md) — no existe
  ni existió un módulo `almacen`/`warehouse` separado de `inventario`.
  La jerarquía Almacén→Zona→Ubicación, con flujo completo de
  recepción→putaway→almacenamiento→reposición→picking→despacho, ya
  está en [19-modulo-inventory.md](./19-modulo-inventory.md). Pedirlo
  como punto 17 de la lista no agrega alcance nuevo sobre el punto 4.
- **Logistics → no existe como dominio acotado, a propósito:** grep
  completo sobre toda la documentación — cero módulo, schema o fase
  de logística/distribución/flete como concepto propio. Lo que existe
  está deliberadamente distribuido: zonas de despacho dentro de
  `inventario`, gastos de flete de importación dentro de `compras`
  ([21-modulo-purchases.md §6](./21-modulo-purchases.md)), direcciones
  de envío dentro de `clientes`/`proveedores`. Si hay una necesidad de
  negocio real no cubierta por esa distribución (p. ej. gestión de
  flota propia, rutas de reparto con optimización, integración con
  transportistas 3PL), es una decisión de alcance nueva — mismo
  criterio de "no se diseña especulativamente" ya aplicado a
  LDAP/Active Directory en la Fase 3. Avisá si ese es el caso.

## 3. Los 4 módulos genuinamente pendientes — necesitan decisión de alcance, no se diseñan en este documento

Projects, Production, Service y Assets tienen su modelo de datos
completo (10-18 tablas cada uno) pero **cero documento de
arquitectura** — a diferencia de todo lo demás en este plan, donde el
trabajo es secuenciar algo ya escrito. Diseñar cada uno es del mismo
orden de magnitud que
[21-modulo-purchases.md](./21-modulo-purchases.md) o
[27-modulo-crm.md](./27-modulo-crm.md) — flujos completos, gaps reales
encontrados contra el schema, diagramas de secuencia, no un
párrafo de mapeo. No los diseño acá por la misma razón que no absorbí
Taxes en la Fase 4 ni Reportes en la Fase 5: mezclar diseño nuevo de
ese tamaño dentro de un plan de secuenciación produce un documento
desproporcionado y difícil de mantener.

El orden ya sugerido en
[00-roadmap-fases.md §"Orden sugerido para las 8 fases pendientes"](../00-roadmap-fases.md)
prioriza estos 4 según cuántas referencias cruzadas ya existen desde
módulos completos: **Activos Fijos** (ya referenciado desde
`purchases.is_capitalizable` y `hr.employee_asset_assignments`) y
**Producción** (ya parcialmente descrito en
`18-modulo-products.md §11.1`) son los más urgentes de cerrar;
**Servicios** y **Proyectos** están menos acoplados a lo ya construido
y pueden esperar.

## 4. Orden de construcción — los 16 puntos con diseño listo (12 completos + POS parcial + Finance)

Requiere primero
[Fase 2-5](./32-core-platform/13-plan-de-implementacion-fase-2.md)
(Core Platform, IAM, Configuration, Frameworks internos) — todo
módulo de negocio depende de `Repository Base`/`Security Context`
(multiempresa), `Sequence Generator`/`Document Numbering`
(comprobantes), `Event Bus` (comunicación entre módulos) y
`Workflow/Approval Engine` (aprobaciones) ya construidos.

### H1 — Datos maestros (paralelizable entre sí)

- **Customers, Suppliers, Products** — sin dependencia mutua real
  (los tres son "módulo dueño" de su propia entidad maestra, patrón ya
  fijado en
  [06-comunicacion-entre-modulos.md §4](./06-comunicacion-entre-modulos.md#4-patrón-módulo-dueño)).
- **Listo cuando:** los tres CRUD maestros pasan su propia pirámide de
  testing (`07-convenciones-y-estandares.md §5`) y publican sus
  eventos de dominio (`ClienteCreado`, `ProveedorCreado`,
  `ProductoCreado`) correctamente al Event Bus de la Fase 2.

### H2 — Inventory (depende de H1: Products)

- **Listo cuando:** el flujo completo de almacén (recepción→putaway→
  picking→despacho, ya diagramado en 19-modulo-inventory.md) corre de
  punta a punta contra Postgres real, y FIFO/Promedio calculan costo
  correctamente bajo movimientos concurrentes.

### H3 — Transaccional de venta y compra (depende de H1-H2, paralelizable entre sí)

- **Sales** (depende de Customers, Products, Inventory) — incluye
  **POS** como canal (ver nota de alcance abajo).
- **Purchases** (depende de Suppliers, Products, Inventory).
- **Nota sobre POS:** antes de considerar POS "listo" dentro de este
  hito hace falta cerrar el gap ya identificado (UI de mostrador,
  integración de hardware, tolerancia a desconexión) — es trabajo de
  diseño acotado (mucho menor que un módulo completo), pero es un
  gap real que este plan no cierra por sí solo.
- **Listo cuando:** una venta y una compra completas (cotización/
  solicitud → confirmación → documento fiscal) corren end-to-end, cada
  una disparando los eventos de dominio que Cash/Banks/Accounting
  (H4-H5) consumen.

### H4 — Financiero operativo (depende de H3)

- **Cash, Banks** — ambos consumen eventos de Sales/Purchases
  (cobros, pagos).
- **Listo cheque cuando:** un cobro en efectivo desde Sales abre/
  actualiza el turno de caja correcto, y una conciliación bancaria de
  prueba concilia contra movimientos generados por Purchases.

### H5 — Contabilidad y consolidación (depende de H4)

- **Accounting** — consume eventos de prácticamente todos los módulos
  anteriores vía `Business Rules Engine` (asientos automáticos, ya
  diseñado en la Fase 2).
- **Finance/Tesorería** — se cierra en este mismo hito, es la vista de
  consolidación sobre lo que H4-H5 ya construyeron, no una unidad de
  trabajo separable.
- **Listo cuando:** una venta confirmada genera su asiento contable
  automático correcto (partida doble balanceada), y
  `v_treasury_position` refleja el saldo consolidado real de
  caja+bancos+CxC+CxP.

### H6 — RRHH y Nómina (independiente de H1-H5, puede paralelizarse desde H1)

- **HR**, luego **Payroll** (depende de HR).
- **Listo cuando:** el motor de nómina calcula un período completo
  (salario, deducciones, ISR, AFP/ARS) para un empleado de prueba y
  genera el asiento contable correspondiente (enlace con Accounting,
  H5).

### H7 — CRM (depende de H1: Customers; acoplamiento débil con H3: Sales)

- **Listo cuando:** una oportunidad de CRM se convierte correctamente
  en una venta real (trazabilidad ya diseñada en
  27-modulo-crm.md), sin que CRM escriba directamente en tablas de
  `sales`.

### Sin hito todavía — Projects, Production, Service, Assets

Bloqueados en diseño (§3), no en disponibilidad de ingeniería. No se
les asigna hito de construcción hasta que exista su documento de
arquitectura.

## 5. Resumen visual

```
Fase 2-5 (Core Platform · IAM · Configuration · Frameworks)
 └─▶ H1 Customers · Suppliers · Products
      └─▶ H2 Inventory
           └─▶ H3 Sales (+POS, gap de UI/hardware pendiente) · Purchases
                └─▶ H4 Cash · Banks
                     └─▶ H5 Accounting + Finance/Tesorería (vista)
      └─▶ H6 HR → Payroll (paralelo desde H1)
      └─▶ H7 CRM (depende de H1, acoplamiento débil con H3)

Aclaraciones, no gaps: Finance=Tesorería (H5), Warehouse=Inventory (H2),
Logistics=no existe como módulo (§2).

Bloqueados en diseño, no en este plan: Projects · Production · Service ·
Assets (§3) — necesitan documento de arquitectura propio antes de
poder secuenciarse.
```
