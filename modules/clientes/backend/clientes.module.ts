import { Module } from '@nestjs/common';
import { DatabaseModule } from '@gorazus/core-database';
import { ClientesController } from './controllers/clientes.controller';
import { ContactosController } from './controllers/contactos.controller';
import { DireccionesController } from './controllers/direcciones.controller';
import { CuentasPorCobrarController } from './controllers/cuentas-por-cobrar.controller';
import { ClientesService } from './services/clientes.service';
import { ContactosService } from './services/contactos.service';
import { DireccionesService } from './services/direcciones.service';
import { CuentasPorCobrarService } from './services/cuentas-por-cobrar.service';
import { ClienteRepository } from './repositories/cliente.repository';
import { ClienteRepositoryPrisma } from './repositories/cliente.repository.prisma';
import { ContactoClienteRepository } from './repositories/contacto-cliente.repository';
import { ContactoClienteRepositoryPrisma } from './repositories/contacto-cliente.repository.prisma';
import { DireccionClienteRepository } from './repositories/direccion-cliente.repository';
import { DireccionClienteRepositoryPrisma } from './repositories/direccion-cliente.repository.prisma';
import { CuentaPorCobrarRepository } from './repositories/cuenta-por-cobrar.repository';
import { CuentaPorCobrarRepositoryPrisma } from './repositories/cuenta-por-cobrar.repository.prisma';
import { EmpresaSucursalLookupRepository } from './repositories/empresa-sucursal-lookup.repository';
import { EmpresaSucursalLookupRepositoryPrisma } from './repositories/empresa-sucursal-lookup.repository.prisma';

/**
 * `clientes` — CRUD de `customers.customers` (FASE 06 Parte 01, requisito
 * del checkout de POS) + resolución del cliente sentinela "Consumidor
 * Final" + Clientes Parte 02 (Customer 360): contactos, direcciones, y
 * cuentas por cobrar (integración de solo lectura con `sales`, sobre
 * `v_accounts_receivable_aging`). El resto de las 17 tablas del schema
 * (categorías, notas, perfil de crédito, listas de precio, rutas de
 * venta, visitas, lealtad) sigue sin código, ver
 * `docs/reports/crm/CRM_ROADMAP.md`.
 */
@Module({
  imports: [DatabaseModule],
  controllers: [
    ClientesController,
    ContactosController,
    DireccionesController,
    CuentasPorCobrarController,
  ],
  providers: [
    ClientesService,
    ContactosService,
    DireccionesService,
    CuentasPorCobrarService,
    { provide: ClienteRepository, useClass: ClienteRepositoryPrisma },
    { provide: ContactoClienteRepository, useClass: ContactoClienteRepositoryPrisma },
    { provide: DireccionClienteRepository, useClass: DireccionClienteRepositoryPrisma },
    { provide: CuentaPorCobrarRepository, useClass: CuentaPorCobrarRepositoryPrisma },
    {
      provide: EmpresaSucursalLookupRepository,
      useClass: EmpresaSucursalLookupRepositoryPrisma,
    },
  ],
  // Exportado para el checkout de POS (`modules/pos/backend`) — mismo
  // patrón que `InventarioModule`/`CajaModule`, ver `modules/clientes/index.ts`.
  exports: [ClientesService],
})
export class ClientesModule {}
