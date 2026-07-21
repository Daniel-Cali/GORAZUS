import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { UsuariosAdminService } from '../services/usuarios-admin.service';
import {
  crearUsuarioSchema,
  asignarRolSchema,
  type CrearUsuarioInput,
  type AsignarRolInput,
} from '../validators/usuarios.schema';

/** `/seguridad/usuarios` — administración de usuarios (alta/baja/roles), no login (eso es `auth`). Docs/architecture/15-modulo-security.md §1. */
@ApiTags('seguridad')
@ApiBearerAuth()
@Controller('seguridad/usuarios')
export class UsuariosController {
  constructor(private readonly usuariosAdminService: UsuariosAdminService) {}

  @ApiOperation({
    summary: 'Listar usuarios',
    description: 'Requiere seguridad.gestionar_usuarios.',
  })
  @RequirePermission('seguridad.gestionar_usuarios')
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const result = await this.usuariosAdminService.listar(user, {
      page: Number(page),
      pageSize: Number(pageSize),
    });
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({
    summary: 'Crear usuario',
    description:
      'Alta con contraseña temporal — sin flujo de invitación por email todavía (Fase 2). Requiere seguridad.gestionar_usuarios.',
  })
  @RequirePermission('seguridad.gestionar_usuarios')
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearUsuarioSchema)) body: CrearUsuarioInput,
  ) {
    const { usuario, passwordTemporal } = await this.usuariosAdminService.crear(
      user,
      body.email,
      body.fullName,
    );
    return { data: { usuario, passwordTemporal } };
  }

  @ApiOperation({
    summary: 'Desactivar usuario',
    description:
      'Baja lógica (is_active=false) — no revoca sesiones/API keys todavía (Fase 2). Requiere seguridad.gestionar_usuarios.',
  })
  @RequirePermission('seguridad.gestionar_usuarios')
  @Post(':id/desactivar')
  async desactivar(@CurrentUser() user: UserContext, @Param('id') userId: string) {
    const usuario = await this.usuariosAdminService.desactivar(user, userId);
    return { data: usuario };
  }

  @ApiOperation({
    summary: 'Asignar rol a usuario',
    description: 'Requiere seguridad.gestionar_usuarios.',
  })
  @RequirePermission('seguridad.gestionar_usuarios')
  @Post(':id/roles')
  async asignarRol(
    @CurrentUser() user: UserContext,
    @Param('id') userId: string,
    @Body(new ZodValidationPipe(asignarRolSchema)) body: AsignarRolInput,
  ) {
    await this.usuariosAdminService.asignarRol(user, userId, body.rolId);
    return { data: { userId, rolId: body.rolId } };
  }
}
