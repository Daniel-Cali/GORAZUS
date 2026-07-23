import jwt from 'jsonwebtoken';

/**
 * Infrastructure — JWT Provider (Parte 2.1). Extraído de la firma inline
 * ya duplicada en `IssueLoginSessionService` y `RefreshTokenUseCase`
 * (Parte 2 — Backend Core, ambos con su propio `jwt.sign(payload, secret,
 * { expiresIn })`). Disponible para que esos dos lugares lo adopten sin
 * cambiar de comportamiento — no se tocaron en esta parte para no
 * modificar login/refresh todavía.
 *
 * Vive en `modules/auth/backend`, no en `packages/tooling/utils`: ese
 * paquete comparte código resolviendo `node_modules` desde la RAÍZ del
 * monorepo (sin `package.json` propio, ver comentario ya establecido en
 * `login.usecase.ts`), así que solo puede importar dependencias que
 * también estén declaradas en la raíz (`argon2` lo está, por eso
 * `hash.ts` funciona ahí; `jsonwebtoken` no lo está — confirmado con un
 * fallo real de resolución de tipos al intentarlo). Función pura de
 * todos modos (sin estado, sin DI), mismo espíritu que el resto de
 * utilidades comunes, solo que ubicada donde su dependencia real resuelve.
 */
export function signAccessToken<TPayload extends object>(
  payload: TPayload,
  secret: string,
  expiresIn: string,
): string {
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
}
