import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { MonedasService } from '../services/monedas.service';
import { crearMonedaSchema, type CrearMonedaInput } from '../validators/monedas.schema';

/** `/configuracion/monedas` — catálogo de monedas ISO 4217 (docs/architecture/14-modulo-core.md). */
@ApiTags('configuracion')
@ApiBearerAuth()
@Controller('configuracion/monedas')
export class MonedasController {
  constructor(private readonly monedasService: MonedasService) {}

  @ApiOperation({
    summary: 'Listar monedas',
    description: 'Requiere configuracion.gestionar_monedas.',
  })
  @RequirePermission('configuracion.gestionar_monedas')
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const result = await this.monedasService.listar(user, {
      page: Number(page),
      pageSize: Number(pageSize),
    });
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({
    summary: 'Obtener moneda por código ISO',
    description: 'Requiere configuracion.gestionar_monedas.',
  })
  @RequirePermission('configuracion.gestionar_monedas')
  @Get(':isoCode')
  async obtener(@CurrentUser() user: UserContext, @Param('isoCode') isoCode: string) {
    const moneda = await this.monedasService.obtenerPorCodigo(user, isoCode);
    return { data: moneda };
  }

  @ApiOperation({
    summary: 'Crear moneda',
    description: 'Requiere configuracion.gestionar_monedas.',
  })
  @RequirePermission('configuracion.gestionar_monedas')
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearMonedaSchema)) body: CrearMonedaInput,
  ) {
    const moneda = await this.monedasService.crear(user, body);
    return { data: moneda };
  }
}
