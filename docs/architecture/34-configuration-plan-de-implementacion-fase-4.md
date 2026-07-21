# 34 — Configuration: Plan de implementación (Fase 4)

> Plan técnico de construcción — versión 1.0, 2026-07-13. Mismo
> criterio que
> [32-core-platform/13](./32-core-platform/13-plan-de-implementacion-fase-2.md)
> y [33](./33-iam-plan-de-implementacion-fase-3.md): plan de
> secuenciación, no diseño nuevo ni código. A diferencia de esas dos
> fases, acá **sí hubo que escribir diseño nuevo primero** — 5 de los
> 14 puntos pedidos no tenían prosa de arquitectura (solo tabla SQL) y
> se agregaron como §12-16 de
> [14-modulo-core.md](./14-modulo-core.md) antes de poder planificar su
> construcción. Este documento asume esa ampliación ya hecha.

## 1. Mapeo: los 14 puntos pedidos → estado real

| #   | Pedido          | Estado                                          | Documento                                                                                                                                                                                                                                          |
| --- | --------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Companies       | ✅ Completo (ya existía)                        | [14 §1](./14-modulo-core.md#1-companies-corecompanies--dueño-real-core)                                                                                                                                                                            |
| 2   | Branches        | ✅ Completo (ya existía)                        | [14 §2](./14-modulo-core.md#2-branches-corebranches--dueño-real-core)                                                                                                                                                                              |
| 3   | Currencies      | ✅ Completo (ya existía)                        | [14 §4-7](./14-modulo-core.md#4-7-countries-currencies-languages-timezones--dueño-real-configuration) + [32-core-platform/03 §4](./32-core-platform/03-localizacion-y-globalizacion.md#4-currency-manager)                                         |
| 4   | Countries       | ✅ Completo (ya existía)                        | [14 §4-7](./14-modulo-core.md#4-7-countries-currencies-languages-timezones--dueño-real-configuration)                                                                                                                                              |
| 5   | Cities          | 🆕 Agregado ahora                               | [14 §12](./14-modulo-core.md#12-cities-configurationmunicipalities--dueño-real-configuration) — la tabla real es `municipalities`, no `cities`                                                                                                     |
| 6   | Languages       | ✅ Completo (ya existía)                        | [14 §4-7](./14-modulo-core.md#4-7-countries-currencies-languages-timezones--dueño-real-configuration)                                                                                                                                              |
| 7   | Fiscal Years    | ✅ Completo (ya existía)                        | [14 §8](./14-modulo-core.md#8-fiscal-years-accountingfiscal_years--fiscal_periods--dueño-real-accounting)                                                                                                                                          |
| 8   | Exchange Rates  | ✅ Completo (ya existía) + 🆕 sub-tipo agregado | [14 §4-7](./14-modulo-core.md#4-7-countries-currencies-languages-timezones--dueño-real-configuration) + [14 §13](./14-modulo-core.md#13-exchange-rate-types-configurationexchange_rate_types--dueño-real-configuration) (tasas múltiples por país) |
| 9   | Taxes           | ❌ Fuera de este plan a propósito               | Ver §2 — es la Fase 16 ("Impuestos") ya conocida, no se absorbe acá                                                                                                                                                                                |
| 10  | Series          | ✅ Completo (ya existía)                        | [14 §9](./14-modulo-core.md#9-document-series-configurationnumbering_series--document_number_formats--dueño-real-configuration)                                                                                                                    |
| 11  | Correlatives    | ✅ Completo (ya existía) + corrección de doc    | [14 §10](./14-modulo-core.md#10-correlatives-configurationcorrelatives--dueño-real-configuration) — ver §3, se corrigió una inconsistencia real encontrada al revisar                                                                              |
| 12  | Document Types  | 🆕 Agregado ahora, con desambiguación           | [14 §14](./14-modulo-core.md#14-fiscal-document-types-configurationfiscal_document_types--dueño-real-configuration) — ver §4, son 3 tablas distintas, no 1                                                                                         |
| 13  | Payment Methods | 🆕 Agregado ahora                               | [14 §15](./14-modulo-core.md#15-payment-methods-configurationpayment_forms--payment_methods--banks--dueño-real-configuration)                                                                                                                      |
| 14  | Price Lists     | 🆕 Agregado ahora, con decisión de propiedad    | [14 §16](./14-modulo-core.md#16-price-lists-configurationprice_lists--price_list_items--dueño-real-configuration) — propiedad no estaba asignada, se fijó en `configuration`                                                                       |

**8 de 14 ya estaban completos. 5 se diseñaron recién** (Cities,
Exchange Rate Types, Fiscal Document Types, Payment Methods, Price
Lists) **y 1 se excluye deliberadamente** (Taxes, §2).

## 2. Taxes: no se absorbe acá — es la Fase 16 ya conocida

"Taxes" en la lista de Fase 4 podría significar dos cosas de tamaño
muy distinto:

- Las 3 tablas de **metadata fiscal** que sí viven en `configuration`
  (`fiscal_regimes`, `fiscal_document_types` — ya cubierta en §14 del
  14-modulo-core.md ampliado —, `exchange_rate_types` — ya cubierta en
  §13). Estas son catálogos de clasificación, sin lógica de cálculo.
- El **motor de impuestos real** (tasas, retenciones, percepciones,
  declaraciones) — 13 tablas en el schema `taxes`
  ([database/logico/12-taxes.md](../database/logico/12-taxes.md)),
  propiedad del módulo `impuestos`, que es la **Fase 16** del roadmap
  de documentación
  ([00-roadmap-fases.md](../00-roadmap-fases.md), fila 16: "❌
  Pendiente — modelo de datos completo, sin documento de
  arquitectura").

Este plan cubre la primera categoría (ya incluida en §14/§13) y
**no** la segunda. Un motor de impuestos de 13 tablas con reglas de
cálculo, retención y declaración es una pieza de tamaño comparable a
un módulo de negocio completo (como `contabilidad` o `nómina`), no un
sub-ítem de "Configuration" — mezclarlo acá produciría exactamente el
tipo de documento sobredimensionado y difícil de mantener que la
convención de un-módulo-un-documento ya evita en el resto del
proyecto. Si querés que se aborde ahora, es una **Fase propia**
("Fase 5 — Impuestos" o similar), con su propio documento de
arquitectura — decílo explícitamente y se planifica aparte.

## 3. Corrección encontrada al revisar: Correlatives no usa lock optimista

Al verificar §10 contra el SQL real
([25_functions.sql](../database/sql/25_functions.sql)) para este plan,
se encontró que dos documentos (`sql/21_configuration.sql` y
`database/logico/21-configuration.md`) describían el mecanismo de
`correlatives` como "lock optimista vía `row_version`" — **incorrecto**,
el mecanismo real (`fn_get_next_correlative`) es `SELECT ... FOR
UPDATE`, es decir, **pesimista**, tal como ya lo tenía bien
`14-modulo-core.md §10` desde que se escribió. Se corrigieron los dos
comentarios para que los tres documentos digan lo mismo — no era un
cambio de diseño, era un error de redacción que quedó consistente con
lo demás.

## 4. Orden de construcción (hitos)

Requiere primero
[Fase 2, Hitos H1-H2](./32-core-platform/13-plan-de-implementacion-fase-2.md#4-orden-de-construcción-hitos)
(Kernel, Cache, Base transaccional, Security Context, MultiTenant) —
incluso los catálogos globales puros necesitan `Cache Framework` para
no golpear Postgres en cada request, y Companies/Branches necesitan
`Repository Base`/`Security Context` como cualquier entidad
transaccional.

### H1(F4) — Catálogos globales puros (paralelizable, seed-data + servicio de lectura)

- **Countries, Currencies, Languages, Cities** (`municipalities`/`sectors`,
  [14 §12](./14-modulo-core.md#12-cities-configurationmunicipalities--dueño-real-configuration)),
  **Exchange Rate Types** ([14 §13](./14-modulo-core.md#13-exchange-rate-types-configurationexchange_rate_types--dueño-real-configuration)).
- Requiere: Fase 2 H1 (Cache Framework).
- No requiere MultiTenant real — son catálogo global (`tenant_id` =
  sentinela del sistema), visible a todos los tenants desde el
  primer día.
- **Listo cuando:** el seed inicial carga ISO 3166 (países) + ISO 4217
  (monedas) + ISO 639-1 (idiomas) completos, la jerarquía
  country→state→municipality→sector resuelve en cascada (test de
  integración con al menos 2 países de estructura distinta), y
  `Currency Manager` rechaza una conversión que requiere
  `exchange_rate_type_id` explícito cuando el país tiene más de un
  tipo activo (regla de §13, sin tasa "por defecto" implícita).

### H2(F4) — Companies y Branches (núcleo transaccional)

- **Companies** ([14 §1](./14-modulo-core.md#1-companies-corecompanies--dueño-real-core)),
  **Branches** ([14 §2](./14-modulo-core.md#2-branches-corebranches--dueño-real-core)).
- Requiere: Fase 2 H2 completo (Security Context, MultiTenant,
  Repository Base) + Fase 2 H4 (Event Bus — el flujo de onboarding de
  §1 es 100% orquestado por el evento `CompanyCreated`, no por
  escritura directa entre módulos).
- **Listo cuando:** el flujo completo de alta de empresa (diagrama de
  §1) crea la sucursal principal, publica `CompanyCreated`, y — una
  vez que exista un listener registrado (ver H3) — dispara la
  creación del ejercicio fiscal inicial y las series de numeración por
  defecto, todo dentro de la misma prueba de integración end-to-end.

### H3(F4) — Numeración y ejercicio fiscal (reacciona a H2)

- **Series** ([14 §9](./14-modulo-core.md#9-document-series-configurationnumbering_series--document_number_formats--dueño-real-configuration)),
  **Correlatives** ([14 §10](./14-modulo-core.md#10-correlatives-configurationcorrelatives--dueño-real-configuration)),
  **Fiscal Years** ([14 §8](./14-modulo-core.md#8-fiscal-years-accountingfiscal_years--fiscal_periods--dueño-real-accounting)).
- Requiere: H2(F4) (consume `CompanyCreated`/`BranchCreated`).
- Nota de alcance: el listener que crea el `fiscal_year` inicial es
  responsabilidad del módulo `accounting`, que no forma parte de las
  fases 2-4 (Core Platform/IAM/Configuration) — este hito construye el
  lado emisor del evento y dejar el listener de Fiscal Years con un
  _stub_ documentado hasta que `accounting` se planifique como fase
  propia, para no bloquear Series/Correlatives (que sí son 100% de
  `configuration`) esperando a un módulo que todavía no se construye.
- **Listo cuando:** crear una sucursal nueva genera automáticamente
  sus series de numeración con `branch_id` obligatorio (regla de §9),
  y `fn_get_next_correlative` pasa una prueba de concurrencia real
  (N transacciones paralelas piden el siguiente número de la misma
  serie, cero duplicados, cero huecos).

### H4(F4) — Medios de pago y precios (depende de H2, en paralelo con H3)

- **Payment Methods** ([14 §15](./14-modulo-core.md#15-payment-methods-configurationpayment_forms--payment_methods--banks--dueño-real-configuration)),
  **Price Lists** ([14 §16](./14-modulo-core.md#16-price-lists-configurationprice_lists--price_list_items--dueño-real-configuration)).
- Requiere: H2(F4) (`company_id` obligatorio en ambas tablas) + H1(F4)
  (Price Lists multi-moneda depende de Currency Manager).
- **Listo cuando:** el flujo de resolución de precio de §16 (lista del
  cliente → precio base → override manual auditado) pasa una prueba
  con un cliente sin lista asignada (usa precio base) y uno con lista
  asignada en moneda distinta a la de la venta (pasa por conversión).

## 5. Resumen visual

```
Fase 2 (Core Platform) H1-H2, H4
 └─▶ H1(F4) Countries · Currencies · Languages · Cities · Exchange Rate Types
      └─▶ H2(F4) Companies · Branches (flujo de onboarding vía evento)
           ├─▶ H3(F4) Series · Correlatives · Fiscal Years (listener stub hasta que exista `accounting`)
           └─▶ H4(F4) Payment Methods · Price Lists

Fuera del plan: Taxes (motor completo) — es Fase 16 / posible "Fase 5
— Impuestos" propia, no un sub-ítem de Configuration (§2).
```
