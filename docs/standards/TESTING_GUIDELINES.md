# Testing Guidelines — GORAZUS

> EPIC 04 — Implementation Standards. Consolida `docs/architecture/07-convenciones-y-estandares.md §5`
> (pirámide backend) y `docs/frontend/TESTING.md` (frontend) en un procedimiento único
> de "cómo escribir un test" — cierra parcialmente el gap de
> `docs/00-roadmap-fases.md` Fase 30 (🟡 Parcial: "falta estrategia QA dedicada —
> cobertura por módulo, datos de prueba, regresión entre módulos"), específicamente el
> criterio de cobertura y el procedimiento de escritura; no cierra la fase completa
> (ver §6). Sin código.

## 1. La pirámide (referencia)

Ya fijada completa en `docs/architecture/07-convenciones-y-estandares.md §5`:

| Capa                           | Qué se testea                                | Herramienta                 |
| ------------------------------ | -------------------------------------------- | --------------------------- |
| `entities/`                    | Invariantes de dominio, sin mocks            | Jest                        |
| `services/` (casos de uso)     | Orquestación, con repositorio fake/in-memory | Jest                        |
| `repositories/`                | Query real contra Postgres de test           | Jest + testcontainers       |
| `controllers/`                 | Contrato HTTP                                | Jest + supertest            |
| `frontend/hooks`, `components` | Comportamiento de UI                         | Vitest + Testing Library    |
| Flujo entre módulos            | Caso de negocio real end-to-end              | Jest e2e (`apps/api-e2e`)   |
| Flujo de usuario en navegador  | —                                            | Playwright (`apps/web-e2e`) |

No se prioriza el mismo nivel de cobertura e2e para todos los módulos por igual — se
prioriza donde el costo de un bug es alto (ventas, compras, caja, contabilidad, POS)
sobre pantallas de solo consulta. Regla ya fijada, aplicada sin excepción.

## 2. Cómo escribir un test — backend (procedimiento)

1. **Entidad** (`<entidad>.entity.spec.ts`): un test por invariante — dado un estado
   inválido propuesto, la entidad lanza; dado uno válido, aplica la transición. Sin
   mocks, sin Nest, sin base de datos (`docs/architecture/02 §2`).
2. **Caso de uso** (`<accion>-<entidad>.usecase.spec.ts`): repositorio fake/in-memory
   inyectado — se testea la orquestación (¿llama a las entidades correctas? ¿publica
   el evento correcto? ¿abre/cierra la transacción?), no la query SQL real.
3. **Repositorio** (`<entidad>.repository.prisma.spec.ts`): contra Postgres real de
   test (testcontainers) — es la única capa que valida que la query SQL hace lo que
   el nombre del método promete.
4. **Controller** (`<dominio>.controller.spec.ts`, supertest): contrato HTTP completo
   — status code, forma de `{data,meta}`/`{error}`, que el guard de permiso rechaza
   sin el permiso correcto.
5. **Escribir el test en el mismo cambio que el código**, no después — un PR que
   agrega un caso de uso sin su test no pasa [CODE_REVIEW.md](./CODE_REVIEW.md).

## 3. Cómo escribir un test — frontend (procedimiento)

Consolidado de `docs/frontend/TESTING.md §2-3`, no repetido completo:

1. **Hook de datos** (`use-<recurso>.test.ts`): que la `queryKey` se construye
   correctamente, que la validación Zod de la respuesta rechaza un payload inválido,
   que una mutación invalida las queries correctas.
2. **Componente** (`<nombre>.test.tsx`): renderizado condicional por estado
   (vacío/cargando/error), interacción de usuario dispara el callback/mutación
   esperada.
3. **Mocking de red**: MSW, nunca mockear `useQuery` directamente — intercepta a
   nivel de `fetch`, corre el cliente HTTP real incluidos sus interceptores
   (`docs/frontend/TESTING.md §3`, `docs/frontend/API_LAYER.md §1,3`).
4. **Página** (`<nombre>.page.test.tsx`): smoke test de que la página compone sus
   hooks + componentes sin crashear en sus 3-4 estados principales — no repite los
   casos borde ya cubiertos a nivel de componente.
5. **E2E** (Playwright, `apps/web-e2e`): un flujo por caso de negocio crítico, no por
   pantalla — contra el stack Dockerizado completo, con datos de prueba seed
   determinísticos.

## 4. Criterio de cobertura (nuevo — no estaba fijado como número)

No existía un umbral explícito — se fija acá, diferenciado por capa (un único número
global de cobertura para todo el monorepo sería una métrica vanidosa, no una señal
útil):

| Capa                       | Objetivo de cobertura                                           | Motivo                                                                                                      |
| -------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `entities/` (dominio)      | 100% de invariantes con test                                    | Es la capa más barata de testear (sin mocks) y la más costosa de dejar sin cubrir (bug de regla de negocio) |
| `services/` (casos de uso) | Todo camino feliz + todo camino de error de negocio documentado | Es donde vive la orquestación real                                                                          |
| `repositories/`            | Cada método público, al menos un test contra Postgres real      | Es la única capa que valida SQL real                                                                        |
| `controllers/`             | Contrato de cada endpoint (2xx + 4xx principales)               | No se testea two veces la lógica ya cubierta en `services/`                                                 |
| Componentes de `ui-kit/`   | Comportamiento + accesibilidad de cada variante pública         | Se usa en 25 módulos, un bug ahí se multiplica                                                              |
| Componentes de módulo      | Camino feliz + estados de `docs/product/09_WIREFRAMES.md`       | No se persigue 100% de líneas, se persigue cobertura de estado de UI                                        |

**Regla que se antepone al número:** un PR no se bloquea por no alcanzar un
porcentaje agregado arbitrario — se revisa si el código nuevo/modificado tiene test
para su comportamiento observable, criterio cualitativo sobre cuantitativo (evita el
antipatrón de tests triviales escritos solo para inflar un número de cobertura).

## 5. Datos de prueba (nuevo — cierra parte del gap de Fase 30)

- **Unitario/integración** (Jest/Vitest): fixtures construidos en código, mínimos y
  explícitos por test — nunca un fixture JSON gigante compartido entre decenas de
  tests que nadie entiende completo.
- **E2E** (`apps/web-e2e`, `apps/api-e2e`): seed determinístico por test, sin
  reutilizar estado entre tests para evitar dependencias de orden de ejecución
  (`docs/frontend/TESTING.md §4`) — mecanismo de seed ya existe en
  `infra/scripts/` (`docs/architecture/01-estructura-monorepo.md §2`), reutilizado,
  no reinventado por `web-e2e`.
- **Nunca datos de producción** (reales o anonimizados de forma incompleta) como
  fixture de test — todo dato de prueba es sintético desde su origen.

## 6. Qué queda fuera de este documento (transparencia sobre la Fase 30)

Este documento cierra el procedimiento de escritura de test y el criterio de
cobertura por capa — **no** cierra completamente la Fase 30 del roadmap. Quedan
pendientes, sin diseñar acá por no tener necesidad de negocio confirmada al momento
de escribir este documento:

- **Regresión entre módulos a escala** (más allá de los flujos e2e críticos ya
  priorizados en §1) — requeriría una matriz de qué combinaciones de módulos se
  re-testean ante un cambio, no diseñada todavía.
- **Performance testing** más allá del ya fijado en
  `docs/frontend/TESTING.md §6`/`docs/frontend/PERFORMANCE.md §1` (Lighthouse CI del
  lado frontend) — no hay equivalente de carga/estrés diseñado para el backend
  todavía.

Se documentan acá para que no se descubran tarde, siguiendo el mismo criterio de
transparencia que el resto del proyecto (`docs/00-roadmap-fases.md`).

## 7. Checklist de salida (todo PR con código nuevo)

- [ ] Test escrito en el mismo cambio, no en un PR posterior.
- [ ] Cobertura acorde a la capa tocada (§4), no un porcentaje arbitrario.
- [ ] Sin datos de producción como fixture.
- [ ] Si el cambio toca un flujo crítico (ventas/compras/caja/contabilidad/POS):
      verificar si necesita actualización del e2e correspondiente.

## 8. Trazabilidad

| Punto pedido en el EPIC                       | Ya fijado en                                                                       | Cerrado/detallado acá                             |
| --------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------- |
| Cómo escribir tests                           | `07-convenciones §5` (herramienta por capa), `docs/frontend/TESTING.md` (frontend) | Procedimiento paso a paso (§2-3)                  |
| Criterio de cobertura                         | Ninguno                                                                            | Tabla por capa (§4)                               |
| Datos de prueba                               | Ninguno (mencionado como gap en Fase 30)                                           | Cerrado parcialmente (§5)                         |
| Regresión entre módulos / performance backend | Ninguno (gap de Fase 30)                                                           | Explícitamente fuera de alcance, documentado (§6) |
