import { Module } from '@nestjs/common';
import { DatabaseModule } from '@gorazus/core-database';
import { SolicitudesCompraController } from './controllers/solicitudes-compra.controller';
import { SolicitudesCompraService } from './services/solicitudes-compra.service';
import { SolicitudCompraRepository } from './repositories/solicitud-compra.repository';
import { SolicitudCompraRepositoryPrisma } from './repositories/solicitud-compra.repository.prisma';
import { EstadoSolicitudCompraRepository } from './repositories/estado-solicitud-compra.repository';
import { EstadoSolicitudCompraRepositoryPrisma } from './repositories/estado-solicitud-compra.repository.prisma';
import { HistorialEstadoSolicitudRepository } from './repositories/historial-estado-solicitud.repository';
import { HistorialEstadoSolicitudRepositoryPrisma } from './repositories/historial-estado-solicitud.repository.prisma';
import { OrdenesCompraController } from './controllers/ordenes-compra.controller';
import { OrdenesCompraService } from './services/ordenes-compra.service';
import { OrdenCompraRepository } from './repositories/orden-compra.repository';
import { OrdenCompraRepositoryPrisma } from './repositories/orden-compra.repository.prisma';
import { EstadoOrdenCompraRepository } from './repositories/estado-orden-compra.repository';
import { EstadoOrdenCompraRepositoryPrisma } from './repositories/estado-orden-compra.repository.prisma';
import { HistorialEstadoOrdenRepository } from './repositories/historial-estado-orden.repository';
import { HistorialEstadoOrdenRepositoryPrisma } from './repositories/historial-estado-orden.repository.prisma';
import { RecepcionesCompraController } from './controllers/recepciones-compra.controller';
import { RecepcionesCompraService } from './services/recepciones-compra.service';
import { RecepcionCompraRepository } from './repositories/recepcion-compra.repository';
import { RecepcionCompraRepositoryPrisma } from './repositories/recepcion-compra.repository.prisma';
import { FacturasCompraController } from './controllers/facturas-compra.controller';
import { FacturasCompraService } from './services/facturas-compra.service';
import { FacturaCompraRepository } from './repositories/factura-compra.repository';
import { FacturaCompraRepositoryPrisma } from './repositories/factura-compra.repository.prisma';
import { EstadoFacturaCompraRepository } from './repositories/estado-factura-compra.repository';
import { EstadoFacturaCompraRepositoryPrisma } from './repositories/estado-factura-compra.repository.prisma';
import { HistorialEstadoFacturaRepository } from './repositories/historial-estado-factura.repository';
import { HistorialEstadoFacturaRepositoryPrisma } from './repositories/historial-estado-factura.repository.prisma';
import { CotejosCompraController } from './controllers/cotejos-compra.controller';
import { CotejosCompraService } from './services/cotejos-compra.service';
import { CotejoCompraRepository } from './repositories/cotejo-compra.repository';
import { CotejoCompraRepositoryPrisma } from './repositories/cotejo-compra.repository.prisma';
import { DevolucionesCompraController } from './controllers/devoluciones-compra.controller';
import { DevolucionesCompraService } from './services/devoluciones-compra.service';
import { DevolucionCompraRepository } from './repositories/devolucion-compra.repository';
import { DevolucionCompraRepositoryPrisma } from './repositories/devolucion-compra.repository.prisma';
import { NotasCreditoCompraController } from './controllers/notas-credito-compra.controller';
import { NotasCreditoCompraService } from './services/notas-credito-compra.service';
import { NotaCreditoCompraRepository } from './repositories/nota-credito-compra.repository';
import { NotaCreditoCompraRepositoryPrisma } from './repositories/nota-credito-compra.repository.prisma';
import { RetencionesCompraController } from './controllers/retenciones-compra.controller';
import { RetencionesCompraService } from './services/retenciones-compra.service';
import { RetencionCompraRepository } from './repositories/retencion-compra.repository';
import { RetencionCompraRepositoryPrisma } from './repositories/retencion-compra.repository.prisma';
import { ImportacionesController } from './controllers/importaciones.controller';
import { ImportacionesService } from './services/importaciones.service';
import { ExpedienteImportacionRepository } from './repositories/expediente-importacion.repository';
import { ExpedienteImportacionRepositoryPrisma } from './repositories/expediente-importacion.repository.prisma';
import { EstadoImportacionRepository } from './repositories/estado-importacion.repository';
import { EstadoImportacionRepositoryPrisma } from './repositories/estado-importacion.repository.prisma';
import { HistorialEstadoImportacionRepository } from './repositories/historial-estado-importacion.repository';
import { HistorialEstadoImportacionRepositoryPrisma } from './repositories/historial-estado-importacion.repository.prisma';
import { GastoImportacionRepository } from './repositories/gasto-importacion.repository';
import { GastoImportacionRepositoryPrisma } from './repositories/gasto-importacion.repository.prisma';
import { ProveedorLookupRepository } from './repositories/proveedor-lookup.repository';
import { ProveedorLookupRepositoryPrisma } from './repositories/proveedor-lookup.repository.prisma';
import { EmpresaSucursalLookupRepository } from './repositories/empresa-sucursal-lookup.repository';
import { EmpresaSucursalLookupRepositoryPrisma } from './repositories/empresa-sucursal-lookup.repository.prisma';
import { ProductoLookupRepository } from './repositories/producto-lookup.repository';
import { ProductoLookupRepositoryPrisma } from './repositories/producto-lookup.repository.prisma';

