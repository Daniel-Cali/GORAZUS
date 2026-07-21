import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

/**
 * Ver docs/architecture/32-core-platform/10-utilidades-comunes.md §7:
 * cifrado simétrico AEAD (AES-256-GCM, detecta manipulación) para
 * datos recuperables en texto plano (credenciales de integración,
 * números de cuenta) — distinto de hash.ts (irreversible, contraseñas).
 * Clave resuelta por el llamador vía ConfigService (Configuration
 * Manager), nunca hardcodeada acá — esta utilidad es agnóstica de
 * dónde vienen las claves, soporta múltiples `keyId` para rotación.
 */
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // recomendado para GCM

export interface EncryptedPayload {
  keyId: string;
  iv: string;
  authTag: string;
  ciphertext: string;
}

export function encrypt(plaintext: string, keyId: string, key: Buffer): EncryptedPayload {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return {
    keyId,
    iv: iv.toString('base64'),
    authTag: cipher.getAuthTag().toString('base64'),
    ciphertext: ciphertext.toString('base64'),
  };
}

/**
 * Falla explícito (lanza) si el dato fue manipulado — propiedad AEAD,
 * no es un fallo silencioso ni devuelve texto corrupto.
 */
export function decrypt(payload: EncryptedPayload, key: Buffer): string {
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(payload.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(payload.authTag, 'base64'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, 'base64')),
    decipher.final(),
  ]);
  return plaintext.toString('utf8');
}
