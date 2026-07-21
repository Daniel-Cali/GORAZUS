# Coding Standards — GORAZUS

> EPIC 04 — Implementation Standards. Cierra un gap real: ningún documento anterior
> fijaba estilo de código a nivel de TypeScript/comentarios/complejidad — solo naming
> (`docs/architecture/07-convenciones-y-estandares.md §1`, ver
> [NAMING_CONVENTIONS.md](./NAMING_CONVENTIONS.md)) y estructura de capas
> (`docs/architecture/02,03`). Este documento fija el resto. Sin código (ejemplos
> ilustrativos cortos permitidos, mismo criterio que el resto de `docs/architecture/`).

## 1. TypeScript estricto (nuevo — no estaba fijado a nivel de configuración)

- `strict: true` en `tsconfig.base.json` sin excepciones por módulo — ningún
  `modules/<x>/tsconfig.json` relaja `strict` para "ir más rápido"; es deuda técnica
  invisible que contradice "Enterprise, no MVP"
  ([[feedback-gorazus-architect-role]]).
- `any` está **prohibido** salvo en la frontera con una librería de terceros sin
  tipos, y en ese caso se aísla en un único archivo de tipado (`*.d.ts` o un adaptador
  tipado) — nunca se propaga `any` a la lógica de negocio.
- `unknown` es el default seguro para datos de origen externo (respuesta de red antes
  de validar con Zod, `catch (error: unknown)`) — nunca `any` como atajo.
- Tipos derivados de Zod (`z.infer<typeof schema>`), nunca definiciones paralelas a
  mano que puedan divergir del schema real — ya fijado como principio en
  `docs/architecture/02-arquitectura-modulos-backend.md §3` ("dto/"), generalizado
  acá a todo el codebase.
- `readonly` en propiedades de entidades de dominio y en arrays/tipos que no deben
  mutarse tras construirse — el compilador es la primera línea de defensa contra
  mutación accidental de un objeto de dominio.

## 2. Estilo de función y clase

- **Una función, una responsabilidad** — si el nombre de una función necesita "y"
  (`validarYGuardar`), es señal de que son dos funciones. Aplica el mismo principio
  SOLID ya fijado a nivel de servicio/hook (`docs/architecture/01-estructura-monorepo.md §2`,
  `docs/frontend/STATE_MANAGEMENT.md §5`) a nivel de función individual.
- **Longitud como señal, no como regla dura**: una función que no cabe en una
  pantalla sin scroll es candidata a dividirse — no hay un límite de líneas exacto
  impuesto artificialmente, pero una función de 100+ líneas en un caso de uso es
  señal de que mezcla orquestación con detalle que debería vivir en un método de
  entidad o en una función auxiliar con nombre propio.
- **Parámetros:** más de 3 parámetros posicionales → objeto de opciones tipado
  (`{ ventaId, motivo }` en vez de `(ventaId, motivo, forzar, notificar)`) — mejora
  legibilidad en el call site y evita errores de orden.
- **Early return** sobre anidamiento de `if`/`else` — un método de caso de uso que
  valida precondiciones las corta con `return`/`throw` temprano, no acumula niveles
  de indentación.
- **Sin exports por defecto** (`export default`) — solo exports nombrados. Razón
  técnica: los exports nombrados se re-exportan de forma explícita y verificable en
  el barrel `index.ts` de cada módulo (`docs/architecture/01-estructura-monorepo.md §4`),
  mientras que un `export default` puede renombrarse silenciosamente en cada import,
  lo que dificulta hacer `grep` de dónde se usa un símbolo en un monorepo de este
  tamaño.

## 3. Comentarios: cuándo sí, cuándo no

No estaba fijado — se cierra acá con un criterio único, aplicado sin excepción en
todo el codebase (backend y frontend):

- Un comentario explica **por qué**, nunca **qué** — el código ya dice qué hace si
  los nombres son correctos (§2, §NAMING_CONVENTIONS). Un comentario que describe
  literalmente la línea siguiente (`// suma el total` sobre `total += linea.monto`)
  se elimina, no se escribe.
- Se comenta: una restricción no obvia del dominio (`// IVA se calcula sobre el neto,
no sobre el bruto — confirmado con contabilidad`), un workaround de un bug
  específico de una librería, una decisión que un lector razonablemente cuestionaría
  sin contexto.
- **No se comentea código muerto** (`// código viejo, por si acaso`) — se borra; el
  historial de Git es el mecanismo de recuperación, no un comentario.
- Ningún archivo lleva un bloque de comentario de cabecera con autor/fecha/historial
  — esa información ya vive en Git (`git blame`, `git log`) y un comentario de
  cabecera queda desactualizado la primera vez que otra persona toca el archivo.

## 4. Manejo de errores (código, no UI — ver [ERROR_HANDLING.md de docs/frontend/](../frontend/ERROR_HANDLING.md) para el caso de UI)

- **Backend:** toda excepción de dominio extiende una base común de `core/http`
  (ya fijado en `docs/architecture/05-flujo-de-datos.md §3`) — nunca se lanza un
  `Error` genérico de JavaScript ni un string como excepción.
