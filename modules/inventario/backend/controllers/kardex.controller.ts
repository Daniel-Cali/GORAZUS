import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { KardexService } from '../services/kardex.service';

const PERMISO_GESTIONAR = 'inventario.gestionar_stock';

/** `/inventario/kardex` — saldo corrido por producto+almacén (`inventory.v_kardex`). Solo lectura. */
@ApiTags('inventario')
@ApiBearerAuth()
@Controller('inventario/kardex')
export class KardexController {
  constructor(private readonly kardexService: KardexService) {}

  @ApiOperation({
    summary: 'Consultar kardex de un producto en un almacén',
    description: `Requiere ${PERMISO_GESTIONAR}. desde/hasta en formato ISO 8601, opcionales.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get()
  async consultar(
    @CurrentUser() user: UserContext,
    @Query('productId') productId: string,
    @Query('warehouseId') warehouseId: string,
    @Query('desde') desde: string | undefined,
    @Query('hasta') hasta: string | undefined,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const data = await this.kardexService.consultar(
      user,
      {
        productId,
        warehouseId,
        ...(desde && { desde: new Date(desde) }),
        ...(hasta && { hasta: new Date(hasta) }),
      },
      { page: Number(page), pageSize: Number(pageSize) },
    );
    return { data };
  }
}
