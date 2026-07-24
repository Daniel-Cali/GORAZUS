import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { MotivosAjusteService } from '../services/motivos-ajuste.service';
import {
  crearMotivoAjusteSchema,
  actualizarMotivoAjusteSchema,
  type CrearMotivoAjusteInput,
  type ActualizarMotivoAjusteInput,
} from '../validators/motivos-ajuste.schema';

const PERMISO_GESTIONAR = 'inventario.gestionar_stock';

/** `/inventario/motivos-ajuste` — catálogo configurable de motivos de ajuste. */
@ApiTags('inventario')
@ApiBearerAuth()
@Controller('inventario/motivos-ajuste')
export class MotivosAjusteController {
  constructor(private readonly motivosAjusteService: MotivosAjusteService) {}

  @ApiOperation({
    summary: 'Listar motivos de ajuste',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const result = await this.motivosAjusteService.listar(user, {
      page: Number(page),
      pageSize: Number(pageSize),
    });
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({ summary: 'Obtener motivo por id', description: `Requiere ${PERMISO_GESTIONAR}.` })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get(':id')
  async obtener(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const motivo = await this.motivosAjusteService.obtener(user, id);
    return { data: motivo };
  }

  @ApiOperation({
    summary: 'Crear motivo de ajuste',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearMotivoAjusteSchema)) body: CrearMotivoAjusteInput,
  ) {
    const motivo = await this.motivosAjusteService.crear(user, body);
    return { data: motivo };
  }

  @ApiOperation({
    summary: 'Actualizar motivo de ajuste',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Patch(':id')
  async actualizar(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(actualizarMotivoAjusteSchema)) body: ActualizarMotivoAjusteInput,
  ) {
    const motivo = await this.motivosAjusteService.actualizar(user, id, body);
    return { data: motivo };
  }
}
