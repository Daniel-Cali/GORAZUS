# Security Report — GORAZUS ERP

> Fase 2 — Desarrollo del Backend Core. Sesión del 2026-07-22, versión
> **0.3.0**. Cubre exactamente lo que cambió esta sesión — no repite el
> checklist de seguridad genérico ya cubierto en sesiones previas
> (Argon2id, RLS, SQL injection vía Prisma parametrizado, helmet, CORS con
> origen exacto — todos ya reales antes de esta sesión, confirmado por
> auditoría, sin cambios acá).

## 1. Los 4 gaps reales cerrados (auditoría → fix → verificación)

| #   | Gap encontrado                                                            | Fix                                                                                                  | Verificado cómo                                                                                  |
| --- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 1   | `security.login_attempts` sin escritor — sin bloqueo por fuerza bruta     | `LoginAttemptRepository` + `CuentaBloqueadaException` (429) tras 5 fallos/15min, por (tenant, email) | 5 tests unitarios (fakes) + e2e real                                                             |
| 2   | `/auth/login` sin rate limit propio (compartía el global 100/60s)         | `@Throttle({ default: { limit: 5, ttl: 60_000 } })`                                                  | Confirmado indirectamente: los propios e2e tuvieron que reordenarse para no chocar con el límite |
| 3   | Access token sin revocación — válido ~15 min pase lo que pase tras logout | `LogoutUseCase` marca el `sessionId` revocado en Redis; `JwtStrategy` lo consulta                    | e2e real: login → logout → reusar el mismo token → 401                                           |
| 4   | `/auth/refresh` (único endpoint cookie-only) sin defensa CSRF explícita   | `SameSite: 'lax'` → `'strict'` + chequeo de `Origin` contra `CORS_ORIGIN`                            | e2e real: `Origin` cross-site → 403                                                              |

Detalle técnico completo de cada uno en `CHANGELOG.md` § "Corregido" (misma
fecha). Trade-off aceptado y documentado inline en el código: el bloqueo
por intentos (#1) cuenta por email sin confirmar que exista, lo que en
teoría permite que alguien fuerce el bloqueo de una cuenta ajena fallando
5 veces a propósito — cerrar eso del todo pide límite por IP o CAPTCHA,
fuera de esta fase.

## 2. 2FA — de "preparado" a exigido

`security.two_factor_credentials` y su flujo de setup/confirmar/deshabilitar
ya eran reales desde la sesión anterior, pero `LoginUseCase` nunca los
consultaba — un atacante con la contraseña de un usuario con 2FA activo
igual entraba. Ahora `POST /auth/login` retiene los tokens y exige un
segundo paso (`POST /auth/login/2fa`) con el código TOTP real cuando hay una
credencial confirmada. El `challengeToken` es de un solo uso (se borra de
Redis al leerlo, importe o no el resultado del código) — verificado que
reintentar con el mismo token, exitoso o no el primer intento, siempre da
401 en el segundo.

## 3. Superficie nueva: `core/storage` expuesto por primera vez

`POST/GET/DELETE /files` es la primera vez que el backend acepta contenido
binario arbitrario subido por un usuario. Mitigaciones aplicadas:

- Límite de tamaño (25MB, `multer` `limits.fileSize`) — rechaza antes de
  llenar memoria/disco.
- Nombre de archivo sanitizado antes de convertirse en parte de la object
  key (`sanitizeFileName`) — sin esto, un nombre como `../../etc/passwd`
  quedaría literal en la key (no explotable como path traversal real en
  MinIO, que no tiene filesystem jerárquico, pero sanitizado de todos
  modos por higiene y legibilidad).
- Aislamiento multi-tenant a nivel de bucket (`archivos-<tenantId>`) — un
  usuario autenticado de un tenant no puede alcanzar objetos de otro
  tenant sin importar qué `key` intente adivinar, porque su JWT solo
  autoriza contra el bucket de su propio tenant.
- Protegido por el `JwtAuthGuard` global — sin `@Public()`, requiere
  autenticación como cualquier otro endpoint de negocio.

## 4. Dependencias — dos CVEs reales introducidos y cerrados en la misma sesión

Agregar `nodemailer` y elevar `multer` a dependencia directa (antes
transitiva y sin usar) subió `pnpm audit` de 35 a 47 vulnerabilidades —
a diferencia del resto de la deuda ya documentada (heredada, deferida por
riesgo de regresión en código ya verificado), estas las introdujo esta
misma sesión, así que se resolvieron acá:

| Paquete      | Antes  | Después | Cierra                                                                                                                        |
| ------------ | ------ | ------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `nodemailer` | 6.10.1 | 9.0.3   | 8 advisories, incluyendo validación de certificado TLS y CRLF injection en headers — relevante porque ahora manda correo real |
| `multer`     | 2.0.2  | 2.2.0   | DoS por nested field names / cleanup incompleto — relevante porque ahora hay un endpoint de upload real                       |

**39 vulnerabilidades restantes** (era 35 antes de esta sesión, +4 neto tras
los dos fixes de arriba) — todas la misma deuda de tooling/observabilidad ya
rastreada en `CHANGELOG.md` "Pendiente conocido" (Vitest UI crítica sin
superficie real, minimatch/picomatch ReDoS en tooling de build, exporters de
OpenTelemetry). `security.yml` sigue con `pnpm audit || true` (no bloqueante)
— decisión ya tomada, no revisitada acá.

## 5. Efecto colateral de seguridad: `trust proxy`

`app.set('trust proxy', 1)` en `core/kernel/bootstrap.ts` — sin esto,
`req.ip` (usado ahora por el rate limiter Y por el registro de intentos de
login) siempre resolvía a la IP interna de nginx, no la del cliente real.
Esto no es solo un bug de logging: sin la IP real, el rate limiting global
(`ThrottlerGuard`) tampoco distinguía clientes reales detrás de nginx —
cualquier IP falsa en `X-Forwarded-For` sin este flag habría sido ignorada
de todos modos (Express no confía en el header sin `trust proxy` seteado),
así que el fix no abre una superficie de IP-spoofing nueva, cierra un
bug de "todo el tráfico se ve igual" que ya existía.

## 6. No evaluado esta sesión

- Pentesting real / escaneo de vulnerabilidades activo contra la API
  corriendo — fuera de alcance de este entorno de agente.
- Rotación de `JWT_ACCESS_SECRET`/`SEGURIDAD_ENCRYPTION_KEY`/`NOTIFICATIONS_ENCRYPTION_KEY`
  — sin cambios, siguen siendo claves únicas sin mecanismo de rotación
  (documentado como Fase 2 futura desde antes de esta sesión).
