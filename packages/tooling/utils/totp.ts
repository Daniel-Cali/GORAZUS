import { createHmac, randomBytes } from 'node:crypto';

/**
 * TOTP (RFC 6238, sobre HOTP de RFC 4226) implementado directamente con
 * `node:crypto` — no se agrega una librería (`otplib` u otra) porque el
 * algoritmo es HMAC-SHA1 + truncamiento dinámico, ya cubierto por la
 * dependencia nativa de Node (docs/architecture/07-convenciones-y-estandares.md,
 * "no agregar dependencias innecesarias"). Primer consumidor:
 * `modules/seguridad/backend/services/dos-factores.service.ts` (2FA, Fase 02
 * "preparado" — no integrado todavía como paso obligatorio del login).
 */
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const TOTP_STEP_SECONDS = 30;
const TOTP_DIGITS = 6;
/** Tolerancia de reloj: acepta el código del paso anterior/actual/siguiente (±30s). */
const TOTP_WINDOW = 1;

/** Secreto aleatorio de 160 bits (recomendado para HMAC-SHA1), codificado en Base32 (RFC 4648) — formato que cualquier app autenticadora (Google Authenticator, Authy, etc.) espera. */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

export function generateTotpCode(base32Secret: string, at: Date = new Date()): string {
  const counter = Math.floor(at.getTime() / 1000 / TOTP_STEP_SECONDS);
  return hotp(base32Secret, counter);
}

/** Verifica contra la ventana de ±`TOTP_WINDOW` pasos para tolerar desfasaje de reloj del dispositivo del usuario. */
export function verifyTotpCode(base32Secret: string, code: string, at: Date = new Date()): boolean {
  const counter = Math.floor(at.getTime() / 1000 / TOTP_STEP_SECONDS);
  for (let offset = -TOTP_WINDOW; offset <= TOTP_WINDOW; offset++) {
    // El contador es la cuenta de pasos de 30s desde el epoch Unix — nunca
    // negativo. Cerca de epoch 0 (irrelevante en producción, pero real en
    // tests con vectores RFC 4226) un offset negativo podía producir un
    // contador < 0, que `writeBigUInt64BE` rechaza (RangeError).
    if (counter + offset < 0) continue;
    if (hotp(base32Secret, counter + offset) === code) return true;
  }
  return false;
}

function hotp(base32Secret: string, counter: number): string {
  const key = base32Decode(base32Secret);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));

  const hmac = createHmac('sha1', key).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1]! & 0x0f;
  const binary =
    ((hmac[offset]! & 0x7f) << 24) |
    ((hmac[offset + 1]! & 0xff) << 16) |
    ((hmac[offset + 2]! & 0xff) << 8) |
    (hmac[offset + 3]! & 0xff);

  const code = (binary % 10 ** TOTP_DIGITS).toString().padStart(TOTP_DIGITS, '0');
  return code;
}

function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 0x1f];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 0x1f];
  }
  return output;
}

function base32Decode(base32: string): Buffer {
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of base32.toUpperCase().replace(/=+$/, '')) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) continue;
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}
