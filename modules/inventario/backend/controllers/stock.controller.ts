import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { StockService } from '../services/stock.service';

const PERMISO_GESTIONAR = 'inventario.gestionar_stock';

/** `/inventario/stock` — existencias y disponible (`INVENTORY_ARCHITECTURE.md §2`). Solo lectura: el saldo se modifica exclusivamente vía `/inventario/movimientos`. */
@ApiTags('inventario')
@ApiBearerAuth()
@Controller('inventario/stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @ApiOperation({
    summary: 'Listar stock',
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
    const result = await this.stockService.listar(
      user,
      {
        ...(productId && { product_id: productId }),
        ...(warehouseId && { warehouse_id: warehouseId }),
      },
      { page: Number(page), pageSize: Number(pageSize) },
    );
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({
    summary: 'Disponible de un producto en un almacén',
    description: `Requiere ${PERMISO_GESTIONAR}. Disponible = a mano - reservado (inventory.v_available_stock).`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get('disponible')
  async disponible(
    @CurrentUser() user: UserContext,
    @Query('productId') productId: string,
    @Query('warehouseId') warehouseId: string,
    @Query('locationId') locationId: string | undefined,
  ) {
    const data = await this.stockService.obtenerDisponible(user, {
      productId,
      warehouseId,
      locationId,
    });
    return { data };
  }
}
