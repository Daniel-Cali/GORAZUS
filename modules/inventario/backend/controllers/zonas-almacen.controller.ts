import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { ZonasAlmacenService } from '../services/zonas-almacen.service';
import {
  crearZonaAlmacenSchema,
  actualizarZonaAlmacenSchema,
  type CrearZonaAlmacenInput,
  type ActualizarZonaAlmacenInput,
} from '../validators/zonas-almacen.schema';

const PERMISO_GESTIONAR = 'inventario.gestionar_almacenes';

/** `/inventario/zonas` — CRUD de zonas de almacén (docs/architecture/19-modulo-inventory.md §2). */
@ApiTags('inventario')
@ApiBearerAuth()
@Controller('inventario/zonas')
export class ZonasAlmacenController {
  constructor(private readonly zonasAlmacenService: ZonasAlmacenService) {}

  @ApiOperation({
    summary: 'Listar zonas',
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
    const result = await this.zonasAlmacenService.listar(user, warehouseId, {
      page: Number(page),
      pageSize: Number(pageSize),
    });
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({ summary: 'Obtener zona por id', description: `Requiere ${PERMISO_GESTIONAR}.` })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get(':id')
  async obtener(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const zona = await this.zonasAlmacenService.obtener(user, id);
    return { data: zona };
  }

  @ApiOperation({
    summary: 'Crear zona',
    description: `Requiere ${PERMISO_GESTIONAR}. warehouseId debe ser un almacén ya existente.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearZonaAlmacenSchema)) body: CrearZonaAlmacenInput,
  ) {
    const zona = await this.zonasAlmacenService.crear(user, body);
    return { data: zona };
  }

  @ApiOperation({
    summary: 'Actualizar zona',
    description: `Requiere ${PERMISO_GESTIONAR}. PATCH parcial — nunca reasigna el almacén.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Patch(':id')
  async actualizar(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(actualizarZonaAlmacenSchema)) body: ActualizarZonaAlmacenInput,
  ) {
    const zona = await this.zonasAlmacenService.actualizar(user, id, body);
    return { data: zona };
  }
}
