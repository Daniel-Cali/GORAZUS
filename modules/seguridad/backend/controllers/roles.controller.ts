import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { RolesService } from '../services/roles.service';
import {
  crearRolSchema,
  actualizarRolSchema,
  asignarPermisoSchema,
  type CrearRolInput,
  type ActualizarRolInput,
  type AsignarPermisoInput,
} from '../validators/roles.schema';

const PERMISO_GESTIONAR = 'seguridad.gestionar_roles';

/** `/seguridad/roles` — CRUD de roles + asignación de permisos (docs/architecture/15-modulo-security.md §2). */
@ApiTags('seguridad')
@ApiBearerAuth()
@Controller('seguridad/roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @ApiOperation({
    summary: 'Listar roles',
    description: `Requiere ${PERMISO_GESTIONAR}. Filtrable por companyId — sin filtro, devuelve los roles de todo el tenant (todas las empresas).`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query('companyId') companyId: string | undefined,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const result = await this.rolesService.listar(user, companyId, {
      page: Number(page),
      pageSize: Number(pageSize),
    });
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({
    summary: 'Obtener rol por id, con sus permisos asignados',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get(':id')
  async obtener(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const { rol, permissionCodes } = await this.rolesService.obtener(user, id);
    return { data: { ...rol, permissionCodes } };
  }

  @ApiOperation({
    summary: 'Crear rol',
    description: `Requiere ${PERMISO_GESTIONAR}. companyId ausente = empresa activa de la sesión; companyId null explícito = rol de todo el tenant.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearRolSchema)) body: CrearRolInput,
  ) {
    const rol = await this.rolesService.crear(
      user,
      body.name,
      body.companyId,
      body.branchId,
      body.code,
      body.description,
      body.roleType,
    );
    return { data: rol };
  }

  @ApiOperation({
    summary: 'Renombrar rol',
    description: `Requiere ${PERMISO_GESTIONAR}. Un rol de fábrica (isSystemRole) no puede renombrarse.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Patch(':id')
  async actualizar(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(actualizarRolSchema)) body: ActualizarRolInput,
  ) {
    const rol = await this.rolesService.actualizar(user, id, body.name);
    return { data: rol };
  }

  @ApiOperation({
    summary: 'Eliminar rol (baja lógica)',
    description: `Requiere ${PERMISO_GESTIONAR}. Un rol de fábrica (isSystemRole) no puede eliminarse.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Delete(':id')
  async eliminar(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const rol = await this.rolesService.eliminar(user, id);
    return { data: rol };
  }

  @ApiOperation({
    summary: 'Asignar permiso a rol',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/permisos')
  async asignarPermiso(
    @CurrentUser() user: UserContext,
    @Param('id') rolId: string,
    @Body(new ZodValidationPipe(asignarPermisoSchema)) body: AsignarPermisoInput,
  ) {
    await this.rolesService.asignarPermiso(user, rolId, body.permissionCode);
    return { data: { rolId, permissionCode: body.permissionCode } };
  }

  @ApiOperation({
    summary: 'Revocar permiso de rol',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Delete(':id/permisos/:permissionCode')
  async revocarPermiso(
    @CurrentUser() user: UserContext,
    @Param('id') rolId: string,
    @Param('permissionCode') permissionCode: string,
  ) {
    await this.rolesService.revocarPermiso(user, rolId, permissionCode);
    return { data: { rolId, permissionCode } };
  }
}
