import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { LotesInventarioService } from '../services/lotes-inventario.service';
import {
  listarLotesQuerySchema,
  type ListarLotesQuery,
  proximosAVencerQuerySchema,
  type ProximosAVencerQuery,
} from '../validators/lotes-inventario.schema';

const PERMISO_GESTIONAR = 'inventario.gestionar_stock';

/**
 * `/inventario/lotes` — trazabilidad de lotes (Inventario Parte 05,
 * Subfase 3). Solo lectura. Rutas estáticas (`proximos-a-vencer`,
 * `vencidos`) declaradas ANTES de `:id` — Nest resuelve por orden de
 * declaración, si `:id` fuera primero capturaría esos segmentos como id.
 * Reutiliza `inventario.gestionar_stock` — el módulo no tiene un permiso de
 * solo-lectura separado (mismo criterio que `StockController`/`KardexController`).
 */
@ApiTags('inventario')
@ApiBearerAuth()
@Controller('inventario/lotes')
export class LotesInventarioController {
  constructor(private readonly lotesInventarioService: LotesInventarioService) {}

  @ApiOperation({
    summary: 'Listar lotes ("find stock by lot")',
    description: `Requiere ${PERMISO_GESTIONAR}. Filtrable por productId/warehouseId.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query(new ZodValidationPipe(listarLotesQuerySchema)) query: ListarLotesQuery,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const result = await this.lotesInventarioService.listarPorProducto(
      user,
      query.productId,
      query.warehouseId,
      { page: Number(page), pageSize: Number(pageSize) },
    );
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({
    summary: 'Lotes próximos a vencer',
    description: `Requiere ${PERMISO_GESTIONAR}. Parámetro "dias" (default 30).`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get('proximos-a-vencer')
  async proximosAVencer(
    @CurrentUser() user: UserContext,
    @Query(new ZodValidationPipe(proximosAVencerQuerySchema)) query: ProximosAVencerQuery,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const result = await this.lotesInventarioService.listarProximosAVencer(user, query.dias, {
      page: Number(page),
      pageSize: Number(pageSize),
    });
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({
    summary: 'Lotes vencidos',
    description: `Requiere ${PERMISO_GESTIONAR}. No implementa destrucción automática — solo consulta.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get('vencidos')
  async vencidos(
    @CurrentUser() user: UserContext,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const result = await this.lotesInventarioService.listarVencidos(user, {
      page: Number(page),
      pageSize: Number(pageSize),
    });
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({
    summary: 'Obtener lote por id',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get(':id')
  async obtener(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const lote = await this.lotesInventarioService.obtenerPorId(user, id);
    return { data: lote };
  }
}
