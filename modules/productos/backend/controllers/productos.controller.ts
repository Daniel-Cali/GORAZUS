import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { ProductosService } from '../services/productos.service';
import {
  crearProductoSchema,
  actualizarProductoSchema,
  type CrearProductoInput,
  type ActualizarProductoInput,
} from '../validators/productos.schema';

const PERMISO_GESTIONAR = 'productos.gestionar_productos';

/** `/productos` — CRUD de productos, entidad central del módulo (docs/architecture/18-modulo-products.md §1). */
@ApiTags('productos')
@ApiBearerAuth()
@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @ApiOperation({
    summary: 'Listar productos',
    description: `Requiere ${PERMISO_GESTIONAR}. Filtrable por categoryId.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query('categoryId') categoryId: string | undefined,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const result = await this.productosService.listar(user, categoryId, {
      page: Number(page),
      pageSize: Number(pageSize),
    });
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({
    summary: 'Obtener producto por id',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get(':id')
  async obtener(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const producto = await this.productosService.obtener(user, id);
    return { data: producto };
  }

  @ApiOperation({
    summary: 'Crear producto',
    description: `Requiere ${PERMISO_GESTIONAR}. baseUnitId obligatorio; category/brand/model opcionales, validados si se indican (y el modelo debe pertenecer a la marca indicada).`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearProductoSchema)) body: CrearProductoInput,
  ) {
    const producto = await this.productosService.crear(user, body);
    return { data: producto };
  }

  @ApiOperation({
    summary: 'Actualizar producto',
    description: `Requiere ${PERMISO_GESTIONAR}. PATCH parcial — nunca reasigna sku ni unidad base.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Patch(':id')
  async actualizar(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(actualizarProductoSchema)) body: ActualizarProductoInput,
  ) {
    const producto = await this.productosService.actualizar(user, id, body);
    return { data: producto };
  }
}
