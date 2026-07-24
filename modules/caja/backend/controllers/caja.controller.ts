import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { CajaService } from '../services/caja.service';
import {
  crearCajaSchema,
  abrirCajaSchema,
  cerrarCajaSchema,
  type CrearCajaInput,
  type AbrirCajaInput,
  type CerrarCajaInput,
} from '../validators/caja.schema';

const PERMISO_GESTIONAR = 'caja.gestionar_caja';

/** `/caja` — registros, apertura/cierre de turno (`POS_ARCHITECTURE.md §3`). */
@ApiTags('caja')
@ApiBearerAuth()
@Controller('caja')
export class CajaController {
  constructor(private readonly cajaService: CajaService) {}

  @ApiOperation({ summary: 'Listar cajas', description: `Requiere ${PERMISO_GESTIONAR}.` })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get('registros')
  async listarRegistros(
    @CurrentUser() user: UserContext,
    @Query('branchId') branchId: string | undefined,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const result = await this.cajaService.listarRegistros(user, branchId, {
      page: Number(page),
      pageSize: Number(pageSize),
    });
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({ summary: 'Crear caja', description: `Requiere ${PERMISO_GESTIONAR}.` })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post('registros')
  async crearRegistro(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearCajaSchema)) body: CrearCajaInput,
  ) {
    const caja = await this.cajaService.crearRegistro(user, body);
    return { data: caja };
  }

  @ApiOperation({
    summary: 'Obtener la apertura activa de una caja (si hay una)',
    description: `Requiere ${PERMISO_GESTIONAR}. Devuelve null en \`data\` si la caja está cerrada.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get('registros/:id/apertura-activa')
  async obtenerAperturaActiva(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const apertura = await this.cajaService.obtenerAperturaActiva(user, id);
    return { data: apertura };
  }

  @ApiOperation({
    summary: 'Abrir caja',
    description: `Requiere ${PERMISO_GESTIONAR}. Falla si ya hay una apertura activa.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post('aperturas')
  async abrir(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(abrirCajaSchema)) body: AbrirCajaInput,
  ) {
    const apertura = await this.cajaService.abrir(user, body);
    return { data: apertura };
  }

  @ApiOperation({
    summary: 'Cerrar caja',
    description: `Requiere ${PERMISO_GESTIONAR}. Monto esperado = apertura + suma de movimientos.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post('cierres')
  async cerrar(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(cerrarCajaSchema)) body: CerrarCajaInput,
  ) {
    const resultado = await this.cajaService.cerrar(user, body);
    return { data: resultado };
  }
}
