# 43 — DevOps: mapeo y cierre de gaps (Fase 9)

> Versión 1.0 — 2026-07-13. Igual que la Fase 7 (BI), acá la mayoría
> ya estaba completa — el trabajo real fue nombrar 2 productos
> concretos (Loki, Jaeger) que el usuario pidió explícitamente y que
> el stack de observabilidad ya diseñado dejaba sin resolver (logs y
> trazas tenían el mecanismo pero no el destino). A diferencia de la
> Fase 8 (Integraciones), acá **sí correspondía decidir** — el usuario
> nombró los productos específicos, no hacía falta confirmar negocio
> para elegir entre alternativas. Sin código.

## 1. Mapeo: los 10 puntos pedidos → estado real

| #   | Pedido         | Estado                   | Documento                                                                                                                                                 |
| --- | -------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Docker         | ✅ Completo (ya existía) | [08-infraestructura-y-despliegue.md §1](./08-infraestructura-y-despliegue.md#1-topología-docker-compose)                                                  |
| 2   | Docker Compose | ✅ Completo (ya existía) | [08 §1](./08-infraestructura-y-despliegue.md#1-topología-docker-compose) — servicios, variantes dev/prod                                                  |
| 3   | Kubernetes     | ✅ Completo (ya existía) | [31-infraestructura-completa.md §2](./31-infraestructura-completa.md#2-kubernetes--adoptado-decisión-revisada) — topología completa, operators, Kustomize |
| 4   | Nginx          | ✅ Completo (ya existía) | [08 §2](./08-infraestructura-y-despliegue.md#2-nginx-enrutamiento)                                                                                        |
| 5   | GitHub Actions | ✅ Completo (ya existía) | [31 §8](./31-infraestructura-completa.md#8-github-actions--la-implementación-concreta-de-7) — 4 workflows nombrados                                       |
| 6   | CI/CD          | ✅ Completo (ya existía) | [31 §7](./31-infraestructura-completa.md#7-cicd--gap-cerrado-identificado-en-00-arquitectura-general-10) — pipeline de 4 etapas sobre `nx affected`       |
| 7   | Prometheus     | ✅ Completo (ya existía) | [31 §9](./31-infraestructura-completa.md#9-monitoreo--gap-cerrado-identificado-en-00-arquitectura-general-10) — métricas                                  |
| 8   | Grafana        | ✅ Completo (ya existía) | [31 §9](./31-infraestructura-completa.md#9-monitoreo--gap-cerrado-identificado-en-00-arquitectura-general-10) — visualización + Grafana Alerting          |
| 9   | Loki           | 🆕 Gap cerrado ahora     | [31 §9](./31-infraestructura-completa.md#9-monitoreo--gap-cerrado-identificado-en-00-arquitectura-general-10) — ver §2                                    |
| 10  | Jaeger         | 🆕 Gap cerrado ahora     | [31 §9](./31-infraestructura-completa.md#9-monitoreo--gap-cerrado-identificado-en-00-arquitectura-general-10) — ver §2                                    |

**8 de 10 ya estaban completos, con decisiones concretas y
sustanciales, no menciones de paso. Los otros 2 tenían el hueco exacto
que el usuario nombró: el pilar de logs y el de trazas del stack de
observabilidad (`31-infraestructura-completa.md §9`) ya estaban
diseñados en su mecanismo (JSON estructurado con correlación; trace ID
= mismo `requestId`), pero ninguno de los dos tenía un producto de
destino nombrado — la métrica sí tenía Prometheus+Grafana, logs y
trazas se quedaban en "recolectado por el stack de observabilidad de
Kubernetes", sin decir cuál.**

## 2. Loki y Jaeger — por qué son la elección consistente, no una libre

A diferencia de Power BI/Forecast (Fase 7) o las 11 integraciones sin
antecedente (Fase 8), acá no hacía falta confirmar necesidad de
negocio — el usuario nombró los productos específicos, y ambos son la
continuación natural de decisiones ya tomadas:

- **Loki** es el sistema de logs de Grafana Labs, construido para
  integrarse sin fricción con Grafana (ya elegido para métricas) —
  mismo lenguaje de consulta emparentado con PromQL (LogQL), mismo
  modelo de etiquetado. Se prefiere sobre ELK/Elasticsearch (más
  pesado operacionalmente para logs ya estructurados que no necesitan
  búsqueda de texto libre).
- **Jaeger** recibe OTLP nativamente — el colector de OpenTelemetry
  que ya instrumenta métricas también exporta trazas ahí sin
  traductor intermedio, y reusa el mismo `requestId` como trace ID sin
  generar uno propio (mismo principio de "no duplicar sistemas de
  correlación" que ya justificaba esa decisión en `31 §9`).

Ambos se agregan al mismo namespace `observability` de Kubernetes
(`31 §2.2`, tabla de topología, fila nueva) vía el `kube-prometheus-stack`
(Prometheus+Grafana+Alertmanager empaquetados) más los charts
oficiales de Loki/Jaeger — sin introducir Helm como herramienta
paralela a Kustomize, referenciados desde el mismo mecanismo de
manifiestos ya fijado (`31 §2.3`). No se agregan al Docker Compose
local — mismo criterio ya aplicado a Prometheus/Grafana, que tampoco
corren en `local` (el stack de observabilidad completo es
`staging`/`production` únicamente, consistente con
[31 §2.1](./31-infraestructura-completa.md#21-alcance-por-entorno)).

## 3. Cambios aplicados

- [31-infraestructura-completa.md §9](./31-infraestructura-completa.md#9-monitoreo--gap-cerrado-identificado-en-00-arquitectura-general-10) —
  fila "Logs" ahora nombra Loki+Promtail; fila "Trazas distribuidas"
  ahora nombra Jaeger; párrafo nuevo justificando ambas elecciones
  frente a alternativas (ELK, Zipkin/Tempo).
- [31 §2.2](./31-infraestructura-completa.md#22-topología) — fila
  nueva en la tabla de topología K8s para el stack de observabilidad
  completo (Prometheus+Grafana+Loki+Jaeger).
- [32-core-platform/07 §2](./32-core-platform/07-observabilidad-y-gobernanza.md#2-logging-framework)
  (Logging Framework) — Flujo interno actualizado: el destino del
  `stdout` ya no es genérico, es Loki vía Promtail.
- [32-core-platform/07 §7](./32-core-platform/07-observabilidad-y-gobernanza.md#7-tracing)
  (Tracing) — nueva entrada "Backend de trazas" nombrando Jaeger.

## 4. Trazabilidad

| Punto solicitado                                       | Estado         | Documento                            |
| ------------------------------------------------------ | -------------- | ------------------------------------ |
| Docker, Docker Compose, Nginx                          | ✅ Sin cambios | `08-infraestructura-y-despliegue.md` |
| Kubernetes, GitHub Actions, CI/CD, Prometheus, Grafana | ✅ Sin cambios | `31-infraestructura-completa.md`     |
| Loki                                                   | 🆕 Cerrado     | `31 §9` + `32-core-platform/07 §2`   |
| Jaeger                                                 | 🆕 Cerrado     | `31 §9` + `32-core-platform/07 §7`   |
