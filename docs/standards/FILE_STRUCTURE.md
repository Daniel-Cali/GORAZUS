# File Structure — GORAZUS

> EPIC 04 — Implementation Standards. Complementa
> [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) (que se detiene en el nivel de carpeta
> raíz/módulo) bajando al nivel de **archivo dentro de un módulo**. Consolida
> `docs/architecture/02-arquitectura-modulos-backend.md §2` (backend) y
> `docs/frontend/FOLDER_STRUCTURE.md §2` (frontend) en una sola referencia de "qué
> archivo va dónde" — no repite el razonamiento de cada capa, eso vive en esos
> documentos. Sin código.

## 1. Backend — plantilla de archivo (referencia)

```
modules/<dominio>/backend/
├── entities/         # Dominio puro — ver docs/architecture/02 §3 "entities/"
├── repositories/      # Interfaz (puerto) + implementación Prisma — ver 02 §3 "repositories/"
├── services/            # Casos de uso — ver 02 §3 "services/"
├── dto/                   # Tipo derivado del schema Zod — ver 02 §3 "dto/"
├── validators/             # Zod, fuente de verdad de forma de datos — ver 02 §3 "validators/"
├── controllers/              # Traduce HTTP → caso de uso — ver 02 §3 "controllers/"
├── events/                     # Publica/consume eventos de dominio — ver 02 §3 "events/"
├── <dominio>.module.ts           # Wiring de Nest
└── <dominio>.module.spec.ts
```

Detalle completo de cada capa (qué va en `entities/` vs `services/`, la regla de
dependencia hacia adentro): `docs/architecture/02-arquitectura-modulos-backend.md §1-3`.
Este documento no lo repite.

## 2. Frontend — plantilla de archivo (referencia)

```
modules/<dominio>/frontend/
├── components/    # Con conocimiento de negocio — ver docs/frontend/FOLDER_STRUCTURE.md §2
├── pages/           # Destino de una ruta — incluye reportes/ y consultas/ como subcarpetas
├── hooks/             # Datos de servidor, tiempo real — ver docs/frontend/STATE_MANAGEMENT.md §5
├── routes/              # RouteObject[] exportado
└── i18n/                  # Diccionarios del módulo — ver docs/frontend/FRONTEND_ARCHITECTURE.md §8
```

Detalle completo, incluido un ejemplo real completo (`ventas`):
`docs/frontend/FOLDER_STRUCTURE.md §2`. No se repite acá.

## 3. Tabla de decisión: "tengo un archivo nuevo, ¿dónde va?"

La tabla que un desarrollador consulta en la práctica — no estaba consolidada en un
solo lugar antes de este documento:

| Tengo que crear...                                                 | Va en                                                                                                      | Ver también                                                                                                                 |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Una regla de negocio pura (invariante de una entidad)              | `backend/entities/<entidad>.entity.ts`                                                                     | `02 §3`                                                                                                                     |
| Un caso de uso (orquesta entidades + repositorios)                 | `backend/services/<accion>-<entidad>.usecase.ts`                                                           | `02 §3`, [MODULE_GUIDELINES.md §4](./MODULE_GUIDELINES.md#4-cómo-crear-un-servicio-caso-de-uso)                             |
| Un endpoint HTTP nuevo                                             | `backend/controllers/<dominio>.controller.ts` (agregar método, no un archivo nuevo salvo submódulo grande) | `02 §3`                                                                                                                     |
| Un schema de validación                                            | `backend/validators/<accion>-<entidad>.schema.ts`, reexportado en `shared/contracts/`                      | `02 §3`                                                                                                                     |
| Un evento de dominio nuevo                                         | `backend/events/<entidad>-<participio>.event.ts`                                                           | `02 §3`, [ARCHITECTURE_RULES.md §4](./ARCHITECTURE_RULES.md#4-comunicación-entre-módulos-las-dos-formas-válidas-y-solo-dos) |
| Un componente de UI sin negocio, reutilizable por cualquier módulo | `ui-kit/components/{primitives,form,data-table,charts,layout}/`                                            | `docs/frontend/UI_GUIDELINES.md §1`                                                                                         |
| Un componente con conocimiento de negocio                          | `modules/<dominio>/frontend/components/`                                                                   | `docs/frontend/FOLDER_STRUCTURE.md §2`                                                                                      |
| Una página nueva (pantalla del catálogo)                           | `modules/<dominio>/frontend/pages/<nombre>.page.tsx`                                                       | [MODULE_GUIDELINES.md §6](./MODULE_GUIDELINES.md#6-cómo-crear-una-página)                                                   |
| Un hook de datos de servidor                                       | `modules/<dominio>/frontend/hooks/use-<recurso>.ts`                                                        | [MODULE_GUIDELINES.md §5](./MODULE_GUIDELINES.md#5-cómo-crear-un-hook)                                                      |
| Un tipo/schema compartido FE↔BE del módulo                         | `modules/<dominio>/shared/contracts/`                                                                      | `02 §3`, `docs/frontend/API_LAYER.md §2`                                                                                    |
| Un tipo verdaderamente transversal a TODOS los módulos             | `packages/contracts/` — solo vía ADR                                                                       | `docs/architecture/06-comunicacion-entre-modulos.md §3`                                                                     |
| Una utilidad de infraestructura (cache, DB, mensajería)            | `core/<área>/`                                                                                             | `docs/architecture/01 §2`                                                                                                   |
| Un test unitario                                                   | Colocado junto al archivo que testea, sufijo `.spec.ts` (backend) / `.test.ts(x)` (frontend)               | [TESTING_GUIDELINES.md](./TESTING_GUIDELINES.md)                                                                            |

## 4. Qué NO se crea nunca

Consolidado de reglas ya fijadas en distintos documentos, repetido acá porque es
la pregunta inversa a la tabla de §3 y es igual de frecuente:

- **`services/`/`repositories/` en `frontend/`** — no existen, el hook de TanStack
  Query es la capa de datos (`docs/architecture/03 §1`).
- **Un archivo que declara una tabla en el schema de otro módulo** — prohibido
  siempre, ver [DATABASE_GUIDELINES.md §3](./DATABASE_GUIDELINES.md#3-nunca-fk-entre-schemas-de-módulos-distintos).
  regla completa en `docs/architecture/02 §4`.
  Cada módulo declara sus tablas exclusivamente en su propio archivo `sql/NN_<schema>.sql`.
- **Un componente de `ui-kit/` que importa algo de `modules/*`** — rompería la regla
  de que `ui-kit/` nunca depende de negocio (`docs/frontend/FOLDER_STRUCTURE.md §6`).
- **Un archivo de configuración de Nx/TypeScript duplicado a mano** — se extiende el
  base (`tsconfig.base.json`, `project.json` generado por Nx), nunca se copia y pega
  configuración completa por módulo.

## 5. Trazabilidad

| Punto                     | Ya fijado en                           | Cerrado/detallado acá        |
| ------------------------- | -------------------------------------- | ---------------------------- |
| Plantilla backend         | `docs/architecture/02 §2`              | Referencia (§1)              |
| Plantilla frontend        | `docs/frontend/FOLDER_STRUCTURE.md §2` | Referencia (§2)              |
| "¿Dónde va este archivo?" | Ninguno — disperso en 5+ documentos    | Tabla de decisión única (§3) |
| Qué no se crea nunca      | Disperso                               | Consolidado (§4)             |
