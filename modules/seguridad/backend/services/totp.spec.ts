// eslint-disable-next-line @nx/enforce-module-boundaries -- packages/tooling no tiene project.json propio, ver dos-factores.service.ts
import { generateTotpCode, verifyTotpCode } from '../../../../packages/tooling/utils';

/**
 * Vectores de prueba de RFC 4226 Apéndice D (HOTP con la clave ASCII
 * "12345678901234567890", 20 bytes) — codificada en Base32 es
 * "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ". TOTP con paso de 30s reduce a HOTP
 * con contador = floor(epochSeconds / 30), así que epoch 0 y 30 son los
 * contadores 0 y 1 de esos vectores publicados (755224 y 287082).
 */
const RFC4226_SECRET_BASE32 = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

describe('totp (RFC 6238 sobre RFC 4226)', () => {
  it('genera el código esperado para el contador 0 (epoch 0)', () => {
    expect(generateTotpCode(RFC4226_SECRET_BASE32, new Date(0))).toBe('755224');
  });

  it('genera el código esperado para el contador 1 (epoch 30s)', () => {
    expect(generateTotpCode(RFC4226_SECRET_BASE32, new Date(30_000))).toBe('287082');
  });

  it('verifyTotpCode acepta el código correcto', () => {
    expect(verifyTotpCode(RFC4226_SECRET_BASE32, '755224', new Date(0))).toBe(true);
  });

  it('verifyTotpCode acepta un código del paso anterior/siguiente (tolerancia de reloj)', () => {
    // Contador 1 (epoch 30s) verificado con el código del contador 0 — dentro de la ventana ±1.
    expect(verifyTotpCode(RFC4226_SECRET_BASE32, '755224', new Date(30_000))).toBe(true);
  });

  it('verifyTotpCode rechaza un código incorrecto', () => {
    expect(verifyTotpCode(RFC4226_SECRET_BASE32, '000000', new Date(0))).toBe(false);
  });
});
