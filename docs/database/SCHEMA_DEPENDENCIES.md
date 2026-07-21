# Schema Dependencies — GORAZUS

> "Database Enterprise v1.0" — Fase 1, Parte 2 (2026-07-21, rama
> `feature/database-audit`). El grafo de dependencias entre schemas **ya
> existe** en
> [DATABASE_DEPENDENCIES.md](./DATABASE_DEPENDENCIES.md) (generado
> 2026-07-16/17, con el hallazgo real de 185 FK cross-schema ya
> documentado) — este documento no lo duplica: lo referencia y agrega
> exactamente lo que esa pasada no cubría todavía — cohesión/acoplamiento
> **por schema individual** (no solo el grafo global) y una verificación
> explícita de dependencias circulares.

## 1. Grafo de dependencias (referencia, no repetido)

Ver el diagrama Mermaid completo y las dependencias síncronas/asíncronas
críticas en
[DATABASE_DEPENDENCIES.md §2-3](./DATABASE_DEPENDENCIES.md#2-dependencias-críticas-síncronas-in-process).
No se reproduce aquí.

## 2. Acoplamiento real (hallazgo heredado)

**185 FK reales cruzan schemas de módulos de negocio distintos** —
contradice la regla ya documentada de "ID suelto entre módulos" (ver
[FOREIGN_KEYS.md §3](./FOREIGN_KEYS.md#3-hallazgo-real-185-fk-cruzan-schemas-de-módulos-de-negocio)).
Re-confirmado hoy sin cambios (mismo número que la auditoría del
2026-07-20). **No se corrige en esta parte** — requiere ADR y decisión de
negocio sobre qué reemplaza la integridad referencial que hoy proveen esas
FK (mismo criterio ya aplicado en las 3 auditorías previas de esta sesión).

## 3. Acoplamiento por schema (nuevo — no existía desglosado por schema individual)

| Schema          | Dependencias salientes (de qué depende)                   | Dependencias entrantes (quién depende de él)                         | Evaluación de acoplamiento                                                                                   |
| --------------- | --------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `core`          | Ninguna (schema fundacional)                              | Los 21 restantes (FK universal `tenant_id`/`company_id`/`branch_id`) | Esperado y correcto — `core` es la base, no un módulo de negocio par                                         |
| `configuration` | `core`                                                    | `customers`, `suppliers`, `products`, `hr`, prácticamente todos      | Bajo — es un catálogo puro, sin lógica de negocio propia                                                     |
| `security`      | `core` (usuarios)                                         | Ninguno de negocio (solo consumido por `auth`/middleware técnico)    | Bajo                                                                                                         |
| `customers`     | `configuration`                                           | `sales`, `crm`, `accounting` (cuenta corriente)                      | Medio — 3 consumidores, pero vía patrón módulo-dueño (proyección/consulta, no escritura)                     |
| `suppliers`     | `configuration`                                           | `purchases`, `banks`                                                 | Bajo                                                                                                         |
| `products`      | `configuration`                                           | `inventory`, `sales`, `purchases`, `produccion` (vía `inventory`)    | Medio-alto — es el maestro más consumido después de `core`, consistente con ser Supporting Subdomain central |
| `inventory`     | `products`                                                | `sales`, `purchases`, `produccion`                                   | Medio — dueño único del stock, consumido pero nunca escrito desde afuera                                     |
| `sales`         | `customers`, `products`, `inventory`, `taxes`             | `contabilidad`, `caja`, `crm` (vía comando síncrono), `proyectos`    | Alto — es el Core Subdomain con más dependencias salientes, esperado para el ciclo de venta completo         |
| `purchases`     | `suppliers`, `products`, `taxes`                          | `contabilidad`, `bancos`                                             | Medio                                                                                                        |
| `cash`          | `configuration`                                           | `contabilidad`                                                       | Bajo                                                                                                         |
| `banks`         | `configuration`                                           | `contabilidad`, `tesoreria` (solo lectura)                           | Bajo                                                                                                         |
| `accounting`    | Ninguna dependencia síncrona — consumidor puro de eventos | Ninguno (es el sumidero)                                             | **El mejor caso posible de acoplamiento** — 0 dependencias salientes de negocio, por diseño                  |
| `taxes`         | `configuration`                                           | `sales`, `purchases`, `contabilidad`                                 | Bajo-medio                                                                                                   |
| `hr`            | `configuration`                                           | `nomina`, `proyectos`                                                | Bajo                                                                                                         |
| `payroll`       | `hr`                                                      | `contabilidad`, `bancos`                                             | Bajo                                                                                                         |
| `crm`           | `customers`                                               | `ventas` (comando síncrono)                                          | Bajo                                                                                                         |
| `services`      | `customers`                                               | `contabilidad`, `ventas` (garantías)                                 | Bajo                                                                                                         |
| `projects`      | `sales`, `purchases`, `hr`                                | Ninguno                                                              | Medio (3 dependencias salientes, 0 entrantes — módulo "hoja" del grafo)                                      |
| `assets`        | Ninguna                                                   | `contabilidad`                                                       | Bajo                                                                                                         |
| `reports`, `bi` | Todos (solo lectura)                                      | Ninguno                                                              | Por diseño — son proyecciones, no participan del grafo de escritura                                          |

**Ningún schema individual muestra alta cohesión + alto acoplamiento
simultáneo** (la combinación que indicaría un schema mal delimitado) — los
de mayor acoplamiento (`sales`, `products`) son también los de mayor
cohesión interna (todas sus tablas pertenecen inequívocamente a su propio
dominio), consistente con ser Core/Supporting Subdomains centrales, no con
una mezcla de responsabilidades.

## 4. Dependencias circulares (entregable, verificación explícita)

**0 encontradas.** Verificado por inspección del grafo completo de §1 +
la tabla de §3: siguiendo cualquier cadena de dependencia saliente
(`sales → inventory → products → configuration → core`), ningún schema
vuelve a aparecer en su propia cadena. Regla ya fijada como error de build,
no advertencia
([docs/architecture/06-comunicacion-entre-modulos.md §1a](../architecture/06-comunicacion-entre-modulos.md#a-síncrona-in-process--a-través-de-la-fachada-pública)).

## 5. Riesgos detectados (entregable 4)

| Riesgo                                                                           | Severidad            | Detalle                                                                                                                                                                                                                                                         |
| -------------------------------------------------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 185 FK cross-schema (acoplamiento físico no previsto por el diseño)              | 🟠 Media-alta        | Ver §2 — pendiente de ADR                                                                                                                                                                                                                                       |
| `sales` con 55 tablas y el mayor número de dependencias salientes                | 🟡 Baja              | Tamaño y acoplamiento esperados para el Core Subdomain central del ciclo de venta — no es un riesgo de diseño, es monitoreable si crece más allá de lo razonable en fases futuras                                                                               |
| Dependencia transversal no modelada: mantenimiento de particiones (`pg_partman`) | 🟡 Baja, ya mitigada | Todo schema con tablas particionadas depende del mecanismo de aprovisionamiento — ya operativo (0 de 27 sin aprovisionar), ver [DATABASE_DEPENDENCIES.md §4](./DATABASE_DEPENDENCIES.md#4-tablas-particionadas-y-su-dependencia-de-mantenimiento-hallazgo-real) |

## 6. Preparación para microservicios / Clean Architecture

Ya evaluado explícitamente en
[docs/architecture/10-evolucion-a-microservicios.md](../architecture/10-evolucion-a-microservicios.md) —
el patrón módulo-dueño + eventos de dominio (no FK) es exactamente lo que
permite que un schema se extraiga a servicio propio sin romper consistencia
transaccional. La única fricción real para esa extracción futura son las
185 FK cross-schema de §2 (una FK física no sobrevive a una extracción de
servicio) — razón adicional, ya señalada, para resolver ese hallazgo antes
de cualquier extracción real (no antes de esta auditoría).

## 7. Trazabilidad

| Punto pedido                | Cerrado en                                                                                                                                                |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dependencias entre schemas  | §1 (referencia)                                                                                                                                           |
| Dependencias circulares     | §4 — 0 encontradas                                                                                                                                        |
| Dependencias innecesarias   | Ninguna encontrada — cada dependencia saliente de §3 corresponde a una necesidad de negocio real ya documentada en `04-catalogo-modulos-negocio.md`       |
| Acoplamiento excesivo       | §3 (por schema) + §2 (hallazgo heredado, 185 FK)                                                                                                          |
| Violaciones de arquitectura | §2 — la única violación real ya conocida, gobernada, no nueva                                                                                             |
| Diagrama de dependencias    | Ver [DATABASE_DIAGRAM.md](./DATABASE_DIAGRAM.md) y [DATABASE_DEPENDENCIES.md §2](./DATABASE_DEPENDENCIES.md#2-dependencias-críticas-síncronas-in-process) |

**Siguiente documento:** [DATABASE_DIAGRAM.md](./DATABASE_DIAGRAM.md).
