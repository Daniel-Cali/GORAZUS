import { BadRequestException, Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { AsientosService } from '../services/asientos.service';
import type { OrdenAsiento } from '../repositories/asiento.repository';
import { crearAsientoSchema, type CrearAsientoInput } from '../validators/asientos.schema';

const PERMISO_GESTIONAR = 'contabilidad.gestionar_asientos';
const PERMISO_VER_REPORTES = 'contabilidad.ver_reportes';
const CAMPOS_ORDEN_VALIDOS: OrdenAsiento[] = ['posting_date', 'document_number'];

/**
 * `/contabilidad/asientos` — Libro Diario es este mismo `listar()` con
 * filtros (`ACCOUNTING_API_REPORT.md §1`); Libro Mayor vive en
 * `/contabilidad/asientos/libro-mayor` (una cuenta, un rango de fechas).
 */
@ApiTags('contabilidad')
@ApiBearerAuth()
@Controller('contabilidad/asientos')
export class AsientosController {
  constructor(private readonly asientosService: AsientosService) {}

  @ApiOperation({
    summary: 'Libro Diario — listar asientos con filtros',
    description: `Requiere ${PERMISO_VER_REPORTES}. Filtrable por branchId/statusId/rango de fechas, ordenable por posting_date/document_number.`,
  })
  @RequirePermission(PERMISO_VER_REPORTES)
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query('companyId') companyId: string,
    @Query('branchId') branchId: string | undefined,
    @Query('statusId') statusId: string | undefined,
    @Query('desde') desde: string | undefined,
    @Query('hasta') hasta: string | undefined,
    @Query('sortBy') sortBy: string | undefined,
    @Query('sortDir') sortDir: 'asc' | 'desc' = 'desc',
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const campoOrden = CAMPOS_ORDEN_VALIDOS.includes(sortBy as OrdenAsiento)
      ? (sortBy as OrdenAsiento)
      : undefined;
    const result = await this.asientosService.listar(
      user,
      {
        companyId,
        branchId,
        statusId,
        desde: desde ? new Date(desde) : undefined,
        hasta: hasta ? new Date(hasta) : undefined,
      },
      { page: Number(page), pageSize: Number(pageSize) },
      campoOrden ? { campo: campoOrden, direccion: sortDir } : undefined,
    );
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({
    summary: 'Libro Mayor de una cuenta',
    description: `Requiere ${PERMISO_VER_REPORTES}. Saldo inicial + movimientos del rango + saldo final, solo asientos contabilizados.`,
  })
  @RequirePermission(PERMISO_VER_REPORTES)
  @Get('libro-mayor')
  async libroMayor(
    @CurrentUser() user: UserContext,
    @Query('accountId') accountId: string,
    @Query('companyId') companyId: string,
    @Query('branchId') branchId: string | undefined,
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
  ) {
    if (!accountId || !desde || !hasta) {
      throw new BadRequestException('accountId, desde y hasta son obligatorios.');
    }
    return {
      data: await this.asientosService.libroMayor(user, {
        accountId,
        companyId,
        branchId,
        desde: new Date(desde),
        hasta: new Date(hasta),
      }),
    };
  }

  @ApiOperation({
    summary: 'Obtener asiento por id (con líneas)',
    description: `Requiere ${PERMISO_VER_REPORTES}.`,
  })
  @RequirePermission(PERMISO_VER_REPORTES)
  @Get(':id')
  async obtener(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.asientosService.obtener(user, id) };
  }

  @ApiOperation({
    summary: 'Crear asiento manual (borrador)',
    description: `Requiere ${PERMISO_GESTIONAR}. Debe estar balanceado (Σdébitos = Σcréditos).`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearAsientoSchema)) body: CrearAsientoInput,
  ) {
    return { data: await this.asientosService.crear(user, body) };
  }

  @ApiOperation({
    summary: 'Contabilizar asiento (borrador/pendiente → contabilizado)',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/contabilizar')
  async contabilizar(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.asientosService.contabilizar(user, id) };
  }

  @ApiOperation({ summary: 'Anular asiento', description: `Requiere ${PERMISO_GESTIONAR}.` })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/anular')
  async anular(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.asientosService.anular(user, id) };
  }

  @ApiOperation({
    summary: 'Revertir asiento contabilizado (genera un asiento nuevo con las líneas invertidas)',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post(':id/revertir')
  async revertir(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return { data: await this.asientosService.revertir(user, id) };
  }
}
