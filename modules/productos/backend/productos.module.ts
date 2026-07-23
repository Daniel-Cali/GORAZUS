import { Module } from '@nestjs/common';
import { DatabaseModule } from '@gorazus/core-database';
import { UnidadesMedidaController } from './controllers/unidades-medida.controller';
import { CategoriasProductoController } from './controllers/categorias-producto.controller';
import { MarcasController } from './controllers/marcas.controller';
import { ModelosProductoController } from './controllers/modelos-producto.controller';
import { ProductosController } from './controllers/productos.controller';
import { UnidadesMedidaService } from './services/unidades-medida.service';
import { CategoriasProductoService } from './services/categorias-producto.service';
import { MarcasService } from './services/marcas.service';
import { ModelosProductoService } from './services/modelos-producto.service';
import { ProductosService } from './services/productos.service';
import { UnidadMedidaRepository } from './repositories/unidad-medida.repository';
import { UnidadMedidaRepositoryPrisma } from './repositories/unidad-medida.repository.prisma';
import { CategoriaProductoRepository } from './repositories/categoria-producto.repository';
import { CategoriaProductoRepositoryPrisma } from './repositories/categoria-producto.repository.prisma';
import { MarcaRepository } from './repositories/marca.repository';
import { MarcaRepositoryPrisma } from './repositories/marca.repository.prisma';
import { ModeloProductoRepository } from './repositories/modelo-producto.repository';
import { ModeloProductoRepositoryPrisma } from './repositories/modelo-producto.repository.prisma';
import { ProductoRepository } from './repositories/producto.repository';
import { ProductoRepositoryPrisma } from './repositories/producto.repository.prisma';
import { EmpresaLookupRepository } from './repositories/empresa-lookup.repository';
import { EmpresaLookupRepositoryPrisma } from './repositories/empresa-lookup.repository.prisma';

/**
 * `productos` — Unidades de Medida, Categorías, Marcas, Modelos,
 * Productos (FASE 04: alcance del producto base, no variantes/combos/
 * kits/BOM/atributos/imágenes — docs/architecture/18-modulo-products.md).
 * El resto de las 35 tablas del schema `products` es trabajo de una
 * parte siguiente, mismo `@Module` cuando corresponda.
 */
@Module({
  imports: [DatabaseModule],
  controllers: [
    UnidadesMedidaController,
    CategoriasProductoController,
    MarcasController,
    ModelosProductoController,
    ProductosController,
  ],
  providers: [
    UnidadesMedidaService,
    CategoriasProductoService,
    MarcasService,
    ModelosProductoService,
    ProductosService,
    { provide: UnidadMedidaRepository, useClass: UnidadMedidaRepositoryPrisma },
    { provide: CategoriaProductoRepository, useClass: CategoriaProductoRepositoryPrisma },
    { provide: MarcaRepository, useClass: MarcaRepositoryPrisma },
    { provide: ModeloProductoRepository, useClass: ModeloProductoRepositoryPrisma },
    { provide: ProductoRepository, useClass: ProductoRepositoryPrisma },
    { provide: EmpresaLookupRepository, useClass: EmpresaLookupRepositoryPrisma },
  ],
})
export class ProductosModule {}
