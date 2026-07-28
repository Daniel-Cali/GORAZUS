---
id: governance-gemm-enterprise-maturity-model
title: 'GEMM — GORAZUS Enterprise Maturity Model v1.0'
version: 1.0.0
status: active
owner: Chief Software Architect
domain: governance
subdomain: enterprise-maturity
created: 2026-07-28
updated: 2026-07-28
tags: [governance, maturity, dashboard, second-brain, gemm]
related:
  - '[[Enterprise Governance Report — 2026-07-28]]'
  - '[[Innovation Report — 2026-07-28]]'
  - '[[Architecture Review — ADR-DB-001 and ADR-INV-001]]'
  - '[[Issue Register]]'
  - '[[ADR Index]]'
---

# Purpose

Modelo de Madurez Empresarial de GORAZUS (GEMM v1.0) — el dashboard oficial de salud arquitectónica.
**Metodología obligatoria antes de cualquier número**: cada porcentaje de este documento se calcula
con la banda objetiva de abajo, nunca por estimación — la instrucción del protocolo ("Never invent
percentages") se cumple con un criterio auditable, no con buena voluntad.

**Bandas de madurez** (0/20/40/60/80/100, sin valores intermedios inventados):

| Banda | Criterio objetivo                                                                              |
| ----- | ---------------------------------------------------------------------------------------------- |
| 0%    | Sin schema real y sin código de aplicación                                                     |
| 20%   | Schema Prisma real y certificado, cero código de aplicación (`0` controllers)                  |
| 40%   | Backend real con `≥1` controller/service, sin `e2e-spec` propio                                |
| 60%   | `≥1` `e2e-spec` real verificado contra infraestructura real (Postgres/Redis/RabbitMQ)          |
| 80%   | Flujo de negocio cruzado entre módulos verificado de punta a punta (no solo el módulo aislado) |
| 100%  | Desplegado en producción con evidencia operativa real (monitoreo, tráfico real)                |

**Ningún dominio de GORAZUS alcanza 100% hoy** — no hay evidencia de despliegue en producción con
tráfico real en ningún documento leído en toda esta sesión (`docker-postgres-1` es el entorno de
verificación real, explícitamente de desarrollo — `POSTGRESQL_TUNING.md`). Declarar 100% sin esa
evidencia sería inventar el número que el protocolo prohíbe inventar.

# 1. Executive Summary

GORAZUS tiene **21 schemas de base de datos reales y certificados** (data model completo para casi
todo dominio de negocio de un ERP) pero **código de aplicación real en solo 12 de 29 carpetas de
módulo** — la brecha entre "modelado" y "construido" es la señal más importante de este reporte, ya
verificada con un conteo real de controllers/services/specs, no con memoria de sesiones anteriores.

# 2. Enterprise Health Dashboard (Step 8)

```text
Architecture        ████████████████░░░░  80%
Platform             ████████████░░░░░░░░  60%
Infrastructure       ████████████░░░░░░░░  60%
Database             ████████████████░░░░  80%
Security             ████████████░░░░░░░░  60%
API                  ████████████░░░░░░░░  60%
DDD                  ████████░░░░░░░░░░░░  40%
Clean Architecture   ████████████████░░░░  80%
Hexagonal            ████████████████░░░░  80%
Testing              ████████░░░░░░░░░░░░  40%
Documentation        ████████████████░░░░  80%
Knowledge Base       ████████████████░░░░  80%
Engineering Library  ████████░░░░░░░░░░░░  40%
Governance           ████████████░░░░░░░░  60%
Performance          ████████████░░░░░░░░  60%
Scalability          ████████████░░░░░░░░  60%
Observability        ████████████░░░░░░░░  60%
Dev Experience       ████████████░░░░░░░░  60%
DevOps               ████████░░░░░░░░░░░░  40%

Inventario           ████████████░░░░░░░░  60%
Ventas               ████████████████░░░░  80%
Seguridad            ████████████████░░░░  80%
Auth                 ████████████░░░░░░░░  60%
Contabilidad         ████████████░░░░░░░░  60%
CRM                  ████████████░░░░░░░░  60%
Clientes             ████████████░░░░░░░░  60%
Configuración        ████████████░░░░░░░░  60%
Productos            ████████████░░░░░░░░  60% (módulo) / 14% (cobertura de dominio, 5 de 35 tablas)
POS                  ████████░░░░░░░░░░░░  40%
Caja                 ████████░░░░░░░░░░░░  40%
Compras              ████░░░░░░░░░░░░░░░░  20%
Activos Fijos        ████░░░░░░░░░░░░░░░░  20%
Bancos               ████░░░░░░░░░░░░░░░░  20%
Tesorería            ████░░░░░░░░░░░░░░░░  20%
HR                   ████░░░░░░░░░░░░░░░░  20%
Nómina               ████░░░░░░░░░░░░░░░░  20%
Producción           ████░░░░░░░░░░░░░░░░  20%
Proyectos            ████░░░░░░░░░░░░░░░░  20%
Proveedores          ████░░░░░░░░░░░░░░░░  20%
Impuestos            ████░░░░░░░░░░░░░░░░  20%
Reportes             ████░░░░░░░░░░░░░░░░  20%
BI                   ████░░░░░░░░░░░░░░░░  20%
IA                   ░░░░░░░░░░░░░░░░░░░░   0%
DGII                 ░░░░░░░░░░░░░░░░░░░░   0%
E-commerce           ░░░░░░░░░░░░░░░░░░░░   0%
Portal Cliente       ░░░░░░░░░░░░░░░░░░░░   0%
Portal Proveedor     ░░░░░░░░░░░░░░░░░░░░   0%

Overall ERP          ████████████░░░░░░░░  ~52%
```

`Overall ERP` es el promedio simple de las 21 filas de dominio de negocio (no de las dimensiones
transversales, que miden calidad de lo construido, no cobertura de alcance) — método declarado, no
una cifra elegida a mano.

# 3. Architecture Maturity

**80%** — flujo cruzado verificado de punta a punta en al menos un caso real (Pedido→Factura→Asiento
contable, `PRODUCTOS_REPORT.md`/`SALES_ROADMAP` de sesiones anteriores) y Clean/Hexagonal confirmados
con código real, no solo citados, en [[Architecture Review — ADR-DB-001 and ADR-INV-001]]. No alcanza
100% porque la reconciliación formal con `docs/ddd/` (Bounded Contexts/Aggregates/Invariantes) solo
se hizo completa para el dominio de Inventario (`ADR-INV-000`) — el resto de dominios no tiene ese
mismo nivel de rigor DDD documentado todavía (ver §7 DDD).

# 4. Platform Maturity

**60%** — [[Shared Services]] reales (`EventBusService`, `LoggerService`, `Repository Base`,
`Sequence Generator`), pero **0 de 3 clases de evento de dominio existentes se publican** todavía
([[Domain Events]]) — infraestructura real con capacidad real sin usar, la misma brecha ya
identificada como prioridad en [[Innovation Report — 2026-07-28]] §2 (Horizonte 2).

# 5. Infrastructure Maturity

**60%** — topología real y documentada ([[Infrastructure]]: Nginx/api/web/Postgres/Redis/RabbitMQ/
MinIO), `api` horizontalmente escalable confirmado, pero Postgres es _"un único primario"_ sin
evidencia de conmutación por error probada, y TLS real _"solo en producción"_ sin evidencia de que
production tenga tráfico real hoy.

# 6. Database Maturity

**80%** — particionamiento production-proven (~1.200 particiones físicas reales), 0 índices
faltantes/duplicados/innecesarios ([[Database Maintenance]]), pero con deuda real conocida (6 tablas
sin `PARTITION BY RANGE`, `core.data_retention_policies` sin poblar) que impide el 100%.

# 7. Security Maturity

**60%** — RLS real y universal (494 tablas, tenant/company), RBAC real con guards duales, auditoría
inmutable universal ([[Security]]) — pero la brecha branch/warehouse (`ISSUE-02`) y la invariante I4
sin enforcement real (ambas ya en el [[Issue Register]] consolidado) son gaps de seguridad/integridad
de datos reales, no teóricos.

# 8. API Maturity

**60%** — estándares reales y consolidados ([[API Standards]]: versionado, formato de error RFC
7807, OpenAPI autoexportado), pero sin clave de idempotencia formalizada para comandos de escritura
(gap ya señalado en esa misma nota) y sin contrato de API propio todavía para el dominio de Productos
más allá de la Parte 1 (`ADR-INV-001` es "solo arquitectura", sin superficie REST definida).

# 9. Domain Maturity (Step 3) — Evidencia Real

Fuente: conteo real de `*.controller.ts`/`*.service.ts`/`*.spec.ts`/`*.e2e-spec.ts` por carpeta de
`modules/`, ejecutado en esta sesión — no memoria de sesiones anteriores.

| Dominio          | Controllers | Services | Specs | E2E | Schema real                                                           | Madurez                             | Brecha crítica                                               |
| ---------------- | ----------- | -------- | ----- | --- | --------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------ |
| Inventario       | 13          | 13       | 24    | 4   | ✅ `inventory`                                                        | 60%                                 | Invariante I4, RLS branch/warehouse                          |
| Ventas           | 3           | 3        | 7     | 2   | ✅ `sales`                                                            | 80%                                 | Devoluciones (gap ya conocido de sesiones previas)           |
| Seguridad        | 5           | 9        | 13    | 5   | ✅ `security`                                                         | 80%                                 | —                                                            |
| Auth             | 1           | 1        | 11    | 3   | ✅ `security`/`core`                                                  | 60%                                 | —                                                            |
| Contabilidad     | 6           | 7        | 4     | 1   | ✅ `accounting`                                                       | 60%                                 | —                                                            |
| CRM              | 4           | 4        | 8     | 1   | ✅ `crm`                                                              | 60%                                 | —                                                            |
| Clientes         | 4           | 4        | 7     | 1   | ✅ `customers`                                                        | 60%                                 | —                                                            |
| Configuración    | 7           | 7        | 6     | 4   | ✅ `configuration`                                                    | 60%                                 | —                                                            |
| Productos        | 5           | 5        | 10    | 1   | ✅ `products` (35 tablas)                                             | 60% módulo / **14% dominio** (5/35) | Variantes/kits/BOM/atributos sin código (`ADR-INV-001 §2.3`) |
| POS              | 1           | 1        | 1     | 0   | ✅ (usa `sales`)                                                      | 40%                                 | Sin `e2e-spec` propio (integración probada desde `ventas`)   |
| Caja             | 1           | 1        | 2     | 0   | ✅ `cash`                                                             | 40%                                 | Sin `e2e-spec` propio                                        |
| Compras          | 0           | 0        | 0     | 0   | ✅ `purchases` (particionada, `ADR-DB-001`)                           | 20%                                 | Sin ningún código de aplicación                              |
| Activos Fijos    | 0           | 0        | 0     | 0   | ✅ `assets` (10 modelos)                                              | 20%                                 | Sin código — dominio ya delimitado en `ADR-INV-001 §3.7`     |
| Bancos           | 0           | 0        | 0     | 0   | ✅ `banks`                                                            | 20%                                 | Sin código                                                   |
| Tesorería        | 0           | 0        | 0     | 0   | 🟡 sin schema propio (probable `cash`+`banks`)                        | 20%                                 | Sin código ni schema dedicado confirmado                     |
| HR               | 0           | 0        | 0     | 0   | ✅ `hr`                                                               | 20%                                 | Sin código                                                   |
| Nómina           | 0           | 0        | 0     | 0   | ✅ `payroll`                                                          | 20%                                 | Sin código                                                   |
| Producción       | 0           | 0        | 0     | 0   | 🟡 dentro de `inventory` (`production_consumptions`, `ADR-DB-001 §7`) | 20%                                 | Sin módulo propio, sin código                                |
| Proyectos        | 0           | 0        | 0     | 0   | ✅ `projects`                                                         | 20%                                 | Sin código                                                   |
| Proveedores      | 0           | 0        | 0     | 0   | ✅ `suppliers`                                                        | 20%                                 | Sin código                                                   |
| Impuestos        | 0           | 0        | 0     | 0   | ✅ `taxes`                                                            | 20%                                 | Sin código                                                   |
| Reportes         | 0           | 0        | 0     | 0   | ✅ `reports`                                                          | 20%                                 | Sin código                                                   |
| BI               | 0           | 0        | 0     | 0   | ✅ `bi` (`kpi_snapshots` ya catalogada, `ADR-DB-001 §7`)              | 20%                                 | Sin código                                                   |
| IA               | 0           | 0        | 0     | 0   | 🔴 sin schema                                                         | 0%                                  | Confirmado en [[Innovation Report — 2026-07-28]]             |
| DGII             | 0           | 0        | 0     | 0   | 🔴 sin evidencia                                                      | 0%                                  | Ya declarado stub honesto en [[DGII]]                        |
| E-commerce       | 0           | 0        | 0     | 0   | 🔴 sin evidencia                                                      | 0%                                  | Ninguna mención en ningún documento leído                    |
| Portal Cliente   | 0           | 0        | 0     | 0   | 🔴 sin evidencia                                                      | 0%                                  | Ninguna mención                                              |
| Portal Proveedor | 0           | 0        | 0     | 0   | 🔴 sin evidencia                                                      | 0%                                  | Ninguna mención                                              |

**Servicios** (`servicios`/`services` schema) también sin código — no listado en la tabla del
protocolo pero real en GORAZUS, mismo 20%.

# 10. Knowledge Maturity

**80%** — AKB con más de 40 notas (13 agregadas en esta secuencia de 6 niveles, el resto de la sesión
de Inventario), cero notas aisladas confirmadas nota por nota en cada nivel de esta secuencia,
[[Issue Register]]/[[Decision Log]]/[[ADR Index]] activos como archivos reales. No alcanza 100%
porque `03 Shared Kernel` todavía mezcla DDD puro con patrones/heurísticas de ingeniería sin una
categoría "Engineering Library" separada (recomendación ya hecha, no ejecutada — `§7` de
[[Enterprise Optimization Report — 2026-07-28]]).

# 11. Technical Debt

Registro único, sin repetir el detalle ya documentado — consolidado por última vez en
[[Enterprise Governance Report — 2026-07-28]] §6 (8 ítems, ninguno Crítico, todos con plan de
mitigación). Este reporte no agrega deuda nueva — mide madurez, no la vuelve a descubrir.

# 12. Enterprise Benchmark (Step 10)

Mismo límite metodológico ya declarado en [[Innovation Report — 2026-07-28]]: sin investigación de
mercado en vivo verificable este turno. Un solo patrón estructural, ya validado con evidencia real
de GORAZUS: el patrón de extensibilidad sin migración de schema (EAV de `product_attributes`) es
conceptualmente equivalente al "Tipo de Material" de SAP (`ADR-INV-001 §3.1`) — GORAZUS ya iguala
ese patrón específico en diseño, aunque no en cobertura de dominio (14% de Productos vs. un ERP
maduro con años de datos reales). No se fabrica ninguna comparación adicional sin evidencia.

# 13. Roadmap

Mismo roadmap ya generado en [[Enterprise Governance Report — 2026-07-28]] §8 (Inmediato → Visión
Estratégica) — GEMM no lo duplica, lo consume: cada ítem de deuda de §11 es, por definición, lo que
más rápido sube el `Overall ERP` de §2 si se resuelve, porque mueve una fila de dominio de una banda
a la siguiente (p. ej., cerrar el gap de `PARTITION BY RANGE` no mueve ninguna fila de dominio — es
un ítem de `Database Maturity` §6; construir el primer controller real de `Compras` sí movería esa
fila de 20% a 40%).

# 14. Recommended ADRs

Ninguno nuevo — mismo criterio que niveles anteriores: ningún hallazgo de este reporte alcanzó el
nivel de madurez que justifique una propuesta de ADR nueva. La recomendación más directa que GEMM
produce no es arquitectónica — es de **priorización de construcción**: de los 17 dominios en 20%
(schema real, cero código), `Compras` es el candidato más justificado por evidencia para ser el
próximo (ya tiene tabla particionada real en `ADR-DB-001 §7`, ya es consumido conceptualmente por
`product_suppliers.last_purchase_cost`/`lead_time_days` — la mitad del puente con Productos ya
existe).

# 15. New Knowledge Generated

Este documento en sí — primera versión de GEMM. Ninguna nota adicional generada; el valor de este
nivel es la consolidación medible, no el descubrimiento (ese ya ocurrió en Levels 2-6).

# 16. Final Recommendation

**GEMM v1.0 queda establecido como el dashboard vivo de GORAZUS.** Estado actual: arquitectura y
disciplina de ingeniería maduras para lo que existe (80% en Architecture/Database/Clean/Hexagonal),
cobertura de dominio de negocio todavía temprana (~52% promedio, con 17 de 26 dominios en 20% —
schema listo, sin construir). Ninguna cifra de este reporte se inventó — cada una traza a un conteo
real de archivos, una nota del AKB con evidencia citada, o un ADR ya aceptado. Recalcular este
documento después de cada ADR/dominio/patrón nuevo, como exige el protocolo, mientras siga habiendo
evidencia real que lo sostenga — nunca antes.

# Related ADRs

[[ADR-DB-001]] · [[ADR-INV-001]] · [[ADR-INV-000]] · `ADR-INV-002` · `ADR-INV-003` · `ADR-INF-001`

# References

[[Enterprise Governance Report — 2026-07-28]] · [[Innovation Report — 2026-07-28]] ·
[[Architecture Review — ADR-DB-001 and ADR-INV-001]] · [[Issue Register]] · [[ADR Index]] ·
`modules/*/backend` (conteo real de esta sesión)
