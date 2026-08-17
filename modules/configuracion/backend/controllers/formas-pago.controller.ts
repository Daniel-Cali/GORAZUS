import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { FormasPagoService } from '../services/formas-pago.service';

/** `/configuracion/formas-pago` — catálogo real (`configuration.payment_forms`, ya sembrado: cash/check/transfer/card/credit). Primer consumidor: POS (`PaymentDialog`), Prompt 3C. */
@ApiTags('configuracion')
@ApiBearerAuth()
@Controller('configuracion/formas-pago')
export class FormasPagoController {
  constructor(private readonly formasPagoService: FormasPagoService) {}

  @ApiOperation({
    summary: 'Listar formas de pago',
    description: 'Requiere configuracion.gestionar_parametros.',
  })
  @RequirePermission('configuracion.gestionar_parametros')
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '50',
  ) {
    const result = await this.formasPagoService.listar(user, {
      page: Number(page),
      pageSize: Number(pageSize),
    });
    return { data: result.data, meta: result.meta };
  }
}
