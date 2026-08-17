import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { RecepcionesInventarioService } from '../services/recepciones-inventario.service';
import {
  crearRecepcionInventarioSchema,
  type CrearRecepcionInventarioInput,
  confirmarRecepcionInventarioSchema,
  type ConfirmarRecepcionInventarioInput,
} from '../validators/recepciones-inventario.schema';

const PERMISO_GESTIONAR = 'inventario.gestionar_stock';

/**
 * `/inventario/recepciones` — recepción física de inventario (Inventario
 * Parte 05, Subfase 1). `borrador → confirmada`, o `borrador → cancelada`.
 * Estado derivado, no persistido — ver `RecepcionesInventarioService.resolverEstado`.
 */
@ApiTags('inventario')
@ApiBearerAuth()
@Controller('inventario/recepciones')
export class RecepcionesInventarioController {
  constructor(private readonly recepcionesInventarioService: RecepcionesInventarioService) {}

  @ApiOperation({
    summary: 'Crear recepción de inventario (borrador)',
    description: `Requiere ${PERMISO_GESTIONAR}. No genera movimientos todavía — eso ocurre en /confirmar.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearRecepcionInventarioSchema))
    body: CrearRecepcionInventarioInput,
  ) {
    const recepcion = await this.recepcionesInventarioService.crear(user, body);
    return { data: recepcion };
  }

  @ApiOperation({
    summary: 'Obtener recepción de inventario por id (con líneas)',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get(':id')
  async obtener(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const recepcion = await this.recepcionesInventarioService.obtener(user, id);
    return { data: recepcion };
  }

  @ApiOperation({
    summary: 'Listar recepciones de inventario',
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
    const result = await this.recepcionesInventarioService.listar(
      user,
      { ...(warehouseId && { warehouse_id: warehouseId }) },
      { page: Number(page), pageSize: Number(pageSize) },
    );
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({
    summary: 'Confirmar recepción (borrador → confirmada)',
    description: `Requiere ${PERMISO_GESTIONAR}. Genera un movimiento "receipt" por línea (atómico) y aplica costeo. idempotencyKey opcional para reintentos seguros.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/confirmar')
  async confirmar(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(confirmarRecepcionInventarioSchema))
    body: ConfirmarRecepcionInventarioInput,
  ) {
    const recepcion = await this.recepcionesInventarioService.confirmar(
      user,
      id,
      body.idempotencyKey,
    );
    return { data: recepcion };
  }

  @ApiOperation({
    summary: 'Cancelar recepción (borrador → cancelada)',
    description: `Requiere ${PERMISO_GESTIONAR}. Solo permitido desde borrador — sin movimientos que revertir.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/cancelar')
  async cancelar(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const recepcion = await this.recepcionesInventarioService.cancelar(user, id);
    return { data: recepcion };
  }
}
