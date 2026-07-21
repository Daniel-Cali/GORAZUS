# MinIO — convención operativa

Convención de buckets ya fijada en
[docs/architecture/08-infraestructura-y-despliegue.md §5](../../docs/architecture/08-infraestructura-y-despliegue.md#5-minio-buckets):
un bucket por módulo que maneja archivos (`ventas-comprobantes`,
`compras-facturas`, `pos-tickets`), no un bucket único genérico.
Acceso siempre vía backend con URLs firmadas de corta duración —
nunca se exponen credenciales de MinIO al frontend.

**Por qué no hay un script de creación de buckets acá**: los buckets
son por módulo, y ningún módulo de negocio está implementado todavía
— crear buckets ahora sería inventar nombres sin un consumidor real.
El bootstrap de bucket (`mc mb`) es responsabilidad de
`core/storage` (cliente MinIO, ver
[docs/architecture/01 §2](../../docs/architecture/01-estructura-monorepo.md#2-árbol-de-carpetas-raíz))
o de un script en `infra/scripts/` cuando el primer módulo que
necesite almacenamiento de archivos se implemente.

Alta disponibilidad (modo distribuido, erasure coding, mínimo 4 nodos)
— gap ya cerrado en
[docs/architecture/31-infraestructura-completa.md §11](../../docs/architecture/31-infraestructura-completa.md#11-alta-disponibilidad--gap-cerrado-para-redisrabbitmqminio),
implementación pendiente de ADR (single-node en Docker Compose local,
como está hoy).

**Respaldo**: replicación a un segundo bucket/región vía `mc mirror` o
replicación nativa — ver
[docs/architecture/31 §10](../../docs/architecture/31-infraestructura-completa.md#10-respaldos).
