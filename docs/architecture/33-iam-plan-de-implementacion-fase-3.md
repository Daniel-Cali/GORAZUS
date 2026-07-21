# 33 — IAM: Plan de implementación (Fase 3)

> Plan técnico de construcción — versión 1.0, 2026-07-13. Igual que
> [32-core-platform/13](./32-core-platform/13-plan-de-implementacion-fase-2.md),
> esto **no es diseño nuevo ni código** — es el orden de construcción
> de algo que, a diferencia del Core Platform de la Fase 2, **ya está
> diseñado en un 76%** (13 de 17 puntos pedidos). El trabajo real de
> este documento es: mapear, detectar los 4 puntos que no están al
> 100%, y fijar el orden — no redactar especificación desde cero.
>
> Nota de alcance: "Fase 3" es tu numeración de secuencia de
> construcción (Fase 1 = arquitectura, Fase 2 = Core Platform, Fase 3
> = IAM). Es distinta de la numeración de `00-roadmap-fases.md`, donde
> esto es la Fase 04 ("Sistema IAM"), ya marcada ✅ Completo — ver §3
> para la tensión real que eso genera con este plan.

## 1. Mapeo: los 17 puntos pedidos → lo ya diseñado

| #   | Pedido           | Estado                                           | Documento(s)                                                                                                                                                                                                                           |
| --- | ---------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Auth             | ✅ Completo                                      | [13-modulo-auth.md](./13-modulo-auth.md) (módulo completo)                                                                                                                                                                             |
| 2   | JWT              | ✅ Completo                                      | [09 §1](./09-seguridad-y-multiempresa.md#1-autenticación-auth) (decisión: access+refresh, sin roles embebidos) + [13 §2](./13-modulo-auth.md#2-jwt) (flujo completo con 2FA)                                                           |
| 3   | OAuth            | ✅ Completo                                      | [13 §3](./13-modulo-auth.md#3-oauth) — GORAZUS como **proveedor** (Authorization Code + PKCE), no como consumidor                                                                                                                      |
| 4   | LDAP             | ❌ Fuera de alcance por ahora                    | Ver §2 — no se diseña especulativamente                                                                                                                                                                                                |
| 5   | Active Directory | ❌ Fuera de alcance por ahora                    | Ver §2 — no se diseña especulativamente                                                                                                                                                                                                |
| 6   | 2FA              | ✅ Completo                                      | [13 §5](./13-modulo-auth.md#5-2fa) — enrolamiento TOTP + backup codes + reto en login                                                                                                                                                  |
| 7   | Users            | ✅ Completo                                      | [15 §1](./15-modulo-security.md#1-usuarios--administración-no-autenticación) (administración/ciclo de vida) — login vive en 13                                                                                                         |
| 8   | Roles            | ✅ Completo                                      | [13 §6](./13-modulo-auth.md#6-roles) (RBAC) + [15 §2](./15-modulo-security.md#2-roles--resumen-detalle-completo-en-13) (gobernanza)                                                                                                    |
| 9   | Permissions      | ✅ Completo                                      | [13 §7](./13-modulo-auth.md#7-permisos) (catálogo `<módulo>.<acción>`, 4 mecanismos de otorgamiento unificados)                                                                                                                        |
| 10  | Policies         | ✅ Completo, con nota de alcance                 | `security.security_policies`/`password_policies` — ver §4 (no confundir con **Policy Engine** de la Fase 2, son cosas distintas)                                                                                                       |
| 11  | ACL              | ✅ Completo                                      | [13 §8](./13-modulo-auth.md#8-autorización-cómo-se-combinan-roles-y-acl-regla-de-precedencia--no-existía) (precedencia deny>allow>role) + [15 §4](./15-modulo-security.md#4-acl--administración-nueva-la-precedencia-ya-está-en-13-§8) |
| 12  | RBAC             | ✅ Completo                                      | [09 §2](./09-seguridad-y-multiempresa.md#2-autorización-seguridad) + [13 §6, §8](./13-modulo-auth.md) + [15 §5](./15-modulo-security.md#5-rbac--vista-resumen-detalle-completo-en-13-§6-8)                                             |
| 13  | ABAC             | 🟡 Diseño parcial, ya declarado pendiente de ADR | [15 §6](./15-modulo-security.md#6-abac-attribute-based-access-control--diseño-nuevo-candidato-pendiente-de-adr) — ver §5                                                                                                               |
| 14  | Sessions         | ✅ Completo                                      | [13 §9](./13-modulo-auth.md#9-sesiones) — modelo de dos escalas de tiempo + gestión (listar/revocar)                                                                                                                                   |
| 15  | Devices          | 🟡 Modelo de datos real, falta ciclo de vida     | Ver §6 — gap real y acotado                                                                                                                                                                                                            |
| 16  | API Keys         | ✅ Completo                                      | [13 §10](./13-modulo-auth.md#10-api-keys)                                                                                                                                                                                              |
| 17  | Refresh Tokens   | ✅ Completo                                      | [09 §1](./09-seguridad-y-multiempresa.md#1-autenticación-auth) + [13 §4](./13-modulo-auth.md#4-refresh-token) (detección de reuso → revoca toda la familia de sesión)                                                                  |

**13 de 17 ya están completos y no requieren ni una línea de diseño
adicional** — el trabajo de este documento para esos 13 es
exclusivamente de secuenciación (§7). Quedan 4 puntos con matices
reales: LDAP/AD (§2), Policies — nota de desambiguación (§4), ABAC
(§5), Devices (§6).

## 2. LDAP y Active Directory: no se diseñan especulativamente

Grep completo sobre todo `docs/` (arquitectura + base de datos):
**cero menciones** de LDAP, Active Directory, SAML o Kerberos en
ningún documento ni en el schema SQL. No es un descuido — es
consistente con una decisión de alcance ya tomada explícitamente en
[13-modulo-auth.md §3](./13-modulo-auth.md#3-oauth): GORAZUS es
**proveedor** OAuth2, no consumidor, y el caso inverso ("iniciar
sesión con un IdP externo") queda **"fuera de alcance hasta que haya
necesidad de negocio confirmada"**. LDAP/Active Directory son
exactamente esa misma categoría de característica (GORAZUS
delegando/validando identidad contra un directorio externo), solo que
corporativo en vez de social.

La regla de gobernanza del proyecto ya fijada en
[11-gobernanza-y-adrs.md §1](./11-gobernanza-y-adrs.md#1-cómo-se-agrega-un-módulo-nuevo)
es explícita: no se diseña especulativamente sin necesidad de negocio
confirmada — el mismo criterio ya aplicado a Fase 27 (Inteligencia
Artificial) y Fase 29 (Aplicación Móvil) en
[00-roadmap-fases.md](../00-roadmap-fases.md), ambas marcadas
"❌ Pendiente de definir alcance", no diseñadas de antemano.

**Por eso este plan no incluye LDAP/Active Directory como hito.** Si
en algún momento se confirma una necesidad real (p. ej. un cliente
enterprise que exige SSO corporativo contra su directorio), se
diseña en ese momento como una extensión — probablemente un nuevo
`security.ldap_directory_configs` + un flujo de _bind_ + sincronización
de usuarios, evaluado contra el mecanismo OAuth2/JWT ya existente, no
reemplazándolo. Hasta entonces, queda fuera del plan de Fase 3, igual
de explícito que las fases 27/29.

## 3. Tensión con `00-roadmap-fases.md`: "Sistema IAM ✅ Completo"

El roadmap de documentación marca la Fase 04 (IAM) como **✅
Completo** apuntando a `13-modulo-auth.md` + `15-modulo-security.md`.
Eso sigue siendo cierto para el propósito de ese roadmap — "¿existe
documento de arquitectura?" Sí, para los 13 puntos centrales. Este
plan de Fase 3 no lo contradice: LDAP/AD nunca estuvieron en el
alcance que ese "Completo" declara (esos 13 puntos no los incluían),
y ABAC/Devices ya estaban marcados como parciales **dentro** de esos
mismos documentos antes de este plan (no es un gap que este documento
descubra, es uno que los propios documentos ya declaraban). No hace
falta editar el roadmap — este plan es coherente con lo que ya dice.

## 4. Nota de desambiguación: "Policies" (IAM) vs. "Policy Engine" (Core Platform, Fase 2)

Dos cosas con nombre parecido, dominios distintos — vale la pena
dejarlo explícito para no confundirlas en la construcción:

- **Policies (este documento, IAM)** = configuración concreta por
  tenant/company: `security.security_policies`
  (`requires_2fa`, `session_timeout_minutes`, `max_login_attempts`) y
  `password_policies` (complejidad de contraseña). Son **datos de
  configuración**, no un motor de evaluación.
- **Policy Engine (Fase 2, Core Platform)** =
  [32-core-platform/05 §3](./32-core-platform/05-motores-de-logica-de-negocio.md#3-policy-engine),
  el componente de código que evalúa `PolicyEngineService.can(actor,
action, resource)`. Hoy delega 100% en RBAC (§8 de este documento);
  el día que ABAC se apruebe por ADR, el Policy Engine es quien
  consume `security.attribute_policies` (ver §5) — pero el Policy
  Engine en sí ya está planificado en el Hito H5 de la Fase 2, no de
  esta Fase 3.

## 5. ABAC: hito bloqueado hasta que exista el ADR

`15-modulo-security.md §6` ya declara, con sus propias palabras, "no
existe hoy una tabla genérica de políticas ABAC en el schema" y
propone (sin crear) `security.attribute_policies`. Esto es
exactamente el mismo patrón de gobernanza que LDAP/AD (§2): no se
construye sin la decisión formal correspondiente. La diferencia es
que ABAC sí tiene un diseño candidato completo esperando aprobación
— LDAP/AD ni eso.

**Este plan agrega ABAC como Hito H5(F3), pero bloqueado**: no se
implementa `security.attribute_policies` ni el motor de evaluación de
atributos hasta que se abra y apruebe el ADR correspondiente, siguiendo
el proceso ya fijado en
[11-gobernanza-y-adrs.md](./11-gobernanza-y-adrs.md). El resto de
IAM (H1-H4) no depende de esa decisión y puede construirse sin
esperarla.

## 6. Devices: gap real y acotado — qué falta exactamente

A diferencia de LDAP/AD/ABAC, esto **no** es una decisión de negocio
pendiente — es un flujo que falta especificar sobre datos que ya
existen (`core.user_devices`, `security.trusted_devices`, ya en el
schema). Antes de construir, faltan 3 piezas de diseño menor (no
requieren ADR, son detalle de implementación de algo ya aprobado):

1. **Mecanismo de fingerprint**: el diagrama de login en
   `13-modulo-auth.md §2` recibe un `deviceFingerprint` como parámetro
   pero nunca especifica cómo se calcula en el cliente.
2. **Flujo de registro**: cómo/cuándo nace una fila en
   `core.user_devices` — hoy el documento salta directo a consultar
   `trusted_devices`.
3. **Gestión del usuario**: pantalla "Dispositivos" análoga a la ya
   diseñada de "Sesiones activas" (`13-modulo-auth.md §9`) — listar,
   renombrar, revocar confianza de un dispositivo.

Estas 3 piezas se resuelven como una adenda corta a
`13-modulo-auth.md §5` antes de construir el Hito H3(F3) — no
bloquean el resto del plan, y no requieren volver a este documento una
vez resueltas.

## 7. Orden de construcción (hitos)

Requiere primero
[Fase 2, Hitos H1-H3](./32-core-platform/13-plan-de-implementacion-fase-2.md#4-orden-de-construcción-hitos)
completos — Auth no tiene dónde apoyarse sin Kernel, Security Context,
Repository Base y Audit Framework ya funcionando.

### H1(F3) — Núcleo de autenticación

- **Users** (administración — [15 §1](./15-modulo-security.md#1-usuarios--administración-no-autenticación)),
  **JWT** ([13 §2](./13-modulo-auth.md#2-jwt)), **Refresh Tokens**
  ([13 §4](./13-modulo-auth.md#4-refresh-token)), **Sessions**
  ([13 §9](./13-modulo-auth.md#9-sesiones)).
- Requiere: Fase 2 H2 (Security Context, Repository Base).
- **Listo cuando:** login/logout/refresh funcionan de punta a punta
  contra Postgres real, la reutilización de un refresh token ya
  revocado dispara la revocación de toda la familia de sesión (test
  de integración explícito para esto, es el caso más fácil de dejar
  roto por accidente).

### H2(F3) — Autorización

- **Roles, Permissions, RBAC, ACL** ([13 §6-8](./13-modulo-auth.md), [15 §2-5](./15-modulo-security.md)).
- Requiere: H1(F3) (necesita saber quién es el actor).
- **Listo cuando:** la regla de precedencia deny > allow > role tiene
  un test por cada combinación posible (no solo el caso feliz), y un
  usuario sin rol pero con una ACL explícita de `allow` accede
  correctamente.

### H3(F3) — Refuerzos de autenticación

- **2FA** ([13 §5](./13-modulo-auth.md#5-2fa)) + **Devices** (con las
  3 piezas de §6 ya resueltas primero).
- Requiere: H1(F3).
- **Listo cuando:** el enrolamiento TOTP genera códigos de respaldo
  utilizables una sola vez, y marcar un dispositivo como confiable
  efectivamente omite el reto de 2FA en el siguiente login dentro de
  `trusted_until`, no después.

### H4(F3) — Extensiones de acceso

- **API Keys** ([13 §10](./13-modulo-auth.md#10-api-keys)), **OAuth**
  ([13 §3](./13-modulo-auth.md#3-oauth)).
- Requiere: H2(F3) (permisos/scopes ya definidos, ambos mecanismos se
  apoyan en el mismo catálogo de permisos).
- **Listo cuando:** una API Key con scope limitado no puede invocar un
  endpoint fuera de su scope aunque el usuario dueño de la key sí
  tenga permiso (prueba de que el scope de la key, no el permiso del
  usuario, es el límite real), y el flujo Authorization Code + PKCE
  emite un token opaco verificable contra `oauth_tokens`.

### H5(F3) — ABAC (bloqueado hasta ADR — ver §5)

- No se planifica fecha de inicio — depende de una decisión de
  gobernanza, no de disponibilidad de ingeniería.

## 8. Resumen visual

```
Fase 2 (Core Platform) H1-H3
 └─▶ H1(F3) Users · JWT · Refresh Tokens · Sessions
      └─▶ H2(F3) Roles · Permissions · RBAC · ACL
           ├─▶ H3(F3) 2FA · Devices (tras resolver §6)
           └─▶ H4(F3) API Keys · OAuth
                └─▶ H5(F3) ABAC — BLOQUEADO hasta ADR (§5)

Fuera del plan: LDAP, Active Directory — sin necesidad de negocio
confirmada (§2), mismo criterio que Fases 27/29 del roadmap.
```
