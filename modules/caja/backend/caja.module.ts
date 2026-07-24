import { Module } from '@nestjs/common';
import { DatabaseModule } from '@gorazus/core-database';
import { CajaController } from './controllers/caja.controller';
import { CajaService } from './services/caja.service';
import { CajaRegistroRepository } from './repositories/caja-registro.repository';
import { CajaRegistroRepositoryPrisma } from './repositories/caja-registro.repository.prisma';
import { AperturaCajaRepository } from './repositories/apertura-caja.repository';
import { AperturaCajaRepositoryPrisma } from './repositories/apertura-caja.repository.prisma';
import { CierreCajaRepository } from './repositories/cierre-caja.repository';
import { CierreCajaRepositoryPrisma } from './repositories/cierre-caja.repository.prisma';
import { TipoMovimientoCajaRepository } from './repositories/tipo-movimiento-caja.repository';
import { TipoMovimientoCajaRepositoryPrisma } from './repositories/tipo-movimiento-caja.repository.prisma';
import { MovimientoCajaRepository } from './repositories/movimiento-caja.repository';
import { MovimientoCajaRepositoryPrisma } from './repositories/movimiento-caja.repository.prisma';
import { EmpresaSucursalLookupRepository } from './repositories/empresa-sucursal-lookup.repository';
import { EmpresaSucursalLookupRepositoryPrisma } from './repositories/empresa-sucursal-lookup.repository.prisma';

/**
 * `caja` — registros, apertura/cierre de turno, movimientos (FASE 06
 * Parte 01, `POS_ARCHITECTURE.md §3`). Sin arqueo por denominación
 * (`cash_counts`/`cash_count_lines`), sin transferencias entre cajas ni
 * caja chica — 4 de las 11 tablas del schema `cash`.
 */
@Module({
  imports: [DatabaseModule],
  controllers: [CajaController],
  providers: [
    CajaService,
    { provide: CajaRegistroRepository, useClass: CajaRegistroRepositoryPrisma },
    { provide: AperturaCajaRepository, useClass: AperturaCajaRepositoryPrisma },
    { provide: CierreCajaRepository, useClass: CierreCajaRepositoryPrisma },
    { provide: TipoMovimientoCajaRepository, useClass: TipoMovimientoCajaRepositoryPrisma },
    { provide: MovimientoCajaRepository, useClass: MovimientoCajaRepositoryPrisma },
    {
      provide: EmpresaSucursalLookupRepository,
      useClass: EmpresaSucursalLookupRepositoryPrisma,
    },
  ],
  // Exportado para el checkout de POS (`modules/pos/backend`) — mismo
  // patrón que `InventarioModule`, ver `modules/caja/index.ts`.
  exports: [CajaService],
})
export class CajaModule {}
