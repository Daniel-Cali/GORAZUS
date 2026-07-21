# API Guidelines — GORAZUS

> EPIC 04 — Implementation Standards. Consolida `docs/architecture/07-convenciones-y-estandares.md §4`,
> `docs/architecture/30-api-completa.md` y `docs/frontend/API_LAYER.md` en una guía
> operativa de "cómo construir/consumir un endpoint" — no repite el razonamiento
> completo de cada decisión (por qué REST y no GraphQL, por qué offset+limit), lo
> cita. Sin código.

## 1. REST es el único paradigma (referencia)

Ya fijado y no reabierto: `docs/architecture/30-api-completa.md §1-2` — REST es el
único paradigma de API de negocio; GraphQL evaluado y explícitamente no adoptado (3
razones documentadas ahí, puerta abierta solo vía ADR si aparece necesidad
confirmada de integración externa).

## 2. Cómo crear un endpoint nuevo (procedimiento)

1. **Definir el schema Zod primero** (`backend/validators/<accion>.schema.ts`) — es
   la fuente de verdad de forma de datos, el DTO se deriva de él
   (`docs/architecture/02 §3`), nunca al revés.
2. **Ruta:** `/api/v1/<recurso-plural-español>` — recursos en el idioma del dominio
   cuando son de negocio (`docs/architecture/07-convenciones-y-estandares.md §4`).
3. **Guards en orden**: `@RequireAuth` (autenticación) → `@RequirePermission('<modulo>.<accion>')`
   (autorización, `docs/architecture/09-seguridad-y-multiempresa.md §2`) — un
   controller nunca implementa su propia verificación de permiso a mano.
4. **Formato de respuesta** — nunca se improvisa una forma distinta:
   ```
   Éxito: { "data": {...}, "meta": { "page", "pageSize", "total" } }
   Error: { "error": { "code", "message", "details": [] } }
   ```
   (`07-convenciones §4`, formato inspirado en RFC 7807).
