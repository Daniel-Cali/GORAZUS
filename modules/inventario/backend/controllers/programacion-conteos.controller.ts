import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { ProgramacionConteosService } from '../services/programacion-conteos.service';
import {
  crearProgramaConteoSchema,
  actualizarProgramaConteoSchema,
  type CrearProgramaConteoInput,
  type ActualizarProgramaConteoInput,
} from '../validators/programacion-conteos.schema';

const PERMISO_GESTIONAR = 'inventario.gestionar_stock';

/** `/inventario/programacion-conteos` — calendario de conteo cíclico por zona. */
@ApiTags('inventario')
@ApiBearerAuth()
@Controller('inventario/programacion-conteos')
export class ProgramacionConteosController {
  constructor(private readonly programacionConteosService: ProgramacionConteosService) {}

  @ApiOperation({
    summary: 'Crear programación de conteo cíclico',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearProgramaConteoSchema)) body: CrearProgramaConteoInput,
  ) {
    const programa = await this.programacionConteosService.crear(user, body);
    return { data: programa };
  }

  @ApiOperation({
    summary: 'Obtener programación por id',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get(':id')
  async obtener(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const programa = await this.programacionConteosService.obtener(user, id);
    return { data: programa };
  }

  @ApiOperation({ summary: 'Listar programaciones', description: `Requiere ${PERMISO_GESTIONAR}.` })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const result = await this.programacionConteosService.listar(user, {
      page: Number(page),
      pageSize: Number(pageSize),
    });
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({
    summary: 'Actualizar programación',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Patch(':id')
  async actualizar(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(actualizarProgramaConteoSchema))
    body: ActualizarProgramaConteoInput,
  ) {
    const programa = await this.programacionConteosService.actualizar(user, id, body);
    return { data: programa };
  }

  @ApiOperation({
    summary: 'Generar el conteo físico programado',
    description: `Requiere ${PERMISO_GESTIONAR}. Crea un physical_count real filtrado a la zona y avanza next_run_date.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/generar')
  async generar(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const resultado = await this.programacionConteosService.generar(user, id);
    return { data: resultado.conteo, programa: resultado.programa };
  }
}
