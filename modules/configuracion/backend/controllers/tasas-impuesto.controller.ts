import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { TasasImpuestoService } from '../services/tasas-impuesto.service';
import {
  crearTasaImpuestoSchema,
  type CrearTasaImpuestoInput,
} from '../validators/impuestos.schema';

/** `/configuracion/tasas-impuesto` — tasas vigentes de un impuesto (docs/architecture/14-modulo-core.md). */
@ApiTags('configuracion')
@ApiBearerAuth()
@Controller('configuracion/tasas-impuesto')
export class TasasImpuestoController {
  constructor(private readonly tasasImpuestoService: TasasImpuestoService) {}

  @ApiOperation({
    summary: 'Listar tasas de un impuesto',
    description: 'Requiere configuracion.gestionar_impuestos. Filtrable por taxId.',
  })
  @RequirePermission('configuracion.gestionar_impuestos')
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query('taxId') taxId: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const result = await this.tasasImpuestoService.listarPorImpuesto(user, taxId, {
      page: Number(page),
      pageSize: Number(pageSize),
    });
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({
    summary: 'Crear tasa para un impuesto',
    description: 'Requiere configuracion.gestionar_impuestos.',
  })
  @RequirePermission('configuracion.gestionar_impuestos')
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearTasaImpuestoSchema)) body: CrearTasaImpuestoInput,
  ) {
    const tasa = await this.tasasImpuestoService.crear(user, body);
    return { data: tasa };
  }
}
