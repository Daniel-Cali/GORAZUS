import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { CurrentUser, Public, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { loginSchema, type LoginInput } from '../validators/login.schema';
import { LoginUseCase } from '../services/login.usecase';
import { RefreshTokenUseCase } from '../services/refresh-token.usecase';
import { LogoutUseCase } from '../services/logout.usecase';
import { LoginResponseEnvelopeDto, RefreshResponseEnvelopeDto } from '../dto/login-response.dto';

const REFRESH_COOKIE = 'refreshToken';

/** `AuthController` — `/auth/login`, `/auth/refresh`, `/auth/logout` (docs/architecture/13-modulo-auth.md §1). Solo traduce HTTP → caso de uso, sin lógica de negocio (docs/architecture/02 §3). */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  @ApiOperation({
    summary: 'Login',
    description:
      'Resuelve el tenant por slug, valida credenciales y emite un access token + cookie httpOnly de refresh.',
  })
  @ApiResponse({ status: 200, type: LoginResponseEnvelopeDto })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas (tenant, email o password incorrectos).',
  })
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginInput,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.loginUseCase.execute(body.tenantSlug, body.email, body.password);
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
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const refreshToken = (request.cookies as Record<string, string | undefined> | undefined)?.[
      REFRESH_COOKIE
    ];
    if (!refreshToken) {
      response.status(HttpStatus.UNAUTHORIZED);
      return { error: { code: 'SESION_INVALIDA', message: 'No hay sesión activa.', details: [] } };
    }
    const result = await this.refreshTokenUseCase.execute(refreshToken);
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
}

function setRefreshCookie(response: Response, refreshToken: string, expiresAt: Date): void {
  response.cookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/api/v1/auth',
  });
}
