import { Module } from '@nestjs/common';
import { DatabaseModule } from '@gorazus/core-database';
import { CuentasContablesController } from './controllers/cuentas-contables.controller';
import { CentrosCostoController } from './controllers/centros-costo.controller';
import { PeriodosFiscalesController } from './controllers/periodos-fiscales.controller';
import { ReglasContablesController } from './controllers/reglas-contables.controller';
import { AsientosController } from './controllers/asientos.controller';
import { EstadosFinancierosController } from './controllers/estados-financieros.controller';
import { PlanCuentasService } from './services/plan-cuentas.service';
import { CentrosCostoService } from './services/centros-costo.service';
import { PeriodosFiscalesService } from './services/periodos-fiscales.service';
import { ReglasContablesService } from './services/reglas-contables.service';
import { AsientosService } from './services/asientos.service';
import { MotorContableService } from './services/motor-contable.service';
import { EstadosFinancierosService } from './services/estados-financieros.service';
import { CuentaContableRepository } from './repositories/cuenta-contable.repository';
import { CuentaContableRepositoryPrisma } from './repositories/cuenta-contable.repository.prisma';
import { TipoCuentaRepository } from './repositories/tipo-cuenta.repository';
import { TipoCuentaRepositoryPrisma } from './repositories/tipo-cuenta.repository.prisma';
import { CentroCostoRepository } from './repositories/centro-costo.repository';
import { CentroCostoRepositoryPrisma } from './repositories/centro-costo.repository.prisma';
import { AnioFiscalRepository } from './repositories/anio-fiscal.repository';
import { AnioFiscalRepositoryPrisma } from './repositories/anio-fiscal.repository.prisma';
import { PeriodoFiscalRepository } from './repositories/periodo-fiscal.repository';
import { PeriodoFiscalRepositoryPrisma } from './repositories/periodo-fiscal.repository.prisma';
import { EstadoAsientoRepository } from './repositories/estado-asiento.repository';
import { EstadoAsientoRepositoryPrisma } from './repositories/estado-asiento.repository.prisma';
import { ReglaContableRepository } from './repositories/regla-contable.repository';
import { ReglaContableRepositoryPrisma } from './repositories/regla-contable.repository.prisma';
import { AsientoRepository } from './repositories/asiento.repository';
import { AsientoRepositoryPrisma } from './repositories/asiento.repository.prisma';
import { ReportesContablesRepository } from './repositories/reportes-contables.repository';
import { ReportesContablesRepositoryPrisma } from './repositories/reportes-contables.repository.prisma';

/**
 * `contabilidad` — Contabilidad Enterprise Parte 1 (Núcleo contable +
 * Estados financieros): plan de cuentas, motor de reglas, asientos
 * (Libro Diario/Mayor), Balance General/Estado de Resultados/Flujo de
 * Efectivo. 17 de las 28 tablas del schema `accounting` —
 * CxC/CxP avanzadas, Bancos/Conciliación, Activos Fijos/Depreciaciones,
 * Impuestos, Presupuestos-ejecución, Cierre contable, dimensiones,
 * revaluación de moneda, intercompañía e IFRS sin código todavía, ver
 * `docs/reports/contabilidad/ACCOUNTING_ROADMAP.md`.
 */
@Module({
  imports: [DatabaseModule],
  controllers: [
    CuentasContablesController,
    CentrosCostoController,
    PeriodosFiscalesController,
    ReglasContablesController,
    AsientosController,
    EstadosFinancierosController,
  ],
  providers: [
    PlanCuentasService,
    CentrosCostoService,
    PeriodosFiscalesService,
    ReglasContablesService,
    AsientosService,
    MotorContableService,
    EstadosFinancierosService,
    { provide: CuentaContableRepository, useClass: CuentaContableRepositoryPrisma },
    { provide: TipoCuentaRepository, useClass: TipoCuentaRepositoryPrisma },
    { provide: CentroCostoRepository, useClass: CentroCostoRepositoryPrisma },
    { provide: AnioFiscalRepository, useClass: AnioFiscalRepositoryPrisma },
    { provide: PeriodoFiscalRepository, useClass: PeriodoFiscalRepositoryPrisma },
    { provide: EstadoAsientoRepository, useClass: EstadoAsientoRepositoryPrisma },
    { provide: ReglaContableRepository, useClass: ReglaContableRepositoryPrisma },
    { provide: AsientoRepository, useClass: AsientoRepositoryPrisma },
    { provide: ReportesContablesRepository, useClass: ReportesContablesRepositoryPrisma },
  ],
  // Exportado para la integración real con `ventas` (motor de reglas
  // disparado al confirmar una factura) — mismo patrón que
  // `VentasModule` exportando `VentasService` para `pos`.
  exports: [MotorContableService, PlanCuentasService],
})
export class ContabilidadModule {}
