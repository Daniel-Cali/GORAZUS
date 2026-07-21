# 32.02 — Multiempresa y alcance organizacional

> Componentes: Tenant Manager, Company Manager, Branch Manager, Multi
> Company, Multi Branch, Multi Warehouse.

## 1. Tenant Manager

**Trazabilidad:** 📎 Referencia — mecanismo completo ya diseñado:
`TenantInterceptor` / `TenantContext`
([09-seguridad-y-multiempresa.md §3](../09-seguridad-y-multiempresa.md#3-multiempresa-multi-tenant)),
`core.tenants` como raíz de la jerarquía
([database/01-modelo-conceptual.md §2](../../database/01-modelo-conceptual.md)).

- **Objetivo:** garantizar que ningún dato de un tenant sea visible ni
  escribible desde el contexto de otro. Ver diseño completo en la
  referencia.
- **Responsabilidad:** resolver el tenant activo desde el JWT en cada
  request y adjuntarlo al `Security Context`; el `Repository Base`
  ([09-base-transaccional-y-modelado-ddd.md §4](./09-base-transaccional-y-modelado-ddd.md#4-repository-base))
  lo consume para inyectar el filtro `WHERE tenant_id = :tenantId` de
  forma automática en toda consulta.
- **Dependencias:** `Security Context`, `core/database`.
- **Interfaces:** `TenantContext.current()` (propagado vía
  `AsyncLocalStorage`, no vía parámetro explícito, para que ningún
  desarrollador pueda "olvidar" pasarlo).
- **Eventos:** ninguno de dominio — el aislamiento es transversal e
  invisible cuando funciona correctamente.
- **Flujo interno:** ver `09-seguridad-y-multiempresa.md §3`.
- **Comunicación con otros componentes:** todo componente de este
  documento que persiste o consulta datos de negocio pasa por el
  `Repository Base`, que a su vez consulta al Tenant Manager — es la
  dependencia transversal más usada de todo el Core Platform.
- **Estrategias de seguridad:** el filtro de tenant se aplica a nivel
  de `Repository Base`, no opcionalmente en cada query manual — un
  desarrollador no puede "olvidarlo" porque no tiene forma de saltarlo
  sin usar explícitamente un repositorio marcado `@AllowCrossTenant()`
  (uso restringido a jobs de plataforma, auditado).
- **Estrategias de rendimiento:** `tenant_id` es la primera columna de
  todo índice compuesto en tablas de negocio (convención ya fijada en
  `database/01-modelo-conceptual.md §1.1`).
- **Estrategias de escalabilidad:** el modelo es de tenancy compartida
  (misma base de datos, aislamiento lógico) — ver el análisis de
  cuándo migrar a esquema-por-tenant o base-por-tenant en
  [10-evolucion-a-microservicios.md](../10-evolucion-a-microservicios.md).

## 2. Company Manager

**Trazabilidad:** 📎 Referencia — diseño completo en
[14-modulo-core.md §1](../14-modulo-core.md), incluyendo flujo de
onboarding y reglas de inmutabilidad.

- **Objetivo / Responsabilidad / Flujo interno:** ver diseño completo
  en la referencia — no se repite aquí.
- **Dependencias:** `Tenant Manager` (una company siempre pertenece a
  un tenant), `Sequence Generator` (numeración fiscal por company).
- **Interfaces:** `CompanyService` (CRUD + validaciones de negocio),
  consumido por el módulo `configuracion` y por el flujo de onboarding.
- **Eventos:** `company.created`, `company.updated` — consumidos por
  `Branch Manager` (una company nueva crea automáticamente su sucursal
  matriz, ver `14-modulo-core.md §2`) y por `Audit Framework`.
- **Comunicación con otros componentes:** todo dato de negocio con
  alcance fiscal (facturación, contabilidad) referencia `company_id`;
  el Core Platform no agrega reglas nuevas más allá de las ya
  documentadas.
- **Estrategias de seguridad:** cambios sobre campos fiscales
  inmutables (RNC/RUC, régimen) requieren re-autenticación
  (step-up, ver `13-modulo-auth.md`).
- **Estrategias de rendimiento / escalabilidad:** ver
  `14-modulo-core.md §1` — el volumen de companies por tenant es bajo
  (decenas, no miles), no es un componente sensible a escala.

## 3. Branch Manager

**Trazabilidad:** 📎 Referencia — diseño completo en
[14-modulo-core.md §2](../14-modulo-core.md), incluyendo el flujo de
cascada al crear una company.

- **Objetivo / Responsabilidad / Flujo interno:** ver diseño completo
  en la referencia.
- **Dependencias:** `Company Manager`, `Sequence Generator`
  (`branch_id` es obligatorio en la numeración de documentos, ver
  [04-identidad-de-datos.md §2](./04-identidad-de-datos.md#2-document-numbering)).
- **Interfaces:** `BranchService`.
- **Eventos:** `branch.created`, `branch.deactivated` — consumidos por
  `Multi Warehouse` (una sucursal nueva puede requerir un almacén
  asociado, decisión del módulo `inventario`, no automática) y por
  `Notification Center`.
- **Comunicación con otros componentes:** toda operación transaccional
  de negocio (venta, compra, movimiento de caja) exige `branch_id` no
  nulo — regla ya fijada en el modelo conceptual.
- **Estrategias de seguridad / rendimiento / escalabilidad:** ver
  `14-modulo-core.md §2`.

## 4. Multi Company

**Trazabilidad:** 📎 Referencia — la jerarquía Tenant → Company →
Branch es explícitamente "la respuesta" a todas las dimensiones
"multi-" de alcance organizacional
([database/01-modelo-conceptual.md §2](../../database/01-modelo-conceptual.md)):
ninguna necesita tabla especial adicional.

- **Objetivo:** que un mismo tenant opere legalmente varias empresas
  (razones sociales) de forma completamente aislada a nivel contable y
  fiscal, compartiendo la misma instalación técnica.
- **Responsabilidad:** no es un componente de código nuevo — es la
  garantía, ya diseñada, de que todo dato con relevancia fiscal
  (asientos contables, facturas, declaraciones) filtra por
  `company_id` además de `tenant_id`.
- **Dependencias:** `Company Manager`, `Repository Base`.
- **Interfaces:** el mismo filtro compuesto `(tenant_id, company_id)`
  aplicado por `Repository Base`.
- **Eventos:** ninguno propio — hereda los de `Company Manager`.
- **Flujo interno:** el usuario autenticado selecciona su company
  activa (persistida en el `Security Context` de la sesión); cambiar
  de company activa no requiere nuevo login, solo refresca el contexto.
- **Comunicación con otros componentes:** `Currency Manager` depende
  de esto — la moneda funcional es por company, no por tenant (ver
  [03-localizacion-y-globalizacion.md §4](./03-localizacion-y-globalizacion.md#4-currency-manager)).
- **Estrategias de seguridad:** un usuario solo ve las companies para
  las que tiene un rol asignado explícitamente — no hay acceso
  implícito a todas las companies de un tenant por el solo hecho de
  pertenecer a él.
- **Estrategias de rendimiento / escalabilidad:** sin overhead
  adicional sobre lo ya cubierto por `Tenant Manager` — el filtro de
  company usa el mismo índice compuesto.

## 5. Multi Branch

**Trazabilidad:** 📎 Referencia — mismo fundamento que Multi Company,
un nivel más abajo en la jerarquía.

- **Objetivo:** que una company opere múltiples puntos físicos
  (sucursales, tiendas, bodegas administrativas) con inventario, caja
  y numeración de documentos independientes entre sí.
- **Responsabilidad:** garantizar que `branch_id` participe en el
  filtro de aislamiento para las entidades que son branch-scoped
  (inventario, caja, numeración) y no para las que son company-scoped
  (plan de cuentas, moneda funcional) — la distinción exacta de qué
  entidad es de qué nivel ya está resuelta módulo por módulo en sus
  respectivos documentos (`19-modulo-inventory.md`,
  `23-modulo-cash.md`, `14-modulo-core.md §9`).
- **Dependencias:** `Branch Manager`, `Repository Base`.
- **Interfaces:** filtro `(tenant_id, company_id, branch_id)` aplicado
  selectivamente según el nivel de alcance declarado por entidad.
- **Eventos:** ninguno propio.
- **Flujo interno:** el usuario selecciona sucursal activa de forma
  independiente a la company activa (una company activa puede tener
  varias branches asignadas al usuario); igual que con company, el
  cambio de branch activa no requiere nuevo login.
- **Comunicación con otros componentes:** `Multi Warehouse` (un
  almacén se asocia típicamente a una branch, aunque el modelo permite
  varios almacenes por branch — decisión del módulo `inventario`).
- **Estrategias de seguridad:** los roles pueden estar restringidos a
  un subconjunto de branches (p. ej. un cajero solo ve su sucursal).
- **Estrategias de rendimiento / escalabilidad:** el índice compuesto
  con `branch_id` es crítico en tablas de alto volumen transaccional
  (ventas, movimientos de inventario) — ya contemplado en la estrategia
  de particionamiento (`database/07-estrategia-particionamiento.md`,
  referenciada desde el índice maestro).

## 6. Multi Warehouse

**Trazabilidad:** 🔗 Extiende diseño existente — las tablas
(`warehouses`, `warehouse_locations`, ...) están completamente
diseñadas y son propiedad del módulo `inventario`
([19-modulo-inventory.md](../19-modulo-inventory.md)); lo que falta es
la vista de plataforma de cómo `Multi Warehouse` se relaciona con el
resto del Core Platform.

- **Objetivo:** permitir que una branch (o, en instalaciones más
  simples, directamente una company) opere varios almacenes físicos o
  lógicos con existencias y movimientos independientes.
- **Responsabilidad:** el Core Platform **no** gestiona el modelo de
  almacenes en sí (eso es responsabilidad exclusiva del módulo dueño,
  `inventario`, patrón ya fijado en
  [06-comunicacion-entre-modulos.md §4](../06-comunicacion-entre-modulos.md#4-patrón-módulo-dueño));
  su única responsabilidad de plataforma es que `Sequence Generator`,
  `Cache Framework` y `Audit Framework` reconozcan `warehouse_id` como
  una dimensión válida de particionamiento de cache/numeración/auditoría
  cuando el módulo `inventario` lo requiera.
- **Dependencias:** módulo `inventario` (dueño de los datos),
  `Multi Branch`.
- **Interfaces:** ninguna propia — el Core Platform expone los
  mecanismos genéricos (`Cache Framework` namespaced,
  `Sequence Generator` parametrizable por dimensión adicional) y el
  módulo `inventario` los consume con `warehouse_id` como parámetro.
- **Eventos:** los eventos de dominio (`WarehouseCreated`,
  `StockTransferred`) son responsabilidad y catálogo del módulo
  `inventario`, no de este documento.
- **Flujo interno:** no aplica a nivel de plataforma.
- **Comunicación con otros componentes:** el único acoplamiento de
  plataforma es que el `Repository Base` no impone un cuarto nivel de
  filtro obligatorio por `warehouse_id` — lo deja como filtro adicional
  opcional que cada módulo aplica si su entidad lo requiere, para no
  forzar una jerarquía rígida de 4 niveles a módulos que no la
  necesitan (p. ej. `contabilidad` nunca filtra por almacén).
- **Estrategias de seguridad:** heredadas de `Multi Branch` — no hay
  control de acceso adicional a nivel de plataforma por almacén (si el
  módulo `inventario` lo necesitara, sería una extensión de su propio
  RBAC, no del Core Platform).
- **Estrategias de rendimiento / escalabilidad:** ver
  `19-modulo-inventory.md` para el detalle de índices y particionamiento
  de movimientos de inventario por almacén.
