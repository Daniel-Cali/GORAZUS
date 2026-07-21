# Security Guidelines — GORAZUS

> EPIC 04 — Implementation Standards. Consolida `docs/architecture/09-seguridad-y-multiempresa.md`,
> `docs/architecture/13-modulo-auth.md`, `15-modulo-security.md`,
> `docs/database/06-estrategia-seguridad.md` y `docs/frontend/API_LAYER.md §4`/`ROUTING.md §5`
> en una lista operativa de "qué está permitido, qué está prohibido" en materia de
> seguridad — no repite el diseño completo de esos módulos. Sin código.

## 1. Autenticación (referencia)

JWT de dos tokens — access (~15 min) sin roles/permisos embebidos, refresh (~7 días,
rotado, httpOnly cookie, verificado contra Redis para revocación real) — ya fijado
completo en `docs/architecture/09-seguridad-y-multiempresa.md §1`,
`13-modulo-auth.md`. Consumo desde el cliente:
[docs/frontend/API_LAYER.md §4](../frontend/API_LAYER.md#4-autenticación-y-refresh-de-token).

## 2. Autorización (referencia)

RBAC: `Usuario → Rol (por empresa) → Permiso`, granularidad `<modulo>.<accion>`.
`JwtAuthGuard` + `PermissionsGuard` en cada endpoint, verificación contra `seguridad`
con cache invalidado al cambiar un rol — ningún módulo implementa autorización
paralela (`09 §2`, `15-modulo-security.md §4-6`). **Regla que no admite excepción,
repetida en cada documento que la toca por su importancia:** el frontend refleja
permisos solo para UX (`usePermiso()`, ocultar botón, bloquear ruta) — la
autorización real y obligatoria ocurre siempre en el backend, sin excepción, sin
importar cuán "obviamente" un botón esté oculto en la UI.

## 3. Aislamiento multiempresa (RLS, referencia)

`tenant_id`/`company_id`/`branch_id` aplicados en la capa base de repositorio,
reforzados por Row-Level Security de Postgres — un bug de aplicación que olvida
filtrar por tenant pasa de "fuga de datos entre clientes" a "cero filas devueltas"
(`docs/database/06-estrategia-seguridad.md §1`, detalle completo en
[DATABASE_GUIDELINES.md §6](./DATABASE_GUIDELINES.md#6-row-level-security-referencia)).
**Ningún repositorio nuevo se escribe sin heredar de la clase base que inyecta el
filtro** — escribir una query Prisma cruda que evite la clase base es la forma más
directa de introducir una fuga de datos entre tenants.

## 4. Secretos y credenciales

No estaba consolidado en un solo lugar — se fija acá:

- Ningún secreto (API key, credencial de integración, connection string con
  password) se commitea al repositorio, ni siquiera en un archivo `.env` real —
  solo `.env.example` con placeholders (ya presente en la raíz del repo).
- Variables de entorno se cargan y validan vía `core/config` (Zod,
  `docs/architecture/01-estructura-monorepo.md §2`) — un módulo nunca lee
  `process.env` directamente, siempre a través del esquema validado de `core/config`,
  que falla rápido (fail-fast) si falta una variable requerida en vez de continuar
  con `undefined` silencioso.
- Credenciales de integraciones externas (`security.integration_credentials`) se
  cifran con `pgcrypto` — nunca en texto plano en base de datos, ni siquiera en un
  campo `metadata` (`docs/database/06-estrategia-seguridad.md §3`).
- Un campo de secreto (contraseña, API key) en un formulario de frontend nunca se
  muestra en texto plano tras guardar — ya aplicado explícitamente en el catálogo de
  pantallas (`docs/product/07_SCREEN_CATALOG.md §4.24`, "Credenciales de API").

## 5. Validación de entrada (input validation)

- Zod es la única fuente de verdad de validación, backend y frontend, vía
  `shared/contracts` — no se duplican reglas escritas a mano en dos lugares
  (`docs/architecture/07-convenciones-y-estandares.md §7`).
- El frontend **nunca** es la única línea de defensa — toda validación de UI se
  re-valida en el backend, sin excepción (`docs/architecture/03 §4`, repetido acá
  porque es la regla de seguridad más fácil de relajar bajo presión de entrega).
- Filtros de query string siguen whitelist obligatoria por endpoint — un parámetro
  fuera de whitelist se ignora, nunca se ejecuta contra la base sin control
  ([API_GUIDELINES.md §4](./API_GUIDELINES.md#4-filtros-referencia)).

## 6. Cifrado (referencia)

En tránsito: `sslmode=verify-full` obligatorio, sin excepción ni en entornos
internos. En reposo a nivel de columna: `pgcrypto` para campos de sensibilidad alta
(`customers.customer_bank_accounts`, `hr.employees`, `security.integration_credentials`)
— lista completa y mecanismo de rotación de claves en
`docs/database/06-estrategia-seguridad.md §3`. No se repite.

## 7. OWASP — cobertura por mecanismo ya diseñado (nuevo — no estaba mapeado así)

No existía un mapeo directo del proyecto contra riesgos OWASP conocidos — se fija
acá, apuntando al mecanismo que ya lo cubre en vez de diseñar controles nuevos
redundantes:

| Riesgo                                | Mitigado por                                                                                                                                                                                          |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Inyección SQL                         | Prisma parametrizado (nunca SQL concatenado a mano); si un caso excepcional requiere SQL crudo, usar consultas parametrizadas de Prisma (`$queryRaw` con template tag), nunca interpolación de string |
| Autenticación rota                    | §1 — JWT con rotación de refresh y detección de reuso                                                                                                                                                 |
| Exposición de datos sensibles         | §3 (RLS) + §6 (cifrado)                                                                                                                                                                               |
| Control de acceso roto                | §2 (RBAC, autorización solo en backend)                                                                                                                                                               |
| Configuración de seguridad incorrecta | `core/config` con validación fail-fast (§4), roles de BD de privilegio mínimo (`DATABASE_GUIDELINES.md §7`)                                                                                           |
| XSS                                   | React escapa por defecto; contenido HTML crudo (`dangerouslySetInnerHTML`) prohibido salvo sanitización explícita revisada en code review                                                             |
| Deserialización insegura              | Zod valida forma y tipo en cada frontera, nunca se confía en un `JSON.parse` sin schema                                                                                                               |
| Logging y monitoreo insuficiente      | Logging estructurado con `empresaId`/`userId`/`requestId` (`docs/architecture/07-convenciones-y-estandares.md §6`) + Sentry en frontend (`docs/frontend/ERROR_HANDLING.md §5`)                        |

## 8. Qué está prohibido (síntesis)

| Prohibido                                                            | Ver                         |
| -------------------------------------------------------------------- | --------------------------- |
| Autorización decidida solo en el frontend                            | §2                          |
| Query Prisma que evite la clase base de aislamiento de tenant        | §3                          |
| Secreto commiteado al repositorio, incluso en `.env` real            | §4                          |
| `process.env` leído fuera de `core/config`                           | §4                          |
| Validación de formulario sin su contraparte de validación en backend | §5                          |
| SQL concatenado a mano con interpolación de string de usuario        | §7                          |
| `dangerouslySetInnerHTML` sin sanitización revisada                  | §7                          |
| Rol de aplicación con `BYPASSRLS` o superusuario                     | `DATABASE_GUIDELINES.md §7` |

## 9. Trazabilidad

| Punto                 | Ya fijado en                                             | Cerrado/detallado acá            |
| --------------------- | -------------------------------------------------------- | -------------------------------- |
| Autenticación         | `09-seguridad-y-multiempresa.md §1`, `13-modulo-auth.md` | Referencia (§1)                  |
| Autorización          | `09 §2`, `15-modulo-security.md`                         | Referencia + regla repetida (§2) |
| Multiempresa/RLS      | `06-estrategia-seguridad.md §1`                          | Referencia (§3)                  |
| Secretos              | Ninguno — disperso/implícito                             | Consolidado (§4)                 |
| Validación de entrada | `07-convenciones §7`, `03 §4`                            | Referencia (§5)                  |
| Cifrado               | `06-estrategia-seguridad.md §3`                          | Referencia (§6)                  |
| OWASP                 | Ninguno — nunca mapeado                                  | Tabla de cobertura (§7)          |
