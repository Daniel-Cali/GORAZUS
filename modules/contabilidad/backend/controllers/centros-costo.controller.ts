import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { CentrosCostoService } from '../services/centros-costo.service';
import {
  crearCentroCostoSchema,
  type CrearCentroCostoInput,
} from '../validators/centros-costo.schema';

const PERMISO_GESTIONAR = 'contabilidad.gestionar_plan_cuentas';

/** `/contabilidad/centros-costo`. */
@ApiTags('contabilidad')
@ApiBearerAuth()
@Controller('contabilidad/centros-costo')
export class CentrosCostoController {
  constructor(private readonly centrosCostoService: CentrosCostoService) {}

  @ApiOperation({
    summary: 'Listar centros de costo',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query('companyId') companyId: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '50',
  ) {
    const result = await this.centrosCostoService.listar(user, companyId, {
      page: Number(page),
      pageSize: Number(pageSize),
    });
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({
    summary: 'Obtener centro de costo por id',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get(':id')
  async obtener(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.centrosCostoService.obtener(user, id) };
  }

  @ApiOperation({ summary: 'Crear centro de costo', description: `Requiere ${PERMISO_GESTIONAR}.` })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearCentroCostoSchema)) body: CrearCentroCostoInput,
  ) {
    return { data: await this.centrosCostoService.crear(user, body) };
  }
}
