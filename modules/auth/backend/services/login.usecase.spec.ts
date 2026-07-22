import type { ConfigService } from '@nestjs/config';
import type { tenants, users } from '@gorazus/core-database';
import { TenantRepository } from '../repositories/tenant.repository';
import { UserRepository } from '../repositories/user.repository';
import { SessionRepository } from '../repositories/session.repository';
import {
  LoginAttemptRecord,
  LoginAttemptRepository,
} from '../repositories/login-attempt.repository';
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

describe('LoginUseCase', () => {
  let tenantRepository: TenantRepository;
  let userRepository: UserRepository;
  let sessionRepository: SessionRepository;
  let loginAttemptRepository: LoginAttemptRepository;
  let configService: ConfigService;
  let recordedAttempts: LoginAttemptRecord[];
  let recentFailures: number;

  beforeEach(() => {
    recordedAttempts = [];
    recentFailures = 0;

    tenantRepository = {
      findBySlug: jest.fn(async (slug: string) => (slug === 'demo' ? (TENANT as tenants) : null)),
    } as unknown as TenantRepository;

    userRepository = {
      findByEmail: jest.fn(async (_tenantId: string, email: string) =>
        email === USER.email ? (USER as users) : null,
      ),
    } as unknown as UserRepository;

    sessionRepository = {
      create: jest.fn(async () => ({}) as never),
    } as unknown as SessionRepository;

    loginAttemptRepository = {
      countRecentFailures: jest.fn(async () => recentFailures),
      record: jest.fn(async (attempt: LoginAttemptRecord) => {
        recordedAttempts.push(attempt);
      }),
    } as unknown as LoginAttemptRepository;

    configService = {
      getOrThrow: jest.fn(() => 'test-secret'),
    } as unknown as ConfigService;
  });

  function buildUseCase(): LoginUseCase {
    return new LoginUseCase(
      tenantRepository,
      userRepository,
      sessionRepository,
      loginAttemptRepository,
      configService,
    );
  }

  it('login con credenciales correctas registra el intento como exitoso y devuelve los tokens', async () => {
    const useCase = buildUseCase();

    const result = await useCase.execute('demo', USER.email, 'Test1234!', '203.0.113.5');

    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(recordedAttempts).toEqual([
      expect.objectContaining({
        tenantId: 'tenant-1',
        emailAttempted: USER.email,
        userId: USER.id,
        succeeded: true,
      }),
    ]);
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
