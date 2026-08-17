import { Module } from '@nestjs/common';
import { DatabaseModule } from '@gorazus/core-database';
import { ClientesModule } from '@gorazus/modules/clientes';
import { LeadsController } from './controllers/leads.controller';
import { LeadsService } from './services/leads.service';
import { LeadRepository } from './repositories/lead.repository';
import { LeadRepositoryPrisma } from './repositories/lead.repository.prisma';
import { LeadStatusRepository } from './repositories/lead-status.repository';
import { LeadStatusRepositoryPrisma } from './repositories/lead-status.repository.prisma';
import { LeadSourceRepository } from './repositories/lead-source.repository';
import { LeadSourceRepositoryPrisma } from './repositories/lead-source.repository.prisma';
import { ClienteLookupRepository } from './repositories/cliente-lookup.repository';
import { ClienteLookupRepositoryPrisma } from './repositories/cliente-lookup.repository.prisma';
import { OportunidadesController } from './controllers/oportunidades.controller';
import { OportunidadesService } from './services/oportunidades.service';
import { OpportunityRepository } from './repositories/opportunity.repository';
import { OpportunityRepositoryPrisma } from './repositories/opportunity.repository.prisma';
import { SalesFunnelRepository } from './repositories/sales-funnel.repository';
import { SalesFunnelRepositoryPrisma } from './repositories/sales-funnel.repository.prisma';
import { OpportunityLossReasonRepository } from './repositories/opportunity-loss-reason.repository';
import { OpportunityLossReasonRepositoryPrisma } from './repositories/opportunity-loss-reason.repository.prisma';
import { ProductoLookupRepository } from './repositories/producto-lookup.repository';
import { ProductoLookupRepositoryPrisma } from './repositories/producto-lookup.repository.prisma';
import { CampanasController } from './controllers/campanas.controller';
import { CampanasService } from './services/campanas.service';
import { CampaignRepository } from './repositories/campaign.repository';
import { CampaignRepositoryPrisma } from './repositories/campaign.repository.prisma';
import { AgendaController } from './controllers/agenda.controller';
import { AgendaService } from './services/agenda.service';
import { CalendarEventRepository } from './repositories/calendar-event.repository';
import { CalendarEventRepositoryPrisma } from './repositories/calendar-event.repository.prisma';

/**
 * `crm` — Parte 02 (Leads) + Parte 03 (Oportunidades) + Parte 04
 * (Campañas + Agenda). Seguimientos queda para la parte siguiente —
 * ver `docs/reports/crm/CRM_ROADMAP.md`.
 */
@Module({
  imports: [DatabaseModule, ClientesModule],
  controllers: [LeadsController, OportunidadesController, CampanasController, AgendaController],
  providers: [
    LeadsService,
    { provide: LeadRepository, useClass: LeadRepositoryPrisma },
    { provide: LeadStatusRepository, useClass: LeadStatusRepositoryPrisma },
    { provide: LeadSourceRepository, useClass: LeadSourceRepositoryPrisma },
    { provide: ClienteLookupRepository, useClass: ClienteLookupRepositoryPrisma },
    OportunidadesService,
    { provide: OpportunityRepository, useClass: OpportunityRepositoryPrisma },
    { provide: SalesFunnelRepository, useClass: SalesFunnelRepositoryPrisma },
    {
      provide: OpportunityLossReasonRepository,
      useClass: OpportunityLossReasonRepositoryPrisma,
    },
    { provide: ProductoLookupRepository, useClass: ProductoLookupRepositoryPrisma },
    CampanasService,
    { provide: CampaignRepository, useClass: CampaignRepositoryPrisma },
    AgendaService,
    { provide: CalendarEventRepository, useClass: CalendarEventRepositoryPrisma },
  ],
  // Único punto de entrada para otros módulos — mismo patrón que ventas/clientes.
  exports: [LeadsService, OportunidadesService, CampanasService, AgendaService],
})
export class CrmModule {}
