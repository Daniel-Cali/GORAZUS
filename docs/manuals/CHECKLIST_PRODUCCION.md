# Checklist de Producción — GORAZUS ERP

> FASE 05 (2026-07-20). Honesto a propósito — ✅ = verificado con ejecución real esta sesión,
> 🟡 = construido pero sin verificar contra el entorno real de destino, ❌ = no existe. No es una
> lista para "marcar todo antes de lanzar mañana" — el hallazgo más importante de esta fase es que
> **solo 2 de 27 módulos de negocio tienen código real** (auth, seguridad); un primer despliegue a
> producción real hoy serviría, como mucho, un ERP de identidad/RBAC, no un ERP funcional.

## Infraestructura

- ✅ Imagen Docker de `api` construye y corre contra Postgres/Redis/RabbitMQ/MinIO reales
- ✅ Imagen Docker de `web` construye y sirve contenido real vía nginx
- ✅ HTTPS con cabeceras de seguridad (HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy)
- ✅ Backup automático real (verificado: dump válido de 501 tablas, `pg_restore --list` confirma integridad)
- ✅ Monitoreo (Prometheus+Grafana+Loki) provisionado y verificado localmente
- 🟡 Manifiestos de Kubernetes — válidos sintácticamente (`kubectl kustomize`), **nunca aplicados contra un cluster real**
- 🟡 Alta disponibilidad de Postgres/Redis/RabbitMQ/MinIO — diseñada, CRs de operador escritos, **sin ADR formal** (`11-gobernanza-y-adrs.md §2` lo exige antes de producción real) ni cluster para probar
- ❌ Registry de imágenes Docker real (`REGISTRY_URL`) — no provisionado
- ❌ Cluster de Kubernetes real (`KUBE_CONFIG`) — no provisionado
- ❌ Alertmanager conectado a un canal real (Slack/email/PagerDuty) — las alertas evalúan pero nadie las recibe todavía
- ❌ pgBackRest + PITR continuo — `pg_dump` diario es la Fase 1 real, no el mecanismo objetivo de producción

## Seguridad

- ✅ RLS genuinely enforced (`gorazus_app` sin superusuario, `FORCE ROW LEVEL SECURITY` en ~500 tablas) — corregido y verificado FASE 05
- ✅ JWT de dos tokens (access corto + refresh httpOnly con rotación)
- ✅ RBAC funcionando de punta a punta (verificado con Playwright real)
- ✅ Rate limiting global activo (100 req/60s por IP — ver hallazgo de capacidad en `infra/k6/README.md`)
- ✅ Escaneo de seguridad en CI (CodeQL + `pnpm audit`, ambos corriendo real)
- 🟠 34 vulnerabilidades de dependencias sin parchear (1 crítica, 15 altas) — ninguna en runtime de negocio directo, pero pendientes de un pase de remediación dedicado
- 🟡 Rate limiter sin diferenciar por usuario/endpoint — revisar antes de tráfico real concurrente esperado
- ❌ Cifrado a nivel de columna para datos sensibles reales (cuentas bancarias, etc.) — sin datos de producción todavía, no auditado
- ❌ Pentest / auditoría de seguridad externa

## Base de datos

- ✅ 501 tablas, 21 schemas, esquema completo
- ✅ Particionamiento + pg_partman configurado y funcionando (corregido FASE 05 — bug real de schema)
- ✅ RLS real (ver arriba)
- 🟠 185 Foreign Keys cruzan schemas de módulos distintos — requiere ADR, decisión de negocio pendiente
- 🟡 `core.restore_test_logs` sin RLS habilitado — plausiblemente intencional, no confirmado

## Aplicación (backend + frontend)

- ✅ 2/27 módulos de negocio con backend+frontend real (`auth`, `seguridad`) — resto son placeholders honestos, no pantallas rotas ni datos inventados
- ✅ Swagger/OpenAPI auto-exportado
- ✅ 36 tests reales pasando (17 auth + 13 seguridad + 5 notifications + 5 ollama, todos contra infraestructura real, no mocks)
- ✅ Suite de Playwright real committeada (6/6 tests pasan contra el stack completo)
- ❌ 25 módulos de negocio restantes sin construir — Productos, Inventario, Compras, Ventas, POS, Caja, Bancos, Contabilidad, RRHH, CRM, BI, Reportes, Auditoría, Configuración, Administración, Producción, Servicios, Proyectos, Activos, Nómina, Impuestos

## Documentación

- ✅ ~45 documentos de arquitectura + documentación de base de datos completa
- ✅ 6 manuales (este, Técnico, Usuario, Instalación, DevOps, Arquitectura Final)
- ✅ CHANGELOG mantenido activamente, con severidad marcada en cada hallazgo pendiente
- ✅ `docs/00-roadmap-fases.md` — verificar que esté al día con FASE 01-05 antes de usarlo como referencia (ver `docs/manuals/TECNICO.md §3` para el estado real más actualizado)

## Antes de decir "listo para producción" de verdad

1. Construir los 25 módulos de negocio restantes (o confirmar explícitamente que el alcance de v1
   es solo identidad/RBAC).
2. Provisionar registry + cluster real de Kubernetes, aplicar `infra/kubernetes/` contra él, y
   corregir lo que la primera aplicación real revele (siguiendo el mismo patrón de esta sesión:
   cada vez que algo se prueba de verdad por primera vez aparecen bugs reales).
3. ADR formal para la topología de alta disponibilidad de datos (Postgres/Redis/RabbitMQ/MinIO).
4. Pase de remediación de las 34 vulnerabilidades de `pnpm audit`.
5. Decisión de negocio sobre la política de rate limiting bajo tráfico concurrente real.
6. Conectar Alertmanager a un canal real.
7. Definir y ejecutar pgBackRest + PITR si el RPO/RTO objetivo de `08-estrategia-respaldo.md` es
   un requisito real (no solo documentado).
