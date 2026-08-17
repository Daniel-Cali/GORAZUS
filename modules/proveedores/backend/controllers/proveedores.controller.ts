import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { ProveedoresService } from '../services/proveedores.service';
import {
  crearProveedorSchema,
  actualizarProveedorSchema,
  bloquearProveedorSchema,
  desbloquearProveedorSchema,
  type CrearProveedorInput,
  type ActualizarProveedorInput,
  type BloquearProveedorInput,
  type DesbloquearProveedorInput,
} from '../validators/proveedores.schema';

const PERMISO_GESTIONAR = 'proveedores.gestionar_proveedores';

/** `/proveedores` — CRUD de proveedores + bloqueo/desbloqueo, maestro único (`docs/database/logico/04-suppliers.md`). */
@ApiTags('proveedores')
@ApiBearerAuth()
@Controller('proveedores')
export class ProveedoresController {
  constructor(private readonly proveedoresService: ProveedoresService) {}

  @ApiOperation({
    summary: 'Listar proveedores',
    description: `Requiere ${PERMISO_GESTIONAR}. Filtrable por isBlocked.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query('isBlocked') isBlocked: string | undefined,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const result = await this.proveedoresService.listar(
      user,
      isBlocked === undefined ? undefined : isBlocked === 'true',
      { page: Number(page), pageSize: Number(pageSize) },
    );
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({
    summary: 'Obtener proveedor por id',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get(':id')
  async obtener(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const proveedor = await this.proveedoresService.obtener(user, id);
    return { data: proveedor };
  }

  @ApiOperation({
    summary: 'Crear proveedor',
    description: `Requiere ${PERMISO_GESTIONAR}. companyId/legalName/taxId obligatorios.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearProveedorSchema)) body: CrearProveedorInput,
  ) {
    const proveedor = await this.proveedoresService.crear(user, body);
    return { data: proveedor };
  }

  @ApiOperation({
    summary: 'Actualizar proveedor',
    description: `Requiere ${PERMISO_GESTIONAR}. PATCH parcial — nunca reasigna companyId ni taxId.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Patch(':id')
  async actualizar(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(actualizarProveedorSchema)) body: ActualizarProveedorInput,
  ) {
    const proveedor = await this.proveedoresService.actualizar(user, id, body);
    return { data: proveedor };
  }

  @ApiOperation({
    summary: 'Bloquear proveedor',
    description: `Requiere ${PERMISO_GESTIONAR}. Registra el motivo en el historial de bloqueo.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/bloquear')
  async bloquear(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(bloquearProveedorSchema)) body: BloquearProveedorInput,
  ) {
    const proveedor = await this.proveedoresService.bloquear(user, id, body.reason ?? null);
    return { data: proveedor };
  }

  @ApiOperation({
    summary: 'Desbloquear proveedor',
    description: `Requiere ${PERMISO_GESTIONAR}. Registra el motivo en el historial de bloqueo.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/desbloquear')
  async desbloquear(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(desbloquearProveedorSchema)) body: DesbloquearProveedorInput,
  ) {
    const proveedor = await this.proveedoresService.desbloquear(user, id, body.reason ?? null);
    return { data: proveedor };
  }
}
