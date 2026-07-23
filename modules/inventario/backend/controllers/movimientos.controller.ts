import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { MovimientosService } from '../services/movimientos.service';
import {
  registrarMovimientoSchema,
  type RegistrarMovimientoInput,
} from '../validators/movimientos.schema';

const PERMISO_GESTIONAR = 'inventario.gestionar_stock';

/**
 * `/inventario/movimientos` — motor de movimientos (`INVENTORY_ARCHITECTURE.md §6`).
 * Único endpoint que modifica `inventory.stock`; cualquier módulo futuro
 * (Compras, Ventas, Producción) que hoy no existe llamará a este mismo
 * motor vía `source_module`/`source_entity_id`, no directo por HTTP.
 */
@ApiTags('inventario')
@ApiBearerAuth()
@Controller('inventario/movimientos')
export class MovimientosController {
  constructor(private readonly movimientosService: MovimientosService) {}

  @ApiOperation({
    summary: 'Registrar movimiento de stock',
    description: `Requiere ${PERMISO_GESTIONAR}. Actualiza inventory.stock atómicamente junto con el movimiento.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post()
  async registrar(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(registrarMovimientoSchema)) body: RegistrarMovimientoInput,
  ) {
    const movimiento = await this.movimientosService.registrar(user, body);
    return { data: movimiento };
  }

  @ApiOperation({
    summary: 'Listar movimientos',
    description: `Requiere ${PERMISO_GESTIONAR}. Filtrable por productId/warehouseId.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query('productId') productId: string | undefined,
    @Query('warehouseId') warehouseId: string | undefined,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const result = await this.movimientosService.listar(
      user,
      {
        ...(productId && { product_id: productId }),
        ...(warehouseId && { warehouse_id: warehouseId }),
      },
      { page: Number(page), pageSize: Number(pageSize) },
    );
    return { data: result.data, meta: result.meta };
  }
}
