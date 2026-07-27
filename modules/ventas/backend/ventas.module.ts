import { Module } from '@nestjs/common';
import { DatabaseModule } from '@gorazus/core-database';
import { ContabilidadModule } from '@gorazus/modules/contabilidad';
import { FacturasController } from './controllers/facturas.controller';
import { VentasService } from './services/ventas.service';
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

/**
 * `ventas` — la venta POS es una factura directa (`sales_channel='pos'`,
 * FASE 06 Parte 01): `invoice_status`/`invoices`/`invoice_lines`/
 * `receipts`/`receipt_allocations`, 5 de las 55 tablas del schema
 * `sales`. Cotización/pedido/remito/devolución/garantía/promociones/
 * cupones/lealtad/tarjetas de regalo/suscripciones/venta online siguen
 * sin código, ver `POS_ARCHITECTURE.md §3`.
 */
@Module({
  imports: [DatabaseModule, ContabilidadModule],
  controllers: [FacturasController],
  providers: [
    VentasService,
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
  ],
  // Exportado para el checkout de POS (`modules/pos/backend`) — mismo
  // patrón que `InventarioModule`/`CajaModule`/`ClientesModule`, ver
  // `modules/ventas/index.ts`.
  exports: [VentasService],
})
export class VentasModule {}
