import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { RetencionesCompraService } from '../services/retenciones-compra.service';
import {
  crearRetencionCompraSchema,
  actualizarRetencionCompraSchema,
  type CrearRetencionCompraInput,
  type ActualizarRetencionCompraInput,
} from '../validators/retenciones-compra.schema';

const PERMISO_GESTIONAR = 'compras.gestionar_retenciones';

/**
 * `/compras/retenciones` — Compras FASE 10 (Purchase Withholdings). Sin
 * líneas propias ni flujo de estados — registro de retención a nivel de
 * cabecera de factura. No excede el total de la factura.
 */
@ApiTags('compras')
@ApiBearerAuth()
@Controller('compras/retenciones')
export class RetencionesCompraController {
  constructor(private readonly retencionesCompraService: RetencionesCompraService) {}

  @ApiOperation({
    summary: 'Listar retenciones de compra',
    description: `Requiere ${PERMISO_GESTIONAR}. Filtrable por purchaseInvoiceId.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query('purchaseInvoiceId') purchaseInvoiceId: string | undefined,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const result = await this.retencionesCompraService.listar(
      user,
      { purchaseInvoiceId },
      { page: Number(page), pageSize: Number(pageSize) },
    );
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({
    summary: 'Obtener retención de compra por id',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get(':id')
  async obtener(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.retencionesCompraService.obtener(user, id) };
  }

  @ApiOperation({
    summary: 'Registrar retención de compra',
    description: `Requiere ${PERMISO_GESTIONAR}. La factura debe existir y no estar cancelada; el monto no puede exceder el total de la factura (acumulado con otras retenciones activas).`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearRetencionCompraSchema)) body: CrearRetencionCompraInput,
  ) {
    return { data: await this.retencionesCompraService.crear(user, body) };
  }

  @ApiOperation({
    summary: 'Editar retención de compra',
    description: `Requiere ${PERMISO_GESTIONAR}. Nunca reasigna la factura de compra.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Put(':id')
  async actualizar(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(actualizarRetencionCompraSchema))
    body: ActualizarRetencionCompraInput,
  ) {
    return { data: await this.retencionesCompraService.actualizar(user, id, body) };
  }

  @ApiOperation({
    summary: 'Anular retención de compra',
    description: `Requiere ${PERMISO_GESTIONAR}. Baja lógica — libera el monto para futuras retenciones contra la misma factura.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/anular')
  async anular(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.retencionesCompraService.anular(user, id) };
  }
}
