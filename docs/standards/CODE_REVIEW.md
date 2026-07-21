# Code Review — GORAZUS

> EPIC 04 — Implementation Standards. Consolida `docs/architecture/07-convenciones-y-estandares.md §3`
> (Git) y `docs/architecture/11-gobernanza-y-adrs.md §4` (quién aprueba qué) en el
> proceso completo de revisión — y cierra el **checklist obligatorio de PR
> explícitamente pedido por el EPIC**, que no existía en ningún documento anterior.
> Sin código.

## 1. Quién revisa qué (referencia)

Tabla de aprobación ya fijada en `docs/architecture/11-gobernanza-y-adrs.md §4`, no
repetida completa — síntesis operativa:

| Tipo de cambio                                           | Aprobación necesaria                                                                                     |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Código dentro de un módulo, sin tocar su fachada pública | Dueño del módulo (CODEOWNERS)                                                                            |
| Cambio en `index.ts` de un módulo                        | Dueño del módulo + revisión de los módulos consumidores declarados                                       |
| Nueva dependencia entre módulos                          | ADR + actualización de `docs/architecture/06-comunicacion-entre-modulos.md` si introduce un patrón nuevo |
| Cambio en Shared Kernel (`packages/contracts`)           | ADR obligatorio                                                                                          |
| Cambio de infraestructura (`core/`, `infra/`)            | ADR + checklist de extraibilidad                                                                         |

CODEOWNERS por módulo ya fijado en `docs/architecture/07-convenciones-y-estandares.md §3`
— cada carpeta de `modules/<x>/` tiene un dueño declarado en `.github/CODEOWNERS`.

## 2. Git (referencia y checklist)