5. **El controller solo traduce** HTTP → caso de uso → HTTP, sin lógica condicional
   de negocio (`docs/architecture/02 §3`) — ver
   [MODULE_GUIDELINES.md §4](./MODULE_GUIDELINES.md#4-cómo-crear-un-servicio-caso-de-uso)
   para dónde vive la lógica real.
6. **Paginación:** offset+limit (`page`/`pageSize`) por defecto. Cursor-based **solo**
   en las tablas ya identificadas como candidatas por volumen real
   (`inventory.stock_movements`, `core.audit_logs`, `accounting.journal_entry_lines`,
   evaluar en `sales.invoices`/`purchases.purchase_invoices` según antigüedad del
   tenant — lista completa y razones en `docs/architecture/30-api-completa.md §6`).
   No se implementa cursor-based "por si acaso" en un endpoint nuevo sin evidencia de
   volumen.
7. **Documentar el endpoint** en el `README.md` del módulo si introduce una
   capacidad nueva del contrato público (ver
   [DOCUMENTATION_GUIDELINES.md §2](./DOCUMENTATION_GUIDELINES.md#2-readme-de-módulo)).

## 3. Versionado (referencia)

Prefijo `/api/v1/...`; un cambio breaking implica `/api/v2/...` conviviendo con `v1`
hasta deprecar (`07-convenciones §4`). El mismo principio aplica a eventos de dominio
publicados — cambiar el payload de un evento ya publicado es un cambio breaking,
versionado igual que un endpoint (`docs/architecture/02 §3`,
`docs/architecture/30-api-completa.md §4`).

## 4. Filtros (referencia)

Convención completa ya fijada en `docs/architecture/30-api-completa.md §7`:

| Patrón                 | Sintaxis                                | Ejemplo                      |
| ---------------------- | --------------------------------------- | ---------------------------- |
| Igualdad               | `?campo=valor`                          | `?status=confirmed`          |
| Comparación            | `?campo__gte=`/`__lte=`/`__gt=`/`__lt=` | `?issued_at__gte=2026-01-01` |
| Pertenencia a conjunto | `?campo__in=v1,v2,v3`                   | `?status__in=confirmed,paid` |
| Texto libre            | `?search=` (reservado)                  | `?search=acme`               |

**Tres reglas obligatorias** (no solo sintaxis): whitelist explícita por endpoint vía
el validator Zod (un filtro fuera de whitelist se ignora, no es 400); un filtro nunca
amplía el alcance de tenant/empresa ya resuelto por `TenantInterceptor`; un campo solo
se whitelistea si ya está indexado para ese patrón de acceso — se decide junto con la
estrategia de índices del módulo (`docs/database/04-estrategia-indices.md`), no
después. Detalle completo en `30-api-completa.md §7`.

## 5. WebSocket (referencia)

El WebSocket **nunca reemplaza** una respuesta REST — solo invalida queries de
TanStack Query del lado del cliente, el dato en sí siempre se vuelve a pedir por REST
(`docs/architecture/05-flujo-de-datos.md §2`, `30-api-completa.md §3`). Consumo desde
el cliente: [docs/frontend/API_LAYER.md §5](../frontend/API_LAYER.md#5-cliente-websocket).

## 6. Autenticación (referencia)

Los cuatro mecanismos de credencial (JWT de sesión, OAuth2 de terceros, API Key, y
cualquier mecanismo futuro) entran por el mismo punto de extensión de
`core/http/guards/`, nunca lógica repetida por controller
(`docs/architecture/30-api-completa.md §5`). Detalle completo:
`docs/architecture/13-modulo-auth.md`, `15-modulo-security.md`. Consumo desde el
cliente (refresh de token): [docs/frontend/API_LAYER.md §4](../frontend/API_LAYER.md#4-autenticación-y-refresh-de-token).

## 7. Contrato compartido FE↔BE (referencia)

El mismo schema Zod de `backend/validators/` se reexporta desde
`modules/<x>/shared/contracts/` para que el frontend lo use con React Hook Form —
garantiza que frontend y backend validan exactamente lo mismo
(`docs/architecture/02 §3`, `03 §4`). Un cambio de contrato rompe el build del
frontend en tiempo de compilación, no en producción — este es el mecanismo que hace
"un contrato, no dos" verificable, no solo aspiracional.

## 8. Checklist de salida (todo endpoint nuevo)

- [ ] Schema Zod definido antes que el DTO.
- [ ] Guards de auth + permiso aplicados, en ese orden.
- [ ] Respuesta en formato `{data, meta}` / `{error:{code,message,details}}`.
- [ ] Paginación offset+limit salvo que el recurso esté en la lista de candidatos a
      cursor-based.
- [ ] Filtros (si aplica) con whitelist Zod + índice ya existente para cada campo
      filtrable.
- [ ] Contrato reexportado en `shared/contracts/` para el frontend.

## 9. Trazabilidad

| Punto                                 | Ya fijado en                                        | Cerrado/detallado acá              |
| ------------------------------------- | --------------------------------------------------- | ---------------------------------- |
| REST vs. GraphQL                      | `docs/architecture/30-api-completa.md §1-2`         | Referencia (§1)                    |
| Procedimiento de creación de endpoint | Disperso en `02`, `07-convenciones`, `09-seguridad` | Checklist único (§2)               |
| Versionado                            | `07-convenciones §4`, `30 §4`                       | Referencia (§3)                    |
| Filtros                               | `30 §7`                                             | Referencia (§4)                    |
| WebSocket                             | `05-flujo-de-datos.md §2`, `30 §3`                  | Referencia + consumo frontend (§5) |
| Autenticación                         | `30 §5`, `13`, `15`                                 | Referencia (§6)                    |
| Contratos compartidos                 | `02 §3`, `03 §4`                                    | Referencia (§7)                    |
