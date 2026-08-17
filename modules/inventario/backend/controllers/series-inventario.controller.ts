import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { SeriesInventarioService } from '../services/series-inventario.service';

const PERMISO_GESTIONAR = 'inventario.gestionar_stock';

/**
 * `/inventario/series` — trazabilidad de series (Inventario Parte 05,
 * Subfase 3). Solo lectura. Se identifica por `serialNumber` (no por id
 * interno) — es el dato que un operador tiene a mano físicamente.
 */
@ApiTags('inventario')
@ApiBearerAuth()
@Controller('inventario/series')
export class SeriesInventarioController {
  constructor(private readonly seriesInventarioService: SeriesInventarioService) {}

  @ApiOperation({
    summary: 'Obtener serie por número',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get(':serialNumber')
  async obtener(@CurrentUser() user: UserContext, @Param('serialNumber') serialNumber: string) {
    const serie = await this.seriesInventarioService.obtenerPorNumero(user, serialNumber);
    return { data: serie };
  }

  @ApiOperation({
    summary: 'Historial de movimientos de una serie ("find serial history")',
    description: `Requiere ${PERMISO_GESTIONAR}. Recepción → Almacén → Transferencia → Venta, vía stock_movements.serial_id.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get(':serialNumber/historial')
  async historial(
    @CurrentUser() user: UserContext,
    @Param('serialNumber') serialNumber: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const result = await this.seriesInventarioService.obtenerHistorial(user, serialNumber, {
      page: Number(page),
      pageSize: Number(pageSize),
    });
    return { data: result.data, meta: result.meta };
  }
}
