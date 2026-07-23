import type { ConfigService } from '@nestjs/config';
import type { CacheService } from '@gorazus/core-cache';
import type { tenants, users } from '@gorazus/core-database';
import { TenantRepository } from '../repositories/tenant.repository';
import { UserRepository } from '../repositories/user.repository';
import {
  LoginAttemptRecord,
  LoginAttemptRepository,
} from '../repositories/login-attempt.repository';
import {
  TwoFactorCredential,
  TwoFactorCredentialRepository,
} from '../repositories/two-factor-credential.repository';
import { IssueLoginSessionService, LoginResult } from './issue-login-session.service';
import {
  CredencialesInvalidasException,
  CuentaBloqueadaException,
  LoginUseCase,
} from './login.usecase';

const TENANT: Pick<tenants, 'id'> = { id: 'tenant-1' };
const USER: Pick<
  users,
  | 'id'
  | 'tenant_id'
  | 'email'
  | 'password_hash'
  | 'full_name'
  | 'is_active'
  | 'company_id'
  | 'branch_id'
> = {
  id: 'user-1',
  tenant_id: 'tenant-1',
  email: 'demo@demo.local',
  // hash real de "Test1234!" generado con argon2id — sin mockear verifyPassword,
  // mismo criterio que el resto del proyecto (probar contra la implementación real).
  password_hash:
    '$argon2id$v=19$m=65536,t=3,p=4$sqxyVl9VGeAv7GFmByINIw$TwpQ+5hHO09oFcf+XLBebGfmlwwj07LhimvrZQWnpjw',
  full_name: 'Demo User',
  is_active: true,
  company_id: null,
  branch_id: null,
};

const FAKE_LOGIN_RESULT: LoginResult = {
  accessToken: 'fake-access-token',
  refreshToken: 'fake-refresh-token',
  refreshTokenExpiresAt: new Date('2026-01-01'),
  user: { id: USER.id, name: USER.full_name, email: USER.email },
  activeCompanyId: null,
  activeBranchId: null,
};

