import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { AuditoriaService } from '../services/auditoria.service';
import { filtroAuditoriaSchema, type FiltroAuditoriaInput } from '../validators/auditoria.schema';

/** `/seguridad/auditoria` — lectura de `core.audit_logs`, filtrable por tabla/operación/actor (docs/architecture/15-modulo-security.md). */
@ApiTags('seguridad')
@ApiBearerAuth()
@Controller('seguridad/auditoria')
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @ApiOperation({
    summary: 'Listar registros de auditoría',
    description: 'Requiere seguridad.ver_auditoria. Filtrable por tableName/operation/actorUserId.',
  })
  @RequirePermission('seguridad.ver_auditoria')
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query(new ZodValidationPipe(filtroAuditoriaSchema)) query: FiltroAuditoriaInput,
  ) {
    const result = await this.auditoriaService.listar(user, query);
    return { data: result.data, meta: result.meta };
  }
}
