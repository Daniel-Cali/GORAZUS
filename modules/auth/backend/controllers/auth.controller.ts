import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { CurrentUser, Public, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { loginSchema, type LoginInput } from '../validators/login.schema';
import {
  twoFactorLoginSchema,
  type TwoFactorLoginInput,
} from '../validators/two-factor-login.schema';
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from '../validators/password-reset.schema';
import { revokeTokenSchema, type RevokeTokenInput } from '../validators/revoke-token.schema';
import { LoginUseCase } from '../services/login.usecase';
import { CompleteTwoFactorLoginUseCase } from '../services/complete-two-factor-login.usecase';
import { RefreshTokenUseCase } from '../services/refresh-token.usecase';
import { LogoutUseCase } from '../services/logout.usecase';
import { ForgotPasswordUseCase } from '../services/forgot-password.usecase';
import { ResetPasswordUseCase } from '../services/reset-password.usecase';
import { GetCurrentUserUseCase } from '../services/get-current-user.usecase';
import { ValidateTokenUseCase } from '../services/validate-token.usecase';
import { RevokeTokenUseCase } from '../services/revoke-token.usecase';
import {
  LoginResponseEnvelopeDto,
  RefreshResponseEnvelopeDto,
  TwoFactorRequiredEnvelopeDto,
  CurrentUserEnvelopeDto,
  SessionValidationEnvelopeDto,
  RevokeTokenEnvelopeDto,
} from '../dto/login-response.dto';

const REFRESH_COOKIE = 'refreshToken';

/** `AuthController` — `/auth/login`, `/auth/refresh`, `/auth/logout` (docs/architecture/13-modulo-auth.md §1). Solo traduce HTTP → caso de uso, sin lógica de negocio (docs/architecture/02 §3). */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly completeTwoFactorLoginUseCase: CompleteTwoFactorLoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
    private readonly validateTokenUseCase: ValidateTokenUseCase,
    private readonly revokeTokenUseCase: RevokeTokenUseCase,
    private readonly configService: ConfigService,
  ) {}

  @ApiOperation({
    summary: 'Login',
    description:
      'Resuelve el tenant por slug, valida credenciales y emite un access token + cookie httpOnly de refresh.',
  })
  @ApiResponse({ status: 200, type: LoginResponseEnvelopeDto })
  @ApiResponse({
    status: 200,
    type: TwoFactorRequiredEnvelopeDto,
    description:
      'Contraseña correcta, pero el usuario tiene 2FA confirmado — todavía sin tokens, completar con POST /auth/login/2fa.',
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas (tenant, email o password incorrectos).',
  })
  @ApiResponse({
    status: 429,
    description:
      'Cuenta bloqueada temporalmente (5+ intentos fallidos en 15 minutos) o límite de requests excedido.',
  })
  @Public()
  // Más estricto que el límite global (100/60s, core/http/http.module.ts) —
  // login es el endpoint más sensible a fuerza bruta de todo el API.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginInput,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const outcome = await this.loginUseCase.execute(
      body.tenantSlug,
      body.email,
      body.password,
      request.ip ?? null,
      request.headers['user-agent'] ?? null,
      body.rememberMe,
    );
    if (outcome.requiresTwoFactor) {
      return { data: { requiresTwoFactor: true, challengeToken: outcome.challengeToken } };
    }
    const { result } = outcome;
    setRefreshCookie(response, result.refreshToken, result.refreshTokenExpiresAt);
    return {
      data: {
        accessToken: result.accessToken,
        user: result.user,
        activeCompanyId: result.activeCompanyId,
        activeBranchId: result.activeBranchId,
      },
    };
  }

  @ApiOperation({
    summary: 'Login — segundo paso (2FA)',
    description:
      'Completa un login que POST /auth/login dejó pendiente de 2FA — verifica el código TOTP y recién ahí emite tokens.',
  })
  @ApiResponse({ status: 200, type: LoginResponseEnvelopeDto })
  @ApiResponse({
    status: 400,
    description: 'Código TOTP incorrecto (el challengeToken sigue vivo, se puede reintentar).',
  })
  @ApiResponse({
    status: 401,
    description: 'challengeToken inexistente/expirado (~5 min) — hay que volver a /auth/login.',
  })
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login/2fa')
  @HttpCode(HttpStatus.OK)
  async completeTwoFactorLogin(
    @Body(new ZodValidationPipe(twoFactorLoginSchema)) body: TwoFactorLoginInput,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.completeTwoFactorLoginUseCase.execute(body.challengeToken, body.code);
    setRefreshCookie(response, result.refreshToken, result.refreshTokenExpiresAt);
    return {
      data: {
        accessToken: result.accessToken,
        user: result.user,
        activeCompanyId: result.activeCompanyId,
        activeBranchId: result.activeBranchId,
      },
    };
  }

  @ApiOperation({
    summary: 'Refresh',
    description: 'Rota el refresh token (cookie httpOnly) y emite un nuevo access token.',
  })
  @ApiResponse({ status: 200, type: RefreshResponseEnvelopeDto })
  @ApiResponse({ status: 401, description: 'Sin cookie de refresh o sesión inválida/expirada.' })
  @ApiResponse({
    status: 403,
    description: 'El header Origin no coincide con CORS_ORIGIN (protección CSRF).',
  })
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    // Único endpoint autenticado solo por cookie (todo el resto usa Bearer
    // en el header Authorization, que un sitio de terceros no puede setear
    // en un request cross-site sin permiso CORS explícito — CSRF no aplica
    // ahí). `sameSite: 'strict'` en la cookie (setRefreshCookie, más abajo)
    // ya bloquea el envío cross-site en navegadores modernos; este chequeo
    // de Origin es la segunda capa, no la única, para navegadores/proxies
    // que no lo respeten. Sin Origin (clientes no-browser: curl, apps
    // nativas) se deja pasar — no hay navegador de por medio que pueda
    // sufrir CSRF.
    const origin = request.headers.origin;
    if (origin && origin !== this.configService.get<string>('CORS_ORIGIN')) {
      throw new ForbiddenException('Origin no permitido.');
    }

    const refreshToken = (request.cookies as Record<string, string | undefined> | undefined)?.[
      REFRESH_COOKIE
    ];
    if (!refreshToken) {
      response.status(HttpStatus.UNAUTHORIZED);
      return { error: { code: 'SESION_INVALIDA', message: 'No hay sesión activa.', details: [] } };
    }
    const result = await this.refreshTokenUseCase.execute(
      refreshToken,
      request.ip ?? null,
      request.headers['user-agent'] ?? null,
    );
    setRefreshCookie(response, result.refreshToken, result.refreshTokenExpiresAt);
    return { data: { accessToken: result.accessToken } };
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout',
    description: 'Revoca la sesión actual (no las demás sesiones del usuario — Fase 2).',
  })
  @ApiResponse({ status: 204, description: 'Sesión revocada.' })
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @CurrentUser() user: UserContext,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.logoutUseCase.execute(user);
    response.clearCookie(REFRESH_COOKIE);
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Usuario actual',
    description:
      'Identidad del usuario autenticado — mínimo (sin roles/permisos ni perfil editable, eso es /seguridad/usuarios/me).',
  })
  @ApiResponse({ status: 200, type: CurrentUserEnvelopeDto })
  @ApiResponse({ status: 404, description: 'El usuario de la sesión ya no existe.' })
  @Get('me')
  async me(@CurrentUser() user: UserContext) {
    const result = await this.getCurrentUserUseCase.execute(user);
    return { data: result };
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Validar sesión',
    description:
      'Verifica, más allá de la firma/expiración del JWT, que el usuario y la empresa/sucursal activas de la sesión sigan activos.',
  })
  @ApiResponse({ status: 200, type: SessionValidationEnvelopeDto })
  @ApiResponse({
    status: 403,
    description: 'Usuario, empresa o sucursal activa ya no está activo.',
  })
  @Get('session')
  async session(@CurrentUser() user: UserContext) {
    const result = await this.validateTokenUseCase.execute(user);
    return { data: result };
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Revocar sesión(es)',
    description:
      'Con sessionId: revoca solo esa sesión (requiere que sea del usuario autenticado). Sin sessionId: revoca todas las sesiones activas del usuario ("cerrar sesión en todos los dispositivos").',
  })
  @ApiResponse({ status: 200, type: RevokeTokenEnvelopeDto })
  @ApiResponse({
    status: 404,
    description: 'sessionId indicado no existe o pertenece a otro usuario.',
  })
  @Post('revoke')
  @HttpCode(HttpStatus.OK)
  async revoke(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(revokeTokenSchema)) body: RevokeTokenInput,
  ) {
    const result = await this.revokeTokenUseCase.execute(user, body.sessionId);
    return { data: result };
  }

  @ApiOperation({
    summary: 'Solicitar restablecimiento de contraseña',
    description:
      'Siempre responde 200 (evita enumeración de tenants/emails) — el token real se entrega vía PasswordResetNotifier, nunca en esta respuesta.',
  })
  @ApiResponse({
    status: 200,
    description: 'Solicitud procesada (genérico, sin importar el resultado real).',
  })
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body(new ZodValidationPipe(forgotPasswordSchema)) body: ForgotPasswordInput,
  ) {
    await this.forgotPasswordUseCase.execute(body.tenantSlug, body.email);
    return { data: { message: 'Si el correo existe, se envió un enlace de restablecimiento.' } };
  }

  @ApiOperation({
    summary: 'Restablecer contraseña',
    description:
      'Consume el token de restablecimiento, fija la nueva contraseña y revoca todas las sesiones activas del usuario.',
  })
  @ApiResponse({ status: 200, description: 'Contraseña actualizada.' })
  @ApiResponse({ status: 400, description: 'Token inválido, ya usado o expirado.' })
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body(new ZodValidationPipe(resetPasswordSchema)) body: ResetPasswordInput) {
    await this.resetPasswordUseCase.execute(body.tenantSlug, body.token, body.newPassword);
    return { data: { message: 'Contraseña actualizada correctamente.' } };
  }
}

function setRefreshCookie(response: Response, refreshToken: string, expiresAt: Date): void {
  response.cookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    // 'strict' (antes 'lax') — protección CSRF principal para este único
    // endpoint autenticado por cookie. El SPA nunca necesita que esta
    // cookie viaje en una navegación top-level cross-site (siempre la usa
    // desde dentro de la propia app, vía fetch/XHR same-site), así que
    // 'strict' no rompe ningún caso de uso legítimo — solo cierra el hueco
    // que 'lax' deja abierto (algunas implementaciones de navegador
    // conceden una ventana de gracia a cookies 'lax' recién creadas en
    // POSTs cross-site). Ver también el chequeo de Origin en refresh().
    sameSite: 'strict',
    expires: expiresAt,
    path: '/api/v1/auth',
  });
}
