import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { ConfiguracionService } from '../services/configuracion.service';
import { fijarValorSchema, type FijarValorInput } from '../validators/configuracion.schema';

/** `/configuracion/valores` — valor efectivo (override o default) de un parámetro para el tenant actual (docs/architecture/14-modulo-core.md). */
@ApiTags('configuracion')
@ApiBearerAuth()
@Controller('configuracion/valores')
export class ConfiguracionController {
  constructor(private readonly configuracionService: ConfiguracionService) {}

  @ApiOperation({
    summary: 'Obtener valor efectivo de un parámetro',
    description: 'Requiere configuracion.gestionar_parametros.',
  })
  @RequirePermission('configuracion.gestionar_parametros')
  @Get(':key')
  async obtener(@CurrentUser() user: UserContext, @Param('key') key: string) {
    const value = await this.configuracionService.obtenerValor(user, key);
    return { data: { key, value } };
  }

  @ApiOperation({
    summary: 'Fijar el valor de un parámetro para el tenant actual',
    description: 'Requiere configuracion.gestionar_parametros.',
  })
  @RequirePermission('configuracion.gestionar_parametros')
  @Put()
  async fijar(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(fijarValorSchema)) body: FijarValorInput,
  ) {
    const value = await this.configuracionService.fijarValor(user, body);
    return { data: { key: body.key, value } };
  }
}
