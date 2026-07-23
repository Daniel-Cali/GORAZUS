import jwt from 'jsonwebtoken';
import { signAccessToken } from './jwt-token.provider';

const SECRET = 'test-secret';

describe('signAccessToken', () => {
  it('firma un payload verificable con el mismo secreto', () => {
    const token = signAccessToken({ sub: 'user-1', tenantId: 'tenant-1' }, SECRET, '15m');

    const decoded = jwt.verify(token, SECRET) as jwt.JwtPayload;
    expect(decoded['sub']).toBe('user-1');
    expect(decoded['tenantId']).toBe('tenant-1');
    expect(decoded.exp).toBeDefined();
  });

  it('respeta el expiresIn pedido', () => {
    const token = signAccessToken({ sub: 'user-1' }, SECRET, '1s');
    const decoded = jwt.decode(token) as jwt.JwtPayload;
    const ttlSeconds = decoded.exp! - decoded.iat!;
    expect(ttlSeconds).toBe(1);
  });

  it('un token firmado con otro secreto no verifica', () => {
    const token = signAccessToken({ sub: 'user-1' }, SECRET, '15m');
    expect(() => jwt.verify(token, 'otro-secreto')).toThrow();
  });
});
