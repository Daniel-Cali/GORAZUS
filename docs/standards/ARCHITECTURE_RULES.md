# Architecture Rules — GORAZUS

> EPIC 04 — Implementation Standards. Este es el documento de **"qué está permitido,
> qué está prohibido"** a nivel arquitectónico — consolida las reglas duras ya
> fijadas en `docs/architecture/01,02,06,09,11` en una sola lista verificable, sin
> repetir su justificación completa (eso vive en esos documentos). Es el documento que
> un revisor de PR consulta cuando sospecha una violación de frontera — ver
> [CODE_REVIEW.md](./CODE_REVIEW.md). Sin código.

## 1. Regla de dependencia de capas (Clean Architecture, referencia)

Las dependencias de un módulo backend apuntan siempre hacia adentro:
`interfaz → aplicación → dominio`, nunca al revés. Ya fijado completo en
`docs/architecture/02-arquitectura-modulos-backend.md §1`. Verificación práctica: el
dominio (`entities/`) no importa nada de NestJS, Prisma ni HTTP — si un archivo de
`entities/` tiene un `import` de `@nestjs/*` o `@prisma/*`, es una violación.

## 2. Regla de fronteras de módulo (Nx enforcement, referencia)

Tabla completa ya fijada en `docs/architecture/01-estructura-monorepo.md §5` y su
extensión frontend en `docs/frontend/FOLDER_STRUCTURE.md §6` — no se repite completa.
Síntesis verificable:

| ✅ Permitido                                                                                                                          | ❌ Prohibido                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `modules/<x>/backend` importa `core/*`, `packages/contracts`, `modules/<y>/index.ts` (dependencia declarada)                          | `modules/<x>/backend` importa `modules/<y>/backend/*` directo         |
| `modules/<x>/frontend` importa `ui-kit/*`, `packages/contracts`, `modules/<x>/shared`, `modules/<y>/index.ts` (dependencia declarada) | `modules/<x>/frontend` importa cualquier `backend/*` (propio o ajeno) |
| `apps/api` importa `modules/*/backend`, `core/*`                                                                                      | `apps/api` importa `frontend/*` de cualquier módulo                   |
| `apps/web` importa `modules/*/frontend`, `ui-kit/*`                                                                                   | `apps/web` importa `backend/*` de cualquier módulo                    |

Enforcement: `@nx/enforce-module-boundaries` — una dependencia no declarada **falla el
build**, no es una observación de revisor humano. Si el build no falla ante una
violación de esta tabla, el lint está mal configurado, no la regla está mal aplicada.

## 3. La frontera dura: `index.ts`

Cada `modules/<x>/index.ts` es lo único que otro módulo puede importar de `<x>`
(`docs/architecture/01 §4`). Regla de verificación: si un archivo de otro módulo
importa algo de `modules/<x>/` que **no** pasa por su `index.ts`
(`modules/<x>/backend/repositories/foo` importado directo, por ejemplo), es una
violación aunque el lint de Nx no la capture por algún hueco de configuración — el
lint es el mecanismo, esta regla es la intención que protege.

## 4. Comunicación entre módulos: las dos formas válidas, y solo dos

Ya fijado completo en `docs/architecture/06-comunicacion-entre-modulos.md §1`, no se
repite el detalle — síntesis de las únicas dos formas válidas:

1. **Síncrona in-process**, a través del servicio exportado en `index.ts` — para
   cuando la respuesta se necesita en el mismo request-response.
2. **Asíncrona vía eventos de dominio** (RabbitMQ, incluso en fase de monolito) —
   para reacciones a hechos ya ocurridos.

**Todo lo demás es inválido**, lista explícita ya fijada en `06 §2` (repetida acá por
ser la más citada en revisión de PR): importar un archivo interno de otro módulo,
leer la tabla de otro módulo con query directa, una FK de Postgres entre schemas de
módulos distintos, un módulo modificando el estado de una entidad que no le
pertenece.

## 5. Shared Kernel: qué entra y qué no

`packages/contracts` es el único código que todos los módulos importan sin que cuente
como dependencia módulo-a-módulo (`06 §3`). Regla de admisión: **value objects
universales y contexto transversal únicamente** (`Money`, `TenantId`, `UserContext`,
tipos de error base) — nunca un concepto de negocio de un módulo específico
(`Cliente`, `Producto`). Cada adición pasa por ADR (§7) porque se vuelve casi
imposible de cambiar después sin tocar todos los módulos.

## 6. Patrón "módulo dueño"

Toda entidad compartida entre módulos (`Cliente`, `Producto`, `CuentaContable`) tiene
**un único dueño** — el resto la referencia por ID o consume una proyección de solo
lectura publicada por el dueño, nunca la duplica ni la escribe
(`06 §4`, ya fijado con el ejemplo completo de `Cliente`). Regla de verificación:
si un módulo tiene una tabla/entidad con el mismo nombre conceptual que la de otro
módulo dueño, es una señal de duplicación a corregir, no una coincidencia inocente.

