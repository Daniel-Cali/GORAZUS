# Documentation Guidelines — GORAZUS

> EPIC 04 — Implementation Standards. Consolida la convención de comentarios de código
> ([CODING_STANDARDS.md §3](./CODING_STANDARDS.md#3-comentarios-cuándo-sí-cuándo-no)),
> el `README.md` mínimo por módulo (`docs/architecture/07-convenciones-y-estandares.md §8`)
> y la plantilla de ADR (`docs/architecture/11-gobernanza-y-adrs.md §2`) en un único
> procedimiento de "cómo documentar" — y fija el meta-patrón de numeración que todo
> el proyecto ya usa implícitamente sin haberlo escrito nunca. Sin código.

## 1. El meta-patrón de `docs/` (nuevo — nunca escrito explícitamente)

Cada subcarpeta de `docs/` (`architecture/`, `database/`, `menus/`, `product/`,
`frontend/`, `standards/`) sigue el mismo patrón, aplicado de forma consistente en
todo el proyecto sin que ningún documento lo haya declarado como regla hasta ahora:

1. Archivos numerados (`00-`, `01-`, `02-`...) en el orden en que se leen si alguien
   viene de cero — el número es orden de lectura, no orden de creación.
2. Un `README.md` (o `00-convenciones.md` en `docs/menus/`) que indexa todos los
   documentos de la carpeta con una descripción de una línea cada uno.
3. Un documento "00" o "vista consolidada" que resume el conjunto y señala dónde
   vive el detalle normativo completo (`docs/architecture/00-arquitectura-general.md`,
   `docs/database/00-modelo-general.md`) — **este patrón no aplica a `docs/product/`,
   `docs/frontend/` ni `docs/standards/`** porque son sets más chicos y cohesivos
   donde un documento consolidado adicional sería redundante con su propio README de
   índice; se aplica cuando el set es grande y con múltiples ángulos de lectura
   posibles (arquitectura, base de datos).
4. Cada documento nuevo declara al principio, en una nota de alcance, qué documentos
   existentes extiende y qué no repite — el patrón "Trazabilidad" al final de cada
   documento (tabla de qué se cerró y qué ya estaba fijado) es obligatorio en todo
   documento de `docs/architecture/`, `docs/frontend/` y `docs/standards/` desde que
   se adoptó (documentos anteriores a esa adopción no se reescriben retroactivamente,
   mismo criterio de `docs/architecture/11-gobernanza-y-adrs.md §3`).

**Regla dura que aplica a los 6 sets:** ningún documento nuevo repite contenido ya
fijado en otro — lo referencia. Es la aplicación literal, a nivel de documentación,
del principio DRY ya fijado para código (`docs/architecture/01-estructura-monorepo.md §2`).

## 2. README de módulo

Plantilla ya fijada en `docs/architecture/07-convenciones-y-estandares.md §8` — cada
`modules/<x>/README.md` responde, sin extenderse más de lo necesario:

1. ¿Qué responsabilidad tiene este módulo?
2. ¿De qué entidades es dueño?
3. ¿De qué otros módulos depende (síncrono) y a qué eventos reacciona (asíncrono)?
4. ¿Qué eventos publica?

Se escribe **desde el primer commit** del módulo (`docs/architecture/11-gobernanza-y-adrs.md §1`,
paso 2) — no se pospone "para cuando el módulo esté más maduro". Un módulo sin
`README.md` completo no pasa [CODE_REVIEW.md](./CODE_REVIEW.md) en su PR inicial.

## 3. Architecture Decision Record (ADR)

Plantilla completa ya fijada en `docs/architecture/11-gobernanza-y-adrs.md §2`, no
repetida — 4 secciones: Contexto, Decisión, Alternativas consideradas, Consecuencias.
Se escribe en `docs/adr/NNNN-titulo-en-kebab-case.md` cuando la decisión dispara
alguno de los criterios ya fijados en
[ARCHITECTURE_RULES.md §7](./ARCHITECTURE_RULES.md#7-cuándo-una-decisión-requiere-adr).
Diferencia con los documentos numerados de `docs/architecture/`: el ADR registra
**por qué se llegó ahí** y queda como historia aunque la decisión se reemplace; el
documento numerado refleja el **estado actual acordado** (`11 §2`, última línea).

## 4. Comentarios de código (referencia)

Criterio completo ya fijado en
[CODING_STANDARDS.md §3](./CODING_STANDARDS.md#3-comentarios-cuándo-sí-cuándo-no) — un
comentario explica por qué, nunca qué; sin bloques de cabecera con autor/historial
(eso es Git). No se repite acá.

## 5. Documentación de API (nuevo — no estaba decidido)

No existía una decisión sobre generación de documentación de API navegable (Swagger/
OpenAPI) — se fija acá, apoyado en decisiones ya cerradas:

- **OpenAPI generado desde los decoradores de NestJS** (`@nestjs/swagger` o
  equivalente) — nunca escrito a mano en paralelo al controller, para que no diverja
  del contrato real. El schema Zod de cada endpoint
  ([API_GUIDELINES.md §2](./API_GUIDELINES.md#2-cómo-crear-un-endpoint-nuevo-procedimiento))
  alimenta la generación, no se duplica una segunda definición de forma de datos.
- Publicado en un endpoint de solo lectura del propio `apps/api` (`/api/docs` o
  equivalente), no como archivo estático que se desactualiza.
- Esto cierra parcialmente el punto 29 (Documentación) del roadmap maestro
  (`docs/00-indice-maestro.md`, 🟡 Parcial — "documentación de API/OpenAPI generada"
  era uno de los pendientes explícitos ahí).

## 6. Cuándo actualizar documentación vs. cuándo no hace falta

No estaba fijado como criterio — se cierra acá porque es una fuente común de
fricción ("¿tengo que tocar documentación por esto?"):

| Cambio                                                               | ¿Requiere actualizar documentación?                                                                                     |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Nuevo endpoint, tabla, módulo, evento de dominio                     | Sí — `README.md` del módulo como mínimo (§2)                                                                            |
| Cambio de comportamiento visible desde otro módulo (fachada pública) | Sí — el documento de arquitectura del módulo si existe, y `README.md`                                                   |
| Refactor interno sin cambio de comportamiento observable             | No, salvo que el refactor invalide un ejemplo ya escrito en un documento existente                                      |
| Bug fix que no cambia contrato ni comportamiento de negocio esperado | No                                                                                                                      |
| Nueva regla de negocio no obvia                                      | Sí — como comentario en el código (§4) y, si afecta a más de un módulo, en el documento de arquitectura correspondiente |

## 7. Checklist de salida (documentación)

- [ ] `README.md` de módulo completo si el PR crea o modifica la fachada pública.
- [ ] ADR creado si la decisión dispara alguno de los criterios de
      [ARCHITECTURE_RULES.md §7](./ARCHITECTURE_RULES.md#7-cuándo-una-decisión-requiere-adr).
- [ ] Ningún contenido nuevo duplica lo ya fijado en otro documento — se referencia.
- [ ] Sección "Trazabilidad" agregada si el documento es de `docs/architecture/`,
      `docs/frontend/` o `docs/standards/`.

## 8. Trazabilidad

| Punto pedido en el EPIC  | Ya fijado en                                           | Cerrado/detallado acá                                  |
| ------------------------ | ------------------------------------------------------ | ------------------------------------------------------ |
| Cómo crear documentación | Disperso (`07-convenciones §8`, `11-gobernanza §2`)    | Procedimiento único + meta-patrón nunca escrito (§1-3) |
| Comentarios de código    | `CODING_STANDARDS.md §3`                               | Referencia (§4)                                        |
| Documentación de API     | Ninguno (gap de `docs/00-indice-maestro.md`, punto 29) | Decisión cerrada: OpenAPI generado (§5)                |
| Cuándo documentar        | Ninguno                                                | Tabla de criterio (§6)                                 |
