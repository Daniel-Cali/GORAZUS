import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { UsuariosAdminService } from '../services/usuarios-admin.service';
import { AuditoriaService } from '../services/auditoria.service';
import { EmpresasUsuarioService } from '../services/empresas-usuario.service';
import { PreferenciasUsuarioService } from '../services/preferencias-usuario.service';
import { AvatarUsuarioService } from '../services/avatar-usuario.service';
import {
  crearUsuarioSchema,
  asignarRolSchema,
  actualizarPerfilSchema,
  cambiarPasswordSchema,
  editarUsuarioSchema,
  cambiarEstadoSchema,
  asignarEmpresaSchema,
  actualizarPreferenciasSchema,
  type CrearUsuarioInput,
  type AsignarRolInput,
  type ActualizarPerfilInput,
  type CambiarPasswordInput,
  type EditarUsuarioInput,
  type CambiarEstadoInput,
  type AsignarEmpresaInput,
  type ActualizarPreferenciasInput,
} from '../validators/usuarios.schema';

const PERMISO_GESTIONAR = 'seguridad.gestionar_usuarios';

/** `/seguridad/usuarios` — administración de usuarios (alta/baja/roles/multiempresa) + autogestión del propio perfil, no login (eso es `auth`). Docs/architecture/15-modulo-security.md §1. */
@ApiTags('seguridad')
@ApiBearerAuth()
@Controller('seguridad/usuarios')
export class UsuariosController {
  constructor(
    private readonly usuariosAdminService: UsuariosAdminService,
    private readonly auditoriaService: AuditoriaService,
    private readonly empresasUsuarioService: EmpresasUsuarioService,
    private readonly preferenciasUsuarioService: PreferenciasUsuarioService,
    private readonly avatarUsuarioService: AvatarUsuarioService,
  ) {}

  @ApiOperation({ summary: 'Ver mi propio perfil' })
  @Get('me')
  async obtenerMiPerfil(@CurrentUser() user: UserContext) {
    const usuario = await this.usuariosAdminService.obtenerPerfil(user, user.userId);
    return { data: usuario };
  }

  @ApiOperation({
    summary: 'Editar mi propio perfil',
    description: 'Nombre y (opcionalmente) correo — roles/estado son administrativos.',
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
      body.email,
    );
    return { data: usuario };
  }

  @ApiOperation({
    summary: 'Cambiar mi propia contraseña',
    description:
      'Exige la contraseña actual — distinto del reseteo administrativo con contraseña temporal.',
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

  @ApiOperation({ summary: 'Ver mis preferencias' })
  @Get('me/preferencias')
  async obtenerMisPreferencias(@CurrentUser() user: UserContext) {
    const preferencias = await this.preferenciasUsuarioService.obtener(user, user.userId);
    return { data: preferencias };
  }

  @ApiOperation({
    summary: 'Actualizar mis preferencias',
    description:
      'PATCH parcial — tema/formatos/página inicial/registros por página/notificaciones (metadata), idioma/zona horaria (columnas reales).',
  })
  @Patch('me/preferencias')
  async actualizarMisPreferencias(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(actualizarPreferenciasSchema)) body: ActualizarPreferenciasInput,
  ) {
    const preferencias = await this.preferenciasUsuarioService.actualizar(user, user.userId, body);
    return { data: preferencias };
  }

  @ApiOperation({
    summary: 'Subir mi foto de perfil',
    description: 'Multipart, campo "file". Máximo 5MB. Reemplaza la foto anterior si había una.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'Foto subida — devuelve una URL firmada de corta duración.',
  })
  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async subirMiAvatar(
    @CurrentUser() user: UserContext,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) throw new BadRequestException('Falta el archivo (campo "file").');
    const resultado = await this.avatarUsuarioService.subir(user, user.userId, file);
    return { data: resultado };
  }

  @ApiOperation({ summary: 'Borrar mi foto de perfil' })
  @ApiResponse({ status: 204, description: 'Borrada (idempotente — no falla si no había foto).' })
  @Delete('me/avatar')
  @HttpCode(HttpStatus.NO_CONTENT)
  async eliminarMiAvatar(@CurrentUser() user: UserContext): Promise<void> {
    await this.avatarUsuarioService.eliminar(user, user.userId);
  }

  @ApiOperation({
    summary: 'Listar usuarios',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
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
    summary: 'Ver un usuario por id',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get(':id')
  async obtener(@CurrentUser() user: UserContext, @Param('id') userId: string) {
    const usuario = await this.usuariosAdminService.obtenerPerfil(user, userId);
    return { data: usuario };
  }

  @ApiOperation({
    summary: 'Crear usuario',
    description: `Alta con contraseña temporal — sin flujo de invitación por email todavía (Fase 2). Requiere ${PERMISO_GESTIONAR}.`,
  })
  @ApiResponse({ status: 201, description: 'Usuario creado (incluye la contraseña temporal).' })
  @ApiResponse({ status: 409, description: 'Ya existe un usuario con ese correo.' })
  @RequirePermission(PERMISO_GESTIONAR)
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
    summary: 'Editar un usuario',
    description: `Edición administrativa — nombre y/o correo, PATCH parcial. Requiere ${PERMISO_GESTIONAR}.`,
  })
  @ApiResponse({ status: 409, description: 'El correo nuevo ya está en uso por otro usuario.' })
  @RequirePermission(PERMISO_GESTIONAR)
  @Put(':id')
  async editar(
    @CurrentUser() user: UserContext,
    @Param('id') userId: string,
    @Body(new ZodValidationPipe(editarUsuarioSchema)) body: EditarUsuarioInput,
  ) {
    const usuario = await this.usuariosAdminService.editar(user, userId, body);
    return { data: usuario };
  }