## 7. Cuándo una decisión requiere ADR

Tabla de aprobación ya fijada en `docs/architecture/11-gobernanza-y-adrs.md §4`, no
repetida completa. Síntesis de qué dispara un ADR obligatorio (no opcional):

- Cambio en el Shared Kernel (§5).
- Nueva dependencia declarada entre dos módulos que antes no se conocían.
- Cambio de infraestructura (`core/`, `infra/`) que afecte el checklist de
  extraibilidad a microservicio.
- Cualquier decisión "costosa de revertir" que afecte a más de un módulo (criterio
  general de `11 §2`).

Plantilla de ADR: `docs/architecture/11-gobernanza-y-adrs.md §2` — no se repite acá.

## 8. Base de datos: reglas de arquitectura (referencia, detalle en DATABASE_GUIDELINES)

- SQL crudo es la fuente de verdad; Prisma es consumidor vía introspección, nunca
  dueño del schema (`docs/architecture/02 §4`).
- Un schema de Postgres por módulo — un módulo nunca declara una tabla en el schema
  de otro (`02 §4`).
- Sin FK de Postgres entre schemas de módulos de negocio distintos, sin excepción
  (`02 §4`, `docs/database/01-modelo-conceptual.md §1.5`) — referencias cruzadas son
  IDs sueltos.
- Detalle completo en [DATABASE_GUIDELINES.md](./DATABASE_GUIDELINES.md).

## 9. Extraibilidad a microservicio (referencia)

Ninguna regla nueva acá — el checklist completo de qué hace a un módulo ya
extraíble vive en `docs/architecture/10-evolucion-a-microservicios.md §2`. Se cita
porque es el criterio último contra el que se mide cualquier ambigüedad de las reglas
de §1-8: si una decisión de diseño haría más difícil extraer un módulo a servicio
propio el día de mañana, es una violación del principio rector aunque no viole
ninguna regla mecánica de lint.

## 10. Matriz de "permitido / prohibido" (síntesis operativa)

| Acción                                                                             | Permitido | Prohibido                                                                                                                     |
| ---------------------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Importar `index.ts` de un módulo declarado como dependencia                        | ✅        | —                                                                                                                             |
| Importar archivo interno de otro módulo                                            | —         | ❌ Siempre                                                                                                                    |
| Leer tabla de otro módulo con query directa                                        | —         | ❌ Siempre                                                                                                                    |
| FK de Postgres entre schemas de módulos distintos                                  | —         | ❌ Siempre                                                                                                                    |
| Publicar evento de dominio tras confirmar transacción                              | ✅        | —                                                                                                                             |
| Publicar evento de dominio a mitad de una transacción sin confirmar                | —         | ❌ Siempre (`docs/architecture/02 §3`)                                                                                        |
| Modificar entidad de la que el módulo no es dueño, aunque sea técnicamente posible | —         | ❌ Siempre                                                                                                                    |
| Agregar un tipo de negocio de un módulo al Shared Kernel                           | —         | ❌ Sin ADR                                                                                                                    |
| Agregar una dependencia entre módulos no declarada previamente                     | —         | ❌ Sin ADR                                                                                                                    |
| Relajar `strict` de TypeScript en un módulo específico                             | —         | ❌ Ver [CODING_STANDARDS.md §1](./CODING_STANDARDS.md#1-typescript-estricto-nuevo--no-estaba-fijado-a-nivel-de-configuración) |

## 11. Trazabilidad

| Punto                         | Ya fijado en                                    | Cerrado/detallado acá                                 |
| ----------------------------- | ----------------------------------------------- | ----------------------------------------------------- |
| Regla de dependencia de capas | `docs/architecture/02 §1`                       | Referencia + verificación práctica (§1)               |
| Fronteras de módulo (Nx)      | `01 §5`, `docs/frontend/FOLDER_STRUCTURE.md §6` | Síntesis en una tabla (§2)                            |
| Comunicación entre módulos    | `06-comunicacion-entre-modulos.md`              | Síntesis de las 2 formas válidas (§4)                 |
| Shared Kernel                 | `06 §3`                                         | Regla de admisión (§5)                                |
| Módulo dueño                  | `06 §4`                                         | Regla de verificación (§6)                            |
| ADR obligatorio               | `11-gobernanza-y-adrs.md §4`                    | Síntesis de disparadores (§7)                         |
| Base de datos                 | `02 §4`                                         | Referencia — detalle en `DATABASE_GUIDELINES.md` (§8) |
| Matriz permitido/prohibido    | Ninguna — dispersa                              | Tabla única consolidada (§10)                         |
