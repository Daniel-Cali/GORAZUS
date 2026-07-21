import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { UsuariosAdminService } from '../services/usuarios-admin.service';
import { AuditoriaService } from '../services/auditoria.service';
import {
  crearUsuarioSchema,
  asignarRolSchema,
  actualizarPerfilSchema,
  cambiarPasswordSchema,
  type CrearUsuarioInput,
  type AsignarRolInput,
  type ActualizarPerfilInput,
  type CambiarPasswordInput,
} from '../validators/usuarios.schema';

/** `/seguridad/usuarios` — administración de usuarios (alta/baja/roles) + autogestión del propio perfil, no login (eso es `auth`). Docs/architecture/15-modulo-security.md §1. */
@ApiTags('seguridad')
@ApiBearerAuth()
@Controller('seguridad/usuarios')
export class UsuariosController {
  constructor(
    private readonly usuariosAdminService: UsuariosAdminService,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  @ApiOperation({ summary: 'Ver mi propio perfil' })
  @Get('me')
  async obtenerMiPerfil(@CurrentUser() user: UserContext) {
    const usuario = await this.usuariosAdminService.obtenerPerfil(user, user.userId);
    return { data: usuario };
  }

  @ApiOperation({
    summary: 'Editar mi propio perfil',
    description: 'Solo el nombre — email y roles son administrativos.',
  })
  @Patch('me')
  async actualizarMiPerfil(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(actualizarPerfilSchema)) body: ActualizarPerfilInput,
  ) {
    const usuario = await this.usuariosAdminService.actualizarPerfil(
      user,
      user.userId,
      body.fullName,
    );
    return { data: usuario };
  }

  @ApiOperation({
    summary: 'Cambiar mi propia contraseña',
    description:
      'Exige la contraseña actual — distinto del alta administrativa con contraseña temporal.',
  })
  @Patch('me/password')
  @HttpCode(HttpStatus.OK)
  async cambiarMiPassword(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(cambiarPasswordSchema)) body: CambiarPasswordInput,
  ) {
    await this.usuariosAdminService.cambiarPassword(
      user,
      user.userId,
      body.currentPassword,
      body.newPassword,
    );
    return { data: { message: 'Contraseña actualizada correctamente.' } };
  }

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
    summary: 'Activar usuario',
    description: 'Reactivación — simétrico a desactivar. Requiere seguridad.gestionar_usuarios.',
  })
  @RequirePermission('seguridad.gestionar_usuarios')
  @Post(':id/activar')
  async activar(@CurrentUser() user: UserContext, @Param('id') userId: string) {
    const usuario = await this.usuariosAdminService.activar(user, userId);
    return { data: usuario };
  }

  @ApiOperation({
    summary: 'Historial de cambios de un usuario',
    description:
      'Reusa core.audit_logs filtrado por este usuario. Requiere seguridad.gestionar_usuarios.',
  })
  @RequirePermission('seguridad.gestionar_usuarios')
  @Get(':id/historial')
  async historial(
    @CurrentUser() user: UserContext,
    @Param('id') userId: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const result = await this.auditoriaService.historialDeFila(user, 'users', userId, {
      page: Number(page),
      pageSize: Number(pageSize),
    });
    return { data: result.data, meta: result.meta };
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
