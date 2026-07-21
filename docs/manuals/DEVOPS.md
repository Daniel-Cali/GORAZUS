# Manual DevOps — GORAZUS ERP

> FASE 05 (2026-07-20). Runbook operativo. Distingue explícitamente lo que corre de verdad hoy
> (Docker Compose local) de lo que es la arquitectura objetivo documentada pero sin cluster real
> para probar (Kubernetes) — no se presenta lo segundo como si ya estuviera operando.

## 1. Topología

- **Local (desarrollo)**: Docker Compose (`infra/docker/`), siempre. Ver `docs/manuals/INSTALACION.md`.
- **Staging/Production**: Kubernetes, arquitectura objetivo completa en
  `infra/kubernetes/` + `docs/architecture/31-infraestructura-completa.md §2` — manifiestos
  construidos y validados con `kubectl kustomize` esta fase, **nunca aplicados contra un cluster
  real** (no hay uno disponible en este entorno). Ver `infra/kubernetes/README.md` para el detalle
  honesto de qué está probado y qué no antes de un primer despliegue real.

## 2. Deploy

### Hoy (local)

```bash
cd infra/docker
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build api web nginx
```

### Objetivo (staging/production, cuando exista cluster+registry reales)

`.github/workflows/deploy-staging.yml` (push a `main`) y `deploy-production.yml`
(`workflow_dispatch` o release, requiere aprobación manual vía GitHub Environment protegido) —
ambos con los pasos reales de `docker build`/`docker push`/`kubectl apply -k` ya escritos pero
**comentados** hasta que existan los secrets `REGISTRY_URL` y `KUBE_CONFIG`. Producción **promueve
la misma imagen ya validada en staging por SHA**, nunca rebuildea — ver comentarios del propio
workflow.

## 3. Rollback

- **Local**: `docker compose up -d --build <servicio>` con el código anterior (`git checkout` a un
  commit previo primero).
- **Kubernetes (objetivo)**: `kubectl rollout undo deployment/api -n <namespace>` (Deployments
  llevan historial de revisiones por defecto). Como producción despliega por SHA explícito (no
  `latest`), un rollback real es re-aplicar el overlay con el `newTag` del release anterior.

## 4. Monitoreo

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.monitoring.yml up -d
```

- Grafana: `http://localhost:3001` (`admin` / `$GRAFANA_ADMIN_PASSWORD`) — dashboard "GORAZUS API
  Overview" ya provisionado (request rate, tasa de error, P50/P95/P99, logs).
- Prometheus: `http://localhost:9090` — pestaña "Alerts" para ver el estado de `ApiDown`/
  `ApiHighErrorRate`/`ApiHighLatencyP95` en vivo.
- En Kubernetes: mismo rol vía `kube-prometheus-stack` + Loki en el namespace `observability` (ver
  `31-infraestructura-completa.md §9`), no `docker-compose.monitoring.yml`.

**Sin Alertmanager conectado a un canal real todavía** (Slack/email/PagerDuty) — las 3 reglas
evalúan y se ven en la UI de Prometheus, pero nadie recibe una notificación push todavía. Pendiente
de decisión de negocio (qué canal usar).

## 5. Backup y restauración

Automático, corre solo (contenedor `backup`, `docker-compose.yml`) — respaldo inmediato al
arrancar + diario, retención de 7 días, en el volumen `postgres_backups`.

```bash
# Ver respaldos disponibles
docker exec <contenedor-backup> ls -lh /backups

# Restaurar uno (¡SIEMPRE contra un entorno aislado, nunca producción directo!)
docker exec <contenedor-backup> /scripts/restore.sh gorazus_<timestamp>.dump
```

Mecanismo objetivo de producción real (PITR continuo, no solo snapshots diarios): `pgBackRest`,
ver `docs/database/08-estrategia-respaldo.md §2` — infraestructura mayor (repo/stanza dedicados)
no desplegada todavía, `pg_dump` programado es la Fase 1 real y verificada de esta sesión.

## 6. Incidentes — primeros pasos

1. **`/health/live` no responde** → el proceso está caído. `docker compose logs api` / `kubectl
logs deployment/api`. Reiniciar (`docker compose restart api` / el pod se reinicia solo por el
   liveness probe en K8s).
2. **`/health/ready` devuelve 503 pero `/health/live` da 200** → el proceso está arriba pero no
   puede hablar con una dependencia (Postgres/Redis/RabbitMQ). Revisar el body de la respuesta
   (indica cuál). No reiniciar el pod — reiniciar la dependencia caída, K8s deja de enrutar
   tráfico automáticamente hasta que se recupere.
3. **429 masivos en logs/Grafana** → el rate limiter (100 req/60s por IP, `core/http/http.module.ts`)
   está actuando — confirmar si es tráfico legítimo concentrado (revisar política, ver
   `infra/k6/README.md`) o un intento de abuso real.
4. **Cualquier incidente de datos** → NO tocar la base manualmente sin respaldo fresco primero (§5).
   Prueba de restauración mensual automatizada: `.github/workflows/nightly-restore-test.yml`
   (placeholder hasta que exista pgBackRest real desplegado).

## 7. Checklist antes de un primer despliegue real a producción

Ver `docs/manuals/CHECKLIST_PRODUCCION.md`.
