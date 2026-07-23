import jwt from 'jsonwebtoken';
import type { ConfigService } from '@nestjs/config';
import type { ExecutionContext } from '@nestjs/common';
import { GuestGuard } from './guest.guard';

const SECRET = 'test-secret';

describe('GuestGuard', () => {
  const fakeConfigService = {
    getOrThrow: () => SECRET,
  } as unknown as ConfigService;
  const guard = new GuestGuard(fakeConfigService);

  function contextWithAuthHeader(header?: string): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ headers: header ? { authorization: header } : {} }),
      }),
    } as unknown as ExecutionContext;
  }

  it('deja pasar cuando no hay header Authorization', () => {
    expect(guard.canActivate(contextWithAuthHeader())).toBe(true);
  });

  it('deja pasar cuando el token es inválido/expirado', () => {
    const context = contextWithAuthHeader('Bearer token-invalido');
    expect(guard.canActivate(context)).toBe(true);
  });

  it('rechaza cuando ya hay un access token válido', () => {
    const validToken = jwt.sign({ sub: 'user-1' }, SECRET, { expiresIn: '15m' });
    const context = contextWithAuthHeader(`Bearer ${validToken}`);
    expect(guard.canActivate(context)).toBe(false);
  });

  it('deja pasar cuando el token está firmado con otro secreto', () => {
    const tokenFirmadoConOtraClave = jwt.sign({ sub: 'user-1' }, 'otro-secreto', {
      expiresIn: '15m',
    });
    const context = contextWithAuthHeader(`Bearer ${tokenFirmadoConOtraClave}`);
    expect(guard.canActivate(context)).toBe(true);
  });
});
