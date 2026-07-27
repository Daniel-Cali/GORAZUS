import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { ReglasContablesService } from '../services/reglas-contables.service';
import {
  crearReglaContableSchema,
  type CrearReglaContableInput,
} from '../validators/reglas-contables.schema';

const PERMISO_GESTIONAR = 'contabilidad.gestionar_plan_cuentas';

/** `/contabilidad/reglas` — motor de reglas contables (`ACCOUNTING_ARCHITECTURE.md §3`). */
@ApiTags('contabilidad')
@ApiBearerAuth()
@Controller('contabilidad/reglas')
export class ReglasContablesController {
  constructor(private readonly reglasContablesService: ReglasContablesService) {}

  @ApiOperation({
    summary: 'Listar reglas contables',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query('companyId') companyId: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '50',
  ) {
    const result = await this.reglasContablesService.listar(user, companyId, {
      page: Number(page),
      pageSize: Number(pageSize),
    });
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({
    summary: 'Obtener regla contable por id',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get(':id')
  async obtener(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.reglasContablesService.obtener(user, id) };
  }

  @ApiOperation({
    summary: 'Crear regla contable',
    description: `Requiere ${PERMISO_GESTIONAR}. "amountFormula" es el nombre de un campo del hecho contable del módulo de origen, no una expresión evaluada.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearReglaContableSchema)) body: CrearReglaContableInput,
  ) {
    return { data: await this.reglasContablesService.crear(user, body) };
  }

  @ApiOperation({
    summary: 'Editar regla contable (reemplaza sus líneas)',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Put(':id')
  async actualizar(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(crearReglaContableSchema)) body: CrearReglaContableInput,
  ) {
    return { data: await this.reglasContablesService.actualizar(user, id, body) };
  }

  @ApiOperation({
    summary: 'Eliminar regla contable',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Delete(':id')
  async eliminar(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.reglasContablesService.eliminar(user, id) };
  }
}
