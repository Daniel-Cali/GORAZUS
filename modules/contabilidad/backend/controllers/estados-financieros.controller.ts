import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { EstadosFinancierosService } from '../services/estados-financieros.service';

const PERMISO_VER_REPORTES = 'contabilidad.ver_reportes';

/** `/contabilidad/reportes` — Balance General, Estado de Resultados, Flujo de Efectivo (`ACCOUNTING_ARCHITECTURE.md §5-7`). */
@ApiTags('contabilidad')
@ApiBearerAuth()
@Controller('contabilidad/reportes')
export class EstadosFinancierosController {
  constructor(private readonly estadosFinancierosService: EstadosFinancierosService) {}

  @ApiOperation({
    summary: 'Balance General a una fecha de corte',
    description: `Requiere ${PERMISO_VER_REPORTES}. Incluye la utilidad acumulada histórica (sin cierre contable todavía, ver ACCOUNTING_HEALTH_REPORT.md).`,
  })
  @RequirePermission(PERMISO_VER_REPORTES)
  @Get('balance-general')
  async balanceGeneral(
    @CurrentUser() user: UserContext,
    @Query('companyId') companyId: string,
    @Query('branchId') branchId: string | undefined,
    @Query('fechaCorte') fechaCorte: string,
  ) {
    if (!fechaCorte) throw new BadRequestException('fechaCorte es obligatorio.');
    return {
      data: await this.estadosFinancierosService.balanceGeneral(user, {
        companyId,
        branchId,
        fechaCorte: new Date(fechaCorte),
      }),
    };
  }

  @ApiOperation({
    summary: 'Estado de Resultados en un rango de fechas',
    description: `Requiere ${PERMISO_VER_REPORTES}. Utilidad Bruta/Operativa/Neta. "costAccountIds"/"otherIncomeAccountIds"/"otherExpenseAccountIds" (opcionales, separados por coma) reclasifican cuentas de tipo income/expense — el CHECK real de account_types.code solo admite asset/liability/equity/income/expense, ver ACCOUNTING_HEALTH_REPORT.md.`,
  })
  @RequirePermission(PERMISO_VER_REPORTES)
  @Get('estado-resultados')
  async estadoResultados(
    @CurrentUser() user: UserContext,
    @Query('companyId') companyId: string,
    @Query('branchId') branchId: string | undefined,
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
    @Query('costAccountIds') costAccountIds: string | undefined,
    @Query('otherIncomeAccountIds') otherIncomeAccountIds: string | undefined,
    @Query('otherExpenseAccountIds') otherExpenseAccountIds: string | undefined,
  ) {
    if (!desde || !hasta) throw new BadRequestException('desde y hasta son obligatorios.');
    return {
      data: await this.estadosFinancierosService.estadoResultados(user, {
        companyId,
        branchId,
        desde: new Date(desde),
        hasta: new Date(hasta),
        costAccountIds: costAccountIds?.split(',').map((id) => id.trim()),
        otherIncomeAccountIds: otherIncomeAccountIds?.split(',').map((id) => id.trim()),
        otherExpenseAccountIds: otherExpenseAccountIds?.split(',').map((id) => id.trim()),
      }),
    };
  }

  @ApiOperation({
    summary: 'Flujo de Efectivo en un rango de fechas',
    description: `Requiere ${PERMISO_VER_REPORTES}. "cashAccountIds" (uno o más, separados por coma) es obligatorio — el plan de cuentas todavía no tiene un flag "cuenta de efectivo" (ver ACCOUNTING_HEALTH_REPORT.md); desglose aproximado por módulo de origen, no por Operación/Inversión/Financiamiento formal.`,
  })
  @RequirePermission(PERMISO_VER_REPORTES)
  @Get('flujo-efectivo')
  async flujoEfectivo(
    @CurrentUser() user: UserContext,
    @Query('companyId') companyId: string,
    @Query('branchId') branchId: string | undefined,
    @Query('cashAccountIds') cashAccountIds: string,
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
  ) {
    if (!cashAccountIds || !desde || !hasta) {
      throw new BadRequestException('cashAccountIds, desde y hasta son obligatorios.');
    }
    return {
      data: await this.estadosFinancierosService.flujoEfectivo(user, {
        companyId,
        branchId,
        cashAccountIds: cashAccountIds.split(',').map((id) => id.trim()),
        desde: new Date(desde),
        hasta: new Date(hasta),
      }),
    };
  }
}
