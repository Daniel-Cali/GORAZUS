import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { OrdenesCompraService } from '../services/ordenes-compra.service';
import {
  crearOrdenCompraSchema,
  actualizarOrdenCompraSchema,
  type CrearOrdenCompraInput,
  type ActualizarOrdenCompraInput,
} from '../validators/ordenes-compra.schema';

const PERMISO_GESTIONAR = 'compras.gestionar_ordenes';

/** `/compras/ordenes` — Compras FASE 4 (Purchase Order). Flujo: `draft` → `approved`; `cancelled` desde `draft`/`approved`. */
@ApiTags('compras')
@ApiBearerAuth()
@Controller('compras/ordenes')
export class OrdenesCompraController {
  constructor(private readonly ordenesCompraService: OrdenesCompraService) {}

  @ApiOperation({
    summary: 'Listar órdenes de compra',
    description: `Requiere ${PERMISO_GESTIONAR}. Filtrable por branchId/supplierId/statusId.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query('companyId') companyId: string,
    @Query('branchId') branchId: string | undefined,
    @Query('supplierId') supplierId: string | undefined,
    @Query('statusId') statusId: string | undefined,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const result = await this.ordenesCompraService.listar(
      user,
      { companyId, branchId, supplierId, statusId },
      { page: Number(page), pageSize: Number(pageSize) },
    );
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({
    summary: 'Obtener orden de compra por id (con líneas)',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get(':id')
  async obtener(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.ordenesCompraService.obtener(user, id) };
  }

  @ApiOperation({
    summary: 'Consultar historial de estados',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get(':id/historial')
  async historial(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.ordenesCompraService.historial(user, id) };
  }

  @ApiOperation({
    summary: 'Crear orden de compra (borrador)',
    description: `Requiere ${PERMISO_GESTIONAR}. Proveedor obligatorio y no bloqueado; solicitud de compra opcional.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearOrdenCompraSchema)) body: CrearOrdenCompraInput,
  ) {
    return { data: await this.ordenesCompraService.crear(user, body) };
  }

  @ApiOperation({
    summary: 'Editar orden de compra (solo mientras sigue en borrador)',
    description: `Requiere ${PERMISO_GESTIONAR}. 409 si ya no está en borrador.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Put(':id')
  async actualizar(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(actualizarOrdenCompraSchema)) body: ActualizarOrdenCompraInput,
  ) {
    return { data: await this.ordenesCompraService.actualizar(user, id, body) };
  }

  @ApiOperation({
    summary: 'Eliminar orden de compra (baja lógica, solo mientras sigue en borrador)',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Delete(':id')
  async eliminar(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.ordenesCompraService.eliminar(user, id) };
  }

  @ApiOperation({
    summary: 'Aprobar orden de compra',
    description: `Requiere ${PERMISO_GESTIONAR}. draft → approved.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/aprobar')
  async aprobar(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.ordenesCompraService.aprobar(user, id) };
  }

  @ApiOperation({
    summary: 'Cancelar orden de compra',
    description: `Requiere ${PERMISO_GESTIONAR}. draft|approved → cancelled.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/cancelar')
  async cancelar(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.ordenesCompraService.cancelar(user, id) };
  }
}
