import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { PutawayRulesService } from '../services/putaway-rules.service';
import {
  crearPutawayRuleSchema,
  actualizarPutawayRuleSchema,
  resolverPutawayQuerySchema,
  type CrearPutawayRuleInput,
  type ActualizarPutawayRuleInput,
  type ResolverPutawayQuery,
} from '../validators/putaway-rules.schema';

const PERMISO_GESTIONAR = 'inventario.gestionar_almacenes';

/** `/inventario/putaway-rules` — WMS Basic (Prompt 1, Foundation Completion). */
@ApiTags('inventario')
@ApiBearerAuth()
@Controller('inventario/putaway-rules')
export class PutawayRulesController {
  constructor(private readonly putawayRulesService: PutawayRulesService) {}

  @ApiOperation({
    summary: 'Listar reglas de putaway',
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
    const result = await this.putawayRulesService.listar(
      user,
      { ...(warehouseId && { warehouse_id: warehouseId }) },
      { page: Number(page), pageSize: Number(pageSize) },
    );
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({
    summary: 'Resolver zona destino de putaway',
    description: `Requiere ${PERMISO_GESTIONAR}. Regla específica de categoría gana sobre la genérica.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get('resolver')
  async resolver(
    @CurrentUser() user: UserContext,
    @Query(new ZodValidationPipe(resolverPutawayQuerySchema)) query: ResolverPutawayQuery,
  ) {
    const targetZoneId = await this.putawayRulesService.resolverZonaDestino(user, query);
    return { data: { targetZoneId } };
  }

  @ApiOperation({
    summary: 'Obtener regla de putaway por id',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get(':id')
  async obtener(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const regla = await this.putawayRulesService.obtener(user, id);
    return { data: regla };
  }

  @ApiOperation({
    summary: 'Crear regla de putaway',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearPutawayRuleSchema)) body: CrearPutawayRuleInput,
  ) {
    const regla = await this.putawayRulesService.crear(user, body);
    return { data: regla };
  }

  @ApiOperation({
    summary: 'Actualizar regla de putaway',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Patch(':id')
  async actualizar(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(actualizarPutawayRuleSchema)) body: ActualizarPutawayRuleInput,
  ) {
    const regla = await this.putawayRulesService.actualizar(user, id, body);
    return { data: regla };
  }
}
