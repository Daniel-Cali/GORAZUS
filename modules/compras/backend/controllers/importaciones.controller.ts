import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { ImportacionesService } from '../services/importaciones.service';
import {
  crearExpedienteImportacionSchema,
  agregarGastoImportacionSchema,
  type CrearExpedienteImportacionInput,
  type AgregarGastoImportacionInput,
} from '../validators/importaciones.schema';

const PERMISO_GESTIONAR = 'compras.gestionar_importaciones';

/**
 * `/compras/importaciones` — Compras FASE 11 (Imports), última fase del
 * roadmap autorizado. Flujo: `in_transit` → `at_customs` → `cleared`;
 * `cancelled` desde `in_transit`/`at_customs`. Los gastos
 * (`import_expenses`) se agregan incrementalmente, no se fijan al crear.
 */
@ApiTags('compras')
@ApiBearerAuth()
@Controller('compras/importaciones')
export class ImportacionesController {
  constructor(private readonly importacionesService: ImportacionesService) {}

  @ApiOperation({
    summary: 'Listar expedientes de importación',
    description: `Requiere ${PERMISO_GESTIONAR}. Filtrable por purchaseOrderId/statusId.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query('companyId') companyId: string,
    @Query('purchaseOrderId') purchaseOrderId: string | undefined,
    @Query('statusId') statusId: string | undefined,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const result = await this.importacionesService.listar(
      user,
      { companyId, purchaseOrderId, statusId },
      { page: Number(page), pageSize: Number(pageSize) },
    );
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({
    summary: 'Obtener expediente de importación por id (con gastos)',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get(':id')
  async obtener(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.importacionesService.obtener(user, id) };
  }

  @ApiOperation({
    summary: 'Consultar historial de estados',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get(':id/historial')
  async historial(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.importacionesService.historial(user, id) };
  }

  @ApiOperation({
    summary: 'Abrir expediente de importación',
    description: `Requiere ${PERMISO_GESTIONAR}. La orden de compra debe existir y estar "approved".`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearExpedienteImportacionSchema))
    body: CrearExpedienteImportacionInput,
  ) {
    return { data: await this.importacionesService.crear(user, body) };
  }

  @ApiOperation({
    summary: 'Agregar gasto al expediente',
    description: `Requiere ${PERMISO_GESTIONAR}. expenseType: freight|insurance|customs|other.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/gastos')
  async agregarGasto(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(agregarGastoImportacionSchema)) body: AgregarGastoImportacionInput,
  ) {
    return { data: await this.importacionesService.agregarGasto(user, id, body) };
  }

  @ApiOperation({
    summary: 'Anular gasto del expediente',
    description: `Requiere ${PERMISO_GESTIONAR}. Baja lógica.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/gastos/:expenseId/anular')
  async anularGasto(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Param('expenseId') expenseId: string,
  ) {
    return { data: await this.importacionesService.anularGasto(user, id, expenseId) };
  }

  @ApiOperation({
    summary: 'Avanzar a aduana',
    description: `Requiere ${PERMISO_GESTIONAR}. in_transit → at_customs.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/avanzar-a-aduana')
  async avanzarAAduana(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.importacionesService.avanzarAAduana(user, id) };
  }

  @ApiOperation({
    summary: 'Nacionalizar (despachar de aduana)',
    description: `Requiere ${PERMISO_GESTIONAR}. at_customs → cleared.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/nacionalizar')
  async nacionalizar(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.importacionesService.nacionalizar(user, id) };
  }

  @ApiOperation({
    summary: 'Cancelar expediente de importación',
    description: `Requiere ${PERMISO_GESTIONAR}. in_transit|at_customs → cancelled.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/cancelar')
  async cancelar(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.importacionesService.cancelar(user, id) };
  }

  @ApiOperation({
    summary: 'Anular expediente de importación',
    description: `Requiere ${PERMISO_GESTIONAR}. Baja lógica — no permitido si ya está "cleared".`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/anular')
  async anular(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.importacionesService.anular(user, id) };
  }
}
