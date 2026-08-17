import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { RecepcionesCompraService } from '../services/recepciones-compra.service';
import {
  crearRecepcionCompraSchema,
  actualizarRecepcionCompraSchema,
  type CrearRecepcionCompraInput,
  type ActualizarRecepcionCompraInput,
} from '../validators/recepciones-compra.schema';

const PERMISO_GESTIONAR = 'compras.gestionar_recepciones';

/**
 * `/compras/recepciones` — Compras FASE 5 (Goods Receipt). Sin flujo de
 * estados (el schema real no lo define para este par de tablas) — una
 * recepción es un hecho consumado al crearse; "anular" es baja lógica,
 * no una transición de catálogo. Sin integración con Inventario en esta
 * fase (ver `RecepcionesCompraService`).
 */
@ApiTags('compras')
@ApiBearerAuth()
@Controller('compras/recepciones')
export class RecepcionesCompraController {
  constructor(private readonly recepcionesCompraService: RecepcionesCompraService) {}

  @ApiOperation({
    summary: 'Listar recepciones de compra',
    description: `Requiere ${PERMISO_GESTIONAR}. Filtrable por purchaseOrderId y rango de fecha (fromDate/toDate, sobre created_at). Solo devuelve recepciones activas — el schema no distingue más estados.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query('companyId') companyId: string,
    @Query('purchaseOrderId') purchaseOrderId: string | undefined,
    @Query('fromDate') fromDate: string | undefined,
    @Query('toDate') toDate: string | undefined,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const result = await this.recepcionesCompraService.listar(
      user,
      {
        companyId,
        purchaseOrderId,
        fromDate: fromDate ? new Date(fromDate) : undefined,
        toDate: toDate ? new Date(toDate) : undefined,
      },
      { page: Number(page), pageSize: Number(pageSize) },
    );
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({
    summary: 'Obtener recepción de compra por id (con líneas)',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get(':id')
  async obtener(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.recepcionesCompraService.obtener(user, id) };
  }

  @ApiOperation({
    summary: 'Registrar recepción de compra',
    description: `Requiere ${PERMISO_GESTIONAR}. La orden debe existir y estar "approved"; productos y cantidades se validan contra las líneas de la orden y lo ya recibido.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearRecepcionCompraSchema)) body: CrearRecepcionCompraInput,
  ) {
    return { data: await this.recepcionesCompraService.crear(user, body) };
  }

  @ApiOperation({
    summary: 'Editar recepción de compra (reemplaza líneas)',
    description: `Requiere ${PERMISO_GESTIONAR}. Nunca reasigna la orden de compra.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Put(':id')
  async actualizar(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(actualizarRecepcionCompraSchema))
    body: ActualizarRecepcionCompraInput,
  ) {
    return { data: await this.recepcionesCompraService.actualizar(user, id, body) };
  }

  @ApiOperation({
    summary: 'Anular recepción de compra',
    description: `Requiere ${PERMISO_GESTIONAR}. Baja lógica — libera la cantidad para futuras recepciones contra la misma orden.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/anular')
  async anular(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.recepcionesCompraService.anular(user, id) };
  }
}
