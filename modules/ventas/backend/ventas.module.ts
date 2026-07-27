import { Module } from '@nestjs/common';
import { DatabaseModule } from '@gorazus/core-database';
import { ContabilidadModule } from '@gorazus/modules/contabilidad';
import { InventarioModule } from '@gorazus/modules/inventario';
import { FacturasController } from './controllers/facturas.controller';
import { CotizacionesController } from './controllers/cotizaciones.controller';
import { PedidosVentaController } from './controllers/pedidos-venta.controller';
import { VentasService } from './services/ventas.service';
import { CotizacionesService } from './services/cotizaciones.service';
import { PedidosVentaService } from './services/pedidos-venta.service';
import { FacturaRepository } from './repositories/factura.repository';
import { FacturaRepositoryPrisma } from './repositories/factura.repository.prisma';
import { EstadoFacturaRepository } from './repositories/estado-factura.repository';
import { EstadoFacturaRepositoryPrisma } from './repositories/estado-factura.repository.prisma';
import { ReciboRepository } from './repositories/recibo.repository';
import { ReciboRepositoryPrisma } from './repositories/recibo.repository.prisma';
import { ProductoLookupRepository } from './repositories/producto-lookup.repository';
import { ProductoLookupRepositoryPrisma } from './repositories/producto-lookup.repository.prisma';
import { ClienteLookupRepository } from './repositories/cliente-lookup.repository';
import { ClienteLookupRepositoryPrisma } from './repositories/cliente-lookup.repository.prisma';
import { EmpresaSucursalLookupRepository } from './repositories/empresa-sucursal-lookup.repository';
import { EmpresaSucursalLookupRepositoryPrisma } from './repositories/empresa-sucursal-lookup.repository.prisma';
import { TasaImpuestoLookupRepository } from './repositories/tasa-impuesto-lookup.repository';
import { TasaImpuestoLookupRepositoryPrisma } from './repositories/tasa-impuesto-lookup.repository.prisma';
import { EstadoCotizacionRepository } from './repositories/estado-cotizacion.repository';
import { EstadoCotizacionRepositoryPrisma } from './repositories/estado-cotizacion.repository.prisma';
import { CotizacionRepository } from './repositories/cotizacion.repository';
import { CotizacionRepositoryPrisma } from './repositories/cotizacion.repository.prisma';
import { EstadoPedidoRepository } from './repositories/estado-pedido.repository';
import { EstadoPedidoRepositoryPrisma } from './repositories/estado-pedido.repository.prisma';
import { PedidoRepository } from './repositories/pedido.repository';
import { PedidoRepositoryPrisma } from './repositories/pedido.repository.prisma';

/**
 * `ventas` — la venta POS es una factura directa (`sales_channel='pos'`,
 * FASE 06 Parte 01). Módulo de Ventas Enterprise Parte 1 (Cotización →
 * Pedido → Factura) agrega `quotes`/`quote_lines`/`quote_status`/
 * `quote_status_history` y `sales_orders`/`sales_order_lines`/
 * `sales_order_status`/`sales_order_status_history` — 13 de las 55
 * tablas del schema `sales` en total. Comprobantes fiscales/NCF, listas
 * de precios, descuentos/promociones avanzados, devoluciones, entregas,
 * comisiones y suscripciones siguen sin código, ver
 * `docs/reports/ventas/SALES_ROADMAP.md`.
 */
@Module({
  imports: [DatabaseModule, ContabilidadModule, InventarioModule],
  controllers: [FacturasController, CotizacionesController, PedidosVentaController],
  providers: [
    VentasService,
    CotizacionesService,
    PedidosVentaService,
    { provide: FacturaRepository, useClass: FacturaRepositoryPrisma },
    { provide: EstadoFacturaRepository, useClass: EstadoFacturaRepositoryPrisma },
    { provide: ReciboRepository, useClass: ReciboRepositoryPrisma },
    { provide: ProductoLookupRepository, useClass: ProductoLookupRepositoryPrisma },
    { provide: ClienteLookupRepository, useClass: ClienteLookupRepositoryPrisma },
    {
      provide: EmpresaSucursalLookupRepository,
      useClass: EmpresaSucursalLookupRepositoryPrisma,
    },
    { provide: TasaImpuestoLookupRepository, useClass: TasaImpuestoLookupRepositoryPrisma },
    { provide: EstadoCotizacionRepository, useClass: EstadoCotizacionRepositoryPrisma },
    { provide: CotizacionRepository, useClass: CotizacionRepositoryPrisma },
    { provide: EstadoPedidoRepository, useClass: EstadoPedidoRepositoryPrisma },
    { provide: PedidoRepository, useClass: PedidoRepositoryPrisma },
  ],
  // Exportado para el checkout de POS (`modules/pos/backend`) — mismo
  // patrón que `InventarioModule`/`CajaModule`/`ClientesModule`, ver
  // `modules/ventas/index.ts`.
  exports: [VentasService],
})
export class VentasModule {}
