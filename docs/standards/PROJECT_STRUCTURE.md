# Project Structure — GORAZUS

> EPIC 04 — Implementation Standards. Este documento es el **mapa de orientación de
> más alto nivel** del repositorio — referencia `docs/architecture/01-estructura-monorepo.md`
> como fuente de verdad y no repite su justificación (por qué Nx, por qué `modules/`
> separado de `apps/`). Para el detalle de archivos **dentro** de un módulo/feature, ver
> [FILE_STRUCTURE.md](./FILE_STRUCTURE.md) — este documento se detiene en el nivel de
> carpeta raíz y de módulo. Sin código.

## 1. El árbol raíz (referencia)

```
GORAZUS/
├── apps/            # Composition roots — api (NestJS), web (React 19+Vite), api-e2e, web-e2e
├── modules/          # El corazón del ERP — 27 dominios de negocio, uno por carpeta
├── core/              # Infraestructura técnica transversal (NO negocio)
├── ui-kit/             # Design system compartido del frontend
├── packages/            # Librerías puras sin dependencia de framework (contracts, tooling)
├── infra/                 # Docker, Kubernetes, Nginx, scripts
├── docs/                    # Toda la documentación del proyecto (§3)
├── nx.json, pnpm-workspace.yaml, tsconfig.base.json, package.json
```

Árbol completo y justificación de cada carpeta:
`docs/architecture/01-estructura-monorepo.md §2`. Este documento no lo repite —
lo usa como punto de partida para responder la pregunta operativa que un
desarrollador nuevo hace primero: **"¿dónde pongo este archivo?"**

## 2. Regla de oro para ubicar cualquier archivo nuevo

Antes de crear un archivo, responder en orden:

1. **¿Es lógica de negocio de un dominio específico?** → `modules/<dominio>/backend/`
   o `modules/<dominio>/frontend/`, nunca en `apps/`.
2. **¿Es infraestructura técnica sin negocio (cache, DB, mensajería)?** → `core/`.
3. **¿Es un componente de UI sin conocimiento de negocio?** → `ui-kit/`.
4. **¿Es un tipo/contrato que TODOS los módulos pueden usar sin declarar
   dependencia?** → `packages/contracts` — y pasa primero por el proceso de ADR
   (`docs/architecture/06-comunicacion-entre-modulos.md §3`, ver
   [ARCHITECTURE_RULES.md §5](./ARCHITECTURE_RULES.md#5-shared-kernel-qué-entra-y-qué-no)).
5. **¿Ensambla módulos ya existentes sin contener lógica propia?** → `apps/api` o
   `apps/web` — composition roots, nunca lógica de negocio (`01 §3`).

Si la respuesta no es clara con estas cinco preguntas, es señal de que el archivo no
debería existir todavía sin antes decidir a qué módulo pertenece — no se crea "por
ahora en algún lado" para decidir después (`docs/architecture/11-gobernanza-y-adrs.md §1`).

## 3. Mapa de `docs/` (dónde vive cada tipo de documentación)

No estaba consolidado en un solo lugar — se fija acá como referencia rápida:

| Carpeta                     | Qué contiene                                                                              | Documento de entrada                           |
| --------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `docs/architecture/`        | Decisiones de arquitectura backend/frontend/infraestructura, uno por módulo de negocio    | `docs/architecture/README.md`                  |
| `docs/database/`            | Modelo de datos completo, fuente de verdad del schema SQL                                 | `docs/database/README.md`                      |
| `docs/menus/`               | Especificación de navegación/menú por módulo (formularios, acciones, reportes, consultas) | `docs/menus/00-convenciones.md`                |
| `docs/product/`             | Producto/UX: visión, personas, journeys, flujos, wireframes, catálogo de pantallas        | `docs/product/01_PRODUCT_VISION.md`            |
| `docs/frontend/`            | Arquitectura de frontend a nivel de implementación (EPIC 03)                              | `docs/frontend/README.md`                      |
| `docs/standards/`           | Este set — estándares de implementación (EPIC 04)                                         | `docs/standards/README.md`                     |
| `docs/adr/`                 | Architecture Decision Records                                                             | `docs/architecture/11-gobernanza-y-adrs.md §2` |
| `docs/00-indice-maestro.md` | Qué documentación existe, mapeada contra los 31 puntos originales del pedido              | —                                              |
| `docs/00-roadmap-fases.md`  | En qué orden se construye, estado de cada fase                                            | —                                              |

## 4. Anatomía de un módulo (referencia)

```
modules/<dominio>/
├── backend/     # Ver docs/architecture/02-arquitectura-modulos-backend.md
├── frontend/     # Ver docs/architecture/03-arquitectura-modulos-frontend.md, docs/frontend/FOLDER_STRUCTURE.md
├── shared/         # Contratos Zod, tipos, constantes compartidos FE↔BE de ESTE módulo
├── index.ts          # Barrel público — frontera dura, ver ARCHITECTURE_RULES.md §3
└── README.md           # Ver DOCUMENTATION_GUIDELINES.md §2
```

Ya fijado en `docs/architecture/01-estructura-monorepo.md §4`. Los 27 módulos de
negocio están listados en `docs/architecture/04-catalogo-modulos-negocio.md` — este
documento no repite esa lista, ver
[NAMING_CONVENTIONS.md §5](./NAMING_CONVENTIONS.md#5-mapeo-módulo-español--schema-inglés)
para el mapeo completo nombre de carpeta ↔ schema de base de datos.

## 5. Qué NO va en la raíz del monorepo

Regla explícita, no estaba enumerada:

- **Ningún archivo de configuración por módulo en la raíz** — cada módulo tiene su
  propio `project.json`/`tsconfig.json` de Nx dentro de su carpeta, la raíz solo
  tiene la configuración base (`tsconfig.base.json`) que los módulos extienden.
- **Ningún script de una sola vez ("script.js", "test.ts", "temp.sql") en la raíz** —
  scripts reutilizables van en `infra/scripts/`; un script verdaderamente temporal no
  se commitea.
- **Ninguna carpeta nueva de nivel raíz sin pasar por ADR** — agregar un octavo
  directorio de nivel raíz (además de los 7 de §1) es un cambio estructural,
  gobernado por `docs/architecture/11-gobernanza-y-adrs.md §3`.

## 6. Trazabilidad

| Punto                         | Ya fijado en                                     | Cerrado/detallado acá                     |
| ----------------------------- | ------------------------------------------------ | ----------------------------------------- |
| Árbol raíz completo           | `docs/architecture/01-estructura-monorepo.md §2` | Referencia (§1)                           |
| Dónde ubicar un archivo nuevo | Ninguno — implícito                              | Las 5 preguntas de decisión (§2)          |
| Mapa de `docs/`               | Ninguno — disperso                               | Tabla consolidada (§3)                    |
| Anatomía de módulo            | `01 §4`                                          | Referencia con links a detalle FE/BE (§4) |
| Qué no va en la raíz          | Ninguno                                          | Reglas explícitas (§5)                    |
