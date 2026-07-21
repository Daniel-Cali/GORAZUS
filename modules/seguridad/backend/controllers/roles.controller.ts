import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { RolesService } from '../services/roles.service';
import {
  crearRolSchema,
  asignarPermisoSchema,
  type CrearRolInput,
  type AsignarPermisoInput,
} from '../validators/roles.schema';

/** `/seguridad/roles` — CRUD de roles + asignación de permisos (docs/architecture/15-modulo-security.md §2). */
@ApiTags('seguridad')
@ApiBearerAuth()
@Controller('seguridad/roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @ApiOperation({ summary: 'Listar roles', description: 'Requiere seguridad.gestionar_roles.' })
  @RequirePermission('seguridad.gestionar_roles')
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const result = await this.rolesService.listar(user, {
      page: Number(page),
      pageSize: Number(pageSize),
    });
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({ summary: 'Crear rol', description: 'Requiere seguridad.gestionar_roles.' })
  @RequirePermission('seguridad.gestionar_roles')
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearRolSchema)) body: CrearRolInput,
  ) {
    const rol = await this.rolesService.crear(user, body.name);
    return { data: rol };
  }

  @ApiOperation({
    summary: 'Asignar permiso a rol',
    description: 'Requiere seguridad.gestionar_roles.',
  })
  @RequirePermission('seguridad.gestionar_roles')
  @Post(':id/permisos')
  async asignarPermiso(
    @CurrentUser() user: UserContext,
    @Param('id') rolId: string,
    @Body(new ZodValidationPipe(asignarPermisoSchema)) body: AsignarPermisoInput,
  ) {
    await this.rolesService.asignarPermiso(user, rolId, body.permissionCode);
    return { data: { rolId, permissionCode: body.permissionCode } };
  }
}
