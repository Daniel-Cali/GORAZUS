import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { LeadsService } from '../services/leads.service';
import {
  crearLeadSchema,
  cambiarEstadoLeadSchema,
  convertirLeadSchema,
  type CrearLeadInput,
  type CambiarEstadoLeadInput,
  type ConvertirLeadInput,
} from '../validators/leads.schema';

const PERMISO_VER = 'crm.ver_leads';
const PERMISO_GESTIONAR = 'crm.gestionar_leads';

/** `/crm/leads` — ciclo de vida de leads (`CRM_ARCHITECTURE.md §5`). */
@ApiTags('crm')
@ApiBearerAuth()
@Controller('crm/leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @ApiOperation({
    summary: 'Listar leads',
    description: `Requiere ${PERMISO_VER}. Filtrable por companyId y búsqueda por nombre/email.`,
  })
  @RequirePermission(PERMISO_VER)
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query('companyId') companyId: string | undefined,
    @Query('query') query: string | undefined,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const result = await this.leadsService.listar(user, companyId, query, {
      page: Number(page),
      pageSize: Number(pageSize),
    });
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({ summary: 'Obtener lead por id', description: `Requiere ${PERMISO_VER}.` })
  @RequirePermission(PERMISO_VER)
  @Get(':id')
  async obtener(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const lead = await this.leadsService.obtener(user, id);
    return { data: lead };
  }

  @ApiOperation({
    summary: 'Crear lead',
    description: `Requiere ${PERMISO_GESTIONAR}. Estado inicial siempre "nuevo".`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearLeadSchema)) body: CrearLeadInput,
  ) {
    const lead = await this.leadsService.crear(user, body);
    return { data: lead };
  }

  @ApiOperation({
    summary: 'Cambiar estado del lead',
    description: `Requiere ${PERMISO_GESTIONAR}. Registra el cambio en el historial de estados.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Patch(':id/estado')
  async cambiarEstado(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(cambiarEstadoLeadSchema)) body: CambiarEstadoLeadInput,
  ) {
    const lead = await this.leadsService.cambiarEstado(user, id, body);
    return { data: lead };
  }

  @ApiOperation({
    summary: 'Convertir lead en cliente',
    description: `Requiere ${PERMISO_GESTIONAR}. Idempotente — invoca ClientesService.crear(), nunca escribe directo en customers.customers.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/convertir')
  async convertir(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(convertirLeadSchema)) body: ConvertirLeadInput,
  ) {
    const lead = await this.leadsService.convertir(user, id, body);
    return { data: lead };
  }
}
