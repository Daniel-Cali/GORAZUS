import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { TransferenciasService } from '../services/transferencias.service';
import {
  crearTransferenciaSchema,
  type CrearTransferenciaInput,
} from '../validators/transferencias.schema';

const PERMISO_GESTIONAR = 'inventario.gestionar_stock';

/**
 * `/inventario/transferencias` — transferencias entre almacenes
 * (`INVENTORY_ARCHITECTURE.md §6`). `draft → in_transit → received`,
 * o `draft → cancelled`.
 */
@ApiTags('inventario')
@ApiBearerAuth()
@Controller('inventario/transferencias')
export class TransferenciasController {
  constructor(private readonly transferenciasService: TransferenciasService) {}

  @ApiOperation({
    summary: 'Crear transferencia (borrador)',
    description: `Requiere ${PERMISO_GESTIONAR}. No genera movimientos todavía — eso ocurre en /iniciar.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearTransferenciaSchema)) body: CrearTransferenciaInput,
  ) {
    const transferencia = await this.transferenciasService.crear(user, body);
    return { data: transferencia };
  }

  @ApiOperation({
    summary: 'Obtener transferencia por id (con líneas)',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get(':id')
  async obtener(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const transferencia = await this.transferenciasService.obtener(user, id);
    return { data: transferencia };
  }

  @ApiOperation({
    summary: 'Listar transferencias',
    description: `Requiere ${PERMISO_GESTIONAR}. Filtrable por sourceWarehouseId/destinationWarehouseId/status.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query('sourceWarehouseId') sourceWarehouseId: string | undefined,
    @Query('destinationWarehouseId') destinationWarehouseId: string | undefined,
    @Query('status') status: string | undefined,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const result = await this.transferenciasService.listar(
      user,
      {
        ...(sourceWarehouseId && { source_warehouse_id: sourceWarehouseId }),
        ...(destinationWarehouseId && { destination_warehouse_id: destinationWarehouseId }),
        ...(status && { status }),
      },
      { page: Number(page), pageSize: Number(pageSize) },
    );
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({
    summary: 'Iniciar transferencia (draft → in_transit)',
    description: `Requiere ${PERMISO_GESTIONAR}. Genera un movimiento transfer_out por línea, atómico.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/iniciar')
  async iniciar(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const transferencia = await this.transferenciasService.iniciar(user, id);
    return { data: transferencia };
  }

  @ApiOperation({
    summary: 'Recibir transferencia (in_transit → received)',
    description: `Requiere ${PERMISO_GESTIONAR}. Genera un movimiento transfer_in por línea, atómico.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/recibir')
  async recibir(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const transferencia = await this.transferenciasService.recibir(user, id);
    return { data: transferencia };
  }

  @ApiOperation({
    summary: 'Cancelar transferencia (draft → cancelled)',
    description: `Requiere ${PERMISO_GESTIONAR}. Solo permitido desde draft — sin movimientos que revertir.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/cancelar')
  async cancelar(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const transferencia = await this.transferenciasService.cancelar(user, id);
    return { data: transferencia };
  }
}
