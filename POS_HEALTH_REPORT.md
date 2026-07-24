# Informe de Salud — Punto de Venta (POS)

## 1. Resumen

El POS de Fase 06 Parte 01 está construido sobre módulos backend nuevos (`clientes`, `caja`,
`ventas`, `pos`) que se apoyan en la arquitectura y el schema ya existentes. No se duplicó ninguna
estructura: cada módulo nuevo reutiliza `products`/`inventory`/`taxes`/`configuration` tal cual
estaban. El código, tanto backend como frontend, fue verificado contra infraestructura real
(Postgres/Redis/RabbitMQ, navegador) y no solo con mocks — ver `POS_TEST_REPORT.md`.

**Estado general: sano, apto para continuar con la Parte 02, con riesgos conocidos y acotados
(§3).**

## 2. Cobertura de pruebas

- 42 tests unitarios nuevos (clientes/caja/ventas/pos) — 42/42 ✅.
- 153 tests de Inventario (regresión) — 153/153 ✅, sin roturas por el fix del bug de stock.
- Verificación end-to-end real vía `curl` (backend) y Playwright (frontend) — ver
  `POS_TEST_REPORT.md §2` y `§4`.
- **No hay** e2e-spec automatizado de NestJS para POS ni pruebas de carga (k6) — riesgo aceptado,
  documentado en `POS_TEST_REPORT.md §5`.

## 3. Riesgos conocidos

| Riesgo                                          | Severidad                    | Detalle                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ----------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Checkout no es una transacción distribuida real | Media                        | `PosCheckoutService.confirmarVenta` encadena escrituras a `inventario`, `ventas` y `caja` en pasos secuenciales, no en una única transacción de base de datos cross-schema (Prisma no lo soporta entre `PrismaClient`s distintos por módulo). Si el proceso cae entre pasos (ej. después de confirmar la factura pero antes de registrar el movimiento de caja) puede quedar una factura sin recibo. Ver `POS_ARCHITECTURE.md §4.3`. |
| Sin pruebas de concurrencia a escala            | Media                        | El bloqueo de fila (`SELECT...FOR UPDATE`) está verificado desde Fase 05 Parte 04, pero no se sometió a carga concurrente real en esta fase (POS agrega un nuevo punto de entrada de alto tráfico).                                                                                                                                                                                                                                  |
| Catálogos get-or-create bajo concurrencia       | Baja                         | El patrón `resolverXPorCodigo` (clientes/caja/ventas/tipos de movimiento) maneja la colisión P2002 con un reintento simple — suficiente para el volumen esperado de catálogos (pocas decenas de códigos), no diseñado para alta concurrencia de creación simultánea del mismo código nuevo.                                                                                                                                          |
| Recibo mixto = N recibos, no N allocations      | Baja                         | Un pago con múltiples formas (efectivo + tarjeta) genera N filas en `sales.receipts`, cada una con su propia `receipt_allocation` — funciona, pero difiere de lo que un reporte de "recibos por cliente" podría esperar más adelante (una fila por pago del cajero, no por factura). Documentado, no bloqueante.                                                                                                                     |
| Sin devoluciones/cambios/garantías              | Alta (funcional, no técnica) | Explícitamente fuera de alcance de Parte 01 — una ferretería real necesita esto pronto; ver Recomendaciones.                                                                                                                                                                                                                                                                                                                         |

## 4. Deuda técnica introducida (nueva en esta fase)

- Checkout no atómico cross-schema (§3) — mitigar en una fase futura con un patrón outbox/saga si
  el volumen lo justifica, o aceptar el riesgo documentándolo en runbooks operativos.
- Sin e2e-spec de NestJS para POS — debería formalizarse antes de que el módulo crezca (devoluciones,
  Parte 02) para no depender de verificación manual.
- `ProductoLookupRepository` de `pos` busca solo por `sku` (`contains`, insensible a mayúsculas) —
  no busca por nombre, código de barras real, ni QR; suficiente para Parte 01, insuficiente para el
  buscador rápido que pide el master prompt completo (necesita más índices y lógica de ranking).

## 5. Deuda técnica heredada, corregida en esta fase (no nueva, pero relevante)

- Bug de doble aplicación de stock (Fase 05 Parte 02, sin detectar por ~9 sesiones con Docker
  caído) — corregido, ver `POS_TEST_REPORT.md §3`.
- Bug de cast de tipo en `stock-lock.util.ts` (Fase 05 Parte 04) — corregido, mismo motivo.

Ambos bugs eran **preexistentes al POS**, no introducidos por esta fase; se listan acá porque
afectan directamente la confiabilidad del stock que el POS depende.

## 6. Seguridad y permisos

Cuatro nuevos permisos RBAC sembrados (`clientes.gestionar_clientes`, `caja.gestionar_caja`,
`ventas.gestionar_ventas`, `pos.operar_pos`), todos los controladores los exigen explícitamente,
consistente con el patrón ya usado en Inventario/Seguridad. No se detectaron endpoints sin guardia
de permisos.

## 7. Rendimiento

No se midió contra los objetivos explícitos del master prompt (apertura <2s, agregar producto
<100ms, cobrar <500ms) con instrumentación real — la verificación fue funcional, no de
rendimiento. Riesgo bajo dado el volumen de datos de prueba (unos pocos productos), pero **no
verificado a escala real de catálogo de ferretería** (miles de SKUs). Recomendado medir en Parte 02
o antes de producción.
