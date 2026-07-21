# 30 — API completa (diseño consolidado)

> Versión 1.0 — 2026-07-13. Mismo criterio que
> [12-backend-enterprise.md](./12-backend-enterprise.md) y
> [29-frontend-enterprise.md](./29-frontend-enterprise.md): consolida
> lo ya fijado sin repetirlo, y toma posición explícita donde el pedido
> incluye algo que **no está adoptado por decisión de arquitectura**
> (GraphQL, §2) en vez de diseñarlo igual para completar la lista. Sin
> código.

## 1. REST

Ya fijado completo en
[07-convenciones-y-estandares §4](./07-convenciones-y-estandares.md#4-api-rest):
prefijo versionado (§4 de este documento), recursos en plural,
formato de respuesta `{ data, meta }`, formato de error inspirado en
RFC 7807 con `code` estable + `message` legible. No se repite.
Recapitulación de una sola línea porque el resto de las secciones lo
dan por base: **REST es el único paradigma de API de negocio de
GORAZUS** — no hay una segunda forma de leer/escribir datos de
negocio compitiendo con esto.

## 2. GraphQL — evaluado y no adoptado, con razones explícitas

**No está en la arquitectura de GORAZUS.** Se declara esto de forma
directa, en vez de diseñar un schema GraphQL para completar el pedido,
porque introducirlo contradiría decisiones ya tomadas:

1. **KISS ya aplicado con el mismo razonamiento** — el README fija
   "no se introduce un patrón hasta que la complejidad real del
   módulo lo justifique"
   ([README §2](./README.md#2-principios-rectores)). Ningún módulo de
   los 21 ya diseñados tiene una necesidad de consulta arbitraria
   (over-fetching/under-fetching) que REST + hooks de TanStack Query
   por módulo no resuelvan ya —
   [03-arquitectura-modulos-frontend §3](./03-arquitectura-modulos-frontend.md#3-datos-tanstack-query--contratos-compartidos)
   ya construye exactamente el shape de datos que cada pantalla
   necesita, por diseño de cada hook.
2. **Duplicaría la capa de autorización** — `PermissionsGuard`
   ([15-modulo-security §4-5](./15-modulo-security.md)) y el
   `TenantInterceptor`
   ([05-flujo-de-datos §1](./05-flujo-de-datos.md#1-ciclo-de-vida-de-una-request-http-estándar))
   están diseñados para resolver **una vez por request** sobre un
   recurso conocido. Un resolver GraphQL que permite componer
   consultas arbitrarias a través de relaciones entre 21 schemas
   obligaría a reimplementar autorización a nivel de campo/relación
   (field-level authorization), un problema que RBAC+ACL+ABAC
   ([15-modulo-security §5-6](./15-modulo-security.md#6-abac-attribute-based-access-control--diseño-nuevo-candidato-pendiente-de-adr))
   no fue diseñado para resolver a ese grado de composición.
3. **El problema N+1 se agravaría exactamente donde más duele** — un
   resolver GraphQL que atraviesa, por ejemplo, `sales.invoices` →
   `customers.customers` → `accounting.chart_of_accounts` cruzaría
   los mismos límites de schema que
   [06-comunicacion-entre-modulos](./06-comunicacion-entre-modulos.md)
   protege deliberadamente con fachadas públicas — un `DataLoader`
   que resuelve eso de forma performante tendría que conocer las
   fachadas de los 21 módulos, acoplando el gateway GraphQL a todos
   ellos a la vez.

**Puerta dejada abierta, no cerrada de forma dogmática**: si en el
futuro aparece una necesidad de negocio real y confirmada — típicamente
una integración externa (un partner que necesita consultas flexibles
sobre su propio subconjunto de datos, vía la capa OAuth2 ya diseñada en
[13-modulo-auth §3](./13-modulo-auth.md#3-oauth)) — la extensión
correcta es un **gateway GraphQL de solo lectura** que se apoye en los
mismos endpoints REST/fachadas ya existentes (un GraphQL-sobre-REST,
no un acceso directo a los 21 schemas), evaluado como ADR cuando esa
necesidad esté confirmada, no antes.

## 3. WebSocket

Ya fijado completo:
[05-flujo-de-datos §2](./05-flujo-de-datos.md#2-ciclo-de-vida-de-un-evento-en-tiempo-real-websocket)
(ciclo de vida del evento en tiempo real, adaptador Redis obligatorio
con más de una réplica) y
[12-backend-enterprise §1.3](./12-backend-enterprise.md#13-core-expandido-a-nivel-de-archivo-nuevo)
(`core/realtime/websocket.gateway.ts` + `redis-adapter.provider.ts`).
No se repite. Un punto de relación con REST que vale explicitar: el
WebSocket **nunca reemplaza** una respuesta REST — se usa
exclusivamente para _invalidar_ queries de TanStack Query en el
cliente (ver
[05 §2](./05-flujo-de-datos.md#2-ciclo-de-vida-de-un-evento-en-tiempo-real-websocket),
"el frontend nunca actualiza estado local a mano al recibir el
evento") — el dato en sí siempre se vuelve a pedir por REST, el socket
solo avisa que hay algo nuevo que pedir.

## 4. Versionado

Ya fijado completo:
[07-convenciones-y-estandares §4](./07-convenciones-y-estandares.md#4-api-rest)
— prefijo `/api/v1`, `/api/v2` conviviendo con `v1` hasta deprecar un
cambio breaking. No se repite. Aplica igual a WebSocket (§3): un
cambio breaking en el payload de un evento de dominio publicado
(`VentaConfirmada`, etc.) sigue la misma regla de versionado de
contrato ya fijada en
[02-arquitectura-modulos-backend §3](./02-arquitectura-modulos-backend.md#3-convenciones-de-cada-capa)
("cambiarlos es un cambio breaking... se versionan igual que un
endpoint de API") — no hay un esquema de versionado separado para
eventos vs. endpoints REST, es el mismo principio aplicado a ambos.

## 5. Autenticación

Ya fijado completo en
[13-modulo-auth.md](./13-modulo-auth.md) (JWT, OAuth2, refresh,
2FA, API Keys) y
[15-modulo-security.md](./15-modulo-security.md) (RBAC/ACL/ABAC). No
se repite — este documento solo ancla que **los cuatro mecanismos de
credencial** (sesión JWT, OAuth2 de terceros, API Key, y en el futuro
cualquier mecanismo nuevo) entran a la API por el mismo punto de
extensión de `core/http/guards/`
([12-backend-enterprise §1.3](./12-backend-enterprise.md#13-core-expandido-a-nivel-de-archivo-nuevo)),
nunca con lógica de autenticación distinta repetida por controller.

## 6. Paginación

Base ya fijada en
[07-convenciones-y-estandares §4](./07-convenciones-y-estandares.md#4-api-rest):
offset+limit (`page`, `pageSize`) por defecto (KISS), cursor-based
"solo para el/los módulos que demuestren necesitarlo por volumen real
de datos". **Esa lista de candidatos ya se puede fijar hoy** (no
estaba armada antes) — son exactamente las tablas ya identificadas
como de alto volumen/particionadas en los documentos de módulo ya
escritos:

| Tabla de alto volumen                            | Ya identificada en                                                                                                                                                           | Candidata a cursor-based                                       |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `inventory.stock_movements`                      | [19-modulo-inventory §4](./19-modulo-inventory.md#4-movimientos-stock_movements--stock_movement_types)                                                                       | Sí — kardex de productos de alta rotación                      |
| `core.audit_logs`                                | [05-estrategia-auditoria](../database/05-estrategia-auditoria.md)                                                                                                            | Sí — consulta de auditoría en tenants grandes                  |
| `sales.invoices` / `purchases.purchase_invoices` | [20](./20-modulo-sales.md#3-facturas-invoices--invoice_lines)/[21](./21-modulo-purchases.md#5-facturas-purchase_invoices--purchase_invoice_lines--purchase_invoice_matching) | Evaluar según antigüedad de negocio del tenant, no por defecto |
| `accounting.journal_entry_lines`                 | [22-modulo-accounting §2](./22-modulo-accounting.md#2-diario-accountingjournal_entries)                                                                                      | Sí — Mayor de cuentas con mucho movimiento                     |

Offset+limit sigue siendo el default para las otras ~490 tablas — la
excepción se activa por endpoint específico, no por decisión global,
cuando el volumen real del tenant lo justifica (mismo criterio KISS
que ya rige el resto del proyecto, no una optimización prematura
aplicada a todo).

## 7. Filtros — no existía convención, se fija acá

**Gap real, no cubierto en ningún documento anterior.** Se fija la
convención completa:

| Patrón                 | Sintaxis                                              | Ejemplo                                                                                                                                                                    |
| ---------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Igualdad               | `?campo=valor`                                        | `?status=confirmed`                                                                                                                                                        |
| Comparación            | `?campo__gte=` / `__lte=` / `__gt=` / `__lt=`         | `?issued_at__gte=2026-01-01&issued_at__lte=2026-01-31`                                                                                                                     |
| Pertenencia a conjunto | `?campo__in=v1,v2,v3`                                 | `?status__in=confirmed,paid`                                                                                                                                               |
| Texto libre            | `?search=` (campo reservado, no un nombre de columna) | `?search=acme` — usa el índice GIN+trigram del recurso, ver [04-estrategia-indices §4](../database/04-estrategia-indices.md#4-índices-por-tipo-de-dato-y-patrón-de-acceso) |

**Reglas de seguridad y performance, no solo de sintaxis** (la parte
que realmente faltaba diseñar):

1. **Whitelist obligatoria por endpoint** — cada controller declara
   explícitamente qué campos acepta como filtro (vía el `validator`
   Zod del módulo, mismo mecanismo ya usado para el body,
   [02-arquitectura-modulos-backend §3](./02-arquitectura-modulos-backend.md#3-convenciones-de-cada-capa)).
   Un query param que no está en la whitelist se **ignora
   silenciosamente** (no es un 400 — evita que un cliente mal
   construido rompa por un typo en un filtro opcional), pero tampoco
   se ejecuta contra la base sin control.
2. **Un filtro nunca reemplaza el alcance de tenant/empresa** — se
   aplica **después** de que el `TenantInterceptor` ya resolvió
   `tenant_id`/`company_id`
   ([05-flujo-de-datos §1](./05-flujo-de-datos.md#1-ciclo-de-vida-de-una-request-http-estándar)),
   nunca antes ni en su lugar. Un filtro malicioso no puede ampliar el
   alcance más allá de lo que RLS
   ([06-estrategia-seguridad §1](../database/06-estrategia-seguridad.md#1-row-level-security-el-mecanismo-central-de-aislamiento-multiempresa))
   ya permite ver.
3. **Solo se whitelistea un campo si ya está indexado para ese
   patrón** — la whitelist de filtros de un endpoint se decide _junto
   con_ la estrategia de índices del módulo
   ([04-estrategia-indices.md](../database/04-estrategia-indices.md)),
   no después. Habilitar un filtro sobre una columna sin índice
   adecuado en una tabla de alto volumen (§6) sería repetir, del lado
   de la API, el mismo error que la estrategia de índices ya evita del
   lado de la base de datos.

## 8. Trazabilidad

| Punto solicitado | Documento(s) de detalle normativo                                                          | Novedad de este documento                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| REST             | [07-convenciones-y-estandares §4](./07-convenciones-y-estandares.md#4-api-rest)            | — (recapitulado como base del resto)                                                           |
| GraphQL          | _(no adoptado)_                                                                            | Posición explícita con 3 razones + condición de reapertura vía ADR (§2)                        |
| WebSocket        | [05 §2](./05-flujo-de-datos.md#2-ciclo-de-vida-de-un-evento-en-tiempo-real-websocket)      | Relación explícita "nunca reemplaza REST, solo invalida" (§3)                                  |
| Versionado       | [07 §4](./07-convenciones-y-estandares.md#4-api-rest)                                      | Extensión del mismo principio a eventos de dominio (§4)                                        |
| Autenticación    | [13-modulo-auth.md](./13-modulo-auth.md), [15-modulo-security.md](./15-modulo-security.md) | Punto de extensión único para los 4 mecanismos de credencial (§5)                              |
| Paginación       | [07 §4](./07-convenciones-y-estandares.md#4-api-rest)                                      | Lista concreta de tablas candidatas a cursor-based, armada desde los módulos ya diseñados (§6) |
| Filtros          | _(no existía)_                                                                             | Convención completa de sintaxis + 3 reglas de seguridad/performance, nuevo (§7)                |
