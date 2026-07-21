import * as argon2 from 'argon2';

/**
 * Ver docs/architecture/13-modulo-auth.md ("verifica argon2id(password,
 * password_hash)") — argon2id ya es el algoritmo fijado para
 * contraseñas, esta utilidad solo lo envuelve. Irreversible por
 * diseño (a diferencia de `encryption.ts`) — no hay `.decrypt`.
 */
export async function hashPassword(plaintext: string): Promise<string> {
  return argon2.hash(plaintext, { type: argon2.argon2id });
}

export async function verifyPassword(plaintext: string, hash: string): Promise<boolean> {
  return argon2.verify(hash, plaintext);
}
