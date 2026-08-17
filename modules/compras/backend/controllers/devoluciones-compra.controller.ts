import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { DevolucionesCompraService } from '../services/devoluciones-compra.service';
import {
  crearDevolucionCompraSchema,
  actualizarDevolucionCompraSchema,
  type CrearDevolucionCompraInput,
  type ActualizarDevolucionCompraInput,
} from '../validators/devoluciones-compra.schema';

const PERMISO_GESTIONAR = 'compras.gestionar_devoluciones';

/**
 * `/compras/devoluciones` — Compras FASE 8 (Purchase Returns). Sin
 * flujo de estados (el schema real no lo define para este par de
 * tablas, mismo motivo que Goods Receipt) — una devolución es un hecho
 * consumado al crearse; "anular" es baja lógica.
 */
@ApiTags('compras')
@ApiBearerAuth()
@Controller('compras/devoluciones')
export class DevolucionesCompraController {
  constructor(private readonly devolucionesCompraService: DevolucionesCompraService) {}

  @ApiOperation({
    summary: 'Listar devoluciones de compra',
    description: `Requiere ${PERMISO_GESTIONAR}. Filtrable por purchaseInvoiceId.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query('companyId') companyId: string,
    @Query('purchaseInvoiceId') purchaseInvoiceId: string | undefined,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const result = await this.devolucionesCompraService.listar(
      user,
      { companyId, purchaseInvoiceId },
      { page: Number(page), pageSize: Number(pageSize) },
    );
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({
    summary: 'Obtener devolución de compra por id (con líneas)',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get(':id')
  async obtener(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.devolucionesCompraService.obtener(user, id) };
  }

  @ApiOperation({
    summary: 'Registrar devolución de compra',
    description: `Requiere ${PERMISO_GESTIONAR}. La factura debe existir y no estar cancelada; productos y cantidades se validan contra las líneas de la factura y lo ya devuelto.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearDevolucionCompraSchema)) body: CrearDevolucionCompraInput,
  ) {
    return { data: await this.devolucionesCompraService.crear(user, body) };
  }

  @ApiOperation({
    summary: 'Editar devolución de compra (reemplaza líneas)',
    description: `Requiere ${PERMISO_GESTIONAR}. Nunca reasigna la factura de compra.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Put(':id')
  async actualizar(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(actualizarDevolucionCompraSchema))
    body: ActualizarDevolucionCompraInput,
  ) {
    return { data: await this.devolucionesCompraService.actualizar(user, id, body) };
  }

  @ApiOperation({
    summary: 'Anular devolución de compra',
    description: `Requiere ${PERMISO_GESTIONAR}. Baja lógica — libera la cantidad para futuras devoluciones contra la misma factura.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/anular')
  async anular(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.devolucionesCompraService.anular(user, id) };
  }
}
