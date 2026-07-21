# Module Guidelines — GORAZUS

> EPIC 04 — Implementation Standards. Procedimientos paso a paso — "cómo crear X" —
> para los artefactos de nivel de módulo/backend pedidos explícitamente por el EPIC:
> módulo, hook, servicio, página. Cada procedimiento cita el documento normativo que
> ya fijó el _por qué_; este documento fija el _orden de pasos_ concreto, que no
> existía en ningún lugar como checklist accionable. Ver
> [COMPONENT_GUIDELINES.md](./COMPONENT_GUIDELINES.md) para componente/tabla/formulario.
> Sin código.

## 1. Cómo crear un módulo nuevo

Procedimiento completo, consolidando `docs/architecture/11-gobernanza-y-adrs.md §1`
(los 6 pasos ya fijados) con los documentos de detalle que cada paso requiere:

1. **Confirmar necesidad de negocio real** — no se crea un módulo especulativo
   (`11 §1`, paso 1). Si la necesidad no está confirmada, se documenta como
   "pendiente de definición de alcance" en `docs/00-roadmap-fases.md`, no se empieza.
2. **Definir antes de escribir código:** nombre en español (ubiquitous language), de
   qué entidades es dueño, con qué módulos colabora (síncrono) y a qué eventos
   reacciona (asíncrono) — documentado en el `README.md` del módulo desde el primer
   commit (ver [DOCUMENTATION_GUIDELINES.md §2](./DOCUMENTATION_GUIDELINES.md#2-readme-de-módulo)).
3. **Agregar la fila en `docs/architecture/04-catalogo-modulos-negocio.md`** y, si
   corresponde, la especificación de menú en `docs/menus/` — sin esto el módulo no
   tiene fuente de verdad de qué pantallas expone (ver
   `docs/product/07_SCREEN_CATALOG.md §2` para el método de catalogar pantallas).
4. **Resolver el nombre de schema de base de datos** consultando
   [NAMING_CONVENTIONS.md §5](./NAMING_CONVENTIONS.md#5-mapeo-módulo-español--schema-inglés) —
   si el módulo nuevo no está en esa tabla, se agrega ahí primero, no se improvisa un
   nombre de schema al escribir el primer archivo SQL.
5. **Crear la carpeta** siguiendo exactamente la plantilla de
   [FILE_STRUCTURE.md §1-2](./FILE_STRUCTURE.md#1-backend--plantilla-de-archivo-referencia)
   (`docs/architecture/01 §4`, `02`, `03`).
6. **Declarar tags de Nx** (`scope:<modulo>`) y dependencias permitidas — sin esto el
   módulo queda aislado por defecto (fail-safe, `11 §1` paso 5) y no puede importar ni
   ser importado.
7. **Registrar el módulo en el shell** (`apps/web/src/app/app-shell/module-registry.ts`,
   ver `docs/frontend/FEATURES.md §5`) con su permiso base `.ver`.
8. **Escribir el primer archivo SQL** del módulo (`sql/NN_<schema>.sql`) siguiendo
   [DATABASE_GUIDELINES.md](./DATABASE_GUIDELINES.md) — las 18 columnas universales
   sin excepción, sin FK a otro schema de módulo.

Checklist de salida antes de considerar el módulo "creado" (no implementado, solo
andamiado): README con las 4 preguntas de `07-convenciones-y-estandares.md §8`
respondidas, entrada en el catálogo de módulos, tags de Nx declarados, carpeta
completa con los 4 archivos/carpetas de `01 §4` (`backend/`, `frontend/`, `shared/`,
`index.ts`).

## 2. Cómo crear una entidad de dominio

1. Confirmar quién es el dueño (patrón "módulo dueño",
   [ARCHITECTURE_RULES.md §6](./ARCHITECTURE_RULES.md#6-patrón-módulo-dueño)) — una
   entidad nunca se crea "por si otro módulo la necesita después".
2. Archivo `backend/entities/<entidad>.entity.ts` — clase TypeScript plana, sin
   decoradores de framework (`docs/architecture/02 §3`).
3. Los invariantes de negocio van como métodos que lanzan si el estado propuesto es
   inválido (`entidad.confirmar()`, nunca `entidad.estado = 'x'` desde afuera).
4. Test unitario en el mismo momento, no después — `<entidad>.entity.spec.ts`, sin
   mocks (100% testeable sin Nest ni base de datos, `02 §2`). Ver
   [TESTING_GUIDELINES.md §2](./TESTING_GUIDELINES.md#2-cómo-escribir-un-test--backend-procedimiento).
5. Si la entidad tiene ciclo de vida transaccional complejo (más de 2-3 estados con
   transiciones válidas/inválidas), se modela con el patrón `_status`/`_status_history`
   a nivel de base de datos (`docs/database/02-modelo-logico.md §1.1`) — se decide en
   este paso, no se agrega a mitad de implementación.

## 3. Cómo crear un repositorio

1. Definir primero la **interfaz** (`backend/repositories/<entidad>.repository.ts`) —
   solo los métodos que la capa de aplicación necesita (`findById`, `save`,
   `findPendientesPorX`), nunca detalles de Prisma en la firma pública
   (`docs/architecture/02 §3`).
2. Implementar el adaptador Prisma (`<entidad>.repository.prisma.ts`) que satisface
   esa interfaz — consulta contra el schema resuelto en
   [NAMING_CONVENTIONS.md §5](./NAMING_CONVENTIONS.md#5-mapeo-módulo-español--schema-inglés).
3. Registrar el binding en `<modulo>.module.ts`
   (`{ provide: <Entidad>Repository, useClass: <Entidad>RepositoryPrisma }`, ejemplo
   completo en `docs/architecture/02 §5`).
4. Nunca se accede a la tabla de otro módulo desde este repositorio — si hace falta
   un dato de otro módulo, se pide su servicio público (§4 siguiente), no una query
   directa (`docs/architecture/02 §3`, "Ningún módulo accede a las tablas de otro
   módulo directamente").

## 4. Cómo crear un servicio (caso de uso)

1. Un caso de uso = una clase con un método público `execute()`, o agrupado en un
   service más amplio cuando la cohesión lo justifica (KISS,
   `docs/architecture/02 §3`) — no se fuerza un archivo por acción trivial.
2. Archivo `backend/services/<accion>-<entidad>.usecase.ts` (naming ya fijado en
   [NAMING_CONVENTIONS.md §3](./NAMING_CONVENTIONS.md#3-sufijos-de-archivo-por-capa-referencia)).
3. Toda transacción de base de datos (`prisma.$transaction`) se abre y cierra en este
   archivo, nunca en el controller ni en el repositorio (`02 §3`).
4. Si el caso de uso necesita datos de otro módulo: inyectar su servicio público
   (`index.ts` del módulo dueño) — nunca su repositorio interno
   ([ARCHITECTURE_RULES.md §4](./ARCHITECTURE_RULES.md#4-comunicación-entre-módulos-las-dos-formas-válidas-y-solo-dos)).
5. Publicar el/los eventos de dominio al **final** de la operación exitosa, después
   de confirmar la transacción, nunca antes (`02 §3`, `docs/architecture/05-flujo-de-datos.md §1`).
6. Test con repositorio fake/in-memory (`docs/architecture/07-convenciones-y-estandares.md §5`) —
   ver [TESTING_GUIDELINES.md §2](./TESTING_GUIDELINES.md#2-cómo-escribir-un-test--backend-procedimiento).

## 5. Cómo crear un hook (frontend)

Procedimiento completo, apoyado en la taxonomía de 6 categorías ya fijada
(`docs/architecture/29-frontend-enterprise.md §4`,
[docs/frontend/STATE_MANAGEMENT.md §5](../frontend/STATE_MANAGEMENT.md#5-taxonomía-de-hooks-aplicada)):

1. **Identificar la categoría antes de escribir una línea** — datos de servidor,
   tiempo real, formulario, autorización, UI genérica, o estado global. Un hook nunca
   mezcla dos categorías (regla dura, `docs/frontend/STATE_MANAGEMENT.md §5`).
2. **Datos de servidor** (`use-<recurso>.ts`, la categoría más común): define la
   `queryKey` siguiendo la convención `[modulo, recurso, ...params]`
   ([docs/frontend/STATE_MANAGEMENT.md §2.1](../frontend/STATE_MANAGEMENT.md#21-convención-de-queryKey)),
   fija el `staleTime` según el tipo de dato
   ([§2.2](../frontend/STATE_MANAGEMENT.md#22-staletimegctime-por-tipo-de-dato)), valida
   la respuesta contra el mismo schema Zod del backend
   ([docs/frontend/API_LAYER.md §2](../frontend/API_LAYER.md#2-contratos-tipados-zod-compartido)).
3. **Mutación**: invalida explícitamente las `queryKey` afectadas en `onSuccess`
   ([docs/frontend/STATE_MANAGEMENT.md §2.3](../frontend/STATE_MANAGEMENT.md#23-invalidación-tras-mutación)) —
   nunca depende de refetch automático como única estrategia en pantallas
   transaccionales.
4. Archivo en `modules/<x>/frontend/hooks/`, exportado sin pasar por `index.ts` del
   módulo salvo que otro módulo necesite reutilizarlo explícitamente
   (`docs/frontend/FEATURES.md §2`).
5. Test con MSW interceptando la request real
   ([docs/frontend/TESTING.md §3](../frontend/TESTING.md#3-mocking-de-la-capa-de-datos-nuevo)).

## 6. Cómo crear una página

1. Confirmar el arquetipo de `docs/product/09_WIREFRAMES.md` que le corresponde
   (Lista/Tabla, Formulario de captura, Detalle de documento, Dashboard, Modal) —
   consultando `docs/product/07_SCREEN_CATALOG.md` si la pantalla ya está catalogada,
   nunca se inventa un layout nuevo sin pasar primero por
   [docs/frontend/UI_GUIDELINES.md §2](../frontend/UI_GUIDELINES.md#2-los-6-arquetipos-de-pantalla-referencia).
2. Archivo `modules/<x>/frontend/pages/<nombre>.page.tsx` (naming, §NAMING_CONVENTIONS).
3. Componer: hooks de datos (§5 arriba) + componentes de `ui-kit/` del arquetipo
   correspondiente + componentes propios del módulo si hace falta conocimiento de
   negocio (`docs/architecture/03 §2`).
4. Agregar la ruta a `modules/<x>/frontend/routes/<x>.routes.tsx` con su permiso en
   `handle` ([docs/frontend/ROUTING.md §5.2](../frontend/ROUTING.md#52-autorización)).
5. Si la página es de alto tránsito combinado con otra (listado→detalle), evaluar
   agrupación de chunk ([docs/frontend/PERFORMANCE.md §2](../frontend/PERFORMANCE.md#2-code-splitting-y-lazy-loading)).
6. Declarar su clasificación de Alcance Empresa/Sucursal si la página es nueva y el
   módulo no la tiene ya definida (`docs/product/07_SCREEN_CATALOG.md §5`,
   [docs/frontend/FEATURES.md §6](../frontend/FEATURES.md#6-alcance-empresasucursal-a-nivel-de-feature)).
7. Test de integración (smoke test de sus 3-4 estados principales) —
   [TESTING_GUIDELINES.md §3](./TESTING_GUIDELINES.md#3-cómo-escribir-un-test--frontend-procedimiento).

## 7. Checklist de salida (todo módulo/hook/servicio/página nuevo)

- [ ] Naming verificado contra [NAMING_CONVENTIONS.md](./NAMING_CONVENTIONS.md).
- [ ] Ubicación de archivo verificada contra [FILE_STRUCTURE.md §3](./FILE_STRUCTURE.md#3-tabla-de-decisión-tengo-un-archivo-nuevo-dónde-va).
- [ ] Ninguna violación de [ARCHITECTURE_RULES.md §2,4](./ARCHITECTURE_RULES.md#2-regla-de-fronteras-de-módulo-nx-enforcement-referencia).
- [ ] Test escrito en el mismo cambio, no en uno posterior.
- [ ] Documentación mínima actualizada si aplica (`README.md` del módulo,
      [DOCUMENTATION_GUIDELINES.md](./DOCUMENTATION_GUIDELINES.md)).

## 8. Trazabilidad

| Procedimiento pedido en el EPIC | Cerrado en |
| ------------------------------- | ---------- |
| Cómo crear un módulo            | §1         |
| Cómo crear un servicio          | §4         |
| Cómo crear un hook              | §5         |
| Cómo crear una página           | §6         |
