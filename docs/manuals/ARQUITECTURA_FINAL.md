# Arquitectura Final — GORAZUS ERP

> FASE 05 (2026-07-20). Resumen ejecutivo de una sola página — la fuente de verdad detallada de
> cada decisión sigue siendo `docs/architecture/` (~45 documentos) y `docs/database/`, esto no los
> reemplaza ni los repite, los resume.

## Stack

| Capa         | Tecnología                                                                                          | Estado real                                                              |
| ------------ | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Monorepo     | Nx + pnpm workspaces                                                                                | ✅ Funcionando, `nx build` corregido FASE 05                             |
| Backend      | NestJS + TypeScript, ejecutado vía `ts-node` (no JS compilado, ver `docs/manuals/TECNICO.md §4`)    | ✅ 2/27 módulos con código real                                          |
| Datos        | PostgreSQL 17 (SQL versionado, fuente de verdad) + Prisma (introspección)                           | ✅ 501 tablas, 21 schemas, RLS forzado                                   |
| Frontend     | React 19 + Vite + TailwindCSS + shadcn/ui + TanStack Query + Zustand                                | ✅ Design system completo, 2/27 módulos con pantallas reales             |
| Cache        | Redis                                                                                               | ✅ (nodo único local; Sentinel HA diseñado, sin cluster para probar)     |
| Colas        | RabbitMQ (quorum queues)                                                                            | ✅ (nodo único local; cluster HA diseñado, sin cluster para probar)      |
| Objetos      | MinIO                                                                                               | ✅ (nodo único local; distribuido HA diseñado, sin cluster para probar)  |
| IA           | Ollama (cliente genérico)                                                                           | 🟡 Infraestructura sí, asistentes específicos no                         |
| Contenedores | Docker Compose (local)                                                                              | ✅ Completo y verificado de punta a punta                                |
| Orquestación | Kubernetes (staging/production)                                                                     | 🟡 Manifiestos construidos y validados sintácticamente, sin cluster real |
| Monitoreo    | Prometheus + Grafana + Loki                                                                         | ✅ Verificado local; en K8s vía `kube-prometheus-stack` (no desplegado)  |
| CI/CD        | GitHub Actions (lint/build/test real; deploy con pasos reales pero comentados sin registry/cluster) | 🟡                                                                       |

## Principios arquitectónicos (ya fijados, sin cambios esta fase)

1. **Monolito modular primero, microservicios cuando haga falta** — extracción vía strangler fig,
   nunca especulativa (`10-evolucion-a-microservicios.md`).
2. **SQL es la fuente de verdad del modelo de datos, Prisma lo consume** — nunca al revés
   (`02-arquitectura-modulos-backend.md §4`).
3. **RLS es el mecanismo central de aislamiento multi-tenant** — nunca un `WHERE` manual,
   estructuralmente imposible de olvidar vía `BaseRepository` (`06-estrategia-seguridad.md §1`).
4. **No se diseña sin necesidad de negocio confirmada** — gobernanza aplicada consistentemente a
   lo largo de toda la sesión (Producción, Servicios, Proyectos, Integraciones, IA — cada uno
   documentado como "sin antecedente, no se diseña especulativamente" hasta que haya una decisión
   de negocio real detrás).
5. **Todo se verifica con ejecución real** — nunca solo tipos o mocks. Cada fase de esta sesión
   encontró bugs reales exactamente en el momento en que algo se probó de verdad por primera vez
   (ver CHANGELOG.md — es el patrón más repetido de todo el proyecto).

## Topología de despliegue

```
Local (Docker Compose)          Staging/Production (Kubernetes, diseño — sin cluster probado)
┌─────────────────────┐         ┌──────────────────────────────────────┐
│ nginx (TLS, :443)    │         │ Ingress + cert-manager (TLS)          │
│  ├─ web (estático)   │         │  ├─ Deployment web (nginx + build)    │
│  └─ /api/ → api:3000 │         │  └─ Deployment api (N réplicas + HPA) │
│ api (ts-node)        │         │ Operators: CloudNativePG, Redis       │
│ postgres/redis/      │         │  Sentinel, RabbitMQ Cluster, MinIO    │
│  rabbitmq/minio      │         │ Namespace "observability" separado    │
│ backup (pg_dump      │         │  (kube-prometheus-stack + Loki)       │
│  diario)             │         └──────────────────────────────────────┘
│ prometheus/grafana/  │
│  loki (opcional)     │
└──────────────────────┘
```

## Lo que falta para producción real

Ver `docs/manuals/CHECKLIST_PRODUCCION.md` — checklist honesto, no una lista de "ya está todo".
