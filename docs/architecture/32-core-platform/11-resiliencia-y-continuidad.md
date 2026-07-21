# 32.11 — Resiliencia y continuidad

> Componentes: Backup Manager, Restore Manager, Disaster Recovery,
> High Availability, Cluster Support, Scalability Strategy.
>
> Grupo con mayor riesgo de duplicación de todo el documento — los 6
> componentes ya tienen diseño sustancial. Cada entrada es
> deliberadamente breve y referencia la fuente completa en vez de
> re-derivarla.

## 1. Backup Manager

**Trazabilidad:** 📎 Referencia — diseño completo ya existente: PITR,
`pg_dump` por tenant, archivo frío, cifrado, en
[database/08-estrategia-respaldo.md](../../database/08-estrategia-respaldo.md),
extendido a MinIO/RabbitMQ/configuración en
[31-infraestructura-completa.md §10](../31-infraestructura-completa.md#10-respaldos).

- **Objetivo / Responsabilidad / Flujo interno:** ver diseño completo
  en la referencia.
- **Dependencias:** `Storage Framework` (destino de los backups),
  `Encryption Utilities` (cifrado de los archivos de respaldo),
  `Scheduler` (ejecución periódica), `Compression Utilities`.
- **Interfaces:** ninguna de aplicación expuesta a módulos de negocio
  — es un proceso de infraestructura, no un servicio invocado en
  runtime de negocio.
- **Eventos:** `backup.completed`, `backup.failed` — consumidos por
  `Notification Center` (alerta al equipo de operaciones) y
  `Audit Framework`.
- **Comunicación con otros componentes:** `Restore Manager` (§2) es su
  contraparte de verificación.
- **Estrategias de seguridad:** cifrado en reposo de todo archivo de
  respaldo — ver referencia para el detalle de gestión de claves.
- **Estrategias de rendimiento / escalabilidad:** ver
  `database/08-estrategia-respaldo.md` y
  `31-infraestructura-completa.md §10`.

## 2. Restore Manager

**Trazabilidad:** 📎 Referencia — diseño completo ya existente: pruebas
de restauración mensuales en
[database/08-estrategia-respaldo.md §6](../../database/08-estrategia-respaldo.md#6-pruebas-de-restauración)
y workflow automatizado `nightly-restore-test.yml` en
[31-infraestructura-completa.md §8](../31-infraestructura-completa.md#8-github-actions--gap-cerrado).

- **Objetivo / Responsabilidad / Flujo interno:** ver diseño completo
  en la referencia — un backup nunca se considera confiable hasta que
  su restauración se prueba de forma automatizada y periódica.
- **Dependencias:** `Backup Manager`, `Scheduler`.
- **Interfaces:** ninguna de aplicación — proceso de infraestructura.
- **Eventos:** `restore-test.passed`, `restore-test.failed` —
  consumidos por `Notification Center` con prioridad crítica (un
  backup que no restaura es equivalente a no tener backup).
- **Comunicación con otros componentes:** valida la cadena completa
  producida por `Backup Manager`, `Storage Framework` y
  `Compression Utilities`/`Encryption Utilities`.
- **Estrategias de seguridad:** las restauraciones de prueba corren en
  un entorno aislado, nunca sobrescriben datos de producción.
- **Estrategias de rendimiento / escalabilidad:** ver
  `31-infraestructura-completa.md §8`.

## 3. Disaster Recovery

**Trazabilidad:** 📎 Referencia — diseño completo ya existente:
Patroni, objetivos RTO/RPO, despliegue multi-zona, ejercicios "game
day" en
[database/10-estrategia-alta-disponibilidad.md](../../database/10-estrategia-alta-disponibilidad.md),
extendido a Redis Sentinel/RabbitMQ colas cuórum/MinIO erasure coding
en [31-infraestructura-completa.md §11](../31-infraestructura-completa.md#11-alta-disponibilidad-extendida).

- **Objetivo / Responsabilidad / Flujo interno:** ver diseño completo
  en la referencia — objetivos de tiempo de recuperación (RTO) y
  punto de recuperación (RPO) ya cuantificados, no se reabren aquí.
- **Dependencias:** `Backup Manager`, `Restore Manager`,
  `High Availability` (§4).
- **Interfaces:** ninguna de aplicación.
- **Eventos:** ninguno de dominio — es un plan operativo, no un
  componente que corre en el camino de negocio.
- **Comunicación con otros componentes:** consolida `Backup Manager`,
  `Restore Manager` y `High Availability` en un procedimiento único de
  respuesta ante incidente mayor.
- **Estrategias de seguridad:** el plan de DR incluye explícitamente
  el escenario de compromiso de credenciales, no solo fallo de
  hardware — ver referencia.
- **Estrategias de rendimiento / escalabilidad:** ver
  `database/10-estrategia-alta-disponibilidad.md` para el detalle
  cuantitativo de RTO/RPO por escenario.

## 4. High Availability

**Trazabilidad:** 📎 Referencia — mismo fundamento que Disaster
Recovery: Patroni para Postgres, extendido a Redis
Sentinel/RabbitMQ/MinIO en
[31-infraestructura-completa.md §11](../31-infraestructura-completa.md#11-alta-disponibilidad-extendida).

- **Objetivo / Responsabilidad / Flujo interno:** ver diseño completo
  en la referencia — cada pieza de infraestructura con estado
  (Postgres, Redis, RabbitMQ, MinIO) tiene su propio mecanismo de
  redundancia y failover automático, ya diseñado componente por
  componente.
- **Dependencias:** infraestructura Kubernetes
  ([31-infraestructura-completa.md §2](../31-infraestructura-completa.md)).
- **Interfaces:** ninguna de aplicación — transparente para el código
  de negocio, que se conecta siempre al endpoint lógico (no al nodo
  físico activo).
- **Eventos:** ninguno de dominio — `Health Checks`
  ([07-observabilidad-y-gobernanza.md §4](./07-observabilidad-y-gobernanza.md#4-health-checks))
  es quien detecta y reporta degradación, no este componente
  directamente.
- **Comunicación con otros componentes:** `Cluster Support` (§5) es el
  mecanismo de orquestación que hace operable la alta disponibilidad a
  nivel de aplicación (backend), complementario a la HA de datos
  descrita aquí.
- **Estrategias de seguridad:** el failover nunca expone credenciales
  del nodo caído ni requiere intervención manual con acceso elevado en
  el camino crítico.
- **Estrategias de rendimiento / escalabilidad:** ver
  `31-infraestructura-completa.md §11` para tiempos de failover por
  componente.

## 5. Cluster Support

**Trazabilidad:** 📎 Referencia — diseño completo ya existente:
topología de Kubernetes, Deployments, HPA, operadores, en
[31-infraestructura-completa.md §2](../31-infraestructura-completa.md#2-kubernetes--adoptado-decisión-revisada).

- **Objetivo / Responsabilidad / Flujo interno:** ver diseño completo
  en la referencia.
- **Dependencias:** ninguna dentro del Core Platform — es la capa de
  orquestación sobre la que corren todos los demás componentes.
- **Interfaces:** ninguna de aplicación.
- **Eventos:** ninguno de dominio.
- **Comunicación con otros componentes:** `Application Kernel`
  ([01-kernel-y-composicion.md §1](./01-kernel-y-composicion.md#1-application-kernel))
  y `Health Checks` son los dos componentes de código que interactúan
  directamente con las decisiones del clúster (arranque idéntico por
  réplica, señal de readiness para enrutamiento).
- **Estrategias de seguridad:** políticas de red y RBAC de Kubernetes
  ya cubiertas en la referencia.
- **Estrategias de rendimiento / escalabilidad:** ver
  `31-infraestructura-completa.md §2` — HPA atado a métricas de
  Prometheus, ya dimensionado.

## 6. Scalability Strategy

**Trazabilidad:** 📎 Referencia — diseño completo ya existente en tres
niveles: vista física
([00-arquitectura-general.md §2](../00-arquitectura-general.md)),
topología de despliegue
([08-infraestructura-y-despliegue.md §7](../08-infraestructura-y-despliegue.md#7-escalabilidad)),
y HPA atado a métricas
([31-infraestructura-completa.md §2.2](../31-infraestructura-completa.md)).

- **Objetivo / Responsabilidad / Flujo interno:** ver diseño completo
  en la referencia — escalado horizontal como estrategia primaria
  (más réplicas sin estado), vertical como excepción puntual para
  Postgres.
- **Dependencias:** `Cluster Support`, `Metrics`
  ([07-observabilidad-y-gobernanza.md §5](./07-observabilidad-y-gobernanza.md#5-metrics)).
- **Interfaces:** ninguna de aplicación directa — es una propiedad
  emergente de que todo componente de este documento sea, por diseño,
  sin estado compartido no externalizado (Redis/Postgres/RabbitMQ son
  los únicos puntos con estado, y los tres tienen su propia estrategia
  de escalabilidad ya referenciada en `High Availability` §4).
- **Eventos:** ninguno de dominio.
- **Comunicación con otros componentes:** es la síntesis de las
  estrategias de escalabilidad individuales ya documentadas en cada
  uno de los 71 componentes restantes de este documento — no se
  repiten aquí, esta entrada es el punto de entrada que las conecta.
- **Estrategias de seguridad:** escalar horizontalmente nunca debe
  requerir compartir secretos entre réplicas por un canal distinto al
  ya establecido (`Configuration Manager` + secret manager).
- **Estrategias de rendimiento / escalabilidad:** ver las tres
  referencias arriba para el detalle cuantitativo (umbrales de HPA,
  límites de recursos por pod).
