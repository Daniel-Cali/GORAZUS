import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { SalidasInventarioService } from '../services/salidas-inventario.service';
import {
  crearSalidaInventarioSchema,
  type CrearSalidaInventarioInput,
  confirmarSalidaInventarioSchema,
  type ConfirmarSalidaInventarioInput,
} from '../validators/salidas-inventario.schema';

const PERMISO_GESTIONAR = 'inventario.gestionar_stock';

/**
 * `/inventario/salidas` — salida física de inventario (Inventario Parte 05,
 * Subfase 2). `borrador → confirmada`, o `borrador → cancelada`. Estado
 * derivado, no persistido — mismo patrón que `RecepcionesInventarioController`.
 */
@ApiTags('inventario')
@ApiBearerAuth()
@Controller('inventario/salidas')
export class SalidasInventarioController {
  constructor(private readonly salidasInventarioService: SalidasInventarioService) {}

  @ApiOperation({
    summary: 'Crear salida de inventario (borrador)',
    description: `Requiere ${PERMISO_GESTIONAR}. No genera movimientos todavía — eso ocurre en /confirmar.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearSalidaInventarioSchema)) body: CrearSalidaInventarioInput,
  ) {
    const salida = await this.salidasInventarioService.crear(user, body);
    return { data: salida };
  }

  @ApiOperation({
    summary: 'Obtener salida de inventario por id (con líneas)',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get(':id')
  async obtener(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const salida = await this.salidasInventarioService.obtener(user, id);
    return { data: salida };
  }

  @ApiOperation({
    summary: 'Listar salidas de inventario',
    description: `Requiere ${PERMISO_GESTIONAR}. Filtrable por warehouseId.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query('warehouseId') warehouseId: string | undefined,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const result = await this.salidasInventarioService.listar(
      user,
      { ...(warehouseId && { warehouse_id: warehouseId }) },
      { page: Number(page), pageSize: Number(pageSize) },
    );
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({
    summary: 'Confirmar salida (borrador → confirmada)',
    description: `Requiere ${PERMISO_GESTIONAR}. Genera un movimiento "issue" por línea (atómico) y aplica costeo. idempotencyKey opcional para reintentos seguros.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/confirmar')
  async confirmar(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(confirmarSalidaInventarioSchema))
    body: ConfirmarSalidaInventarioInput,
  ) {
    const salida = await this.salidasInventarioService.confirmar(user, id, body.idempotencyKey);
    return { data: salida };
  }

  @ApiOperation({
    summary: 'Cancelar salida (borrador → cancelada)',
    description: `Requiere ${PERMISO_GESTIONAR}. Solo permitido desde borrador — sin movimientos que revertir.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/cancelar')
  async cancelar(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const salida = await this.salidasInventarioService.cancelar(user, id);
    return { data: salida };
  }
}
