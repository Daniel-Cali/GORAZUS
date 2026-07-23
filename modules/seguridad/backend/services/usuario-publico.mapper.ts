import type { users } from '@gorazus/core-database';

/**
 * `users` sin `password_hash` — encontrado en esta parte (FASE 03 Parte
 * 03) que `UsuariosController`/`UsuariosAdminService` devolvían la fila
 * cruda de Prisma tal cual en CADA respuesta (`GET /me`, `PATCH /me`,
 * `POST /` crear, `activar`/`desactivar`, `GET` listar), exponiendo el
 * hash Argon2id de la contraseña al cliente — no es texto plano, pero
 * habilita intentos de cracking offline igual, y viola directamente
 * "Evitar exposición de datos sensibles" (pedido explícito de esta
 * parte). Toda respuesta que incluya un usuario debe pasar por acá.
 */
export type UsuarioPublico = Omit<users, 'password_hash'> & {
  /** Estado agregado para el cliente — ver `usuarios-admin.service.ts` resolverEstado(). */
  status: 'active' | 'inactive' | 'suspended' | 'blocked' | 'pending_activation' | 'deleted';
};

export function toUsuarioPublico(usuario: users, status: UsuarioPublico['status']): UsuarioPublico {
  const { password_hash: _passwordHash, ...resto } = usuario;
  return { ...resto, status };
}

/**
 * Estado agregado (FASE 03 Parte 03) — `core.users` solo persiste
 * `is_active`/`deleted_at` (booleano + soft-delete), no un enum de
 * estado. Los estados más finos pedidos (suspendido/bloqueado/pendiente
 * de activación) se guardan en `metadata.status` (JSONB) EN CONJUNTO con
 * `is_active=false` — nunca como la única señal, para que cualquier
 * chequeo existente que ya lee `is_active` (ej. `Usuario.puedeAutenticarse()`
 * en `auth`) siga funcionando sin cambios. Ver `JWT_CONFIGURATION.md`/
 * `USERS_REPORT.md` para el detalle completo de esta decisión.
 */
export function resolverEstado(usuario: users): UsuarioPublico['status'] {
  if (usuario.deleted_at !== null) return 'deleted';
  if (usuario.is_active) return 'active';

  const metadata =
    typeof usuario.metadata === 'object' && usuario.metadata !== null
      ? (usuario.metadata as Record<string, unknown>)
      : {};
  const status = metadata['status'];
  if (status === 'blocked' || status === 'suspended' || status === 'pending_activation') {
    return status;
  }
  return 'inactive';
}
