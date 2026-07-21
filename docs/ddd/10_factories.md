# 10 — Factories

> Una Factory encapsula la construcción de un Aggregate Root cuando esa
> construcción es lo bastante compleja (múltiples entidades hijas,
> validación cruzada, dependencia de otros contextos) para no vivir
> como un constructor simple dentro de la entidad. Gap genuino: ningún
> documento previo de GORAZUS nombra este patrón explícitamente — se
> diseña aquí por primera vez, apoyado enteramente en mecanismos ya
> existentes (`Repository Base`, Value Objects, Domain Services de
> [08](./08_domain_services.md)).

**Regla común:** toda Factory expone un único método estático/factory
(`crear(...)`) que retorna el agregado completo y válido, o lanza
`ValidationException` — nunca retorna un agregado a medio construir.
Ninguna Factory persiste directamente (esa responsabilidad es del
Repositorio, invocado después por el Application Service — ver
[12_application_services.md](./12_application_services.md)).

## 1. `PedidoVentaFactory`

- **Construye:** el agregado Pedido de Venta completo (cabecera +
  líneas) a partir de una Cotización aceptada o de un carrito de venta
  directo (POS).
- **Complejidad que justifica la Factory:** cada línea requiere
  resolver Precio (lista de precios del Cliente vía consulta síncrona
  a `configuracion`), aplicar `AplicarDescuento`, calcular
  `CalcularImpuestos`, y verificar `StockDisponible`
  ([11_specifications.md](./11_specifications.md)) — validación
  cruzada de 3 contextos antes de que el agregado exista.
- **Depende de:** `ClientesQueryService`, `ProductosQueryService`,
  `InventarioQueryService` (todas de solo lectura, vía fachada
  pública).

## 2. `FacturaFactory`

- **Construye:** el agregado Factura de Venta a partir de un Pedido de
  Venta confirmado.
- **Complejidad que justifica la Factory:** invoca el Domain Service
  `GenerarFactura` ([08_domain_services.md §1.6](./08_domain_services.md#16-generarfactura)),
  congela los precios/impuestos del Pedido en el momento de la emisión
  (una Factura no debe cambiar si el precio del Producto cambia
  después — invariante de inmutabilidad fiscal), y asigna el
  Correlativo correspondiente vía `configuration.correlatives`
  (`Sequence Generator`/`Document Numbering`, ya diseñados en
  [32-core-platform/08](../architecture/32-core-platform/08-frameworks-de-infraestructura.md)).

## 3. `OrdenProduccionFactory`

- **Construye:** el agregado Orden de Producción, explotando
  recursivamente el BOM del Producto a fabricar en la lista plana de
  componentes necesarios (`production_order_components`).
- **Complejidad que justifica la Factory:** un BOM puede tener
  sub-ensambles (BOM de un componente que a su vez es producto
  fabricado) — la explosión recursiva con cálculo de cantidad total
  por nivel es exactamente el tipo de lógica de construcción que no
  pertenece a la entidad `Orden de Producción` en sí, sino a su
  construcción.
- **Depende de:** `BOMRepository` (lectura recursiva), no persiste el
  BOM, solo lo consume para calcular la lista de materiales de la
  orden.
- **Invariante que protege en construcción:** un BOM cíclico (un
  componente que se referencia a sí mismo transitivamente) hace fallar
  la Factory antes de crear la orden, no en tiempo de ejecución de
  producción.

## 4. `AsientoContableFactory`

- **Construye:** el agregado Asiento Contable a partir de un
  `event_code` y su `amount_formula` asociada
  (`accounting_rules`/`accounting_rule_lines`, ya diseñado en
  [22-modulo-accounting.md §3](../architecture/22-modulo-accounting.md)).
- **Complejidad que justifica la Factory:** resuelve la plantilla,
  evalúa `amount_formula` contra el payload del evento de origen, y
  garantiza que el resultado esté balanceado (suma débito = suma
  crédito) **antes** de que el agregado exista — si no balancea, la
  Factory falla y el evento de origen se reintenta o se lleva a
  dead-letter queue, nunca se persiste un asiento inválido.
- **Es la Factory que invoca el Domain Service `GenerarAsientoContable`**
  ([08_domain_services.md §1.5](./08_domain_services.md#15-generarasientocontable))
  internamente.

## 5. `ProductoFactory`

- **Construye:** el agregado Producto con sus Variantes iniciales, a
  partir de una plantilla de atributos (Familia/Categoría de
  Producto).
- **Complejidad que justifica la Factory:** generar el producto
  cartesiano de combinaciones de atributos (talla × color) como
  Variantes individuales, cada una con su propio código/barcode
  generado.

## 6. `ExistenciaFactory`

- **Construye:** el registro inicial de Existencia (saldo 0) para un
  Producto nuevo en cada Almacén activo del tenant, al recibir
  `ProductoCreado`.
- **Complejidad que justifica la Factory:** no es un simple insert —
  itera todos los Almacenes activos de la Empresa y crea un registro
  por cada uno, respetando el alcance de `branch_id` si el Producto
  está restringido a ciertas Sucursales.

## 7. Tabla resumen

| Factory                  | Agregado que construye | Contexto       | Complejidad principal                                              |
| ------------------------ | ---------------------- | -------------- | ------------------------------------------------------------------ |
| `PedidoVentaFactory`     | Pedido de Venta        | `ventas`       | Resolución de precio/descuento/impuesto/stock cruzando 3 contextos |
| `FacturaFactory`         | Factura de Venta       | `ventas`       | Congelamiento de valores + numeración                              |
| `OrdenProduccionFactory` | Orden de Producción    | `produccion`   | Explosión recursiva de BOM                                         |
| `AsientoContableFactory` | Asiento Contable       | `contabilidad` | Resolución de `accounting_rules` + verificación de balance         |
| `ProductoFactory`        | Producto               | `productos`    | Generación cartesiana de Variantes                                 |
| `ExistenciaFactory`      | Existencia             | `inventario`   | Inicialización multi-almacén                                       |

## 8. Trazabilidad

Gap genuino cerrado por esta fase — el patrón Factory no tenía
antecedente documentado en GORAZUS. Ninguna Factory de este catálogo
introduce persistencia, tabla o mecanismo nuevo: cada una orquesta
componentes ya diseñados (`Sequence Generator`, `accounting_rules`,
BOM recursivo ya existente en `products.bill_of_materials`).

**Siguiente documento:** [11_specifications.md](./11_specifications.md).
