import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { CampanasService } from '../services/campanas.service';
import {
  crearCampaignSchema,
  agregarMiembroCampaignSchema,
  type CrearCampaignInput,
  type AgregarMiembroCampaignInput,
} from '../validators/campaigns.schema';

const PERMISO_VER = 'crm.ver_campanas';
const PERMISO_GESTIONAR = 'crm.gestionar_campanas';

/** `/crm/campanas` — campañas y sus miembros (`CRM_ARCHITECTURE.md §5`). */
@ApiTags('crm')
@ApiBearerAuth()
@Controller('crm/campanas')
export class CampanasController {
  constructor(private readonly campanasService: CampanasService) {}

  @ApiOperation({ summary: 'Listar campañas', description: `Requiere ${PERMISO_VER}.` })
  @RequirePermission(PERMISO_VER)
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query('companyId') companyId: string | undefined,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const result = await this.campanasService.listar(user, companyId, {
      page: Number(page),
      pageSize: Number(pageSize),
    });
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({ summary: 'Obtener campaña por id', description: `Requiere ${PERMISO_VER}.` })
  @RequirePermission(PERMISO_VER)
  @Get(':id')
  async obtener(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const campana = await this.campanasService.obtener(user, id);
    return { data: campana };
  }

  @ApiOperation({ summary: 'Crear campaña', description: `Requiere ${PERMISO_GESTIONAR}.` })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearCampaignSchema)) body: CrearCampaignInput,
  ) {
    const campana = await this.campanasService.crear(user, body);
    return { data: campana };
  }

  @ApiOperation({
    summary: 'Agregar un lead como miembro de la campaña',
    description: `Requiere ${PERMISO_GESTIONAR}. Solo admite leads, nunca clientes existentes.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/miembros')
  async agregarMiembro(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(agregarMiembroCampaignSchema)) body: AgregarMiembroCampaignInput,
  ) {
    await this.campanasService.agregarMiembro(user, id, body);
    return { data: { ok: true } };
  }
}
