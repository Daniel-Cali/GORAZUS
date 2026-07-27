import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { PeriodosFiscalesService } from '../services/periodos-fiscales.service';
import {
  crearAnioFiscalSchema,
  type CrearAnioFiscalInput,
} from '../validators/periodos-fiscales.schema';

const PERMISO_GESTIONAR = 'contabilidad.gestionar_plan_cuentas';

/** `/contabilidad/anios-fiscales` — un año fiscal se crea con sus 12 períodos mensuales de una vez. */
@ApiTags('contabilidad')
@ApiBearerAuth()
@Controller('contabilidad/anios-fiscales')
export class PeriodosFiscalesController {
  constructor(private readonly periodosFiscalesService: PeriodosFiscalesService) {}

  @ApiOperation({
    summary: 'Crear año fiscal (genera sus 12 períodos mensuales)',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearAnioFiscalSchema)) body: CrearAnioFiscalInput,
  ) {
    return { data: await this.periodosFiscalesService.crearAnioFiscal(user, body) };
  }

  @ApiOperation({
    summary: 'Obtener año fiscal por id',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get(':id')
  async obtener(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.periodosFiscalesService.obtenerAnio(user, id) };
  }

  @ApiOperation({
    summary: 'Listar los períodos mensuales de un año fiscal',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get(':id/periodos')
  async listarPeriodos(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.periodosFiscalesService.listarPeriodos(user, id) };
  }
}
