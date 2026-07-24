import { Module } from '@nestjs/common';
import { DatabaseModule } from '@gorazus/core-database';
import { AlmacenesController } from './controllers/almacenes.controller';
import { ZonasAlmacenController } from './controllers/zonas-almacen.controller';
import { UbicacionesAlmacenController } from './controllers/ubicaciones-almacen.controller';
import { TiposMovimientoController } from './controllers/tipos-movimiento.controller';
import { StockController } from './controllers/stock.controller';
import { MovimientosController } from './controllers/movimientos.controller';
import { KardexController } from './controllers/kardex.controller';
import { ReservasController } from './controllers/reservas.controller';
import { TransferenciasController } from './controllers/transferencias.controller';
import { AlmacenesService } from './services/almacenes.service';
import { ZonasAlmacenService } from './services/zonas-almacen.service';
import { UbicacionesAlmacenService } from './services/ubicaciones-almacen.service';
import { TiposMovimientoService } from './services/tipos-movimiento.service';
import { StockService } from './services/stock.service';
import { MovimientosService } from './services/movimientos.service';
import { KardexService } from './services/kardex.service';
import { ReservasService } from './services/reservas.service';
import { TransferenciasService } from './services/transferencias.service';
import { AlmacenRepository } from './repositories/almacen.repository';
import { AlmacenRepositoryPrisma } from './repositories/almacen.repository.prisma';
import { ZonaAlmacenRepository } from './repositories/zona-almacen.repository';
import { ZonaAlmacenRepositoryPrisma } from './repositories/zona-almacen.repository.prisma';
import { UbicacionAlmacenRepository } from './repositories/ubicacion-almacen.repository';
import { UbicacionAlmacenRepositoryPrisma } from './repositories/ubicacion-almacen.repository.prisma';
import { EmpresaSucursalLookupRepository } from './repositories/empresa-sucursal-lookup.repository';
import { EmpresaSucursalLookupRepositoryPrisma } from './repositories/empresa-sucursal-lookup.repository.prisma';
import { ProductoLookupRepository } from './repositories/producto-lookup.repository';
import { ProductoLookupRepositoryPrisma } from './repositories/producto-lookup.repository.prisma';
import { TipoMovimientoStockRepository } from './repositories/tipo-movimiento-stock.repository';
import { TipoMovimientoStockRepositoryPrisma } from './repositories/tipo-movimiento-stock.repository.prisma';
import { StockRepository } from './repositories/stock.repository';
import { StockRepositoryPrisma } from './repositories/stock.repository.prisma';
import { MovimientoStockRepository } from './repositories/movimiento-stock.repository';
import { MovimientoStockRepositoryPrisma } from './repositories/movimiento-stock.repository.prisma';
import { KardexRepository } from './repositories/kardex.repository';
import { KardexRepositoryPrisma } from './repositories/kardex.repository.prisma';
import { ReservaStockRepository } from './repositories/reserva-stock.repository';
import { ReservaStockRepositoryPrisma } from './repositories/reserva-stock.repository.prisma';
import { TransferenciaRepository } from './repositories/transferencia.repository';
import { TransferenciaRepositoryPrisma } from './repositories/transferencia.repository.prisma';

/**
 * `inventario` — Almacenes (FASE 03, continuidad): estructura física
 * Almacén → Zona → Ubicación. FASE 05 Parte 02 agregó el motor de stock
 * y movimientos (`stock`/`stock_movement_types`/`stock_movements`,
 * `INVENTORY_ARCHITECTURE.md §6`). FASE 05 Parte 03 agrega Reservas
 * (`stock_reservations`) y Transferencias (`stock_transfers`/
 * `stock_transfer_lines`), ambas orquestando el motor de movimientos ya
 * construido — el resto del schema `inventory` (ajustes, conteos,
 * recepciones, salidas, costeo, series, lotes, producción) sigue sin
 * código, ver `INVENTORY_NEXT_PHASE.md`.
 */
@Module({
  imports: [DatabaseModule],
  controllers: [
    AlmacenesController,
    ZonasAlmacenController,
    UbicacionesAlmacenController,
    TiposMovimientoController,
    StockController,
    MovimientosController,
    KardexController,
    ReservasController,
    TransferenciasController,
  ],
  providers: [
    AlmacenesService,
    ZonasAlmacenService,
    UbicacionesAlmacenService,
    TiposMovimientoService,
    StockService,
    MovimientosService,
    KardexService,
    ReservasService,
    TransferenciasService,
    { provide: AlmacenRepository, useClass: AlmacenRepositoryPrisma },
    { provide: ZonaAlmacenRepository, useClass: ZonaAlmacenRepositoryPrisma },
    { provide: UbicacionAlmacenRepository, useClass: UbicacionAlmacenRepositoryPrisma },
    {
      provide: EmpresaSucursalLookupRepository,
      useClass: EmpresaSucursalLookupRepositoryPrisma,
    },
    { provide: ProductoLookupRepository, useClass: ProductoLookupRepositoryPrisma },
    { provide: TipoMovimientoStockRepository, useClass: TipoMovimientoStockRepositoryPrisma },
    { provide: StockRepository, useClass: StockRepositoryPrisma },
    { provide: MovimientoStockRepository, useClass: MovimientoStockRepositoryPrisma },
    { provide: KardexRepository, useClass: KardexRepositoryPrisma },
    { provide: ReservaStockRepository, useClass: ReservaStockRepositoryPrisma },
    { provide: TransferenciaRepository, useClass: TransferenciaRepositoryPrisma },
  ],
})
export class InventarioModule {}
