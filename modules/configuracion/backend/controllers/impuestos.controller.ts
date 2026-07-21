import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { ImpuestosService } from '../services/impuestos.service';
import { crearImpuestoSchema, type CrearImpuestoInput } from '../validators/impuestos.schema';

/**
 * `/configuracion/impuestos` — catálogo de perfiles de impuesto
 * (docs/architecture/14-modulo-core.md). Alcance mínimo de Fase 02: no
 * incluye reglas de cálculo, percepciones ni retenciones.
 */
@ApiTags('configuracion')
@ApiBearerAuth()
@Controller('configuracion/impuestos')
export class ImpuestosController {
  constructor(private readonly impuestosService: ImpuestosService) {}

  @ApiOperation({
    summary: 'Listar impuestos',
    description: 'Requiere configuracion.gestionar_impuestos.',
  })
  @RequirePermission('configuracion.gestionar_impuestos')
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const result = await this.impuestosService.listar(user, {
      page: Number(page),
      pageSize: Number(pageSize),
    });
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({
    summary: 'Obtener impuesto por id',
    description: 'Requiere configuracion.gestionar_impuestos.',
  })
  @RequirePermission('configuracion.gestionar_impuestos')
  @Get(':id')
  async obtener(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const impuesto = await this.impuestosService.obtener(user, id);
    return { data: impuesto };
  }

  @ApiOperation({
    summary: 'Crear impuesto',
    description: 'Requiere configuracion.gestionar_impuestos.',
  })
  @RequirePermission('configuracion.gestionar_impuestos')
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearImpuestoSchema)) body: CrearImpuestoInput,
  ) {
    const impuesto = await this.impuestosService.crear(user, body);
    return { data: impuesto };
  }
}
