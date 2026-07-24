import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { AjustesService } from '../services/ajustes.service';
import { crearAjusteSchema, type CrearAjusteInput } from '../validators/ajustes.schema';

const PERMISO_GESTIONAR = 'inventario.gestionar_stock';

/**
 * `/inventario/ajustes` — ajustes de inventario
 * (`INVENTORY_ADJUSTMENTS_REPORT.md §2`). `crear` deja el ajuste en
 * `draft` (sin tocar `stock` todavía); `confirmar` genera los
 * movimientos reales.
 */
@ApiTags('inventario')
@ApiBearerAuth()
@Controller('inventario/ajustes')
export class AjustesController {
  constructor(private readonly ajustesService: AjustesService) {}

  @ApiOperation({
    summary: 'Crear ajuste (borrador)',
    description: `Requiere ${PERMISO_GESTIONAR}. previousQuantity se resuelve del stock real, no se pide.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearAjusteSchema)) body: CrearAjusteInput,
  ) {
    const ajuste = await this.ajustesService.crear(user, body);
    return { data: ajuste };
  }

  @ApiOperation({
    summary: 'Obtener ajuste por id (con líneas)',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get(':id')
  async obtener(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const ajuste = await this.ajustesService.obtener(user, id);
    return { data: ajuste };
  }

  @ApiOperation({
    summary: 'Listar ajustes',
    description: `Requiere ${PERMISO_GESTIONAR}. Filtrable por warehouseId/status.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query('warehouseId') warehouseId: string | undefined,
    @Query('status') status: string | undefined,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const result = await this.ajustesService.listar(
      user,
      {
        ...(warehouseId && { warehouse_id: warehouseId }),
        ...(status && { status }),
      },
      { page: Number(page), pageSize: Number(pageSize) },
    );
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({
    summary: 'Confirmar ajuste (draft → confirmed)',
    description: `Requiere ${PERMISO_GESTIONAR}. Genera un movimiento por línea con diferencia real, atómico.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/confirmar')
  async confirmar(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const ajuste = await this.ajustesService.confirmar(user, id);
    return { data: ajuste };
  }
}
