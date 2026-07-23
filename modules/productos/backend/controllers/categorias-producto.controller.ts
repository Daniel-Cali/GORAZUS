import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { CategoriasProductoService } from '../services/categorias-producto.service';
import {
  crearCategoriaProductoSchema,
  actualizarCategoriaProductoSchema,
  type CrearCategoriaProductoInput,
  type ActualizarCategoriaProductoInput,
} from '../validators/categorias-producto.schema';

const PERMISO_GESTIONAR = 'productos.gestionar_productos';

/** `/productos/categorias` — CRUD de categorías, jerárquica auto-referenciada (docs/architecture/18-modulo-products.md §2). */
@ApiTags('productos')
@ApiBearerAuth()
@Controller('productos/categorias')
export class CategoriasProductoController {
  constructor(private readonly categoriasProductoService: CategoriasProductoService) {}

  @ApiOperation({
    summary: 'Listar categorías',
    description: `Requiere ${PERMISO_GESTIONAR}. Filtrable por parentCategoryId.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query('parentCategoryId') parentCategoryId: string | undefined,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const result = await this.categoriasProductoService.listar(user, parentCategoryId, {
      page: Number(page),
      pageSize: Number(pageSize),
    });
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({
    summary: 'Obtener categoría por id',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get(':id')
  async obtener(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const categoria = await this.categoriasProductoService.obtener(user, id);
    return { data: categoria };
  }

  @ApiOperation({
    summary: 'Crear categoría',
    description: `Requiere ${PERMISO_GESTIONAR}. parentCategoryId (opcional) debe ser una categoría ya existente.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearCategoriaProductoSchema)) body: CrearCategoriaProductoInput,
  ) {
    const categoria = await this.categoriasProductoService.crear(user, body);
    return { data: categoria };
  }

  @ApiOperation({ summary: 'Actualizar categoría', description: `Requiere ${PERMISO_GESTIONAR}.` })
  @RequirePermission(PERMISO_GESTIONAR)
  @Patch(':id')
  async actualizar(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(actualizarCategoriaProductoSchema))
    body: ActualizarCategoriaProductoInput,
  ) {
    const categoria = await this.categoriasProductoService.actualizar(user, id, body);
    return { data: categoria };
  }
}
