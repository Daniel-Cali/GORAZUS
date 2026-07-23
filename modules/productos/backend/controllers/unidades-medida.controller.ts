import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { UnidadesMedidaService } from '../services/unidades-medida.service';
import {
  crearUnidadMedidaSchema,
  actualizarUnidadMedidaSchema,
  type CrearUnidadMedidaInput,
  type ActualizarUnidadMedidaInput,
} from '../validators/unidades-medida.schema';

const PERMISO_GESTIONAR = 'productos.gestionar_productos';

/** `/productos/unidades-medida` — CRUD de unidades de medida (docs/architecture/18-modulo-products.md §1). */
@ApiTags('productos')
@ApiBearerAuth()
@Controller('productos/unidades-medida')
export class UnidadesMedidaController {
  constructor(private readonly unidadesMedidaService: UnidadesMedidaService) {}

  @ApiOperation({
    summary: 'Listar unidades de medida',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const result = await this.unidadesMedidaService.listar(user, {
      page: Number(page),
      pageSize: Number(pageSize),
    });
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({
    summary: 'Obtener unidad de medida por id',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get(':id')
  async obtener(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const unidad = await this.unidadesMedidaService.obtener(user, id);
    return { data: unidad };
  }

  @ApiOperation({
    summary: 'Crear unidad de medida',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearUnidadMedidaSchema)) body: CrearUnidadMedidaInput,
  ) {
    const unidad = await this.unidadesMedidaService.crear(user, body);
    return { data: unidad };
  }

  @ApiOperation({
    summary: 'Actualizar unidad de medida',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Patch(':id')
  async actualizar(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(actualizarUnidadMedidaSchema)) body: ActualizarUnidadMedidaInput,
  ) {
    const unidad = await this.unidadesMedidaService.actualizar(user, id, body);
    return { data: unidad };
  }
}