Ya fijado completo en `07-convenciones §3`, no repetido: trunk-based development,
ramas de feature de corta vida (`feat/<módulo>-<descripción>`), Conventional Commits
con el módulo como scope (`feat(ventas): ...`). Un PR que modifica más de un módulo de
negocio a la vez es **señal de alerta, no bloqueo automático** — se revisa con más
atención por posible violación de fronteras
([ARCHITECTURE_RULES.md §2](./ARCHITECTURE_RULES.md#2-regla-de-fronteras-de-módulo-nx-enforcement-referencia)).

## 3. Qué verifica un revisor (más allá del checklist de PR de §5)

No estaba enumerado como guía de revisor — se fija acá como la lista de preguntas
que un revisor humano hace, distinta del checklist mecánico que CI ya verifica:

1. **¿El cambio respeta la frontera de módulo?** —
   [ARCHITECTURE_RULES.md §2,4](./ARCHITECTURE_RULES.md#2-regla-de-fronteras-de-módulo-nx-enforcement-referencia).
   Si el lint de Nx ya lo bloquea, el revisor no necesita re-verificarlo a mano —
   pero si el PR introduce una dependencia nueva entre módulos, el revisor confirma
   que está declarada y, si hace falta, que tiene su ADR.
2. **¿La lógica de negocio está en la capa correcta?** — un controller con un `if` de
   regla de negocio, o un componente de frontend que llama directo a Prisma
   (imposible por Nx, pero verificar la intención), son señales de capa incorrecta
   (`docs/architecture/02 §1,3`).
3. **¿El test cubre el comportamiento, no solo ejecuta el código?** — un test que
   pasa sin aserciones reales (`expect(true).toBe(true)`) no cuenta, aunque suba el
   número de cobertura.
4. **¿El naming sigue [NAMING_CONVENTIONS.md](./NAMING_CONVENTIONS.md)?** — en
   particular, el mapeo módulo↔schema (§5 de ese documento) si el PR toca SQL.
5. **¿Hay un `catch` vacío o un `any` fuera de la frontera de librería externa?** —
   rechazo directo, sin negociación ([CODING_STANDARDS.md §8](./CODING_STANDARDS.md#8-qué-está-prohibido-síntesis-detalle-disperso-en-el-resto-del-set)).
6. **¿El PR agrega la pieza de documentación que le corresponde?** —
   [DOCUMENTATION_GUIDELINES.md §6](./DOCUMENTATION_GUIDELINES.md#6-cuándo-actualizar-documentación-vs-cuándo-no-hace-falta).

## 4. Tamaño y alcance de un PR

No estaba fijado como guía — se agrega:

- Un PR se corresponde con **una** unidad de cambio coherente (un caso de uso, una
  pantalla, un endpoint) — no una colección de cambios no relacionados agrupados por
  conveniencia de tiempo.
- Un PR que crece por scope creep durante la revisión (el autor sigue agregando
  commits de temas distintos al original) se divide, no se sigue creciendo.
- Excepción explícita: el andamiado inicial de un módulo nuevo
  ([MODULE_GUIDELINES.md §1](./MODULE_GUIDELINES.md#1-cómo-crear-un-módulo-nuevo)) es
  legítimamente un PR grande porque es una sola unidad de cambio coherente
  ("este módulo existe"), no una colección de cambios dispares.

## 5. Checklist obligatorio antes de cada Pull Request

**El checklist explícitamente pedido por el EPIC.** Se coloca en la plantilla de PR
de GitHub (`.github/pull_request_template.md`) para que sea imposible de omitir sin
notarlo — un PR que no lo completa no entra a revisión humana:

### General

- [ ] El PR corresponde a una única unidad de cambio coherente (§4).
- [ ] Naming verificado contra [NAMING_CONVENTIONS.md](./NAMING_CONVENTIONS.md).
- [ ] Ningún archivo nuevo viola [FILE_STRUCTURE.md §3-4](./FILE_STRUCTURE.md#3-tabla-de-decisión-tengo-un-archivo-nuevo-dónde-va).
- [ ] `lint`/`format` pasan localmente antes de abrir el PR (no se delega a CI el
      primer intento).

### Arquitectura

- [ ] Ninguna violación de [ARCHITECTURE_RULES.md §2,4](./ARCHITECTURE_RULES.md#2-regla-de-fronteras-de-módulo-nx-enforcement-referencia)
      (fronteras de módulo, comunicación entre módulos).
- [ ] Si agrega una dependencia entre módulos nueva: declarada explícitamente, con
      ADR si corresponde ([ARCHITECTURE_RULES.md §7](./ARCHITECTURE_RULES.md#7-cuándo-una-decisión-requiere-adr)).
- [ ] Si toca base de datos: sin FK entre schemas distintos, 18 columnas universales
      presentes ([DATABASE_GUIDELINES.md §9](./DATABASE_GUIDELINES.md#9-checklist-de-salida-toda-tablacolumna-nueva)).

### Seguridad

- [ ] Sin secreto commiteado ([SECURITY_GUIDELINES.md §4](./SECURITY_GUIDELINES.md#4-secretos-y-credenciales)).
- [ ] Autorización verificada en backend, no solo ocultada en frontend
      ([SECURITY_GUIDELINES.md §2](./SECURITY_GUIDELINES.md#2-autorización-referencia)).
- [ ] Si agrega un endpoint: validación Zod presente, guards de auth+permiso en orden
      ([API_GUIDELINES.md §2](./API_GUIDELINES.md#2-cómo-crear-un-endpoint-nuevo-procedimiento)).

### Testing

- [ ] Test escrito en el mismo PR, no prometido para después
      ([TESTING_GUIDELINES.md §7](./TESTING_GUIDELINES.md#7-checklist-de-salida-todo-pr-con-código-nuevo)).
- [ ] Cobertura acorde a la capa tocada, no un test trivial para inflar el número.

### Frontend (si aplica)

- [ ] Componente ubicado correctamente (`ui-kit/` vs. módulo,
      [COMPONENT_GUIDELINES.md §1](./COMPONENT_GUIDELINES.md#1-cómo-decidir-si-un-componente-va-en-ui-kit-o-en-el-módulo)).
- [ ] Ambos temas (claro/oscuro) y accesibilidad básica verificados si es un
      componente nuevo de `ui-kit/`.
- [ ] Sin `services/`/`repositories/` reintroducidos en `frontend/`.

### Documentación

- [ ] `README.md` del módulo actualizado si el PR crea/modifica la fachada pública
      ([DOCUMENTATION_GUIDELINES.md §2](./DOCUMENTATION_GUIDELINES.md#2-readme-de-módulo)).
- [ ] `docs/00-roadmap-fases.md` y/o `CHANGELOG.md` actualizados si el PR cierra una
      fase o introduce un cambio visible para el resto del equipo (ver
      [CHANGELOG.md](../../CHANGELOG.md)).

## 6. Qué bloquea un PR sin negociación (síntesis)

| Bloqueo                                     | Motivo                                   |
| ------------------------------------------- | ---------------------------------------- |
| Falla el lint de fronteras de Nx            | Violación de arquitectura, no de estilo  |
| `catch` vacío                               | Oculta fallos (`CODING_STANDARDS.md §4`) |
| `any` fuera de frontera de librería externa | Rompe tipado estricto                    |
| Sin test para comportamiento nuevo          | `TESTING_GUIDELINES.md §7`               |
| Secreto commiteado                          | `SECURITY_GUIDELINES.md §4`              |
| FK entre schemas de módulos distintos       | `ARCHITECTURE_RULES.md §8`               |
| Autorización verificada solo en frontend    | `SECURITY_GUIDELINES.md §2`              |

## 7. Trazabilidad

| Punto pedido en el EPIC     | Ya fijado en                                                          | Cerrado/detallado acá                 |
| --------------------------- | --------------------------------------------------------------------- | ------------------------------------- |
| Cómo hacer Code Review      | `11-gobernanza-y-adrs.md §4` (aprobación), `07-convenciones §3` (Git) | Guía de revisor + tamaño de PR (§3-4) |
| Checklist obligatorio de PR | Ninguno — nunca existió                                               | Checklist completo por categoría (§5) |
