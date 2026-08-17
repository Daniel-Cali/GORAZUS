import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { FacturasCompraService } from '../services/facturas-compra.service';
import {
  crearFacturaCompraSchema,
  actualizarFacturaCompraSchema,
  type CrearFacturaCompraInput,
  type ActualizarFacturaCompraInput,
} from '../validators/facturas-compra.schema';

const PERMISO_GESTIONAR = 'compras.gestionar_facturas';

/**
 * `/compras/facturas` — Compras FASE 6 (Purchase Invoice). Flujo:
 * `draft` → `approved` → `posted`; `cancelled` desde `draft`/`approved`
 * (nunca desde `posted` — "no modificar facturas contabilizadas"). Sin
 * relación directa con Goods Receipt (eso es Purchase Matching, Fase 7)
 * ni integración contable/fiscal real.
 */
@ApiTags('compras')
@ApiBearerAuth()
@Controller('compras/facturas')
export class FacturasCompraController {
  constructor(private readonly facturasCompraService: FacturasCompraService) {}

  @ApiOperation({
    summary: 'Listar facturas de compra',
    description: `Requiere ${PERMISO_GESTIONAR}. Filtrable por supplierId/statusId/purchaseOrderId.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query('companyId') companyId: string,
    @Query('supplierId') supplierId: string | undefined,
    @Query('statusId') statusId: string | undefined,
    @Query('purchaseOrderId') purchaseOrderId: string | undefined,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const result = await this.facturasCompraService.listar(
      user,
      { companyId, supplierId, statusId, purchaseOrderId },
      { page: Number(page), pageSize: Number(pageSize) },
    );
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({
    summary: 'Obtener factura de compra por id (con líneas)',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get(':id')
  async obtener(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.facturasCompraService.obtener(user, id) };
  }

  @ApiOperation({
    summary: 'Consultar historial de estados',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get(':id/historial')
  async historial(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.facturasCompraService.historial(user, id) };
  }

  @ApiOperation({
    summary: 'Registrar factura de compra (borrador)',
    description: `Requiere ${PERMISO_GESTIONAR}. Proveedor obligatorio; orden de compra opcional; rechaza número de documento del proveedor duplicado.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearFacturaCompraSchema)) body: CrearFacturaCompraInput,
  ) {
    return { data: await this.facturasCompraService.crear(user, body) };
  }

  @ApiOperation({
    summary: 'Editar factura de compra (solo mientras sigue en borrador)',
    description: `Requiere ${PERMISO_GESTIONAR}. 409 si ya no está en borrador.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Put(':id')
  async actualizar(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(actualizarFacturaCompraSchema)) body: ActualizarFacturaCompraInput,
  ) {
    return { data: await this.facturasCompraService.actualizar(user, id, body) };
  }

  @ApiOperation({
    summary: 'Eliminar factura de compra (baja lógica, solo mientras sigue en borrador)',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Delete(':id')
  async eliminar(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.facturasCompraService.eliminar(user, id) };
  }

  @ApiOperation({
    summary: 'Aprobar factura de compra',
    description: `Requiere ${PERMISO_GESTIONAR}. draft → approved.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/aprobar')
  async aprobar(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.facturasCompraService.aprobar(user, id) };
  }

  @ApiOperation({
    summary: 'Contabilizar factura de compra',
    description: `Requiere ${PERMISO_GESTIONAR}. approved → posted. A partir de acá la factura queda inmutable (sin asiento contable real — fuera de alcance de esta fase).`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/contabilizar')
  async contabilizar(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.facturasCompraService.contabilizar(user, id) };
  }

  @ApiOperation({
    summary: 'Cancelar factura de compra',
    description: `Requiere ${PERMISO_GESTIONAR}. draft|approved → cancelled. No permitido sobre una factura ya contabilizada ("posted").`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/cancelar')
  async cancelar(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.facturasCompraService.cancelar(user, id) };
  }
}
