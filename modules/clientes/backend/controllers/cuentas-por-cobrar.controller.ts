import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { CuentasPorCobrarService } from '../services/cuentas-por-cobrar.service';

const PERMISO_VER = 'clientes.ver_cuentas_por_cobrar';

/**
 * `/clientes/:customerId/cuentas-por-cobrar` — integración real
 * Clientes↔Ventas↔Cuentas por Cobrar, de solo lectura (la vista
 * `customers.v_accounts_receivable_aging` es la única fuente de verdad,
 * nunca se escribe desde acá).
 */
@ApiTags('clientes')
@ApiBearerAuth()
@Controller('clientes/:customerId/cuentas-por-cobrar')
export class CuentasPorCobrarController {
  constructor(private readonly cuentasPorCobrarService: CuentasPorCobrarService) {}

  @ApiOperation({
    summary: 'Listar cuentas por cobrar abiertas de un cliente',
    description: `Requiere ${PERMISO_VER}. Facturas de \`sales\` con saldo abierto, agrupadas por antigüedad (aging).`,
  })
  @RequirePermission(PERMISO_VER)
  @Get()
  async listar(@CurrentUser() user: UserContext, @Param('customerId') customerId: string) {
    const data = await this.cuentasPorCobrarService.listarPorCliente(user, customerId);
    return { data };
  }
}
