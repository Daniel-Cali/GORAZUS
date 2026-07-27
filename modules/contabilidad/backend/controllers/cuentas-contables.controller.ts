import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { PlanCuentasService } from '../services/plan-cuentas.service';
import {
  crearCuentaContableSchema,
  actualizarCuentaContableSchema,
  type CrearCuentaContableInput,
  type ActualizarCuentaContableInput,
} from '../validators/plan-cuentas.schema';

const PERMISO_GESTIONAR = 'contabilidad.gestionar_plan_cuentas';

/** `/contabilidad/cuentas` — plan de cuentas (`ACCOUNTING_ARCHITECTURE.md §2`). */
@ApiTags('contabilidad')
@ApiBearerAuth()
@Controller('contabilidad/cuentas')
export class CuentasContablesController {
  constructor(private readonly planCuentasService: PlanCuentasService) {}

  @ApiOperation({
    summary: 'Listar cuentas del plan contable',
    description: `Requiere ${PERMISO_GESTIONAR}. Filtrable por accountTypeId/parentAccountId.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query('companyId') companyId: string,
    @Query('accountTypeId') accountTypeId: string | undefined,
    @Query('parentAccountId') parentAccountId: string | undefined,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '50',
  ) {
    const result = await this.planCuentasService.listar(
      user,
      { companyId, accountTypeId, parentAccountId },
      { page: Number(page), pageSize: Number(pageSize) },
    );
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({
    summary: 'Obtener cuenta contable por id',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get(':id')
  async obtener(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.planCuentasService.obtener(user, id) };
  }

  @ApiOperation({ summary: 'Crear cuenta contable', description: `Requiere ${PERMISO_GESTIONAR}.` })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearCuentaContableSchema)) body: CrearCuentaContableInput,
  ) {
    return { data: await this.planCuentasService.crear(user, body) };
  }

  @ApiOperation({
    summary: 'Editar cuenta contable (código/nombre/acepta movimientos)',
    description: `Requiere ${PERMISO_GESTIONAR}. Nunca reasigna el tipo de cuenta.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Put(':id')
  async actualizar(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(actualizarCuentaContableSchema))
    body: ActualizarCuentaContableInput,
  ) {
    return { data: await this.planCuentasService.actualizar(user, id, body) };
  }

  @ApiOperation({
    summary: 'Desactivar cuenta contable',
    description: `Requiere ${PERMISO_GESTIONAR}. Nunca se elimina físicamente — solo se marca inactiva.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/desactivar')
  async desactivar(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.planCuentasService.desactivar(user, id) };
  }
}
