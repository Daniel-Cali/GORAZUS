import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { ClientesService } from '../services/clientes.service';
import {
  crearClienteSchema,
  actualizarClienteSchema,
  type CrearClienteInput,
  type ActualizarClienteInput,
} from '../validators/clientes.schema';

const PERMISO_GESTIONAR = 'clientes.gestionar_clientes';

/** `/clientes` — CRUD mínimo de clientes (`POS_ARCHITECTURE.md §3`). */
@ApiTags('clientes')
@ApiBearerAuth()
@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @ApiOperation({
    summary: 'Listar clientes',
    description: `Requiere ${PERMISO_GESTIONAR}. Filtrable por companyId y búsqueda por nombre/tax_id.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get()
  async listar(
    @CurrentUser() user: UserContext,
    @Query('companyId') companyId: string | undefined,
    @Query('query') query: string | undefined,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const result = await this.clientesService.listar(user, companyId, query, {
      page: Number(page),
      pageSize: Number(pageSize),
    });
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({
    summary: 'Obtener cliente por id',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Get(':id')
  async obtener(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const cliente = await this.clientesService.obtener(user, id);
    return { data: cliente };
  }

  @ApiOperation({
    summary: 'Crear cliente',
    description: `Requiere ${PERMISO_GESTIONAR}. companyId/branchId deben ser una empresa/sucursal ya existentes.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Body(new ZodValidationPipe(crearClienteSchema)) body: CrearClienteInput,
  ) {
    const cliente = await this.clientesService.crear(user, body);
    return { data: cliente };
  }

  @ApiOperation({
    summary: 'Actualizar cliente',
    description: `Requiere ${PERMISO_GESTIONAR}. PATCH parcial — nunca reasigna empresa/tax_id.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Patch(':id')
  async actualizar(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(actualizarClienteSchema)) body: ActualizarClienteInput,
  ) {
    const cliente = await this.clientesService.actualizar(user, id, body);
    return { data: cliente };
  }
}
