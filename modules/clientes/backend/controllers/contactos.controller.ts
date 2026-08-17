import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, ZodValidationPipe } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
import { ContactosService } from '../services/contactos.service';
import {
  crearContactoSchema,
  actualizarContactoSchema,
  type CrearContactoInput,
  type ActualizarContactoInput,
} from '../validators/contactos.schema';

const PERMISO_VER = 'clientes.ver_contactos';
const PERMISO_GESTIONAR = 'clientes.gestionar_contactos';

/** `/clientes/:customerId/contactos` — Clientes Parte 02 (Customer 360). */
@ApiTags('clientes')
@ApiBearerAuth()
@Controller('clientes/:customerId/contactos')
export class ContactosController {
  constructor(private readonly contactosService: ContactosService) {}

  @ApiOperation({
    summary: 'Listar contactos de un cliente',
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
    const result = await this.contactosService.listar(user, customerId, {
      page: Number(page),
      pageSize: Number(pageSize),
    });
    return { data: result.data, meta: result.meta };
  }

  @ApiOperation({ summary: 'Obtener contacto por id', description: `Requiere ${PERMISO_VER}.` })
  @RequirePermission(PERMISO_VER)
  @Get(':id')
  async obtener(
    @CurrentUser() user: UserContext,
    @Param('customerId') customerId: string,
    @Param('id') id: string,
  ) {
    const contacto = await this.contactosService.obtener(user, customerId, id);
    return { data: contacto };
  }

  @ApiOperation({ summary: 'Crear contacto', description: `Requiere ${PERMISO_GESTIONAR}.` })
  @RequirePermission(PERMISO_GESTIONAR)
  @Post()
  async crear(
    @CurrentUser() user: UserContext,
    @Param('customerId') customerId: string,
    @Body(new ZodValidationPipe(crearContactoSchema)) body: CrearContactoInput,
  ) {
    const contacto = await this.contactosService.crear(user, customerId, body);
    return { data: contacto };
  }

  @ApiOperation({
    summary: 'Actualizar contacto',
    description: `Requiere ${PERMISO_GESTIONAR}. PATCH parcial.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Patch(':id')
  async actualizar(
    @CurrentUser() user: UserContext,
    @Param('customerId') customerId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(actualizarContactoSchema)) body: ActualizarContactoInput,
  ) {
    const contacto = await this.contactosService.actualizar(user, customerId, id, body);
    return { data: contacto };
  }

  @ApiOperation({
    summary: 'Eliminar contacto (baja lógica)',
    description: `Requiere ${PERMISO_GESTIONAR}.`,
  })
  @RequirePermission(PERMISO_GESTIONAR)
  @Delete(':id')
  async eliminar(
    @CurrentUser() user: UserContext,
    @Param('customerId') customerId: string,
    @Param('id') id: string,
  ) {
    const contacto = await this.contactosService.eliminar(user, customerId, id);
    return { data: contacto };
  }
}
