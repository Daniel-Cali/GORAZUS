# 09 — Seguridad, autenticación/autorización y multiempresa

> **Nota de alcance:** este documento fija el _mecanismo_ técnico
> (cómo se identifica, autoriza y aísla a un usuario/empresa). No asume
> qué roles, permisos o planes concretos existirán — eso se define módulo
> por módulo cuando haya una necesidad de negocio confirmada, igual que
> el resto del catálogo funcional (ver
> [04-catalogo-modulos-negocio.md](./04-catalogo-modulos-negocio.md)).
> El soporte multiempresa sí se fija como decisión de arquitectura desde
> el día uno, porque es una decisión que toca el esquema de datos de
> _todos_ los módulos — cambiarla después de tener datos reales es
> mucho más costoso que decidirla ahora. Si el negocio confirma que
> nunca habrá más de una empresa por instalación, esta capa simplemente
> queda con `empresaId` fijo — no se paga costo funcional extra, solo
> se evita el rediseño si la necesidad aparece.

## 1. Autenticación (`auth`)

- JWT de dos tokens: **access token** de vida corta (~15 min) y
  **refresh token** de vida más larga (~7 días), rotado en cada uso
  (refresh token rotation) para poder detectar reuso indebido.
- El access token lleva `sub` (userId), `empresaId` activa y un
  `sessionId` — no lleva roles/permisos embebidos para que revocar un
  permiso sea instantáneo (no hay que esperar a que expire un token
  viejo con permisos desactualizados).
- El refresh token se guarda del lado del cliente (httpOnly cookie) y su
  estado (válido/revocado) se verifica contra Redis — permite cerrar
  sesión de forma inmediata y real ("cerrar sesión en todos los
  dispositivos"), cosa que un JWT puro y stateless no permite.

## 2. Autorización (`seguridad`)

- Modelo RBAC: `Usuario` → `Rol` (por empresa) → `Permiso`.
- Permiso = `<modulo>.<accion>` (`ventas.crear`, `ventas.confirmar`,
  `contabilidad.ver_asientos`). Granularidad a nivel de acción, no solo
  de módulo, para poder dar acceso de solo lectura a un módulo sin dar
  acceso de escritura.
- El `JwtAuthGuard` (autentica) y el `PermissionsGuard` (autoriza) son
  dos guards separados en `core/http`, aplicados por decorador en cada
  endpoint:

```ts
@RequirePermission('ventas.confirmar')
@Post(':id/confirmar')
confirmar(@Param('id') id: string) { ... }
```

- La verificación de permisos consulta `seguridad` (con cache en Redis
  con invalidación al cambiar un rol) — ningún módulo implementa su
  propia lógica de autorización paralela.
- El frontend refleja permisos vía un hook (`usePermiso('ventas.crear')`)
  para ocultar acciones no autorizadas de la UI, pero eso es solo
  UX — la autorización real y obligatoria ocurre siempre en el backend.

## 3. Multiempresa (multi-tenant)

- Modelo elegido: **una sola base de datos, aislamiento por columna**
  (`empresaId` en cada tabla de negocio), no bases de datos separadas
  por empresa. Es el balance correcto para el tamaño de cliente objetivo
  (pymes) entre aislamiento y costo operativo — separar por base de
  datos física es una opción a reconsiderar solo si aparece un cliente
  con requisitos regulatorios que lo exijan.
- El aislamiento se aplica en la **capa base de repositorio**
  (`core/database`), no en cada query escrita a mano: todo repositorio
  concreto extiende una clase base que inyecta automáticamente el filtro
  `empresaId` a partir del `TenantContext` resuelto por el
  `TenantInterceptor` (ver
  [05-flujo-de-datos.md](./05-flujo-de-datos.md#1-ciclo-de-vida-de-una-request-http-estándar)).
  Esto hace que "olvidarse de filtrar por empresa" sea estructuralmente
  difícil en vez de depender de la disciplina de cada desarrollador.
- Un usuario puede pertenecer a más de una empresa (caso típico: un
  contador que atiende varias pymes); la empresa activa se selecciona al
  iniciar sesión y viaja en el JWT — cambiar de empresa implica emitir
  un nuevo access token, no una bandera mutable en la sesión.

## 4. Qué pasa en los módulos con esto

- Todas las entidades de negocio (todo lo listado en
  [04-catalogo-modulos-negocio.md](./04-catalogo-modulos-negocio.md))
  llevan `empresaId`. Las entidades verdaderamente globales (catálogos
  técnicos del sistema, no de una empresa) son la excepción explícita,
  no la regla.
- Los eventos de dominio (`VentaConfirmadaEvent`, etc.) siempre incluyen
  `empresaId` — un consumidor nunca asume una única empresa.
- `configuracion` es el módulo dueño de la entidad `Empresa` en sí
  misma (sus datos fiscales, monedas, series) — ver catálogo de módulos.

## 5. Qué se deja fuera de esta versión del documento

Cosas que son de negocio, no de arquitectura, y se definen cuando haya
necesidad confirmada: catálogo completo de roles predefinidos, si hay
jerarquía de roles, si hay permisos a nivel de campo (no solo de
acción), políticas de contraseña, 2FA. Este documento solo garantiza que
el mecanismo (guards, tabla de permisos, aislamiento por empresa) esté
listo para soportarlas sin cambios estructurales cuando se necesiten.
