import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { NotasCreditoCompraService } from '../services/notas-credito-compra.service';
import {
  crearNotaCreditoCompraSchema,
  actualizarNotaCreditoCompraSchema,
  type CrearNotaCreditoCompraInput,
  type ActualizarNotaCreditoCompraInput,
} from '../validators/notas-credito-compra.schema';

const PERMISO_GESTIONAR = 'compras.gestionar_notas_credito';

/**
 * `/compras/notas-credito` — Compras FASE 9 (Purchase Credit Notes).
 * Sin flujo de estados (el schema real no lo define, mismo motivo que
 * Purchase Returns) — una nota es un hecho consumado al crearse; "anular"
 * es baja lógica. El monto total se calcula server-side a partir del
 * costo unitario de la factura, nunca lo envía el cliente.
 */
@ApiTags('compras')
@ApiBearerAuth()
@Controller('compras/notas-credito')
export class NotasCreditoCompraController {
  constructor(private readonly notasCreditoCompraService: NotasCreditoCompraService) {}

  @ApiOperation({
    summary: 'Listar notas de crédito de compra',
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
    const result = await this.notasCreditoCompraService.listar(
      user,
      { companyId, purchaseInvoiceId },
      { page: Number(page), pageSize: Number(pageSize) },
    );
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({
    summary: 'Obtener nota de crédito de compra por id (con líneas)',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get(':id')
  async obtener(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.notasCreditoCompraService.obtener(user, id) };
  }

  @ApiOperation({
    summary: 'Registrar nota de crédito de compra',
    description: `Requiere ${PERMISO_GESTIONAR}. La factura debe existir y no estar cancelada; productos y cantidades se validan contra las líneas de la factura y lo ya acreditado; el monto se calcula server-side.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearNotaCreditoCompraSchema)) body: CrearNotaCreditoCompraInput,
  ) {
    return { data: await this.notasCreditoCompraService.crear(user, body) };
  }

  @ApiOperation({
    summary: 'Editar nota de crédito de compra (reemplaza líneas)',
    description: `Requiere ${PERMISO_GESTIONAR}. Nunca reasigna la factura de compra; el monto se recalcula.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Put(':id')
  async actualizar(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(actualizarNotaCreditoCompraSchema))
    body: ActualizarNotaCreditoCompraInput,
  ) {
    return { data: await this.notasCreditoCompraService.actualizar(user, id, body) };
  }

  @ApiOperation({
    summary: 'Anular nota de crédito de compra',
    description: `Requiere ${PERMISO_GESTIONAR}. Baja lógica — libera la cantidad para futuras notas contra la misma factura.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/anular')
  async anular(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.notasCreditoCompraService.anular(user, id) };
  }
}
