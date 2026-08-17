import { Module } from '@nestjs/common';
import { DatabaseModule } from '@gorazus/core-database';
import { InventarioModule } from '@gorazus/modules/inventario';
import { VentasModule } from '@gorazus/modules/ventas';
import { CajaModule } from '@gorazus/modules/caja';
import { ClientesModule } from '@gorazus/modules/clientes';
import { PosController } from './controllers/pos.controller';
import { PosCheckoutService } from './services/pos-checkout.service';
import { ProductoLookupRepository } from './repositories/producto-lookup.repository';
import { ProductoLookupRepositoryPrisma } from './repositories/producto-lookup.repository.prisma';
import { CheckoutIdempotencyRepository } from './repositories/checkout-idempotency.repository';
import { CheckoutIdempotencyRepositoryPrisma } from './repositories/checkout-idempotency.repository.prisma';

/**
 * `pos` — orquestador del checkout (FASE 06 Parte 01, sin tablas
 * propias). Compone `InventarioModule`/`VentasModule`/`CajaModule`/
 * `ClientesModule` vía sus barrels públicos (`modules/<x>/index.ts`),
 * primer consumidor real del patrón documentado en
 * `docs/architecture/01-estructura-monorepo.md §5`. Ver
 * `POS_ARCHITECTURE.md §4.3` para el detalle de la transacción de
 * checkout (y su límite real: no es atómica entre schemas).
 */
@Module({
  imports: [DatabaseModule, InventarioModule, VentasModule, CajaModule, ClientesModule],
  controllers: [PosController],
  providers: [
    PosCheckoutService,
    { provide: ProductoLookupRepository, useClass: ProductoLookupRepositoryPrisma },
    { provide: CheckoutIdempotencyRepository, useClass: CheckoutIdempotencyRepositoryPrisma },
  ],
})
export class PosModule {}