  @ApiOperation({
    summary: 'Cambiar el estado de un usuario',
    description: `active/inactive/suspended/blocked/pending_activation — "deleted" es \`DELETE :id\`, no un valor válido acá. Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Patch(':id/status')
  async cambiarEstado(
    @CurrentUser() user: UserContext,
    @Param('id') userId: string,
    @Body(new ZodValidationPipe(cambiarEstadoSchema)) body: CambiarEstadoInput,
  ) {
    const usuario = await this.usuariosAdminService.cambiarEstado(user, userId, body.status);
    return { data: usuario };
  }

  @ApiOperation({
    summary: 'Resetear la contraseña de un usuario',
    description: `Genera y devuelve una contraseña temporal — a diferencia de \`PATCH me/password\`, no exige la contraseña anterior. Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Patch(':id/password')
  async resetearPassword(@CurrentUser() user: UserContext, @Param('id') userId: string) {
    const { usuario, passwordTemporal } = await this.usuariosAdminService.resetearPassword(
      user,
      userId,
    );
    return { data: { usuario, passwordTemporal } };
  }

  @ApiOperation({
    summary: 'Eliminar usuario (soft delete)',
    description: `Baja lógica (\`deleted_at\`) — reversible con \`POST :id/restore\`. Requiere ${PERMISO_GESTIONAR}.`,
  })
  @ApiResponse({ status: 204, description: 'Usuario eliminado lógicamente.' })
  @RequirePermission(PERMISO_GESTIONAR)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async eliminar(@CurrentUser() user: UserContext, @Param('id') userId: string): Promise<void> {
    await this.usuariosAdminService.eliminar(user, userId);
  }

  @ApiOperation({
    summary: 'Restaurar usuario eliminado',
    description: `Revierte \`DELETE :id\`. Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/restore')
  async restaurar(@CurrentUser() user: UserContext, @Param('id') userId: string) {
    const usuario = await this.usuariosAdminService.restaurar(user, userId);
    return { data: usuario };
  }

  @ApiOperation({
    summary: 'Desactivar usuario',
    description: `Atajo de \`PATCH :id/status {status:"inactive"}\`. Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/desactivar')
  async desactivar(@CurrentUser() user: UserContext, @Param('id') userId: string) {
    const usuario = await this.usuariosAdminService.desactivar(user, userId);
    return { data: usuario };
  }

  @ApiOperation({
    summary: 'Activar usuario',
    description: `Atajo de \`PATCH :id/status {status:"active"}\`. Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/activar')
  async activar(@CurrentUser() user: UserContext, @Param('id') userId: string) {
    const usuario = await this.usuariosAdminService.activar(user, userId);
    return { data: usuario };
  }

  @ApiOperation({
    summary: 'Historial de cambios de un usuario',
    description: `Reusa core.audit_logs filtrado por este usuario. Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
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
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/roles')
  async asignarRol(
    @CurrentUser() user: UserContext,
    @Param('id') userId: string,
    @Body(new ZodValidationPipe(asignarRolSchema)) body: AsignarRolInput,
  ) {
    await this.usuariosAdminService.asignarRol(user, userId, body.rolId);
    return { data: { userId, rolId: body.rolId } };
  }

  @ApiOperation({
    summary: 'Revocar rol de usuario',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Delete(':id/roles/:rolId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revocarRol(
    @CurrentUser() user: UserContext,
    @Param('id') userId: string,
    @Param('rolId') rolId: string,
  ): Promise<void> {
    await this.usuariosAdminService.revocarRol(user, userId, rolId);
  }

  @ApiOperation({
    summary: 'Listar empresas asignadas a un usuario',
    description: `Multiempresa (\`core.user_companies\`) — distinto de la empresa/sucursal ACTIVA de la sesión (eso lo fija \`auth\` al emitir el token). Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get(':id/empresas')
  async listarEmpresas(@CurrentUser() user: UserContext, @Param('id') userId: string) {
    const empresas = await this.empresasUsuarioService.listar(user, userId);
    return { data: empresas };
  }

  @ApiOperation({
    summary: 'Asignar una empresa a un usuario',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @ApiResponse({ status: 409, description: 'La empresa ya estaba asignada, o está inactiva.' })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/empresas')
  async asignarEmpresa(
    @CurrentUser() user: UserContext,
    @Param('id') userId: string,
    @Body(new ZodValidationPipe(asignarEmpresaSchema)) body: AsignarEmpresaInput,
  ) {
    const asignacion = await this.empresasUsuarioService.asignar(
      user,
      userId,
      body.companyId,
      body.isDefault,
    );
    return { data: asignacion };
  }

  @ApiOperation({
    summary: 'Quitar una empresa de un usuario',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Delete(':id/empresas/:companyId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async desasignarEmpresa(
    @CurrentUser() user: UserContext,
    @Param('id') userId: string,
    @Param('companyId') companyId: string,
  ): Promise<void> {
    await this.empresasUsuarioService.desasignar(user, userId, companyId);
  }
}