/**
 * `compras` — bounded context del schema `purchases`, un módulo dueño
 * único (igual que `productos`/`ventas`). FASE 3: Purchase Requisition.
 * FASE 4: Purchase Order. FASE 5: Goods Receipt. FASE 6: Purchase
 * Invoice (cabecera particionada, ver `FacturaCompraRepository`). FASE 7:
 * Purchase Matching (resultado calculado, sin flujo de estados). FASE 8: Purchase Returns (mismo patrón sin estado que Goods Receipt).
 * FASE 9: Purchase Credit Notes (monto derivado del costo de la
 * factura, sin precio propio). FASE 10: Purchase Withholdings (registro a nivel de cabecera
 * de factura, sin líneas propias). FASE 11 agrega Imports
 * (`imports`/`import_status`/`import_status_history`/`import_expenses`,
 * 27 de 27 tablas del schema — schema `purchases` completo). Última
 * fase del roadmap autorizado.
 */
@Module({
  imports: [DatabaseModule],
  controllers: [
    SolicitudesCompraController,
    OrdenesCompraController,
    RecepcionesCompraController,
    FacturasCompraController,
    CotejosCompraController,
    DevolucionesCompraController,
    NotasCreditoCompraController,
    RetencionesCompraController,
    ImportacionesController,
  ],
  providers: [
    SolicitudesCompraService,
    { provide: SolicitudCompraRepository, useClass: SolicitudCompraRepositoryPrisma },
    { provide: EstadoSolicitudCompraRepository, useClass: EstadoSolicitudCompraRepositoryPrisma },
    {
      provide: HistorialEstadoSolicitudRepository,
      useClass: HistorialEstadoSolicitudRepositoryPrisma,
    },
    OrdenesCompraService,
    { provide: OrdenCompraRepository, useClass: OrdenCompraRepositoryPrisma },
    { provide: EstadoOrdenCompraRepository, useClass: EstadoOrdenCompraRepositoryPrisma },
    { provide: HistorialEstadoOrdenRepository, useClass: HistorialEstadoOrdenRepositoryPrisma },
    RecepcionesCompraService,
    { provide: RecepcionCompraRepository, useClass: RecepcionCompraRepositoryPrisma },
    FacturasCompraService,
    { provide: FacturaCompraRepository, useClass: FacturaCompraRepositoryPrisma },
    { provide: EstadoFacturaCompraRepository, useClass: EstadoFacturaCompraRepositoryPrisma },
    {
      provide: HistorialEstadoFacturaRepository,
      useClass: HistorialEstadoFacturaRepositoryPrisma,
    },
    CotejosCompraService,
    { provide: CotejoCompraRepository, useClass: CotejoCompraRepositoryPrisma },
    DevolucionesCompraService,
    { provide: DevolucionCompraRepository, useClass: DevolucionCompraRepositoryPrisma },
    NotasCreditoCompraService,
    { provide: NotaCreditoCompraRepository, useClass: NotaCreditoCompraRepositoryPrisma },
    RetencionesCompraService,
    { provide: RetencionCompraRepository, useClass: RetencionCompraRepositoryPrisma },
    ImportacionesService,
    { provide: ExpedienteImportacionRepository, useClass: ExpedienteImportacionRepositoryPrisma },
    { provide: EstadoImportacionRepository, useClass: EstadoImportacionRepositoryPrisma },
    {
      provide: HistorialEstadoImportacionRepository,
      useClass: HistorialEstadoImportacionRepositoryPrisma,
    },
    { provide: GastoImportacionRepository, useClass: GastoImportacionRepositoryPrisma },
    { provide: ProveedorLookupRepository, useClass: ProveedorLookupRepositoryPrisma },
    {
      provide: EmpresaSucursalLookupRepository,
      useClass: EmpresaSucursalLookupRepositoryPrisma,
    },
    { provide: ProductoLookupRepository, useClass: ProductoLookupRepositoryPrisma },
  ],
})
export class ComprasModule {}
