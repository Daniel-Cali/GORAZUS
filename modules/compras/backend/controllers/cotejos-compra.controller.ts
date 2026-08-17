import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { CotejosCompraService } from '../services/cotejos-compra.service';
import {
  ejecutarCotejoCompraSchema,
  type EjecutarCotejoCompraInput,
} from '../validators/cotejos-compra.schema';

const PERMISO_GESTIONAR = 'compras.gestionar_cotejos';

/**
 * `/compras/cotejos` — Compras FASE 7 (Purchase Matching, 3-way match
 * OC↔Recepción↔Factura). Sin flujo de estados — cada cotejo es el
 * resultado calculado de comparar tres documentos ya existentes.
 * Tolerancia: 2% del total de la factura (placeholder documentado, sin
 * configuración real todavía).
 */
@ApiTags('compras')
@ApiBearerAuth()
@Controller('compras/cotejos')
export class CotejosCompraController {
  constructor(private readonly cotejosCompraService: CotejosCompraService) {}

  @ApiOperation({
    summary: 'Listar cotejos de compra',
    description: `Requiere ${PERMISO_GESTIONAR}. Filtrable por purchaseOrderId/receiptNoteId/purchaseInvoiceId.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query('companyId') companyId: string,
    @Query('purchaseOrderId') purchaseOrderId: string | undefined,
    @Query('receiptNoteId') receiptNoteId: string | undefined,
    @Query('purchaseInvoiceId') purchaseInvoiceId: string | undefined,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const result = await this.cotejosCompraService.listar(
      user,
      { companyId, purchaseOrderId, receiptNoteId, purchaseInvoiceId },
      { page: Number(page), pageSize: Number(pageSize) },
    );
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({
    summary: 'Obtener cotejo de compra por id',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get(':id')
  async obtener(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.cotejosCompraService.obtener(user, id) };
  }

  @ApiOperation({
    summary: 'Ejecutar cotejo (3-way match)',
    description: `Requiere ${PERMISO_GESTIONAR}. Calcula la discrepancia entre lo ordenado, lo recibido y lo facturado; persiste el resultado.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post()
  async ejecutar(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(ejecutarCotejoCompraSchema)) body: EjecutarCotejoCompraInput,
  ) {
    return { data: await this.cotejosCompraService.ejecutar(user, body) };
  }

  @ApiOperation({
    summary: 'Anular cotejo de compra',
    description: `Requiere ${PERMISO_GESTIONAR}. Baja lógica — para corregir un cotejo ejecutado con documentos incorrectos.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/anular')
  async anular(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.cotejosCompraService.anular(user, id) };
  }
}
