import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { OportunidadesService } from '../services/oportunidades.service';
import {
  crearOpportunitySchema,
  moverDeEtapaSchema,
  ganarOpportunitySchema,
  perderOpportunitySchema,
  type CrearOpportunityInput,
  type MoverDeEtapaInput,
  type GanarOpportunityInput,
  type PerderOpportunityInput,
} from '../validators/opportunities.schema';

const PERMISO_VER = 'crm.ver_oportunidades';
const PERMISO_GESTIONAR = 'crm.gestionar_oportunidades';

/** `/crm/oportunidades` — ciclo de vida de oportunidades (`CRM_ARCHITECTURE.md §5`). */
@ApiTags('crm')
@ApiBearerAuth()
@Controller('crm/oportunidades')
export class OportunidadesController {
  constructor(private readonly oportunidadesService: OportunidadesService) {}

  @ApiOperation({ summary: 'Listar oportunidades', description: `Requiere ${PERMISO_VER}.` })
  @RequirePermission(PERMISO_VER)
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query('companyId') companyId: string | undefined,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const result = await this.oportunidadesService.listar(user, companyId, {
      page: Number(page),
      pageSize: Number(pageSize),
    });
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({ summary: 'Obtener oportunidad por id', description: `Requiere ${PERMISO_VER}.` })
  @RequirePermission(PERMISO_VER)
  @Get(':id')
  async obtener(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const oportunidad = await this.oportunidadesService.obtener(user, id);
    return { data: oportunidad };
  }

  @ApiOperation({
    summary: 'Crear oportunidad',
    description: `Requiere ${PERMISO_GESTIONAR}. Debe originarse en un lead o en un cliente existente.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearOpportunitySchema)) body: CrearOpportunityInput,
  ) {
    const oportunidad = await this.oportunidadesService.crear(user, body);
    return { data: oportunidad };
  }

  @ApiOperation({
    summary: 'Mover oportunidad de etapa',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Patch(':id/etapa')
  async moverDeEtapa(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(moverDeEtapaSchema)) body: MoverDeEtapaInput,
  ) {
    const oportunidad = await this.oportunidadesService.moverDeEtapa(user, id, body);
    return { data: oportunidad };
  }

  @ApiOperation({
    summary: 'Marcar oportunidad como ganada',
    description: `Requiere ${PERMISO_GESTIONAR}. Requiere el id del pedido/factura ya creado en ventas.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/ganar')
  async ganar(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ganarOpportunitySchema)) body: GanarOpportunityInput,
  ) {
    const oportunidad = await this.oportunidadesService.ganar(user, id, body);
    return { data: oportunidad };
  }

  @ApiOperation({
    summary: 'Marcar oportunidad como perdida',
    description: `Requiere ${PERMISO_GESTIONAR}. Exige un motivo de pérdida válido.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/perder')
  async perder(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(perderOpportunitySchema)) body: PerderOpportunityInput,
  ) {
    const oportunidad = await this.oportunidadesService.perder(user, id, body);
    return { data: oportunidad };
  }
}
