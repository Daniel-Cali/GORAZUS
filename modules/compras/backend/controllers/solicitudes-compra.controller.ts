import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { SolicitudesCompraService } from '../services/solicitudes-compra.service';
import {
  crearSolicitudCompraSchema,
  actualizarSolicitudCompraSchema,
  type CrearSolicitudCompraInput,
  type ActualizarSolicitudCompraInput,
} from '../validators/solicitudes-compra.schema';

const PERMISO_GESTIONAR = 'compras.gestionar_solicitudes';

/** `/compras/solicitudes` — Compras FASE 3 (Purchase Requisition). Flujo: `draft` → `submitted` → `approved`|`rejected`; `cancelled` desde `draft`/`submitted`. */
@ApiTags('compras')
@ApiBearerAuth()
@Controller('compras/solicitudes')
export class SolicitudesCompraController {
  constructor(private readonly solicitudesCompraService: SolicitudesCompraService) {}

  @ApiOperation({
    summary: 'Listar solicitudes de compra',
    description: `Requiere ${PERMISO_GESTIONAR}. Filtrable por branchId/statusId.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query('companyId') companyId: string,
    @Query('branchId') branchId: string | undefined,
    @Query('statusId') statusId: string | undefined,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const result = await this.solicitudesCompraService.listar(
      user,
      { companyId, branchId, statusId },
      { page: Number(page), pageSize: Number(pageSize) },
    );
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({
    summary: 'Obtener solicitud de compra por id (con líneas)',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get(':id')
  async obtener(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.solicitudesCompraService.obtener(user, id) };
  }

  @ApiOperation({
    summary: 'Consultar historial de estados',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get(':id/historial')
  async historial(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.solicitudesCompraService.historial(user, id) };
  }

  @ApiOperation({
    summary: 'Crear solicitud de compra (borrador)',
    description: `Requiere ${PERMISO_GESTIONAR}. El solicitante es siempre el usuario autenticado.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearSolicitudCompraSchema)) body: CrearSolicitudCompraInput,
  ) {
    return { data: await this.solicitudesCompraService.crear(user, body) };
  }

  @ApiOperation({
    summary: 'Editar solicitud de compra (solo mientras sigue en borrador)',
    description: `Requiere ${PERMISO_GESTIONAR}. 409 si ya no está en borrador.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Put(':id')
  async actualizar(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(actualizarSolicitudCompraSchema))
    body: ActualizarSolicitudCompraInput,
  ) {
    return { data: await this.solicitudesCompraService.actualizar(user, id, body) };
  }

  @ApiOperation({
    summary: 'Eliminar solicitud de compra (baja lógica, solo mientras sigue en borrador)',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Delete(':id')
  async eliminar(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.solicitudesCompraService.eliminar(user, id) };
  }

  @ApiOperation({
    summary: 'Enviar a aprobación',
    description: `Requiere ${PERMISO_GESTIONAR}. draft → submitted.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/enviar')
  async enviar(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.solicitudesCompraService.enviar(user, id) };
  }

  @ApiOperation({
    summary: 'Aprobar solicitud de compra',
    description: `Requiere ${PERMISO_GESTIONAR}. submitted → approved.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/aprobar')
  async aprobar(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.solicitudesCompraService.aprobar(user, id) };
  }

  @ApiOperation({
    summary: 'Rechazar solicitud de compra',
    description: `Requiere ${PERMISO_GESTIONAR}. submitted → rejected.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/rechazar')
  async rechazar(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.solicitudesCompraService.rechazar(user, id) };
  }

  @ApiOperation({
    summary: 'Cancelar solicitud de compra',
    description: `Requiere ${PERMISO_GESTIONAR}. draft|submitted → cancelled.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/cancelar')
  async cancelar(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.solicitudesCompraService.cancelar(user, id) };
  }
}