describe('LoginUseCase', () => {
  let tenantRepository: TenantRepository;
  let userRepository: UserRepository;
  let loginAttemptRepository: LoginAttemptRepository;
  let twoFactorCredentialRepository: TwoFactorCredentialRepository;
  let issueLoginSessionService: IssueLoginSessionService;
  let cacheService: CacheService;
  let configService: ConfigService;
  let recordedAttempts: LoginAttemptRecord[];
  let recentFailures: number;
  let twoFactorCredential: TwoFactorCredential | null;
  let cacheSetCalls: Array<{ key: string; value: unknown; ttlSeconds: number }>;

  beforeEach(() => {
    recordedAttempts = [];
    recentFailures = 0;
    twoFactorCredential = null;
    cacheSetCalls = [];

    tenantRepository = {
      findBySlug: jest.fn(async (slug: string) => (slug === 'demo' ? (TENANT as tenants) : null)),
    } as unknown as TenantRepository;

    userRepository = {
      findByEmail: jest.fn(async (_tenantId: string, email: string) =>
        email === USER.email ? (USER as users) : null,
      ),
    } as unknown as UserRepository;

    loginAttemptRepository = {
      countRecentFailures: jest.fn(async () => recentFailures),
      record: jest.fn(async (attempt: LoginAttemptRecord) => {
        recordedAttempts.push(attempt);
      }),
    } as unknown as LoginAttemptRepository;

    twoFactorCredentialRepository = {
      findConfirmedByUserId: jest.fn(async () => twoFactorCredential),
    } as unknown as TwoFactorCredentialRepository;

    issueLoginSessionService = {
      issue: jest.fn(async () => FAKE_LOGIN_RESULT),
    } as unknown as IssueLoginSessionService;

    cacheService = {
      set: jest.fn(async (key: string, value: unknown, ttlSeconds: number) => {
        cacheSetCalls.push({ key, value, ttlSeconds });
      }),
    } as unknown as CacheService;

    const configValues: Record<string, number> = {
      'auth.loginLockoutThreshold': 5,
      'auth.loginLockoutWindowMinutes': 15,
      'auth.twoFactorChallengeTtlMinutes': 5,
    };
    configService = {
      getOrThrow: jest.fn((key: string) => configValues[key]),
    } as unknown as ConfigService;
  });

  function buildUseCase(): LoginUseCase {
    return new LoginUseCase(
      tenantRepository,
      userRepository,
      loginAttemptRepository,
      twoFactorCredentialRepository,
      issueLoginSessionService,
      cacheService,
      configService,
    );
  }

  it('login con credenciales correctas y sin 2FA emite tokens directamente', async () => {
    const useCase = buildUseCase();

    const outcome = await useCase.execute('demo', USER.email, 'Test1234!', '203.0.113.5');

    expect(outcome.requiresTwoFactor).toBe(false);
    if (!outcome.requiresTwoFactor) {
      expect(outcome.result).toBe(FAKE_LOGIN_RESULT);
    }
    expect(issueLoginSessionService.issue).toHaveBeenCalledWith(USER, {
      ipAddress: '203.0.113.5',
      userAgent: null,
      rememberMe: false,
    });
    expect(recordedAttempts).toEqual([
      expect.objectContaining({
        tenantId: 'tenant-1',
        emailAttempted: USER.email,
        userId: USER.id,
        succeeded: true,
      }),
    ]);
  });

  it('login con credenciales correctas y 2FA confirmado NO emite tokens — devuelve un challengeToken', async () => {
    twoFactorCredential = { encryptedSecret: 'irrelevante-para-este-test' };
    const useCase = buildUseCase();

    const outcome = await useCase.execute('demo', USER.email, 'Test1234!');

    expect(outcome.requiresTwoFactor).toBe(true);
    if (outcome.requiresTwoFactor) {
      expect(outcome.challengeToken).toEqual(expect.any(String));
    }
    expect(issueLoginSessionService.issue).not.toHaveBeenCalled();
    // El intento se registra como exitoso igual — la contraseña sí era correcta.
    expect(recordedAttempts).toEqual([expect.objectContaining({ succeeded: true })]);
    expect(cacheSetCalls).toHaveLength(1);
    expect(cacheSetCalls[0]?.value).toEqual({
      userId: USER.id,
      tenantId: 'tenant-1',
      email: USER.email,
      ipAddress: null,
      userAgent: null,
      rememberMe: false,
    });
  });

  it('login con contraseña incorrecta registra el intento como fallido y lanza CredencialesInvalidasException', async () => {
    const useCase = buildUseCase();

    await expect(
      useCase.execute('demo', USER.email, 'contraseña-incorrecta', '203.0.113.5'),
    ).rejects.toThrow(CredencialesInvalidasException);

    expect(recordedAttempts).toEqual([
      expect.objectContaining({
        tenantId: 'tenant-1',
        emailAttempted: USER.email,
        userId: USER.id,
        ipAddress: '203.0.113.5',
        succeeded: false,
      }),
    ]);
  });

  it('login con email inexistente registra el intento sin userId y lanza CredencialesInvalidasException', async () => {
    const useCase = buildUseCase();

    await expect(useCase.execute('demo', 'no-existe@demo.local', 'lo-que-sea')).rejects.toThrow(
      CredencialesInvalidasException,
    );

    expect(recordedAttempts).toEqual([
      expect.objectContaining({
        userId: null,
        succeeded: false,
        emailAttempted: 'no-existe@demo.local',
      }),
    ]);
  });

  it('con >=5 intentos fallidos recientes, rechaza con CuentaBloqueadaException sin llegar a buscar el usuario', async () => {
    recentFailures = 5;
    const useCase = buildUseCase();

    await expect(useCase.execute('demo', USER.email, 'Test1234!')).rejects.toThrow(
      CuentaBloqueadaException,
    );

    // No se busca el usuario ni se registra un intento más — evita
    // amplificar el trabajo mientras la cuenta ya está bloqueada.
    expect(userRepository.findByEmail).not.toHaveBeenCalled();
    expect(recordedAttempts).toEqual([]);
  });

  it('con tenant inexistente, rechaza sin consultar intentos recientes (mismo 401 genérico, sin enumeración)', async () => {
    const useCase = buildUseCase();

    await expect(useCase.execute('tenant-que-no-existe', USER.email, 'lo-que-sea')).rejects.toThrow(
      CredencialesInvalidasException,
    );

    expect(loginAttemptRepository.countRecentFailures).not.toHaveBeenCalled();
  });
});
