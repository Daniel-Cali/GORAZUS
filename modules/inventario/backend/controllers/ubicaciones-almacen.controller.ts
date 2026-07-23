import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { UbicacionesAlmacenService } from '../services/ubicaciones-almacen.service';
import {
  crearUbicacionAlmacenSchema,
  actualizarUbicacionAlmacenSchema,
  type CrearUbicacionAlmacenInput,
  type ActualizarUbicacionAlmacenInput,
} from '../validators/ubicaciones-almacen.schema';

const PERMISO_GESTIONAR = 'inventario.gestionar_almacenes';

/** `/inventario/ubicaciones` — CRUD de ubicaciones dentro de una zona (docs/architecture/19-modulo-inventory.md §2). */
@ApiTags('inventario')
@ApiBearerAuth()
@Controller('inventario/ubicaciones')
export class UbicacionesAlmacenController {
  constructor(private readonly ubicacionesAlmacenService: UbicacionesAlmacenService) {}

  @ApiOperation({
    summary: 'Listar ubicaciones',
    description: `Requiere ${PERMISO_GESTIONAR}. Filtrable por zoneId.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query('zoneId') zoneId: string | undefined,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const result = await this.ubicacionesAlmacenService.listar(user, zoneId, {
      page: Number(page),
      pageSize: Number(pageSize),
    });
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({
    summary: 'Obtener ubicación por id',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get(':id')
  async obtener(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const ubicacion = await this.ubicacionesAlmacenService.obtener(user, id);
    return { data: ubicacion };
  }

  @ApiOperation({
    summary: 'Crear ubicación',
    description: `Requiere ${PERMISO_GESTIONAR}. zoneId debe ser una zona ya existente; parentLocationId (opcional) debe pertenecer a la misma zona.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearUbicacionAlmacenSchema)) body: CrearUbicacionAlmacenInput,
  ) {
    const ubicacion = await this.ubicacionesAlmacenService.crear(user, body);
    return { data: ubicacion };
  }

  @ApiOperation({
    summary: 'Actualizar ubicación',
    description: `Requiere ${PERMISO_GESTIONAR}. Solo el código — nunca reasigna zona ni ubicación padre.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Patch(':id')
  async actualizar(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(actualizarUbicacionAlmacenSchema))
    body: ActualizarUbicacionAlmacenInput,
  ) {
    const ubicacion = await this.ubicacionesAlmacenService.actualizar(user, id, body);
    return { data: ubicacion };
  }
}
