# GORAZUS — Architecture (Current State, High Level)

Vista de alto nivel del despliegue actual. Para arquitectura de dominio/DDD ver `docs/AKB/`
(`02 Domains/`) y `docs/adr/`; para el diseño detallado de infraestructura ver
`docs/architecture/08-infraestructura-y-despliegue.md`. Este documento no reemplaza a ninguno de
los dos, resume el estado desplegado real.

```
                    ┌───────────────┐
                    │    Client     │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │     Nginx     │   (no verificado en esta sincronización, 2026-08-13)
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │      API      │   (NestJS — apps/api, actualmente sin build/serve
                    └───────┬───────┘    funcional, ver Fase 7 en .claude/ROADMAP.md)
                            │
             ┌──────────────┼──────────────┐
             ▼              ▼              ▼
        PostgreSQL        Redis        RabbitMQ
             │           (healthy)     (healthy)
             ├── MinIO (healthy)
             │
             └── Application data (23 schemas, 736 tablas — ver docs/INFRASTRUCTURE_CURRENT.md)

API ───────────────► Ollama
                       │
                       ▼
               Native Windows (no Docker por defecto)
```

## Notas sobre el diagrama vs. el diseño original

- El diagrama de referencia (plantilla de sincronización) coincide con el diseño real documentado
  en `docs/architecture/08-infraestructura-y-despliegue.md` — no se detectaron divergencias
  estructurales.
- `Nginx`/`web` no se verificaron en esta sincronización (solo se probó `postgres`, `redis`,
  `rabbitmq`, `minio`, `backup`, `pgadmin`, `mailhog`, y un intento de `api` que se detuvo por un
  cuelgue de tooling — ver `docs/KNOWN_ISSUES.md`).
- La capa de negocio (módulos `modules/*`) no está representada en este diagrama de
  infraestructura — ver `ROADMAP.md` para el estado de cada módulo y `docs/AKB/02 Domains/` para
  su arquitectura de dominio.

## Prisma / Persistencia

21 clientes Prisma expuestos (uno por schema de negocio con consumidor real), generados desde
`core/database/prisma/schemas/*/schema.prisma`. `pnpm db:generate` verificado 21/21 el
2026-08-13. RLS forzado a nivel de PostgreSQL, no a nivel de Prisma — ver
`docs/SECURITY_BASELINE.md`.
