import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { CotizacionesService } from '../services/cotizaciones.service';
import type { OrdenCotizacion } from '../repositories/cotizacion.repository';
import {
  crearCotizacionSchema,
  actualizarCotizacionSchema,
  type CrearCotizacionInput,
  type ActualizarCotizacionInput,
} from '../validators/cotizaciones.schema';

const PERMISO_GESTIONAR = 'ventas.gestionar_cotizaciones';
const CAMPOS_ORDEN_VALIDOS: OrdenCotizacion[] = [
  'created_at',
  'total_amount',
  'document_number',
  'valid_until',
];

/** `/ventas/cotizaciones` — Módulo de Ventas Enterprise, Parte 1 (Cotización → Pedido → Factura). */
@ApiTags('ventas')
@ApiBearerAuth()
@Controller('ventas/cotizaciones')
export class CotizacionesController {
  constructor(private readonly cotizacionesService: CotizacionesService) {}

  @ApiOperation({
    summary: 'Listar cotizaciones',
    description: `Requiere ${PERMISO_GESTIONAR}. Filtrable por branchId/customerId/statusId, ordenable.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query('companyId') companyId: string,
    @Query('branchId') branchId: string | undefined,
    @Query('customerId') customerId: string | undefined,
    @Query('statusId') statusId: string | undefined,
    @Query('sortBy') sortBy: string | undefined,
    @Query('sortDir') sortDir: 'asc' | 'desc' = 'desc',
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const campoOrden = CAMPOS_ORDEN_VALIDOS.includes(sortBy as OrdenCotizacion)
      ? (sortBy as OrdenCotizacion)
      : undefined;
    const result = await this.cotizacionesService.listar(
      user,
      { companyId, branchId, customerId, statusId },
      { page: Number(page), pageSize: Number(pageSize) },
      campoOrden ? { campo: campoOrden, direccion: sortDir } : undefined,
    );
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({
    summary: 'Obtener cotización por id (con líneas)',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get(':id')
  async obtener(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.cotizacionesService.obtener(user, id) };
  }

  @ApiOperation({
    summary: 'Crear cotización (borrador)',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearCotizacionSchema)) body: CrearCotizacionInput,
  ) {
    return { data: await this.cotizacionesService.crear(user, body) };
  }

  @ApiOperation({
    summary: 'Editar cotización (solo mientras sigue en borrador)',
    description: `Requiere ${PERMISO_GESTIONAR}. 409 si ya no está en borrador.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Put(':id')
  async actualizar(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(actualizarCotizacionSchema)) body: ActualizarCotizacionInput,
  ) {
    return { data: await this.cotizacionesService.actualizar(user, id, body) };
  }

  @ApiOperation({
    summary: 'Eliminar cotización (baja lógica, solo mientras sigue en borrador)',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Delete(':id')
  async eliminar(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.cotizacionesService.eliminar(user, id) };
  }

  @ApiOperation({ summary: 'Aprobar cotización', description: `Requiere ${PERMISO_GESTIONAR}.` })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/aprobar')
  async aprobar(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.cotizacionesService.aprobar(user, id) };
  }

  @ApiOperation({ summary: 'Rechazar cotización', description: `Requiere ${PERMISO_GESTIONAR}.` })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/rechazar')
  async rechazar(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.cotizacionesService.rechazar(user, id) };
  }

  @ApiOperation({
    summary: 'Duplicar cotización',
    description: `Requiere ${PERMISO_GESTIONAR}. Crea un borrador nuevo con las mismas líneas.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/duplicar')
  async duplicar(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.cotizacionesService.duplicar(user, id) };
  }
}
