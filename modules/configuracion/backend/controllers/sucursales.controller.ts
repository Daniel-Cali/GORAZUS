import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { SucursalesService } from '../services/sucursales.service';
import {
  crearSucursalSchema,
  actualizarSucursalSchema,
  type CrearSucursalInput,
  type ActualizarSucursalInput,
} from '../validators/sucursales.schema';

/** `/configuracion/sucursales` — CRUD de sucursales (docs/architecture/14-modulo-core.md). */
@ApiTags('configuracion')
@ApiBearerAuth()
@Controller('configuracion/sucursales')
export class SucursalesController {
  constructor(private readonly sucursalesService: SucursalesService) {}

  @ApiOperation({
    summary: 'Listar sucursales',
    description: 'Requiere configuracion.gestionar_sucursales. Filtrable por companyId.',
  })
  @RequirePermission('configuracion.gestionar_sucursales')
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query('companyId') companyId: string | undefined,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const result = await this.sucursalesService.listar(user, companyId, {
      page: Number(page),
      pageSize: Number(pageSize),
    });
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({
    summary: 'Obtener sucursal por id',
    description: 'Requiere configuracion.gestionar_sucursales.',
  })
  @RequirePermission('configuracion.gestionar_sucursales')
  @Get(':id')
  async obtener(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const sucursal = await this.sucursalesService.obtener(user, id);
    return { data: sucursal };
  }

  @ApiOperation({
    summary: 'Crear sucursal',
    description: 'Requiere configuracion.gestionar_sucursales.',
  })
  @RequirePermission('configuracion.gestionar_sucursales')
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearSucursalSchema)) body: CrearSucursalInput,
  ) {
    const sucursal = await this.sucursalesService.crear(user, body);
    return { data: sucursal };
  }

  @ApiOperation({
    summary: 'Actualizar sucursal',
    description: 'Requiere configuracion.gestionar_sucursales.',
  })
  @RequirePermission('configuracion.gestionar_sucursales')
  @Patch(':id')
  async actualizar(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(actualizarSucursalSchema)) body: ActualizarSucursalInput,
  ) {
    const sucursal = await this.sucursalesService.actualizar(user, id, body);
    return { data: sucursal };
  }
}
