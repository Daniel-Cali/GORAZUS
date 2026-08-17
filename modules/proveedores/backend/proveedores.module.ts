import { Module } from '@nestjs/common';
import { DatabaseModule } from '@gorazus/core-database';
import { ProveedoresController } from './controllers/proveedores.controller';
import { ProveedoresService } from './services/proveedores.service';
import { ProveedorRepository } from './repositories/proveedor.repository';
import { ProveedorRepositoryPrisma } from './repositories/proveedor.repository.prisma';
import { SupplierBlockHistoryRepository } from './repositories/supplier-block-history.repository';
import { SupplierBlockHistoryRepositoryPrisma } from './repositories/supplier-block-history.repository.prisma';
import { EmpresaLookupRepository } from './repositories/empresa-lookup.repository';
import { EmpresaLookupRepositoryPrisma } from './repositories/empresa-lookup.repository.prisma';

/**
 * `proveedores` — Compras FASE 2: maestro de proveedores + bloqueo
 * (`suppliers.suppliers`, `suppliers.supplier_block_history`, 2 de las
 * 13 tablas del schema). Contactos/direcciones/cuentas bancarias/
 * crédito/evaluaciones/clasificación/contratos sin código todavía —
 * mismo `@Module` cuando corresponda.
 */
@Module({
  imports: [DatabaseModule],
  controllers: [ProveedoresController],
  providers: [
    ProveedoresService,
    { provide: ProveedorRepository, useClass: ProveedorRepositoryPrisma },
    { provide: SupplierBlockHistoryRepository, useClass: SupplierBlockHistoryRepositoryPrisma },
    { provide: EmpresaLookupRepository, useClass: EmpresaLookupRepositoryPrisma },
  ],
})
export class ProveedoresModule {}
