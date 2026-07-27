import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { PedidosVentaService } from '../services/pedidos-venta.service';
import type { OrdenPedido } from '../repositories/pedido.repository';
import {
  crearPedidoSchema,
  convertirPedidoAFacturaSchema,
  type CrearPedidoInput,
  type ConvertirPedidoAFacturaInput,
} from '../validators/pedidos.schema';

const PERMISO_GESTIONAR = 'ventas.gestionar_pedidos';
const CAMPOS_ORDEN_VALIDOS: OrdenPedido[] = ['created_at', 'total_amount', 'document_number'];

/** `/ventas/pedidos` — Módulo de Ventas Enterprise, Parte 1 (Cotización → Pedido → Factura). */
@ApiTags('ventas')
@ApiBearerAuth()
@Controller('ventas/pedidos')
export class PedidosVentaController {
  constructor(private readonly pedidosVentaService: PedidosVentaService) {}

  @ApiOperation({
    summary: 'Listar pedidos de venta',
    description: `Requiere ${PERMISO_GESTIONAR}. Filtrable por branchId/customerId/statusId, ordenable.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query('companyId') companyId: string,
    @Query('branchId') branchId: string | undefined,
    @Query('customerId') customerId: string | undefined,
    @Query('statusId') statusId: string | undefined,
    @Query('sortBy') sortBy: string | undefined,
    @Query('sortDir') sortDir: 'asc' | 'desc' = 'desc',
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const campoOrden = CAMPOS_ORDEN_VALIDOS.includes(sortBy as OrdenPedido)
      ? (sortBy as OrdenPedido)
      : undefined;
    const result = await this.pedidosVentaService.listar(
      user,
      { companyId, branchId, customerId, statusId },
      { page: Number(page), pageSize: Number(pageSize) },
      campoOrden ? { campo: campoOrden, direccion: sortDir } : undefined,
    );
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({
    summary: 'Obtener pedido por id (con líneas)',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get(':id')
  async obtener(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.pedidosVentaService.obtener(user, id) };
  }

  @ApiOperation({
    summary: 'Crear pedido de venta',
    description: `Requiere ${PERMISO_GESTIONAR}. Reserva inventario real de cada línea (warehouseId obligatorio).`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearPedidoSchema)) body: CrearPedidoInput,
  ) {
    return { data: await this.pedidosVentaService.crear(user, body) };
  }

  @ApiOperation({
    summary: 'Convertir una cotización aprobada y vigente en un pedido nuevo',
    description: `Requiere ${PERMISO_GESTIONAR}. "warehouseId" es obligatorio (reserva de inventario).`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post('desde-cotizacion/:cotizacionId')
  async crearDesdeCotizacion(
    @CurrentUser() user: UserContext,
    @Param('cotizacionId') cotizacionId: string,
    @Query('warehouseId') warehouseId: string,
  ) {
    return {
      data: await this.pedidosVentaService.crearDesdeCotizacion(user, cotizacionId, warehouseId),
    };
  }

  @ApiOperation({
    summary: 'Cancelar pedido',
    description: `Requiere ${PERMISO_GESTIONAR}. Solo si ninguna línea tiene facturación parcial/total todavía — libera las reservas de inventario.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/cancelar')
  async cancelar(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.pedidosVentaService.cancelar(user, id) };
  }

  @ApiOperation({
    summary: 'Convertir el pedido (total o parcialmente) en una factura real',
    description: `Requiere ${PERMISO_GESTIONAR}. Sin "lines" en el body, factura el saldo pendiente completo de cada línea.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/convertir-a-factura')
  async convertirAFactura(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(convertirPedidoAFacturaSchema)) body: ConvertirPedidoAFacturaInput,
  ) {
    return { data: await this.pedidosVentaService.convertirAFactura(user, id, body) };
  }
}
