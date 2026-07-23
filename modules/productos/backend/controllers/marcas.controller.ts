import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { MarcasService } from '../services/marcas.service';
import {
  crearMarcaSchema,
  actualizarMarcaSchema,
  type CrearMarcaInput,
  type ActualizarMarcaInput,
} from '../validators/marcas.schema';

const PERMISO_GESTIONAR = 'productos.gestionar_productos';

/** `/productos/marcas` — CRUD de marcas, plana sin jerarquía (docs/architecture/18-modulo-products.md §3). */
@ApiTags('productos')
@ApiBearerAuth()
@Controller('productos/marcas')
export class MarcasController {
  constructor(private readonly marcasService: MarcasService) {}

  @ApiOperation({ summary: 'Listar marcas', description: `Requiere ${PERMISO_GESTIONAR}.` })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const result = await this.marcasService.listar(user, {
      page: Number(page),
      pageSize: Number(pageSize),
    });
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({ summary: 'Obtener marca por id', description: `Requiere ${PERMISO_GESTIONAR}.` })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get(':id')
  async obtener(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const marca = await this.marcasService.obtener(user, id);
    return { data: marca };
  }

  @ApiOperation({ summary: 'Crear marca', description: `Requiere ${PERMISO_GESTIONAR}.` })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearMarcaSchema)) body: CrearMarcaInput,
  ) {
    const marca = await this.marcasService.crear(user, body);
    return { data: marca };
  }

  @ApiOperation({ summary: 'Actualizar marca', description: `Requiere ${PERMISO_GESTIONAR}.` })
  @RequirePermission(PERMISO_GESTIONAR)
  @Patch(':id')
  async actualizar(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(actualizarMarcaSchema)) body: ActualizarMarcaInput,
  ) {
    const marca = await this.marcasService.actualizar(user, id, body);
    return { data: marca };
  }
}
