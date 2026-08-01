import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { CosteoService } from '../services/costeo.service';
import {
  registrarEntradaCosteoSchema,
  resolverCostoSalidaSchema,
  type RegistrarEntradaCosteoInput,
  type ResolverCostoSalidaInput,
} from '../validators/costeo.schema';

const PERMISO_GESTIONAR = 'inventario.gestionar_costeo';

/**
 * `/inventario/costeo` — Motor de Costeo, Fase 1 de `ADR-INV-004`
 * (FIFO/LIFO/Costo Promedio Ponderado). Servicio standalone: quien
 * registra un movimiento de stock (`MovimientosController` u otro módulo
 * futuro) decide por separado si también llama a este motor — no hay
 * conexión automática todavía (ver `CosteoService`).
 */
@ApiTags('inventario')
@ApiBearerAuth()
@Controller('inventario/costeo')
export class CosteoController {
  constructor(private readonly costeoService: CosteoService) {}

  @ApiOperation({
    summary: 'Registrar entrada con costo (crea capa FIFO/LIFO o recalcula Promedio)',
    description: `Requiere ${PERMISO_GESTIONAR}. Despacha según products.costing_method del producto.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post('entradas')
  async registrarEntrada(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(registrarEntradaCosteoSchema)) body: RegistrarEntradaCosteoInput,
  ) {
    const resultado = await this.costeoService.registrarEntrada(user, body);
    return { data: resultado };
  }

  @ApiOperation({
    summary: 'Resolver costo de una salida (consume capas FIFO/LIFO o lee Promedio vigente)',
    description: `Requiere ${PERMISO_GESTIONAR}. Política de inventario negativo estricta (ADR-INV-004 §6): rechaza si no hay costo suficiente.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post('salidas')
  async resolverCostoDeSalida(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(resolverCostoSalidaSchema)) body: ResolverCostoSalidaInput,
  ) {
    const resultado = await this.costeoService.resolverCostoDeSalida(user, body);
    return { data: resultado };
  }

  @ApiOperation({
    summary: 'Listar capas de costo activas de un producto/almacén',
    description: `Requiere ${PERMISO_GESTIONAR}. Vacío para productos con costing_method='average' (sin capas, ver costo-vigente).`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get('productos/:productId/capas')
  async listarCapasActivas(
    @CurrentUser() user: UserContext,
    @Param('productId') productId: string,
    @Query('warehouseId') warehouseId: string,
  ) {
    const resultado = await this.costeoService.listarCapasActivas(user, { productId, warehouseId });
    return { data: resultado };
  }

  @ApiOperation({
    summary: 'Costo vigente de un producto/almacén',
    description: `Requiere ${PERMISO_GESTIONAR}. Próxima capa a consumir (FIFO/LIFO) o último snapshot de Promedio.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get('productos/:productId/costo-vigente')
  async obtenerCostoVigente(
    @CurrentUser() user: UserContext,
    @Param('productId') productId: string,
    @Query('warehouseId') warehouseId: string,
  ) {
    const resultado = await this.costeoService.obtenerCostoVigente(user, {
      productId,
      warehouseId,
    });
    return { data: resultado };
  }
}
