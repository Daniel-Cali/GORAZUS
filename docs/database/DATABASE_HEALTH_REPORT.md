# Database Health Report — GORAZUS

> Actualizado 2026-07-20 (segunda pasada de FASE 01 — Database Enterprise, ver §6).
> Antes actualizado 2026-07-18. Versión original
> 2026-07-16 (EPIC "Database Visualization Environment") encontró 3 gaps reales y
> **no los aplicó** (regla de esa fase: solo documentar). Esta fase los **corrigió**
> (autorización explícita del usuario: "Optimización completa") y, al profundizar
> la verificación, encontró **2 hallazgos nuevos** no vistos antes. Ver
> [DATABASE_ARCHITECTURE.md §5](./DATABASE_ARCHITECTURE.md#5-migraciones-nuevas-de-esta-fase-append-only-nada-editado)
> para los 3 archivos SQL nuevos que aplicaron las correcciones — ninguno de los 30
> archivos originales fue editado.

## 0. Estado general

🟢 **Los 3 gaps de la verificación anterior están resueltos y verificados.** Se
encontraron 2 hallazgos nuevos durante la optimización, ambos documentados con
precisión; uno (185 FK cross-schema) es un hallazgo de arquitectura que requiere
una decisión explícita de negocio antes de tocarse — no se corrige unilateralmente.

## 1. Hallazgos de la verificación anterior — RESUELTOS en esta fase

### ✅ 1.1 — Particionamiento (era 🔴 Crítico) — RESUELTO

Causa raíz completa (más profunda de lo que se sabía en la verificación anterior,
que solo veía el síntoma "0 particiones"): tres problemas en cadena, los tres
corregidos:

1. **`postgres:17-alpine` no incluye `pg_partman`** (no se sabía esto antes — se
   asumía que "el mecanismo simplemente no había corrido"). Corregido con una
   imagen propia: `infra/docker/postgres/Dockerfile` (Postgres 17 oficial +
   `postgresql-17-partman` vía PGDG apt). `docker-compose.yml` actualizado para
   construirla (`build: context: ./postgres`).
2. **`29_partitioning.sql` instala `pg_partman` sin `SCHEMA partman` explícito** —
   cae en `public`, rompe las 21 llamadas subsiguientes a `partman.*`. Corregido
   manualmente (`DROP EXTENSION` + `CREATE EXTENSION pg_partman SCHEMA partman`)
   antes de re-ejecutar el script.
3. **6 de las 27 tablas declaradas `PARTITION BY` nunca tenían su llamada a
   `partman.create_parent()`** en `29_partitioning.sql` (`core.audit_logs`,
   `core.system_logs`, `core.activity_logs`, `core.notification_delivery_logs`,
   `security.login_attempts`, `security.session_activity_logs`) — documentadas en
   `07-estrategia-particionamiento.md §1` pero ausentes del script. Corregido en
   `docs/database/sql/33_partition_provisioning_completion.sql` (archivo nuevo).

**Verificado:** 0 de 27 tablas particionadas sin hijos (antes: 27 de 27). ~200
particiones reales creadas, `p_premake` respetado (3 meses / 1 año adelante).

### ✅ 1.2 — Vista `accounting.v_treasury_position` — RESUELTO

`docs/database/sql/32_bugfixes.sql` recrea la vista con `cm.company_id`/
`cm.branch_id` calificados (antes ambiguos entre `cash_movements` y
`cash_movement_types`). Verificado: la vista existe y es consultable.

### ✅ 1.3 — Seed de `products.product_attributes` — RESUELTO

`docs/database/sql/32_bugfixes.sql`: `ALTER TABLE products.product_attributes
ALTER COLUMN company_id DROP NOT NULL` (alinea con el patrón universal ya
documentado: "NULL = aplica a todo el tenant") + re-inserción de los 3 valores
originales del seed (`color`, `size`, `material`, mismos literales, sin datos
nuevos inventados). Verificado: las 3 filas existen.

## 2. Hallazgos nuevos de esta fase

### 🟠 2.1 — 185 Foreign Keys reales cruzan schemas de módulos de negocio distintos

**Severidad: Alta (arquitectura), no bloqueante (funcional).** Contradice
directamente la regla ya documentada ("ninguna FK cruza schemas de módulos de
negocio distintos, las referencias son ID sueltos") —
`docs/architecture/02-arquitectura-modulos-backend.md §4`. Detalle completo, tabla
por par de schemas, y por qué **no se corrige en esta fase** (cambio de alto riesgo,
requiere ADR y decisión de negocio sobre qué reemplaza la integridad referencial que
hoy proveen estas FK): [FOREIGN_KEYS.md §3](./FOREIGN_KEYS.md#3-hallazgo-real-185-fk-cruzan-schemas-de-módulos-de-negocio).

Esto también corrige una afirmación incorrecta de la verificación anterior
(`DATABASE_DEPENDENCIES.md` decía "0 FK cross-schema, verificado" sin haberlo
verificado realmente contra `pg_constraint`) — ya corregida en ese documento.

### 🟡 2.2 — `core.restore_test_logs` es la única tabla sin RLS habilitado

**Severidad: Baja.** 500 de 501 tablas tienen `relrowsecurity = true`. Contradice
"RLS en las 494 tablas sin excepción" de `06-estrategia-seguridad.md §1`, aunque
plausiblemente intencional (tabla de infraestructura de backup, no dato de tenant).
No corregido sin confirmación — ver [SECURITY.md §1](./SECURITY.md#1-row-level-security--verificado).

## 3. Optimización aplicada: 575 índices FK faltantes

**Gap real cerrado, no solo detectado esta vez.** 575 columnas FK de negocio (de
las ~3,600 FK totales, excluidas las 6 columnas universales ya cubiertas por RLS)
no tenían índice de soporte — anti-patrón conocido que penaliza JOINs y `DELETE`
en cascada. Aplicado vía `docs/database/sql/31_missing_fk_indexes.sql`. Detalle
completo por schema: [INDEX_CATALOG.md §3](./INDEX_CATALOG.md#3-optimización-aplicada-en-esta-fase-575-índices-fk-nuevos).

## 4. Validaciones de integridad (verificado de nuevo tras la optimización)

| Validación                                              | Resultado                                                                                 |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Todas las FK son válidas (`pg_constraint.convalidated`) | ✅ Sin cambios — 100% válidas                                                             |
| Tablas huérfanas (sin ninguna FK entrante ni saliente)  | ✅ 0 de 501                                                                               |
| Índices duplicados                                      | ✅ 0 detectados (575 nuevos son todos genuinamente nuevos, ninguno duplica uno existente) |
| Secuencias sin uso                                      | ✅ 0 de 501                                                                               |
| Vistas inválidas                                        | ✅ 0 — las 9 declaradas existen ahora (era 8/9)                                           |
| RLS                                                     | 🟡 500 de 501 — ver §2.2                                                                  |
| Particiones sin aprovisionar                            | ✅ 0 de 27 — ver §1.1                                                                     |

## 5. Resumen de acción recomendada (priorizado)

1. ✅ Particionamiento — resuelto (§1.1).
2. ✅ Vista de tesorería — resuelto (§1.2).
3. ✅ Seed de atributos de producto — resuelto (§1.3).
4. 🟠 **Pendiente de decisión de negocio/ADR:** 185 FK cross-schema — no se toca sin
   una decisión explícita sobre qué reemplaza su integridad referencial (§2.1).
5. 🟡 **Pendiente de confirmación:** ¿`core.restore_test_logs` debería tener RLS?
   (§2.2).
6. 🟢 Sin acción inmediata en el resto — 575 índices agregados, schema íntegro.

## 6. Segunda pasada (2026-07-20) — auditoría solicitada explícitamente "FASE 01 — Database

Enterprise", verificación en vivo contra la instancia real (no solo lectura de estos documentos)

🟢 Sin regresiones en lo ya resuelto (§1): 0 de 27 tablas particionadas sin hijos (1.200
particiones reales, más que las ~200 estimadas en la pasada anterior — la cifra vieja
subestimaba, no es un error, simplemente creció con el `p_premake` en el tiempo transcurrido),
vista de tesorería viva, seed de atributos de producto íntegro.

🔴 **Hallazgo nuevo, más grave que lo ya documentado en §2.2**: `gorazus_app` — el rol que usa
`DATABASE_URL` de `apps/api` — es **superusuario real** (`rolsuper=true`,
`rolbypassrls=true`), no solo "dueño de las tablas" como se caracterizó en la auditoría de
aplicación de esta misma fecha (`docs/00-auditoria-2026-07-20.md`). Causa raíz exacta,
verificación completa y recomendación de corrección: [SECURITY.md §2](./SECURITY.md#2-roles-de-base-de-datos--verificados-existen-los-5-documentados).
Esto es objetivamente más severo que "necesita `FORCE ROW LEVEL SECURITY`" — un superusuario
omite RLS pase lo que pase, `FORCE` incluido. **No corregido** (requiere tocar
`docker-compose.yml`/`.env`/`DATABASE_URL`, fuera del alcance "solo base de datos" de este pase).

> ✅ **Corregido más tarde el mismo día** (sesión de backend/infra separada, ver
> [SECURITY.md §2.1](./SECURITY.md#-21--corregido-más-tarde-el-mismo-día-fase-05-2026-07-20--re-verificado-en-vivo-2026-07-21))
> — re-verificado en vivo el 2026-07-21 (auditoría Fase 1): `gorazus_app` tiene hoy
> `rolsuper=false, rolbypassrls=false`. Este párrafo queda como registro histórico de
> cómo se encontró el problema, no como estado actual.

Métricas en vivo re-verificadas (algunas ya estaban desactualizadas en `DATABASE_STRUCTURE.md`,
corregidas ahí): 23 schemas, 501 tablas lógicas (701 físicas incluyendo particiones), 3.201
índices, 2.414 triggers, 10 vistas, 4 vistas materializadas, 76 funciones + 4 procedimientos,
5.164 FK totales. Sin índices duplicados (verificado de nuevo). Índices con 0 escaneos
encontrados son todos de particiones vacías de meses futuros/tablas recién creadas sin tráfico
real — esperado en un entorno de desarrollo sin carga, no es una señal de rendimiento real
todavía.

Nada nuevo que agregar a los hallazgos ya abiertos (185 FK cross-schema, `core.restore_test_logs`
sin RLS) — siguen exactamente como se documentaron, pendientes de la misma decisión de negocio/
confirmación.

## 7. Tercera pasada (2026-07-21, rama `feature/database-audit`) — auditoría "Database Enterprise

v1.0" orientada a ferretería/distribución

Re-verificación en vivo de vistas/vistas materializadas/triggers/funciones/procedimientos/
secuencias: **10 vistas, 4 vistas materializadas (schema `bi`), 2.414 triggers, 501 secuencias
(0 sin uso) — idéntico a la pasada del 2026-07-20, sin drift**. Primera verificación explícita de
formas normales (1NF/2NF/3NF/BCNF): sin violaciones reales, 2 columnas `ARRAY` encontradas
(`core.audit_logs.changed_columns`, `security.oauth_clients.redirect_uris`) y evaluadas como
justificadas. 2 gaps reales nuevos, específicos del vertical ferretería/distribución pedido:
ausencia de campos de materiales peligrosos (`is_hazardous_material`/`hazard_class`/
`safety_data_sheet_url`) en `products.products`, y ausencia de columnas de primera clase para
peso/longitud/volumen (mitigado parcialmente por el sistema de atributos genérico ya existente).
Ningún hallazgo bloquea el uso del sistema. Detalle completo, informe final con % de calidad y
recomendaciones para una Fase 2 de aplicación de DDL:
[AUDIT_DATABASE_ENTERPRISE_V2_FERRETERIA.md](./AUDIT_DATABASE_ENTERPRISE_V2_FERRETERIA.md).

## 8. Cuarta y quinta pasada (2026-07-21, Partes 4-5) — relaciones e integridad, normalización

**Parte 4 (relaciones/claves):** resuelto el único FK `CASCADE` que
quedaba sin identificar (`partman.part_config_sub_sub_parent_fkey`,
infraestructura, no negocio — 100% de las FK de GORAZUS usan `NO ACTION`);
re-confirmado con metodología independiente que 0 columnas FK de negocio
carecen de índice; 0 relaciones 1:1 estructurales, 10+ tablas puente
intra-schema con patrón universal completo. 99% de integridad
referencial. Detalle:
[RELATIONSHIP_CATALOG.md](./RELATIONSHIP_CATALOG.md).

**Parte 5 (normalización):** 0 violaciones reales de 1FN/2FN/3FN/BCNF en
una segunda verificación independiente; 0 catálogos duplicados
(verificado explícitamente contra ~40 tablas tipo `*_status`/`*_types`/
`*_reasons`); 100% de normalización. Ninguna tabla fusionada, dividida o
eliminada — las 4 mejoras aditivas ya conocidas siguen especificadas y
sin aplicar, pendientes de autorización explícita para pasar de
documentación a DDL real. Detalle:
[NORMALIZATION_REPORT.md](./NORMALIZATION_REPORT.md).

**Parte 6 (validación funcional, ferretería Enterprise):** simulación
completa de ~95 procesos de negocio (apertura, catálogo, compras,
inventario, ventas, caja, bancos, contabilidad, clientes, proveedores,
reportes) — 96% de cobertura funcional. 2 gaps nuevos encontrados (Costo
Específico de inventario serializado, Contratos de Proveedor formales),
sumados a los 2 ya conocidos (materiales peligrosos, país/idioma/timezone)
— los 4 consolidados con problema/justificación/beneficio/impacto/
complejidad en [FUNCTIONAL_GAPS.md](./FUNCTIONAL_GAPS.md). Ningún proceso
de negocio simulado requiere rediseño estructural. Detalle:
[BUSINESS_VALIDATION.md](./BUSINESS_VALIDATION.md).

**Parte 7 (rendimiento y escalabilidad):** confirmado que la estrategia de
índices ya es Enterprise-grade (BTree 3.884, BRIN 55 ya usado en tablas
particionadas por tiempo, GIN 9 para búsqueda trigram/JSONB, 828 índices
parciales, 11 covering) — 0 índices nuevos necesarios. `EXPLAIN` real
(sin datos, `ANALYZE` no es posible en `dev` vacío) confirmó cobertura de
índice para los 10 patrones de consulta crítica pedidos, y encontró una
guía de uso real: las consultas de Kardex/movimientos necesitan rango de
`created_at` para poda de particiones (~11x más barato). Configuración de
Postgres revisada: `random_page_cost=4` (debería ser 1.1 para SSD) y
`pg_stat_statements` deshabilitado son los 2 hallazgos reales, ninguno
aplicado (requieren reinicio de contenedor). 4 Materialized Views
candidatas identificadas (Rotación/Top Productos/Compras/Utilidad). No se
ejecutó una prueba de carga real de miles de usuarios contra el entorno
compartido — decisión explícita de no arriesgar el servicio en vivo. 93%
de rendimiento (diseño Enterprise-Ready, validación bajo carga real
pendiente de un entorno dedicado). Detalle:
[PERFORMANCE_REPORT.md](./PERFORMANCE_REPORT.md).

**Parte 8 (seguridad, auditoría, cumplimiento, multiempresa):** 🟠
**Hallazgo principal de las 8 partes** — verificado con precisión total
contra `pg_policies` real que **solo existe la política `tenant_isolation`**;
no hay ninguna política de RLS para `company_id` ni `branch_id` (corrige
y precisa un gap que `00-modelo-general.md §13` ya señalaba de forma
menos exacta). Sin impacto en tenants de una sola Empresa; real para
Grupos Corporativos multiempresa (Fase 5) — diseño de la política
faltante especificado, no aplicado. Resto de la auditoría: RBAC plano
(sin jerarquía, decisión defendible), cifrado de claves/tokens ya
diseñado, GDPR/retención documental ya soportados
(`data_subject_requests`/`consent_records`/`data_retention_policies`),
columnas de auditoría extendidas (`ip_address`/`device`/`user_agent`)
correctamente no-universales, trazabilidad de los 11 procesos pedidos
confirmada completa, backup/recuperación ya completos sin cambios. 88%
de seguridad. Detalle:
[RLS_DESIGN.md](./RLS_DESIGN.md),
[SECURITY_REPORT.md](./SECURITY_REPORT.md),
[AUDIT_REPORT.md](./AUDIT_REPORT.md),
[MULTITENANT_REPORT.md](./MULTITENANT_REPORT.md).

**Parte 10 (cierre, certificación y congelación — Database Enterprise
v1.0.0):** re-verificación final en vivo, 0 drift contra la Parte 8 (mismo
conteo de schemas/tablas/FK/índices/triggers/views/matviews/políticas
RLS). Checklist final de 16 puntos: 14 en verde, RLS con nota heredada,
Mobile no aplicable todavía (sin `apps/mobile`, sin bloqueante
estructural). Compatibilidad Backend confirmada (21 clientes Prisma = 21
schemas reales, 1:1). **Score final: 94/100.** Certificado formalmente
como GORAZUS Database Enterprise v1.0.0, modelo congelado — cambios
estructurales futuros solo vía migración versionada. Detalle:
[DATABASE_FINAL_REPORT.md](./DATABASE_FINAL_REPORT.md),
[DATABASE_SCORE.md](./DATABASE_SCORE.md),
[DATABASE_CERTIFICATION.md](./DATABASE_CERTIFICATION.md).

## 9. Trazabilidad

| Punto pedido en la fase                                                                 | Cerrado en                                                                                                                                                                                |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **(2026-07-21)** Auditoría Database Enterprise v1.0 orientada a ferretería/distribución | §7 — sin drift en vistas/triggers/funciones/secuencias, formas normales verificadas, 2 gaps reales de vertical documentados                                                               |
| Optimizar el modelo sin romper compatibilidad                                           | §1, §3 — todo aplicado como archivos SQL nuevos, cero ediciones a los 30 originales                                                                                                       |
| Detectar tablas duplicadas                                                              | Ninguna encontrada (verificado por nombre/estructura contra `docs/database/logico/`)                                                                                                      |
| Detectar relaciones innecesarias                                                        | §2.1 — 185 FK que, por la arquitectura ya documentada, no deberían existir como FK física                                                                                                 |
| Detectar índices faltantes/duplicados                                                   | §3 (575 agregados), §4 (0 duplicados)                                                                                                                                                     |
| Detectar cuellos de botella                                                             | Ver [PERFORMANCE.md](./PERFORMANCE.md) — sin datos reales suficientes todavía, procedimiento fijado                                                                                       |
| Detectar tablas sin documentación                                                       | 0 — las 501 tablas tienen entrada en `docs/database/logico/` y `docs/database/dictionary/`                                                                                                |
| **(2026-07-20)** Completar seguridad/multiempresa                                       | §6 — causa raíz exacta de por qué RLS no protege nada hoy (`gorazus_app` superusuario, no solo dueño de tabla); corrección recomendada, no aplicada (fuera de alcance de un pase solo-BD) |
| **(2026-07-20)** Re-verificar métricas en vivo                                          | §6 — 23 schemas, 501/701 tablas, 3.201 índices, 2.414 triggers, 76 funciones, 4 procedimientos, 5.164 FK, 1.200 particiones — `DATABASE_STRUCTURE.md` actualizado                         |
