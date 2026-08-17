import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { PosCheckoutService } from '../services/pos-checkout.service';
import {
  confirmarVentaSchema,
  suspenderVentaSchema,
  completarVentaSuspendidaSchema,
  type ConfirmarVentaInput,
  type SuspenderVentaInput,
  type CompletarVentaSuspendidaInput,
} from '../validators/pos.schema';

const PERMISO_OPERAR = 'pos.operar_pos';

/** `/pos` — orquestador del checkout (`POS_ARCHITECTURE.md §4.3`). */
@ApiTags('pos')
@ApiBearerAuth()
@Controller('pos')
export class PosController {
  constructor(private readonly posCheckoutService: PosCheckoutService) {}

  @ApiOperation({
    summary: 'Buscar productos (SKU/código de barras/tipeo manual)',
    description: `Requiere ${PERMISO_OPERAR}.`,
  })
  @RequirePermission(PERMISO_OPERAR)
  @Get('productos')
  async buscarProductos(@CurrentUser() user: UserContext, @Query('query') query: string) {
    const productos = await this.posCheckoutService.buscarProductos(user, query ?? '');
    return { data: productos };
  }

  @ApiOperation({
    summary: 'Confirmar venta (checkout completo)',
    description: `Requiere ${PERMISO_OPERAR}. Valida stock, crea la factura, descuenta inventario, registra el/los pago(s) y confirma la factura.`,
  })
  @RequirePermission(PERMISO_OPERAR)
  @Post('ventas')
  async confirmarVenta(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(confirmarVentaSchema)) body: ConfirmarVentaInput,
  ) {
    const resultado = await this.posCheckoutService.confirmarVenta(user, body);
    return { data: resultado };
  }

  @ApiOperation({
    summary: 'Suspender venta (guardar el carrito sin cobrar ni descontar stock)',
    description: `Requiere ${PERMISO_OPERAR}.`,
  })
  @RequirePermission(PERMISO_OPERAR)
  @Post('ventas/suspender')
  async suspenderVenta(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(suspenderVentaSchema)) body: SuspenderVentaInput,
  ) {
    const factura = await this.posCheckoutService.suspenderVenta(user, body);
    return { data: factura };
  }

  @ApiOperation({
    summary: 'Listar ventas suspendidas de una sucursal',
    description: `Requiere ${PERMISO_OPERAR}.`,
  })
  @RequirePermission(PERMISO_OPERAR)
  @Get('ventas/suspendidas')
  async listarSuspendidas(@CurrentUser() user: UserContext, @Query('branchId') branchId: string) {
    const result = await this.posCheckoutService.listarSuspendidas(user, branchId);
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({
    summary: 'Recuperar una venta suspendida por id',
    description: `Requiere ${PERMISO_OPERAR}.`,
  })
  @RequirePermission(PERMISO_OPERAR)
  @Get('ventas/:id')
  async recuperarVenta(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const factura = await this.posCheckoutService.recuperarVenta(user, id);
    return { data: factura };
  }

  @ApiOperation({
    summary: 'Completar una venta suspendida (cobrarla)',
    description: `Requiere ${PERMISO_OPERAR}. Reutiliza la MISMA factura — nunca crea una segunda. Valida stock real (no el de cuando se suspendió), caja abierta y pagos suficientes. Idempotente (misma filosofía que POST /pos/ventas).`,
  })
  @RequirePermission(PERMISO_OPERAR)
  @Post('ventas/:id/completar')
  async completarVentaSuspendida(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(completarVentaSuspendidaSchema))
    body: CompletarVentaSuspendidaInput,
  ) {
    const resultado = await this.posCheckoutService.completarVentaSuspendida(user, id, body);
    return { data: resultado };
  }

  @ApiOperation({
    summary: 'Cancelar una venta suspendida',
    description: `Requiere ${PERMISO_OPERAR}. Baja lógica vía Ventas (anular) — nunca borra la factura físicamente.`,
  })
  @RequirePermission(PERMISO_OPERAR)
  @Post('ventas/:id/cancelar')
  async cancelarVentaSuspendida(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const factura = await this.posCheckoutService.cancelarVentaSuspendida(user, id);
    return { data: factura };
  }
}
