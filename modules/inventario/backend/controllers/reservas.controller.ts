import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { ReservasService } from '../services/reservas.service';
import { crearReservaSchema, type CrearReservaInput } from '../validators/reservas.schema';

const PERMISO_GESTIONAR = 'inventario.gestionar_stock';

/** `/inventario/reservas` — reservas de stock (`INVENTORY_ARCHITECTURE.md §2`, "comprometido"). */
@ApiTags('inventario')
@ApiBearerAuth()
@Controller('inventario/reservas')
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  @ApiOperation({
    summary: 'Reservar stock',
    description: `Requiere ${PERMISO_GESTIONAR}. Aumenta quantity_reserved, no descuenta quantity_on_hand.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearReservaSchema)) body: CrearReservaInput,
  ) {
    const reserva = await this.reservasService.crear(user, body);
    return { data: reserva };
  }

  @ApiOperation({
    summary: 'Liberar una reserva',
    description: `Requiere ${PERMISO_GESTIONAR}. Idempotente: rechaza liberar una reserva ya liberada.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/liberar')
  async liberar(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const reserva = await this.reservasService.liberar(user, id);
    return { data: reserva };
  }

  @ApiOperation({
    summary: 'Obtener reserva por id',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get(':id')
  async obtener(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const reserva = await this.reservasService.obtener(user, id);
    return { data: reserva };
  }

  @ApiOperation({
    summary: 'Listar reservas',
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
    const result = await this.reservasService.listar(
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
