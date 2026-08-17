/**
 * Domain Event — Roles Enterprise, Subfase 4.1 (preparado, sin publicar
 * todavía). Mismo criterio que `modules/auth/backend/events/*.event.ts`:
 * `EventBusService` (`core/messaging`) existe desde Fase 5 sin ningún
 * módulo de negocio que lo use para publicar — `RolesService.crear()`
 * no lo llama todavía, esta clase deja lista la forma del evento para
 * cuando una fase futura decida publicarlo. `routingKey` sigue la
 * convención `<modulo>.<entidad>.<evento>`
 * (`docs/architecture/08-infraestructura-y-despliegue.md §4`).
 */
export class RolCreadoEvent {
  static readonly routingKey = 'seguridad.rol.creado';

  constructor(
    public readonly rolId: string,
    public readonly tenantId: string,
    public readonly companyId: string | null,
    public readonly branchId: string | null,
    public readonly name: string,
    public readonly roleType: string,
    public readonly ocurridoEn: Date,
  ) {}

  toPayload(): Record<string, unknown> {
    return {
      rolId: this.rolId,
      tenantId: this.tenantId,
      companyId: this.companyId,
      branchId: this.branchId,
      name: this.name,
      roleType: this.roleType,
      ocurridoEn: this.ocurridoEn.toISOString(),
    };
  }
}
