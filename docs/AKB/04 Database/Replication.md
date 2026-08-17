---
id: database-replication
title: Replication
version: 1.0.0
status: active
owner: Database Architect
domain: database
subdomain: replication
created: 2026-07-27
updated: 2026-07-27
tags: [database, replication, high-availability]
related:
  - '[[Partitioning]]'
  - '[[Infrastructure]]'
---

# Purpose

Diseño real y completo — `docs/database/09-estrategia-replicacion.md` +
`10-estrategia-alta-disponibilidad.md`, verificados esta sesión. **No desplegado en la fase actual**
(`docs/architecture/08-infraestructura-y-despliegue.md §7`: "un único primario") — los dos hechos no
se contradicen, describen fases distintas (diseño acordado vs. topología de despliegue actual).

# Architecture

- **Replicación física**: standby síncrono (RPO≈0, failover) + standby asíncrono multi-región +
  réplicas de lectura para `reports`/`bi`.
- **Replicación lógica selectiva**: `bi.data_mart_tables` alimentado sin competir con el tráfico
  transaccional.
- **Failover automático**: orquestado por Patroni sobre etcd/Consul, RTO < 60s (nodo), < 15 min
  (región). `apps/api` nunca conoce la IP real del primario — siempre vía PgBouncer/VIP.
- **SLA objetivo**: 99.9% mensual.

# Related ADRs

[[ADR-INV-000]] §2 (Alta disponibilidad, corregido en cierre de gobernanza)

# References

`docs/database/09-estrategia-replicacion.md` · `docs/database/10-estrategia-alta-disponibilidad.md`
