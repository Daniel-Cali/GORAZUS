import { Module } from '@nestjs/common';
import { DatabaseModule } from '@gorazus/core-database';
import { ClientesController } from './controllers/clientes.controller';
import { ClientesService } from './services/clientes.service';
import { ClienteRepository } from './repositories/cliente.repository';
import { ClienteRepositoryPrisma } from './repositories/cliente.repository.prisma';
import { EmpresaSucursalLookupRepository } from './repositories/empresa-sucursal-lookup.repository';
import { EmpresaSucursalLookupRepositoryPrisma } from './repositories/empresa-sucursal-lookup.repository.prisma';

/**
 * `clientes` — CRUD mínimo de `customers.customers` (FASE 06 Parte 01,
 * requisito del checkout de POS) + resolución del cliente sentinela
 * "Consumidor Final". El resto de las 17 tablas del schema (perfil de
 * crédito, clasificación, rutas de venta, visitas, lista de precios,
 * lealtad) sigue sin código, ver `POS_ARCHITECTURE.md §3`.
 */
@Module({
  imports: [DatabaseModule],
  controllers: [ClientesController],
  providers: [
    ClientesService,
    { provide: ClienteRepository, useClass: ClienteRepositoryPrisma },
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
