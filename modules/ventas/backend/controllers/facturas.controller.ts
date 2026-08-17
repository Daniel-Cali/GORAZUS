import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { VentasService } from '../services/ventas.service';
import type { OrdenFactura } from '../repositories/factura.repository';
import {
  crearFacturaSchema,
  actualizarFacturaSchema,
  registrarReciboSchema,
  type CrearFacturaInput,
  type ActualizarFacturaInput,
  type RegistrarReciboInput,
} from '../validators/facturas.schema';

const PERMISO_GESTIONAR = 'ventas.gestionar_ventas';
const CAMPOS_ORDEN_VALIDOS: OrdenFactura[] = ['issued_at', 'total_amount', 'document_number'];

/** `/ventas/facturas` — la venta POS es una factura directa (`POS_ARCHITECTURE.md §3`). */
@ApiTags('ventas')
@ApiBearerAuth()
@Controller('ventas/facturas')
export class FacturasController {
  constructor(private readonly ventasService: VentasService) {}

  @ApiOperation({
    summary: 'Listar facturas',
    description: `Requiere ${PERMISO_GESTIONAR}. Filtrable por branchId/customerId/statusId/issuedFrom/issuedTo, ordenable por issued_at/total_amount/document_number.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query('branchId') branchId: string | undefined,
    @Query('customerId') customerId: string | undefined,
    @Query('statusId') statusId: string | undefined,
    @Query('issuedFrom') issuedFrom: string | undefined,
    @Query('issuedTo') issuedTo: string | undefined,
    @Query('sortBy') sortBy: string | undefined,
    @Query('sortDir') sortDir: 'asc' | 'desc' = 'desc',
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const campoOrden = CAMPOS_ORDEN_VALIDOS.includes(sortBy as OrdenFactura)
      ? (sortBy as OrdenFactura)
      : undefined;
    const result = await this.ventasService.listar(
      user,
      {
        branchId,
        customerId,
        statusId,
        issuedFrom: issuedFrom ? new Date(issuedFrom) : undefined,
        issuedTo: issuedTo ? new Date(issuedTo) : undefined,
      },
      { page: Number(page), pageSize: Number(pageSize) },
      campoOrden ? { campo: campoOrden, direccion: sortDir } : undefined,
    );
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({
    summary: 'Listar catálogo de estados de factura',
    description: `Requiere ${PERMISO_GESTIONAR}. Catálogo de solo lectura (\`invoice_status\`) — declarado antes de ":id" para no colisionar con esa ruta.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get('estados')
  async listarEstados(@CurrentUser() user: UserContext) {
    const result = await this.ventasService.listarEstados(user);
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
    summary: 'Editar factura (solo mientras sigue en borrador)',
    description: `Requiere ${PERMISO_GESTIONAR}. Recalcula impuestos. 409 si la factura ya no está en borrador.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Put(':id')
  async actualizar(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(actualizarFacturaSchema)) body: ActualizarFacturaInput,
  ) {
    const factura = await this.ventasService.actualizarBorrador(user, id, body);
    return { data: factura };
  }

  @ApiOperation({
    summary: 'Eliminar factura (baja lógica, solo mientras sigue en borrador)',
    description: `Requiere ${PERMISO_GESTIONAR}. 409 si la factura ya no está en borrador.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Delete(':id')
  async eliminar(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const factura = await this.ventasService.eliminarBorrador(user, id);
    return { data: factura };
  }

  @ApiOperation({
    summary: 'Duplicar factura',
    description: `Requiere ${PERMISO_GESTIONAR}. Crea un borrador nuevo con las mismas líneas — recalcula impuestos con la tasa vigente de hoy.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/duplicar')
  async duplicar(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const factura = await this.ventasService.duplicarFactura(user, id);
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

  @ApiOperation({
    summary: 'Anular factura (borrador o confirmada → cancelled)',
    description: `Requiere ${PERMISO_GESTIONAR}. 409 si ya estaba anulada — "cancelled" es un estado final.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/anular')
  async anular(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const factura = await this.ventasService.anularFactura(user, id);
    return { data: factura };
  }
}
