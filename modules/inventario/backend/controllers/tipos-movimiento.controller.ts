import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { TiposMovimientoService } from '../services/tipos-movimiento.service';
import {
  crearTipoMovimientoSchema,
  actualizarTipoMovimientoSchema,
  type CrearTipoMovimientoInput,
  type ActualizarTipoMovimientoInput,
} from '../validators/tipos-movimiento.schema';

const PERMISO_GESTIONAR = 'inventario.gestionar_stock';

/** `/inventario/tipos-movimiento` — catálogo de tipos de movimiento (`INVENTORY_ARCHITECTURE.md §6`). */
@ApiTags('inventario')
@ApiBearerAuth()
@Controller('inventario/tipos-movimiento')
export class TiposMovimientoController {
  constructor(private readonly tiposMovimientoService: TiposMovimientoService) {}

  @ApiOperation({
    summary: 'Listar tipos de movimiento',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const result = await this.tiposMovimientoService.listar(user, {
      page: Number(page),
      pageSize: Number(pageSize),
    });
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({
    summary: 'Obtener tipo de movimiento por id',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get(':id')
  async obtener(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const tipo = await this.tiposMovimientoService.obtener(user, id);
    return { data: tipo };
  }

  @ApiOperation({
    summary: 'Crear tipo de movimiento',
    description: `Requiere ${PERMISO_GESTIONAR}. code único por tenant.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearTipoMovimientoSchema)) body: CrearTipoMovimientoInput,
  ) {
    const tipo = await this.tiposMovimientoService.crear(user, body);
    return { data: tipo };
  }

  @ApiOperation({
    summary: 'Actualizar tipo de movimiento',
    description: `Requiere ${PERMISO_GESTIONAR}. No permite cambiar direction si el tipo ya tiene movimientos registrados.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Patch(':id')
  async actualizar(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(actualizarTipoMovimientoSchema))
    body: ActualizarTipoMovimientoInput,
  ) {
    const tipo = await this.tiposMovimientoService.actualizar(user, id, body);
    return { data: tipo };
  }
}
