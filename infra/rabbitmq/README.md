# RabbitMQ — convención operativa

Convención de exchange/routing key/cola ya fijada en
[docs/architecture/08-infraestructura-y-despliegue.md §4](../../docs/architecture/08-infraestructura-y-despliegue.md#4-rabbitmq-convención-de-exchanges-y-colas):
un exchange topic (`gorazus.eventos`), routing key
`<modulo>.<entidad>.<evento>`, una cola por módulo consumidor con su
propio dead-letter queue.

**Por qué no hay un `definitions.json` acá**: exchanges/colas/bindings
se declaran **desde el código de cada módulo** al arrancar (cada
consumidor declara su propia cola), no se preconfiguran de forma
estática en el broker — no existe todavía ningún módulo de negocio
implementado, así que no hay colas reales que definir sin inventar
nombres. Cuando el primer módulo consumidor exista, su declaración de
cola vive en `core/messaging` (cliente RabbitMQ + bus de eventos, ver
[docs/architecture/01 §2](../../docs/architecture/01-estructura-monorepo.md#2-árbol-de-carpetas-raíz))
o en el propio módulo — no en este directorio.

Alta disponibilidad (cluster de 3 nodos, quorum queues) — gap ya
cerrado en
[docs/architecture/31-infraestructura-completa.md §11](../../docs/architecture/31-infraestructura-completa.md#11-alta-disponibilidad--gap-cerrado-para-redisrabbitmqminio),
implementación pendiente de ADR (single-node en Docker Compose local,
como está hoy en `infra/docker/docker-compose.yml`).

**Respaldo**: no se respaldan mensajes (tránsito, no estado
permanente) — solo la definición de exchanges/colas/bindings una vez
que existan, versionada como cualquier config de infraestructura (ver
[docs/architecture/31 §10](../../docs/architecture/31-infraestructura-completa.md#10-respaldos)).
