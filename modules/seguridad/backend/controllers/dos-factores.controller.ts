import { Body, Controller, Delete, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { DosFactoresService } from '../services/dos-factores.service';
import {
  confirmarDosFactoresSchema,
  type ConfirmarDosFactoresInput,
} from '../validators/dos-factores.schema';

/**
 * `/seguridad/2fa` — autogestión de doble autenticación (2FA "preparado",
 * Fase 02). Sin `@RequirePermission`: es el propio usuario configurando su
 * propia cuenta, no una acción administrativa sobre otro usuario (mismo
 * criterio que tendrá `modules/usuarios` para "cambiar mi contraseña").
 */
@ApiTags('seguridad')
@ApiBearerAuth()
@Controller('seguridad/2fa')
export class DosFactoresController {
  constructor(private readonly dosFactoresService: DosFactoresService) {}

  @ApiOperation({
    summary: 'Iniciar configuración de 2FA',
    description: 'Genera un secreto TOTP nuevo, sin confirmar todavía.',
  })
  @Post('setup')
  async setup(@CurrentUser() user: UserContext) {
    const result = await this.dosFactoresService.iniciarConfiguracion(user);
    return { data: result };
  }

  @ApiOperation({
    summary: 'Confirmar 2FA',
    description: 'Verifica un código TOTP real y activa la configuración pendiente.',
  })
  @Post('confirmar')
  @HttpCode(HttpStatus.OK)
  async confirmar(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(confirmarDosFactoresSchema)) body: ConfirmarDosFactoresInput,
  ) {
    await this.dosFactoresService.confirmar(user, body.code);
    return { data: { message: 'Doble autenticación activada.' } };
  }

  @ApiOperation({ summary: 'Deshabilitar 2FA' })
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deshabilitar(@CurrentUser() user: UserContext): Promise<void> {
    await this.dosFactoresService.deshabilitar(user);
  }
}
