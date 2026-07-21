# docs/standards/ — Estándares de Implementación (EPIC 04)

> Versión 1.0 — 2026-07-16. Índice de navegación de este set, mismo criterio que
> `docs/architecture/README.md` y `docs/frontend/README.md`. Este set **no repite**
> decisiones ya cerradas en `docs/architecture/`, `docs/database/` y `docs/frontend/`
> — las convierte en procedimientos accionables ("cómo hacer X") y checklists
> verificables. Sin código.

## Documentos

| Documento                                                    | Contenido                                                                                        |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)               | Mapa de más alto nivel del repositorio, dónde ubicar un archivo nuevo, mapa de `docs/`           |
| [FILE_STRUCTURE.md](./FILE_STRUCTURE.md)                     | Plantillas de archivo backend/frontend, tabla de decisión "¿dónde va este archivo?"              |
| [NAMING_CONVENTIONS.md](./NAMING_CONVENTIONS.md)             | Naming de código, DB, permisos, rutas — incluye el mapeo módulo (español) ↔ schema (inglés)      |
| [CODING_STANDARDS.md](./CODING_STANDARDS.md)                 | TypeScript estricto, estilo de función, comentarios, manejo de errores en código                 |
| [ARCHITECTURE_RULES.md](./ARCHITECTURE_RULES.md)             | Qué está permitido/prohibido a nivel arquitectónico — fronteras, comunicación entre módulos, ADR |
| [MODULE_GUIDELINES.md](./MODULE_GUIDELINES.md)               | Cómo crear un módulo, entidad, repositorio, servicio, hook, página                               |
| [COMPONENT_GUIDELINES.md](./COMPONENT_GUIDELINES.md)         | Cómo crear un componente, una tabla, un formulario                                               |
| [API_GUIDELINES.md](./API_GUIDELINES.md)                     | Cómo crear/consumir un endpoint REST, filtros, versionado, WebSocket                             |
| [DATABASE_GUIDELINES.md](./DATABASE_GUIDELINES.md)           | Cómo agregar una tabla, columnas universales, RLS, migraciones                                   |
| [SECURITY_GUIDELINES.md](./SECURITY_GUIDELINES.md)           | Autenticación/autorización, secretos, cifrado, cobertura OWASP                                   |
| [TESTING_GUIDELINES.md](./TESTING_GUIDELINES.md)             | Cómo escribir tests por capa, criterio de cobertura, datos de prueba                             |
| [DOCUMENTATION_GUIDELINES.md](./DOCUMENTATION_GUIDELINES.md) | Cómo documentar un módulo, ADR, comentarios, documentación de API                                |
| [CODE_REVIEW.md](./CODE_REVIEW.md)                           | Proceso de revisión, quién aprueba qué, **checklist obligatorio de PR**                          |

## Cómo leer esto si venís de cero

Orden sugerido: `PROJECT_STRUCTURE` → `FILE_STRUCTURE` → `NAMING_CONVENTIONS` →
`ARCHITECTURE_RULES` → `CODING_STANDARDS` → el resto según la tarea puntual
(`MODULE_GUIDELINES`/`COMPONENT_GUIDELINES` al construir algo nuevo,
`CODE_REVIEW` antes de abrir un PR).

## Documentos de origen (no repetidos, solo referenciados)

- `docs/architecture/01,02,03,06,07,09,11` — estructura, capas backend/frontend,
  comunicación entre módulos, convenciones generales, seguridad, gobernanza
- `docs/architecture/30-api-completa.md` — diseño de API
- `docs/database/00,01,02,02a,06` — modelo de datos, convenciones SQL, seguridad de datos
- `docs/frontend/` (los 10 documentos del EPIC 03) — arquitectura de frontend
- `docs/product/` — UX, catálogo de pantallas, flujos de usuario

## Relación con ROADMAP y CHANGELOG

Este EPIC actualiza `docs/00-roadmap-fases.md` (nueva fase de Estándares de
Implementación) y crea/mantiene `CHANGELOG.md` en la raíz del repositorio — ver
sección correspondiente en el roadmap y el propio changelog para el detalle de qué
cambió y cuándo.

## Trazabilidad de los 13 documentos contra el EPIC

Cada documento cierra su propia tabla "Trazabilidad" al final, mapeando los puntos
explícitamente pedidos (cómo crear módulo/componente/hook/servicio/página/tabla/
formulario/documentación, cómo escribir tests, cómo hacer code review, qué está
permitido/prohibido, convenciones, checklist de PR) contra dónde se cerraron.
