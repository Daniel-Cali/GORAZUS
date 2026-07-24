import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { ConteosService } from '../services/conteos.service';
import {
  crearConteoSchema,
  capturarLineaConteoSchema,
  type CrearConteoInput,
  type CapturarLineaConteoInput,
} from '../validators/conteos.schema';

const PERMISO_GESTIONAR = 'inventario.gestionar_stock';

/**
 * `/inventario/conteos` — conteos físicos
 * (`INVENTORY_PHYSICAL_COUNTS.md §3`). Flujo real:
 * `planned → in_progress → completed`. `completar` genera
 * automáticamente un ajuste en borrador si hay discrepancias.
 */
@ApiTags('inventario')
@ApiBearerAuth()
@Controller('inventario/conteos')
export class ConteosController {
  constructor(private readonly conteosService: ConteosService) {}

  @ApiOperation({
    summary: 'Crear conteo físico (planned)',
    description: `Requiere ${PERMISO_GESTIONAR}. Sin productIds, autogenera líneas desde el stock actual del almacén (Conteo General).`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearConteoSchema)) body: CrearConteoInput,
  ) {
    const conteo = await this.conteosService.crear(user, body);
    return { data: conteo };
  }

  @ApiOperation({
    summary: 'Obtener conteo por id (con líneas)',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get(':id')
  async obtener(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const conteo = await this.conteosService.obtener(user, id);
    return { data: conteo };
  }

  @ApiOperation({
    summary: 'Listar conteos',
    description: `Requiere ${PERMISO_GESTIONAR}. Filtrable por warehouseId/status.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query('warehouseId') warehouseId: string | undefined,
    @Query('status') status: string | undefined,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const result = await this.conteosService.listar(
      user,
      {
        ...(warehouseId && { warehouse_id: warehouseId }),
        ...(status && { status }),
      },
      { page: Number(page), pageSize: Number(pageSize) },
    );
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({
    summary: 'Iniciar conteo (planned → in_progress)',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/iniciar')
  async iniciar(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const conteo = await this.conteosService.iniciar(user, id);
    return { data: conteo };
  }

  @ApiOperation({
    summary: 'Capturar cantidad contada de una línea (conteo ciego)',
    description: `Requiere ${PERMISO_GESTIONAR}. La respuesta nunca incluye systemQuantity.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/lineas/:lineaId/capturar')
  async capturarLinea(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Param('lineaId') lineaId: string,
    @Body(new ZodValidationPipe(capturarLineaConteoSchema)) body: CapturarLineaConteoInput,
  ) {
    const linea = await this.conteosService.capturarLinea(user, id, lineaId, body.countedQuantity);
    return { data: linea };
  }

  @ApiOperation({
    summary: 'Completar conteo (in_progress → completed)',
    description: `Requiere ${PERMISO_GESTIONAR}. Exige todas las líneas capturadas; genera un ajuste en borrador si hay discrepancias.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/completar')
  async completar(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const resultado = await this.conteosService.completar(user, id);
    return { data: resultado.conteo, ajusteGeneradoId: resultado.ajusteGeneradoId };
  }
}
