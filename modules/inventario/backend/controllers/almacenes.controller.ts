import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { AlmacenesService } from '../services/almacenes.service';
import {
  crearAlmacenSchema,
  actualizarAlmacenSchema,
  type CrearAlmacenInput,
  type ActualizarAlmacenInput,
} from '../validators/almacenes.schema';

const PERMISO_GESTIONAR = 'inventario.gestionar_almacenes';

/** `/inventario/almacenes` — CRUD de almacenes (docs/architecture/19-modulo-inventory.md §1). */
@ApiTags('inventario')
@ApiBearerAuth()
@Controller('inventario/almacenes')
export class AlmacenesController {
  constructor(private readonly almacenesService: AlmacenesService) {}

  @ApiOperation({
    summary: 'Listar almacenes',
    description: `Requiere ${PERMISO_GESTIONAR}. Filtrable por branchId.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query('branchId') branchId: string | undefined,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const result = await this.almacenesService.listar(user, branchId, {
      page: Number(page),
      pageSize: Number(pageSize),
    });
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({
    summary: 'Obtener almacén por id',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get(':id')
  async obtener(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const almacen = await this.almacenesService.obtener(user, id);
    return { data: almacen };
  }

  @ApiOperation({
    summary: 'Crear almacén',
    description: `Requiere ${PERMISO_GESTIONAR}. companyId/branchId deben ser una empresa/sucursal ya existentes.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearAlmacenSchema)) body: CrearAlmacenInput,
  ) {
    const almacen = await this.almacenesService.crear(user, body);
    return { data: almacen };
  }

  @ApiOperation({
    summary: 'Actualizar almacén',
    description: `Requiere ${PERMISO_GESTIONAR}. PATCH parcial — nunca reasigna empresa/sucursal.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Patch(':id')
  async actualizar(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(actualizarAlmacenSchema)) body: ActualizarAlmacenInput,
  ) {
    const almacen = await this.almacenesService.actualizar(user, id, body);
    return { data: almacen };
  }
}
