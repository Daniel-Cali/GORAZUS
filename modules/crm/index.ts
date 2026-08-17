/**
 * Barrel público de `crm` (docs/architecture/01-estructura-monorepo.md §4-5).
 * Parte 02 (Leads) + Parte 03 (Oportunidades) + Parte 04 (Campañas + Agenda).
 * Seguimientos se agrega en la parte siguiente (`docs/reports/crm/CRM_ROADMAP.md`).
 */
export { CrmModule } from './backend/crm.module';
export { LeadsService } from './backend/services/leads.service';
export { OportunidadesService } from './backend/services/oportunidades.service';
export { CampanasService } from './backend/services/campanas.service';
export { AgendaService } from './backend/services/agenda.service';
