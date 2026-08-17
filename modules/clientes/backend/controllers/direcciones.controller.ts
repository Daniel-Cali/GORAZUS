import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { DireccionesService } from '../services/direcciones.service';
import {
  crearDireccionSchema,
  actualizarDireccionSchema,
  type CrearDireccionInput,
  type ActualizarDireccionInput,
} from '../validators/direcciones.schema';

const PERMISO_VER = 'clientes.ver_direcciones';
const PERMISO_GESTIONAR = 'clientes.gestionar_direcciones';

/** `/clientes/:customerId/direcciones` — Clientes Parte 02 (Customer 360). */
@ApiTags('clientes')
@ApiBearerAuth()
@Controller('clientes/:customerId/direcciones')
export class DireccionesController {
  constructor(private readonly direccionesService: DireccionesService) {}

  @ApiOperation({
    summary: 'Listar direcciones de un cliente',
    description: `Requiere ${PERMISO_VER}.`,
  })
  @RequirePermission(PERMISO_VER)
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Param('customerId') customerId: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const result = await this.direccionesService.listar(user, customerId, {
      page: Number(page),
      pageSize: Number(pageSize),
    });
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({ summary: 'Obtener dirección por id', description: `Requiere ${PERMISO_VER}.` })
  @RequirePermission(PERMISO_VER)
  @Get(':id')
  async obtener(
    @CurrentUser() user: UserContext,
    @Param('customerId') customerId: string,
    @Param('id') id: string,
  ) {
    const direccion = await this.direccionesService.obtener(user, customerId, id);
    return { data: direccion };
  }

  @ApiOperation({ summary: 'Crear dirección', description: `Requiere ${PERMISO_GESTIONAR}.` })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Param('customerId') customerId: string,
    @Body(new ZodValidationPipe(crearDireccionSchema)) body: CrearDireccionInput,
  ) {
    const direccion = await this.direccionesService.crear(user, customerId, body);
    return { data: direccion };
  }

  @ApiOperation({
    summary: 'Actualizar dirección',
    description: `Requiere ${PERMISO_GESTIONAR}. PATCH parcial.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Patch(':id')
  async actualizar(
    @CurrentUser() user: UserContext,
    @Param('customerId') customerId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(actualizarDireccionSchema)) body: ActualizarDireccionInput,
  ) {
    const direccion = await this.direccionesService.actualizar(user, customerId, id, body);
    return { data: direccion };
  }

  @ApiOperation({
    summary: 'Eliminar dirección (baja lógica)',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Delete(':id')
  async eliminar(
    @CurrentUser() user: UserContext,
    @Param('customerId') customerId: string,
    @Param('id') id: string,
  ) {
    const direccion = await this.direccionesService.eliminar(user, customerId, id);
    return { data: direccion };
  }
}
