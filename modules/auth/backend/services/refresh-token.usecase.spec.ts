import type { ConfigService } from '@nestjs/config';
import type { LoggerService } from '@gorazus/core-logging';
import type { sessions } from '@gorazus/core-database';
import { SessionRepository } from '../repositories/session.repository';
import { OrganizationStatusRepository } from '../repositories/organization-status.repository';
import {
  EmpresaInactivaException,
  RefreshTokenUseCase,
  SesionInvalidaException,
  SesionSospechosaException,
  SucursalInactivaException,
} from './refresh-token.usecase';

const NOW = new Date('2026-07-22T12:00:00.000Z');
const STANDARD_TTL_DAYS = 7;
const REMEMBER_ME_TTL_DAYS = 30;

function buildSession(overrides: Partial<sessions> = {}): sessions {
  return {
    id: 'session-1',
    user_id: 'user-1',
    tenant_id: 'tenant-1',
    company_id: null,
    branch_id: null,
    refresh_token_hash: 'irrelevante',
    ip_address: null,
    user_agent: null,
    revoked_at: null,
    created_at: new Date(NOW.getTime() - 24 * 60 * 60 * 1000),
    expires_at: new Date(NOW.getTime() + STANDARD_TTL_DAYS * 24 * 60 * 60 * 1000),
    ...overrides,
  } as sessions;
}

describe('RefreshTokenUseCase', () => {
  let session: sessions;
  let updateCalls: Array<{ where: unknown; data: Record<string, unknown> }>;
  let warnCalls: Array<{ message: string; context?: Record<string, unknown> }>;
  let companyActive: boolean;
  let branchActive: boolean;
  let strictSessionValidation: boolean;
  let sessionRepository: SessionRepository;
  let organizationStatusRepository: OrganizationStatusRepository;
  let configService: ConfigService;
  let logger: LoggerService;

  beforeEach(() => {
    session = buildSession();
    updateCalls = [];
    warnCalls = [];
    companyActive = true;
    branchActive = true;
    strictSessionValidation = false;

    sessionRepository = {
      findByRefreshTokenHash: jest.fn(async () => session),
      update: jest.fn(async (_context: unknown, where: unknown, data: Record<string, unknown>) => {
        updateCalls.push({ where, data });
        return session;
      }),
    } as unknown as SessionRepository;

    organizationStatusRepository = {
      isCompanyActive: jest.fn(async () => companyActive),
      isBranchActive: jest.fn(async () => branchActive),
    } as unknown as OrganizationStatusRepository;

    const configValues: Record<string, unknown> = {
      'auth.jwtAccessSecret': 'test-secret',
      'auth.accessTokenTtl': '15m',
      'auth.refreshTokenTtlDays': STANDARD_TTL_DAYS,
      'auth.rememberMeTtlDays': REMEMBER_ME_TTL_DAYS,
      'auth.strictSessionValidation': strictSessionValidation,
    };
    configService = {
      getOrThrow: jest.fn((key: string) =>
        key === 'auth.strictSessionValidation' ? strictSessionValidation : configValues[key],
      ),
    } as unknown as ConfigService;

    logger = {
      warn: jest.fn((message: string, context?: Record<string, unknown>) => {
        warnCalls.push({ message, context });
      }),
    } as unknown as LoggerService;
  });

  function buildUseCase(): RefreshTokenUseCase {
    return new RefreshTokenUseCase(
      sessionRepository,
      organizationStatusRepository,
      configService,
      logger,
    );
  }

  it('rota el refresh token y emite un nuevo access token para una sesión vigente', async () => {
    const useCase = buildUseCase();

    const result = await useCase.execute('refresh-token-plano', '203.0.113.5', 'agente/1.0');

    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(updateCalls).toHaveLength(1);
    expect(warnCalls).toHaveLength(0);
  });

  it('sesión inexistente lanza SesionInvalidaException', async () => {
    sessionRepository.findByRefreshTokenHash = jest.fn(async () => null);
    const useCase = buildUseCase();

    await expect(useCase.execute('lo-que-sea')).rejects.toThrow(SesionInvalidaException);
  });

  it('sesión revocada lanza SesionInvalidaException', async () => {
    session = buildSession({ revoked_at: new Date() });
    const useCase = buildUseCase();

    await expect(useCase.execute('lo-que-sea')).rejects.toThrow(SesionInvalidaException);
  });

  it('sesión expirada lanza SesionInvalidaException', async () => {
    session = buildSession({ expires_at: new Date(NOW.getTime() - 1000) });
    const useCase = buildUseCase();

    await expect(useCase.execute('lo-que-sea')).rejects.toThrow(SesionInvalidaException);
  });

  it('IP distinta a la guardada: registra warning pero NO rechaza por default (AUTH_STRICT_SESSION_VALIDATION=false)', async () => {
    session = buildSession({ ip_address: '203.0.113.5' });
    const useCase = buildUseCase();

    const result = await useCase.execute('lo-que-sea', '198.51.100.9');

    expect(result.accessToken).toEqual(expect.any(String));
    expect(warnCalls).toHaveLength(1);
  });

  it('IP distinta a la guardada: rechaza con SesionSospechosaException si AUTH_STRICT_SESSION_VALIDATION=true', async () => {
    strictSessionValidation = true;
    session = buildSession({ ip_address: '203.0.113.5' });
    const useCase = buildUseCase();

    await expect(useCase.execute('lo-que-sea', '198.51.100.9')).rejects.toThrow(
      SesionSospechosaException,
    );
  });

  it('empresa activa de la sesión ya no está activa: lanza EmpresaInactivaException', async () => {
    session = buildSession({ company_id: 'company-1' });
    companyActive = false;
    const useCase = buildUseCase();

    await expect(useCase.execute('lo-que-sea')).rejects.toThrow(EmpresaInactivaException);
  });

  it('sucursal activa de la sesión ya no está activa: lanza SucursalInactivaException', async () => {
    session = buildSession({ branch_id: 'branch-1' });
    branchActive = false;
    const useCase = buildUseCase();

    await expect(useCase.execute('lo-que-sea')).rejects.toThrow(SucursalInactivaException);
  });

  it('preserva el TTL largo de "recordar sesión" a través de la rotación', async () => {
    // Sesión emitida con rememberMe=true: duración original bien por encima del TTL estándar.
    session = buildSession({
      created_at: NOW,
      expires_at: new Date(NOW.getTime() + REMEMBER_ME_TTL_DAYS * 24 * 60 * 60 * 1000),
    });
    const useCase = buildUseCase();

    const before = Date.now();
    const result = await useCase.execute('lo-que-sea');
    const expectedMinMs = REMEMBER_ME_TTL_DAYS * 24 * 60 * 60 * 1000 - 5000;

    expect(result.refreshTokenExpiresAt.getTime() - before).toBeGreaterThan(expectedMinMs);
  });
});
