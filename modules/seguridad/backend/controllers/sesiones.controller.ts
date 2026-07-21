import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { SesionesService } from '../services/sesiones.service';

/** `/seguridad/sesiones` — gestión administrativa de sesiones activas (docs/architecture/15-modulo-security.md). */
@ApiTags('seguridad')
@ApiBearerAuth()
@Controller('seguridad/sesiones')
export class SesionesController {
  constructor(private readonly sesionesService: SesionesService) {}

  @ApiOperation({
    summary: 'Listar sesiones de un usuario',
    description: 'Requiere seguridad.gestionar_sesiones.',
  })
  @RequirePermission('seguridad.gestionar_sesiones')
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query('userId') userId: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const result = await this.sesionesService.listarPorUsuario(user, userId, {
      page: Number(page),
      pageSize: Number(pageSize),
    });
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({
    summary: 'Revocar una sesión',
    description: 'Requiere seguridad.gestionar_sesiones.',
  })
  @RequirePermission('seguridad.gestionar_sesiones')
  @Post(':id/revocar')
  async revocar(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const sesion = await this.sesionesService.revocar(user, id);
    return { data: sesion };
  }
}
