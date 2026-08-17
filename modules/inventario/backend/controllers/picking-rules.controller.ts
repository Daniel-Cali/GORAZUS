import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { PickingRulesService } from '../services/picking-rules.service';
import {
  crearPickingRuleSchema,
  actualizarPickingRuleSchema,
  type CrearPickingRuleInput,
  type ActualizarPickingRuleInput,
} from '../validators/picking-rules.schema';

const PERMISO_GESTIONAR = 'inventario.gestionar_almacenes';

/** `/inventario/picking-rules` — WMS Basic (Prompt 1, Foundation Completion). */
@ApiTags('inventario')
@ApiBearerAuth()
@Controller('inventario/picking-rules')
export class PickingRulesController {
  constructor(private readonly pickingRulesService: PickingRulesService) {}

  @ApiOperation({
    summary: 'Listar reglas de picking',
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
    const result = await this.pickingRulesService.listar(
      user,
      { ...(warehouseId && { warehouse_id: warehouseId }) },
      { page: Number(page), pageSize: Number(pageSize) },
    );
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({
    summary: 'Resolver estrategia de picking de un almacén',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get('resolver')
  async resolver(@CurrentUser() user: UserContext, @Query('warehouseId') warehouseId: string) {
    const strategy = await this.pickingRulesService.resolverEstrategia(user, warehouseId);
    return { data: { strategy } };
  }

  @ApiOperation({
    summary: 'Obtener regla de picking por id',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get(':id')
  async obtener(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const regla = await this.pickingRulesService.obtener(user, id);
    return { data: regla };
  }

  @ApiOperation({
    summary: 'Crear regla de picking',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearPickingRuleSchema)) body: CrearPickingRuleInput,
  ) {
    const regla = await this.pickingRulesService.crear(user, body);
    return { data: regla };
  }

  @ApiOperation({
    summary: 'Actualizar regla de picking',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Patch(':id')
  async actualizar(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(actualizarPickingRuleSchema)) body: ActualizarPickingRuleInput,
  ) {
    const regla = await this.pickingRulesService.actualizar(user, id, body);
    return { data: regla };
  }
}
