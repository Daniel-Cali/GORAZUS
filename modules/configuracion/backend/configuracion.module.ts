import { Module } from '@nestjs/common';
import { DatabaseModule } from '@gorazus/core-database';
import { EmpresasController } from './controllers/empresas.controller';
import { SucursalesController } from './controllers/sucursales.controller';
import { ParametrosController } from './controllers/parametros.controller';
import { ConfiguracionController } from './controllers/configuracion.controller';
import { EmpresasService } from './services/empresas.service';
import { SucursalesService } from './services/sucursales.service';
import { ParametrosService } from './services/parametros.service';
import { ConfiguracionService } from './services/configuracion.service';
import { EmpresaRepository } from './repositories/empresa.repository';
import { EmpresaRepositoryPrisma } from './repositories/empresa.repository.prisma';
import { SucursalRepository } from './repositories/sucursal.repository';
import { SucursalRepositoryPrisma } from './repositories/sucursal.repository.prisma';
import { ParametroRepository } from './repositories/parametro.repository';
import { ParametroRepositoryPrisma } from './repositories/parametro.repository.prisma';
import { ConfiguracionValorRepository } from './repositories/configuracion-valor.repository';
import { ConfiguracionValorRepositoryPrisma } from './repositories/configuracion-valor.repository.prisma';

@Module({
  imports: [DatabaseModule],
  controllers: [
    EmpresasController,
    SucursalesController,
    ParametrosController,
    ConfiguracionController,
  ],
  providers: [
    EmpresasService,
    SucursalesService,
    ParametrosService,
    ConfiguracionService,
    { provide: EmpresaRepository, useClass: EmpresaRepositoryPrisma },
    { provide: SucursalRepository, useClass: SucursalRepositoryPrisma },
    { provide: ParametroRepository, useClass: ParametroRepositoryPrisma },
    { provide: ConfiguracionValorRepository, useClass: ConfiguracionValorRepositoryPrisma },
  ],
})
export class ConfiguracionModule {}
