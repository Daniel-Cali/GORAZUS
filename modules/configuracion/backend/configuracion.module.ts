import { Module } from '@nestjs/common';
import { DatabaseModule } from '@gorazus/core-database';
import { EmpresasController } from './controllers/empresas.controller';
import { SucursalesController } from './controllers/sucursales.controller';
import { ParametrosController } from './controllers/parametros.controller';
import { ConfiguracionController } from './controllers/configuracion.controller';
import { MonedasController } from './controllers/monedas.controller';
import { ImpuestosController } from './controllers/impuestos.controller';
import { TasasImpuestoController } from './controllers/tasas-impuesto.controller';
import { FormasPagoController } from './controllers/formas-pago.controller';
import { EmpresasService } from './services/empresas.service';
import { SucursalesService } from './services/sucursales.service';
import { ParametrosService } from './services/parametros.service';
import { ConfiguracionService } from './services/configuracion.service';
import { MonedasService } from './services/monedas.service';
import { ImpuestosService } from './services/impuestos.service';
import { TasasImpuestoService } from './services/tasas-impuesto.service';
import { EmpresaRepository } from './repositories/empresa.repository';
import { EmpresaRepositoryPrisma } from './repositories/empresa.repository.prisma';
import { SucursalRepository } from './repositories/sucursal.repository';
import { SucursalRepositoryPrisma } from './repositories/sucursal.repository.prisma';
import { ParametroRepository } from './repositories/parametro.repository';
import { ParametroRepositoryPrisma } from './repositories/parametro.repository.prisma';
import { ConfiguracionValorRepository } from './repositories/configuracion-valor.repository';
import { ConfiguracionValorRepositoryPrisma } from './repositories/configuracion-valor.repository.prisma';
import { MonedaRepository } from './repositories/moneda.repository';
import { MonedaRepositoryPrisma } from './repositories/moneda.repository.prisma';
import { ImpuestoRepository } from './repositories/impuesto.repository';
import { ImpuestoRepositoryPrisma } from './repositories/impuesto.repository.prisma';
import { TasaImpuestoRepository } from './repositories/tasa-impuesto.repository';
import { TasaImpuestoRepositoryPrisma } from './repositories/tasa-impuesto.repository.prisma';
import { JurisdiccionRepository } from './repositories/jurisdiccion.repository';
import { JurisdiccionRepositoryPrisma } from './repositories/jurisdiccion.repository.prisma';
import { FormasPagoService } from './services/formas-pago.service';
import { FormaPagoRepository } from './repositories/forma-pago.repository';
import { FormaPagoRepositoryPrisma } from './repositories/forma-pago.repository.prisma';

@Module({
  imports: [DatabaseModule],
  controllers: [
    EmpresasController,
    SucursalesController,
    ParametrosController,
    ConfiguracionController,
    MonedasController,
    ImpuestosController,
    TasasImpuestoController,
    FormasPagoController,
  ],
  providers: [
    EmpresasService,
    SucursalesService,
    ParametrosService,
    ConfiguracionService,
    MonedasService,
    ImpuestosService,
    TasasImpuestoService,
    FormasPagoService,
    { provide: EmpresaRepository, useClass: EmpresaRepositoryPrisma },
    { provide: SucursalRepository, useClass: SucursalRepositoryPrisma },
    { provide: ParametroRepository, useClass: ParametroRepositoryPrisma },
    { provide: ConfiguracionValorRepository, useClass: ConfiguracionValorRepositoryPrisma },
    { provide: MonedaRepository, useClass: MonedaRepositoryPrisma },
    { provide: ImpuestoRepository, useClass: ImpuestoRepositoryPrisma },
    { provide: TasaImpuestoRepository, useClass: TasaImpuestoRepositoryPrisma },
    { provide: JurisdiccionRepository, useClass: JurisdiccionRepositoryPrisma },
    { provide: FormaPagoRepository, useClass: FormaPagoRepositoryPrisma },
  ],
})
export class ConfiguracionModule {}
