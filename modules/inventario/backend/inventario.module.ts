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
import { CosteoController } from './controllers/costeo.controller';
import { RecepcionesInventarioController } from './controllers/recepciones-inventario.controller';
import { SalidasInventarioController } from './controllers/salidas-inventario.controller';
import { LotesInventarioController } from './controllers/lotes-inventario.controller';
import { SeriesInventarioController } from './controllers/series-inventario.controller';
import { PutawayRulesController } from './controllers/putaway-rules.controller';
import { PickingRulesController } from './controllers/picking-rules.controller';
import { ReplenishmentRulesController } from './controllers/replenishment-rules.controller';
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
import { CosteoService } from './services/costeo.service';
import { RecepcionesInventarioService } from './services/recepciones-inventario.service';
import { SalidasInventarioService } from './services/salidas-inventario.service';
import { LotesInventarioService } from './services/lotes-inventario.service';
import { SeriesInventarioService } from './services/series-inventario.service';
import { PutawayRulesService } from './services/putaway-rules.service';
import { PickingRulesService } from './services/picking-rules.service';
import { ReplenishmentRulesService } from './services/replenishment-rules.service';
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
import { CostingMethodLookupRepository } from './repositories/costing-method-lookup.repository';
import { CostingMethodLookupRepositoryPrisma } from './repositories/costing-method-lookup.repository.prisma';
import { FifoCostLayerRepository } from './repositories/fifo-cost-layer.repository';
import { FifoCostLayerRepositoryPrisma } from './repositories/fifo-cost-layer.repository.prisma';
import { LifoCostLayerRepository } from './repositories/lifo-cost-layer.repository';
import { LifoCostLayerRepositoryPrisma } from './repositories/lifo-cost-layer.repository.prisma';
import { AverageCostHistoryRepository } from './repositories/average-cost-history.repository';
import { AverageCostHistoryRepositoryPrisma } from './repositories/average-cost-history.repository.prisma';
import { GoodsReceiptRepository } from './repositories/goods-receipt.repository';
import { GoodsReceiptRepositoryPrisma } from './repositories/goods-receipt.repository.prisma';
import { GoodsIssueRepository } from './repositories/goods-issue.repository';
import { GoodsIssueRepositoryPrisma } from './repositories/goods-issue.repository.prisma';
import { InventoryLotRepository } from './repositories/inventory-lot.repository';
import { InventoryLotRepositoryPrisma } from './repositories/inventory-lot.repository.prisma';
import { InventorySerialRepository } from './repositories/inventory-serial.repository';
import { InventorySerialRepositoryPrisma } from './repositories/inventory-serial.repository.prisma';
import { PutawayRuleRepository } from './repositories/putaway-rule.repository';
import { PutawayRuleRepositoryPrisma } from './repositories/putaway-rule.repository.prisma';
import { PickingRuleRepository } from './repositories/picking-rule.repository';
import { PickingRuleRepositoryPrisma } from './repositories/picking-rule.repository.prisma';
import { ReplenishmentRuleRepository } from './repositories/replenishment-rule.repository';
import { ReplenishmentRuleRepositoryPrisma } from './repositories/replenishment-rule.repository.prisma';

/**
 * `inventario` — Almacenes (FASE 03, continuidad), motor de stock y
 * movimientos (FASE 05 Parte 02), Reservas y Transferencias (Parte 03).
 * FASE 05 Parte 04 agrega Ajustes (`stock_adjustments`/
 * `stock_adjustment_lines`/`stock_adjustment_reasons`) y Conteos
 * Físicos (`physical_counts`/`physical_count_lines`/
 * `cycle_count_schedules`). Motor de Costeo (`ADR-INV-004` fase 1,
 * FIFO/LIFO/Promedio Ponderado — `fifo_cost_layers`/`lifo_cost_layers`/
 * `average_cost_history`) conectado a `MovimientosService` desde
 * Recepciones (Parte 05 Subfase 1) y Salidas (Subfase 2). Subfase 3
 * agrega Lotes y Series (`inventory_lots`/`inventory_serials`,
 * `stock_movements.lot_id`/`serial_id` — `46_stock_movements_lot_serial_traceability.sql`).
 * Prompt 1 (Foundation Completion) propaga lote/serie a Transferencias/
 * Ajustes/Reservas/Conteos Físicos/Conteos Cíclicos
 * (`47_transfers_adjustments_reservations_counts_lot_serial.sql`) y agrega
 * WMS Basic (Putaway/Picking/Replenishment Rules, tablas certificadas sin
 * código previo). Standard/Specific/Landed/Replacement Cost y producción
 * siguen sin código, ver `INVENTORY_NEXT_PHASE.md`.
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
    CosteoController,
    RecepcionesInventarioController,
    SalidasInventarioController,
    LotesInventarioController,
    SeriesInventarioController,
    PutawayRulesController,
    PickingRulesController,
    ReplenishmentRulesController,
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
    CosteoService,
    RecepcionesInventarioService,
    SalidasInventarioService,
    LotesInventarioService,
    SeriesInventarioService,
    PutawayRulesService,
    PickingRulesService,
    ReplenishmentRulesService,
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
    { provide: CostingMethodLookupRepository, useClass: CostingMethodLookupRepositoryPrisma },
    { provide: FifoCostLayerRepository, useClass: FifoCostLayerRepositoryPrisma },
    { provide: LifoCostLayerRepository, useClass: LifoCostLayerRepositoryPrisma },
    { provide: AverageCostHistoryRepository, useClass: AverageCostHistoryRepositoryPrisma },
    { provide: GoodsReceiptRepository, useClass: GoodsReceiptRepositoryPrisma },
    { provide: GoodsIssueRepository, useClass: GoodsIssueRepositoryPrisma },
    { provide: InventoryLotRepository, useClass: InventoryLotRepositoryPrisma },
    { provide: InventorySerialRepository, useClass: InventorySerialRepositoryPrisma },
    { provide: PutawayRuleRepository, useClass: PutawayRuleRepositoryPrisma },
    { provide: PickingRuleRepository, useClass: PickingRuleRepositoryPrisma },
    { provide: ReplenishmentRuleRepository, useClass: ReplenishmentRuleRepositoryPrisma },
  ],
  // `StockService`/`MovimientosService`/`TiposMovimientoService` exportados
  // para el checkout de POS (FASE 06 Parte 01, `modules/pos/backend`) —
  // primer consumidor real del patrón de barrel documentado en
  // `docs/architecture/01-estructura-monorepo.md §5` ("`modules/<x>/backend`
  // puede importar `modules/<y>/index.ts`"), nunca importado por ruta
  // profunda. `ReservasService` exportado para Pedidos de Venta (Módulo de
  // Ventas Enterprise Parte 1, `modules/ventas/backend`) — reserva real de
  // inventario al crear un pedido. Ver `modules/inventario/index.ts`.
  exports: [
    StockService,
    MovimientosService,
    TiposMovimientoService,
    ReservasService,
    AlmacenesService,
  ],
})
export class InventarioModule {}
