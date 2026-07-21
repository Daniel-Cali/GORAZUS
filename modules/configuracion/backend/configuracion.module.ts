import { Module } from '@nestjs/common';
import { DatabaseModule } from '@gorazus/core-database';
import { EmpresasController } from './controllers/empresas.controller';
import { SucursalesController } from './controllers/sucursales.controller';
import { EmpresasService } from './services/empresas.service';
import { SucursalesService } from './services/sucursales.service';
import { EmpresaRepository } from './repositories/empresa.repository';
import { EmpresaRepositoryPrisma } from './repositories/empresa.repository.prisma';
import { SucursalRepository } from './repositories/sucursal.repository';
import { SucursalRepositoryPrisma } from './repositories/sucursal.repository.prisma';

@Module({
  imports: [DatabaseModule],
  controllers: [EmpresasController, SucursalesController],
  providers: [
    EmpresasService,
    SucursalesService,
    { provide: EmpresaRepository, useClass: EmpresaRepositoryPrisma },
    { provide: SucursalRepository, useClass: SucursalRepositoryPrisma },
  ],
})
export class ConfiguracionModule {}
