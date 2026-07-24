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
import { MotivosAjusteController } from './controllers/motivos-ajuste.controller';
import { AjustesController } from './controllers/ajustes.controller';
import { ConteosController } from './controllers/conteos.controller';
import { ProgramacionConteosController } from './controllers/programacion-conteos.controller';
import { AlmacenesService } from './services/almacenes.service';
import { ZonasAlmacenService } from './services/zonas-almacen.service';
import { UbicacionesAlmacenService } from './services/ubicaciones-almacen.service';
import { TiposMovimientoService } from './services/tipos-movimiento.service';
import { StockService } from './services/stock.service';
import { MovimientosService } from './services/movimientos.service';
import { KardexService } from './services/kardex.service';
import { ReservasService } from './services/reservas.service';
import { TransferenciasService } from './services/transferencias.service';
import { MotivosAjusteService } from './services/motivos-ajuste.service';
import { AjustesService } from './services/ajustes.service';
import { ConteosService } from './services/conteos.service';
import { ProgramacionConteosService } from './services/programacion-conteos.service';
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
import { MotivoAjusteRepository } from './repositories/motivo-ajuste.repository';
import { MotivoAjusteRepositoryPrisma } from './repositories/motivo-ajuste.repository.prisma';
import { AjusteStockRepository } from './repositories/ajuste-stock.repository';
import { AjusteStockRepositoryPrisma } from './repositories/ajuste-stock.repository.prisma';
import { ConteoFisicoRepository } from './repositories/conteo-fisico.repository';
import { ConteoFisicoRepositoryPrisma } from './repositories/conteo-fisico.repository.prisma';
import { ProgramaConteoCiclicoRepository } from './repositories/programa-conteo-ciclico.repository';
import { ProgramaConteoCiclicoRepositoryPrisma } from './repositories/programa-conteo-ciclico.repository.prisma';

/**
 * `inventario` — Almacenes (FASE 03, continuidad), motor de stock y
 * movimientos (FASE 05 Parte 02), Reservas y Transferencias (Parte 03).
 * FASE 05 Parte 04 agrega Ajustes (`stock_adjustments`/
 * `stock_adjustment_lines`/`stock_adjustment_reasons`) y Conteos
 * Físicos (`physical_counts`/`physical_count_lines`/
 * `cycle_count_schedules`) — el resto de las 34 tablas del schema
 * (recepciones, salidas, costeo, series, lotes, producción) sigue sin
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
    MotivosAjusteController,
    AjustesController,
    ConteosController,
    ProgramacionConteosController,
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
    MotivosAjusteService,
    AjustesService,
    ConteosService,
    ProgramacionConteosService,
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
    { provide: MotivoAjusteRepository, useClass: MotivoAjusteRepositoryPrisma },
    { provide: AjusteStockRepository, useClass: AjusteStockRepositoryPrisma },
    { provide: ConteoFisicoRepository, useClass: ConteoFisicoRepositoryPrisma },
    { provide: ProgramaConteoCiclicoRepository, useClass: ProgramaConteoCiclicoRepositoryPrisma },
  ],
})
export class InventarioModule {}
