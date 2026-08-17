import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { AgendaService } from '../services/agenda.service';
import {
  crearCalendarEventSchema,
  agregarAsistenteSchema,
  type CrearCalendarEventInput,
  type AgregarAsistenteInput,
} from '../validators/calendar-events.schema';

const PERMISO_VER = 'crm.ver_agenda';
const PERMISO_GESTIONAR = 'crm.gestionar_agenda';

/** `/crm/agenda` — eventos de calendario y asistentes (`CRM_ARCHITECTURE.md §5`). */
@ApiTags('crm')
@ApiBearerAuth()
@Controller('crm/agenda')
export class AgendaController {
  constructor(private readonly agendaService: AgendaService) {}

  @ApiOperation({ summary: 'Listar eventos de agenda', description: `Requiere ${PERMISO_VER}.` })
  @RequirePermission(PERMISO_VER)
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query('companyId') companyId: string | undefined,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const result = await this.agendaService.listar(user, companyId, {
      page: Number(page),
      pageSize: Number(pageSize),
    });
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({ summary: 'Obtener evento por id', description: `Requiere ${PERMISO_VER}.` })
  @RequirePermission(PERMISO_VER)
  @Get(':id')
  async obtener(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const evento = await this.agendaService.obtener(user, id);
    return { data: evento };
  }

  @ApiOperation({
    summary: 'Crear evento de agenda',
    description: `Requiere ${PERMISO_GESTIONAR}. Puede referenciar un lead u oportunidad (ambos opcionales).`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearCalendarEventSchema)) body: CrearCalendarEventInput,
  ) {
    const evento = await this.agendaService.crear(user, body);
    return { data: evento };
  }

  @ApiOperation({
    summary: 'Agregar asistente al evento',
    description: `Requiere ${PERMISO_GESTIONAR}. Interno (userId) o externo (externalEmail), nunca ambos.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/asistentes')
  async agregarAsistente(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(agregarAsistenteSchema)) body: AgregarAsistenteInput,
  ) {
    await this.agendaService.agregarAsistente(user, id, body);
    return { data: { ok: true } };
  }
}
