import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { ReplenishmentRulesService } from '../services/replenishment-rules.service';
import {
  crearReplenishmentRuleSchema,
  actualizarReplenishmentRuleSchema,
  type CrearReplenishmentRuleInput,
  type ActualizarReplenishmentRuleInput,
} from '../validators/replenishment-rules.schema';

const PERMISO_GESTIONAR = 'inventario.gestionar_almacenes';

/** `/inventario/replenishment-rules` — WMS Basic (Prompt 1, Foundation Completion). */
@ApiTags('inventario')
@ApiBearerAuth()
@Controller('inventario/replenishment-rules')
export class ReplenishmentRulesController {
  constructor(private readonly replenishmentRulesService: ReplenishmentRulesService) {}

  @ApiOperation({
    summary: 'Listar reglas de reposición',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query('warehouseId') warehouseId: string | undefined,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const result = await this.replenishmentRulesService.listar(
      user,
      { ...(warehouseId && { warehouse_id: warehouseId }) },
      { page: Number(page), pageSize: Number(pageSize) },
    );
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({
    summary: 'Evaluar si un producto necesita reposición en un almacén',
    description: `Requiere ${PERMISO_GESTIONAR}. No dispara ninguna orden — solo evalúa.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get('evaluar')
  async evaluar(
    @CurrentUser() user: UserContext,
    @Query('productId') productId: string,
    @Query('warehouseId') warehouseId: string,
  ) {
    const resultado = await this.replenishmentRulesService.evaluar(user, {
      productId,
      warehouseId,
    });
    return { data: resultado };
  }

  @ApiOperation({
    summary: 'Obtener regla de reposición por id',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get(':id')
  async obtener(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const regla = await this.replenishmentRulesService.obtener(user, id);
    return { data: regla };
  }

  @ApiOperation({
    summary: 'Crear regla de reposición',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearReplenishmentRuleSchema)) body: CrearReplenishmentRuleInput,
  ) {
    const regla = await this.replenishmentRulesService.crear(user, body);
    return { data: regla };
  }

  @ApiOperation({
    summary: 'Actualizar regla de reposición',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Patch(':id')
  async actualizar(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(actualizarReplenishmentRuleSchema))
    body: ActualizarReplenishmentRuleInput,
  ) {
    const regla = await this.replenishmentRulesService.actualizar(user, id, body);
    return { data: regla };
  }
}
