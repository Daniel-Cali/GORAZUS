import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { VentasService } from '../services/ventas.service';
import {
  crearFacturaSchema,
  registrarReciboSchema,
  type CrearFacturaInput,
  type RegistrarReciboInput,
} from '../validators/facturas.schema';

const PERMISO_GESTIONAR = 'ventas.gestionar_ventas';

/** `/ventas/facturas` — la venta POS es una factura directa (`POS_ARCHITECTURE.md §3`). */
@ApiTags('ventas')
@ApiBearerAuth()
@Controller('ventas/facturas')
export class FacturasController {
  constructor(private readonly ventasService: VentasService) {}

  @ApiOperation({ summary: 'Listar facturas', description: `Requiere ${PERMISO_GESTIONAR}.` })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query('branchId') branchId: string | undefined,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const result = await this.ventasService.listar(user, branchId, {
      page: Number(page),
      pageSize: Number(pageSize),
    });
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({
    summary: 'Obtener factura por id (con líneas)',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get(':id')
  async obtener(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const factura = await this.ventasService.obtener(user, id);
    return { data: factura };
  }

  @ApiOperation({
    summary: 'Crear factura (borrador)',
    description: `Requiere ${PERMISO_GESTIONAR}. Calcula impuestos por línea con la tasa vigente.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearFacturaSchema)) body: CrearFacturaInput,
  ) {
    const factura = await this.ventasService.crearFactura(user, body);
    return { data: factura };
  }

  @ApiOperation({
    summary: 'Registrar recibo de cobro contra una factura',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/recibos')
  async registrarRecibo(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(registrarReciboSchema)) body: RegistrarReciboInput,
  ) {
    const factura = await this.ventasService.obtener(user, id);
    const recibo = await this.ventasService.registrarRecibo(user, {
      companyId: factura.company_id,
      branchId: factura.branch_id,
      customerId: factura.customer_id,
      invoiceId: id,
      paymentFormId: body.paymentFormId ?? null,
      amount: body.amount,
    });
    return { data: recibo };
  }

  @ApiOperation({
    summary: 'Confirmar factura (draft → issued)',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/confirmar')
  async confirmar(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const factura = await this.ventasService.confirmarFactura(user, id);
    return { data: factura };
  }
}
