# GORAZUS — Documentation Index

Mapa principal de la documentación del proyecto. No enumera cada archivo `.md` del repositorio —
enlaza a los puntos de entrada reales. Si un documento no aparece acá, buscarlo primero en la
sección correspondiente antes de asumir que no existe.

```
GORAZUS Documentation
│
├── Second Brain (memoria + navegación)
│   ├── .claude/MEMORY.md              — memoria operativa central de Claude
│   ├── .claude/SESSION_STATE.md       — foto del último estado sincronizado
│   ├── .claude/ROADMAP.md             — roadmap del track infraestructura/operaciones
│   ├── .claude/STARTUP_PROTOCOL.md    — qué leer/verificar al iniciar una sesión
│   ├── .claude/CLOSING_PROTOCOL.md    — qué actualizar al cerrar una sesión
│   └── docs/AKB/                      — Segundo Cerebro / Obsidian (arquitectura, ADRs, decisiones)
│       └── Home.md                    — punto de entrada del AKB
│
├── Project Context
│   ├── docs/PROJECT_CONTEXT.md        — GORAZUS explicado a una instancia nueva de Claude
│   └── docs/DO_NOT_TOUCH.md           — restricciones críticas, siempre vigentes
│
├── Architecture
│   ├── docs/ARCHITECTURE_CURRENT.md   — vista de despliegue actual (infraestructura)
│   ├── docs/architecture/             — diseño detallado por módulo/capa (documentación oficial)
│   ├── docs/ddd/                      — Domain-Driven Design
│   └── docs/AKB/02 Domains/, 03 Shared Kernel/ — dominio y patrones compartidos (AKB)
│
├── Infrastructure
│   ├── docs/INFRASTRUCTURE_CURRENT.md — estado real verificado (Docker, WSL2, backups, Ollama)
│   ├── docs/OPERATIONS_COMMANDS.md    — comandos seguros de uso frecuente
│   └── infra/docker/README.md         — detalle de la migración de storage C:→D:
│
├── Database
│   ├── docs/database/                 — diseño, diccionario, SQL versionado, certificación
│   ├── docs/database/SECURITY.md, docs/database/06-estrategia-seguridad.md — seguridad de datos
│   └── docs/AKB/04 Database/          — particionamiento, índices, replicación (AKB)
│
├── API
│   └── docs/api/                      — OpenAPI, referencia de endpoints
│
├── Frontend
│   └── docs/frontend/, docs/reports/frontend/ — auditorías y reportes de UI
│
├── Mobile
│   └── (sin documentación — no hay proyecto mobile en este repositorio)
│
├── Security
│   ├── docs/SECURITY_BASELINE.md      — resumen operativo verificado
│   └── docs/AKB/01 Platform/Security.md — diseño (AKB)
│
├── Operations
│   ├── docs/OPERATIONS_COMMANDS.md
│   └── docs/DO_NOT_TOUCH.md
│
├── Phases
│   ├── docs/00-roadmap-fases.md       — 32 fases de documentación de arquitectura
│   ├── .claude/ROADMAP.md             — Fases 1-7 de infraestructura/operaciones (completas)
│   ├── docs/FASE_6_POSTGRES_ROLES_REPORT.md — reporte de la Fase 6 (roles PostgreSQL)
│   ├── docs/INFRA-F7_API_RUNTIME_REPORT.md — reporte de la Fase 7 (API runtime, PASS)
│   └── ROADMAP.md, PROJECT_STATUS.md, NEXT_STEPS.md (raíz) — fases de negocio/producto
│
├── ADR
│   ├── docs/ADR_INDEX.md              — índice liviano, apunta a docs/adr/
│   ├── docs/adr/                      — los 13 ADR completos
│   └── docs/AKB/00 Governance/ADR Index.md — índice enriquecido (AKB, incluye Compras)
│
└── Knowledge Base
    └── docs/AKB/00 Governance/
        ├── Decision Log.md            — decisiones cronológicas
        ├── Issue Register.md          — issues abiertos del dominio de Inventario/Compras
        ├── Glossary.md
        └── Architecture Principles.md
```

## Documentos raíz relevantes (no AKB, no `.claude/`)

`README.md`, `ROADMAP.md`, `PROJECT_STATUS.md`, `NEXT_STEPS.md`, `TECHNICAL_DEBT.md`,
`CHANGELOG.md`, `VERSION.md` — todos parte del track de negocio, no duplicados en esta
sincronización.

## Reglas de uso de este índice

- No inventar enlaces — si un documento no existe, decirlo explícitamente en vez de asumir una
  ruta.
- Ante duda sobre cuál de dos documentos es la fuente de verdad (por ejemplo `docs/ADR_INDEX.md`
  vs. `docs/AKB/00 Governance/ADR Index.md`), el AKB es la fuente enriquecida y `docs/` tiene el
  índice liviano — ambos deben coincidir en los datos básicos (número, título, estado).
