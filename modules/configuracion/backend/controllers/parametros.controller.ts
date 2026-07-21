import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { ParametrosService } from '../services/parametros.service';
import { crearParametroSchema, type CrearParametroInput } from '../validators/parametros.schema';

/** `/configuracion/parametros` — catálogo de claves de configuración del sistema (docs/architecture/14-modulo-core.md). */
@ApiTags('configuracion')
@ApiBearerAuth()
@Controller('configuracion/parametros')
export class ParametrosController {
  constructor(private readonly parametrosService: ParametrosService) {}

  @ApiOperation({
    summary: 'Listar parámetros',
    description: 'Requiere configuracion.gestionar_parametros.',
  })
  @RequirePermission('configuracion.gestionar_parametros')
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const result = await this.parametrosService.listar(user, {
      page: Number(page),
      pageSize: Number(pageSize),
    });
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({
    summary: 'Obtener parámetro por clave',
    description: 'Requiere configuracion.gestionar_parametros.',
  })
  @RequirePermission('configuracion.gestionar_parametros')
  @Get(':key')
  async obtener(@CurrentUser() user: UserContext, @Param('key') key: string) {
    const parametro = await this.parametrosService.obtenerPorClave(user, key);
    return { data: parametro };
  }

  @ApiOperation({
    summary: 'Crear parámetro',
    description: 'Requiere configuracion.gestionar_parametros.',
  })
  @RequirePermission('configuracion.gestionar_parametros')
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearParametroSchema)) body: CrearParametroInput,
  ) {
    const parametro = await this.parametrosService.crear(user, body);
    return { data: parametro };
  }
}
