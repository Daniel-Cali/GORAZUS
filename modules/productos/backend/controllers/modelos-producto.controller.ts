import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { ModelosProductoService } from '../services/modelos-producto.service';
import {
  crearModeloProductoSchema,
  actualizarModeloProductoSchema,
  type CrearModeloProductoInput,
  type ActualizarModeloProductoInput,
} from '../validators/modelos-producto.schema';

const PERMISO_GESTIONAR = 'productos.gestionar_productos';

/** `/productos/modelos` — CRUD de modelos, todo modelo pertenece a una marca (docs/architecture/18-modulo-products.md §4). */
@ApiTags('productos')
@ApiBearerAuth()
@Controller('productos/modelos')
export class ModelosProductoController {
  constructor(private readonly modelosProductoService: ModelosProductoService) {}

  @ApiOperation({
    summary: 'Listar modelos',
    description: `Requiere ${PERMISO_GESTIONAR}. Filtrable por brandId.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query('brandId') brandId: string | undefined,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const result = await this.modelosProductoService.listar(user, brandId, {
      page: Number(page),
      pageSize: Number(pageSize),
    });
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({ summary: 'Obtener modelo por id', description: `Requiere ${PERMISO_GESTIONAR}.` })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get(':id')
  async obtener(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const modelo = await this.modelosProductoService.obtener(user, id);
    return { data: modelo };
  }

  @ApiOperation({
    summary: 'Crear modelo',
    description: `Requiere ${PERMISO_GESTIONAR}. brandId debe ser una marca ya existente.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearModeloProductoSchema)) body: CrearModeloProductoInput,
  ) {
    const modelo = await this.modelosProductoService.crear(user, body);
    return { data: modelo };
  }

  @ApiOperation({
    summary: 'Actualizar modelo',
    description: `Requiere ${PERMISO_GESTIONAR}. Nunca reasigna la marca.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Patch(':id')
  async actualizar(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(actualizarModeloProductoSchema))
    body: ActualizarModeloProductoInput,
  ) {
    const modelo = await this.modelosProductoService.actualizar(user, id, body);
    return { data: modelo };
  }
}
