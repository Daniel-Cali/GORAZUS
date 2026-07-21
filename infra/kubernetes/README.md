# GORAZUS ERP — Kubernetes (staging/production)

Ver `docs/architecture/31-infraestructura-completa.md §2` para el diseño completo. `local`
(desarrollo) sigue en Docker Compose (`infra/docker/`) — K8s es solo para `staging`/`production`.

## Estado real (FASE 05, 2026-07-20)

- **`base/` + `overlays/staging/` + `overlays/production/`**: construidos y **validados con
  `kubectl kustomize`** (renderizan sin error, namespace/imagen/replicas/recursos correctos por
  overlay) — no probados contra un cluster real (no hay uno disponible en este entorno). Antes de
  un primer despliegue real: revisar dominios (`gorazus.example.com` es un placeholder), límites
  de recursos, y el `ClusterIssuer` de cert-manager.
- **`stateful/`** (Postgres/Redis/RabbitMQ/MinIO en alta disponibilidad): son la expresión
  concreta de la arquitectura ya fijada en `31-infraestructura-completa.md §11` — **requieren un
  Architecture Decision Record formal antes de aplicarse a producción real**, tal como ese mismo
  documento ya advierte ("fija la arquitectura objetivo, no reemplaza el ADR"). Tampoco probados
  contra un cluster real.

## Prerrequisitos de cluster (instalados una vez, fuera de este Kustomize)

| Componente                                                                                                                 | Para qué                                                      | CRD/recurso que consume `stateful/`                     |
| -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------- |
| [ingress-nginx](https://kubernetes.github.io/ingress-nginx/)                                                               | Enrutamiento externo (`base/ingress.yaml`)                    | `Ingress`                                               |
| [cert-manager](https://cert-manager.io/) + un `ClusterIssuer` (`letsencrypt-production`/`letsencrypt-staging`)             | TLS automático                                                | annotation `cert-manager.io/cluster-issuer`             |
| [CloudNativePG](https://cloudnative-pg.io/)                                                                                | Postgres HA (Patroni)                                         | `postgresql.cnpg.io/v1 Cluster`                         |
| [Redis Operator (Spotahome)](https://github.com/spotahome/redis-operator)                                                  | Redis Sentinel                                                | `databases.spotahome.com/v1 RedisFailover`              |
| [RabbitMQ Cluster Operator](https://www.rabbitmq.com/kubernetes/operator/operator-overview)                                | RabbitMQ cluster + quorum queues                              | `rabbitmq.com/v1beta1 RabbitmqCluster`                  |
| [MinIO Operator](https://min.io/docs/minio/kubernetes/upstream/operations/installation.html)                               | MinIO distribuido (erasure coding)                            | `minio.min.io/v2 Tenant`                                |
| [kube-prometheus-stack](https://github.com/prometheus-community/helm-charts/tree/main/charts/kube-prometheus-stack) + Loki | Monitoreo (namespace `observability`, separado — ver `31 §9`) | `PodMonitor` (ya anotado en `base/api-deployment.yaml`) |

## Uso

```bash
# Renderizar sin aplicar (para revisar)
kubectl kustomize overlays/staging
kubectl kustomize overlays/production

# Aplicar (requiere cluster real + prerrequisitos de arriba ya instalados)
kubectl apply -k overlays/staging
kubectl apply -k stateful   # una sola vez, no por entorno — o duplicar con overlay propio si staging/production necesitan clusters de datos separados
```

## Secretos

`base/api-secret.yaml` es una **plantilla** con placeholders `CHANGE_ME` — se commitea la forma
(qué keys existen), nunca los valores reales. En un despliegue real, generar el `Secret` desde un
gestor externo (Sealed Secrets, External Secrets Operator contra Vault/AWS Secrets Manager) o
`kubectl create secret` fuera de git — nunca editar este archivo con valores reales y commitearlo.
