import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { EmpresasService } from '../services/empresas.service';
import {
  crearEmpresaSchema,
  actualizarEmpresaSchema,
  type CrearEmpresaInput,
  type ActualizarEmpresaInput,
} from '../validators/empresas.schema';

/** `/configuracion/empresas` — CRUD de empresas (docs/architecture/14-modulo-core.md). */
@ApiTags('configuracion')
@ApiBearerAuth()
@Controller('configuracion/empresas')
export class EmpresasController {
  constructor(private readonly empresasService: EmpresasService) {}

  @ApiOperation({
    summary: 'Listar empresas',
    description: 'Requiere configuracion.gestionar_empresas.',
  })
  @RequirePermission('configuracion.gestionar_empresas')
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const result = await this.empresasService.listar(user, {
      page: Number(page),
      pageSize: Number(pageSize),
    });
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({
    summary: 'Obtener empresa por id',
    description: 'Requiere configuracion.gestionar_empresas.',
  })
  @RequirePermission('configuracion.gestionar_empresas')
  @Get(':id')
  async obtener(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const empresa = await this.empresasService.obtener(user, id);
    return { data: empresa };
  }

  @ApiOperation({
    summary: 'Crear empresa',
    description: 'Requiere configuracion.gestionar_empresas.',
  })
  @RequirePermission('configuracion.gestionar_empresas')
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearEmpresaSchema)) body: CrearEmpresaInput,
  ) {
    const empresa = await this.empresasService.crear(user, body);
    return { data: empresa };
  }

  @ApiOperation({
    summary: 'Actualizar empresa',
    description: 'Requiere configuracion.gestionar_empresas.',
  })
  @RequirePermission('configuracion.gestionar_empresas')
  @Patch(':id')
  async actualizar(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(actualizarEmpresaSchema)) body: ActualizarEmpresaInput,
  ) {
    const empresa = await this.empresasService.actualizar(user, id, body);
    return { data: empresa };
  }
}