- Un `catch` que no puede manejar el error realmente **no atrapa** — deja propagar
  (o relanza con contexto adicional) en vez de un `catch (e) {}` vacío o un
  `console.log` que oculta el fallo. Un `catch` vacío es motivo de rechazo directo en
  code review (ver [CODE_REVIEW.md](./CODE_REVIEW.md)).
- Nunca se usa una excepción para control de flujo normal (p. ej. lanzar y atrapar
  para "salir temprano" de un loop) — excepciones son para lo verdaderamente
  excepcional, `return`/`break` para flujo esperado.

## 5. Inmutabilidad y efectos secundarios

- Se prefiere transformación (`map`, `filter`, spread) sobre mutación in-place de
  arrays/objetos recibidos como parámetro — una función no muta el objeto que le
  pasaron salvo que su propio nombre lo indique explícitamente (`venta.confirmar()`
  como método de la propia entidad es la excepción intencional: la entidad muta su
  propio estado interno, `docs/architecture/02-arquitectura-modulos-backend.md §3`).
- Efectos secundarios (I/O, publicar un evento, escribir a disco) se concentran en
  los bordes de la capa de aplicación (`services/`) — el dominio (`entities/`) es
  100% puro y determinístico, ya fijado en `02 §3`, aplicado acá como regla de
  estilo de código, no solo de capa.

## 6. Magic numbers y strings

- Ningún literal de negocio suelto en medio de la lógica (`if (dias > 30)`) —
  se nombra como constante (`UPPER_SNAKE_CASE`, ya fijado en
  [NAMING_CONVENTIONS.md §2](./NAMING_CONVENTIONS.md#2-código-typescript-referencia-tabla-ya-fijada))
  con el número de negocio explícito (`DIAS_MAXIMOS_CREDITO`). Excepción obvia: `0`,
  `1`, `-1` en contextos evidentes (índices, incrementos) no necesitan nombre.
- Ningún string de estado/código comparado a mano (`if (estado === 'confirmada')`)
  cuando existe un catálogo/enum ya modelado (`<entidad>_status`, ver
  [DATABASE_GUIDELINES.md §5](./DATABASE_GUIDELINES.md#5-patrones-de-tabla-por-nombre-referencia)) —
  se usa la constante/tipo generado desde ese catálogo, nunca el string literal
  repetido en múltiples archivos.

## 7. Formateo automático (herramientas, referencia)

- **ESLint** (`eslint.config.mjs`, ya en la raíz del repo) + **Prettier**
  (`.prettierrc`, ya en la raíz) son la fuente de verdad del formato — ningún
  desarrollador discute indentación/comillas/punto y coma en code review, lo decide
  la herramienta.
- Reglas de fronteras de módulo (`@nx/enforce-module-boundaries`, ya fijadas en
  `docs/architecture/01-estructura-monorepo.md §5`) corren como parte del mismo
  lint — un import prohibido falla el build, no es una observación de revisor.
- `lint`/`format` corren en pre-commit (hook) y en CI — un PR con errores de lint no
  llega a revisión humana, se corrige antes.

## 8. Qué está prohibido (síntesis, detalle disperso en el resto del set)

| Prohibido                                                      | Por qué                                                  | Detalle                                                            |
| -------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------ |
| `any` fuera de la frontera de librería externa                 | Rompe la garantía de tipado estricto (§1)                | §1                                                                 |
| `export default`                                               | Dificulta trazabilidad de símbolos en el monorepo (§2)   | §2                                                                 |
| `catch` vacío                                                  | Oculta fallos silenciosamente (§4)                       | §4                                                                 |
| Comentario que describe el "qué" en vez del "por qué"          | Ruido, se desactualiza (§3)                              | §3                                                                 |
| Mutación de parámetros recibidos (fuera de métodos de entidad) | Rompe previsibilidad, dificulta debugging (§5)           | §5                                                                 |
| Literal de negocio sin nombre                                  | Dificulta mantenimiento, oculta la regla de negocio (§6) | §6                                                                 |
| Código muerto comentado                                        | Ruido, Git ya es el historial (§3)                       | §3                                                                 |
| `services/`/`repositories/` en frontend                        | Ya prohibido en `docs/architecture/03 §1`                | [FILE_STRUCTURE.md §4](./FILE_STRUCTURE.md#4-qué-no-se-crea-nunca) |

## 9. Trazabilidad

| Punto                      | Ya fijado en                                                    | Cerrado/detallado acá              |
| -------------------------- | --------------------------------------------------------------- | ---------------------------------- |
| TypeScript estricto        | Ninguno — implícito                                             | Reglas explícitas (§1)             |
| Estilo de función/clase    | Ninguno                                                         | §2                                 |
| Comentarios                | Ninguno                                                         | Criterio único (§3)                |
| Manejo de errores (código) | `docs/architecture/05-flujo-de-datos.md §3` (contrato)          | Regla de estilo de `catch` (§4)    |
| Inmutabilidad              | `docs/architecture/02 §3` (dominio puro)                        | Generalizado a todo el código (§5) |
| Magic numbers/strings      | Ninguno                                                         | §6                                 |
| Formateo                   | Herramientas ya en el repo (`eslint.config.mjs`, `.prettierrc`) | Regla de enforcement en CI (§7)    |
