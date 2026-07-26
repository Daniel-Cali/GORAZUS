/**
 * Domain Event — Motor de Facturación Enterprise, Parte 1 (preparado,
 * sin publicar todavía). Mismo criterio que
 * `modules/auth/backend/events/*.event.ts`/`modules/seguridad/backend/events/*.event.ts`:
 * `EventBusService` (`core/messaging`) existe desde Fase 5 sin ningún
 * módulo de negocio que lo use para publicar — `VentasService.crearFactura()`
 * no lo llama todavía. `routingKey` sigue la convención
 * `<modulo>.<entidad>.<evento>` (`docs/architecture/08-infraestructura-y-despliegue.md §4`).
 */
export class FacturaCreadaEvent {
  static readonly routingKey = 'ventas.factura.creada';

  constructor(
    public readonly facturaId: string,
    public readonly tenantId: string,
    public readonly companyId: string,
    public readonly branchId: string,
    public readonly customerId: string,
    public readonly totalAmount: number,
    public readonly ocurridoEn: Date,
  ) {}

  toPayload(): Record<string, unknown> {
    return {
      facturaId: this.facturaId,
      tenantId: this.tenantId,
      companyId: this.companyId,
      branchId: this.branchId,
      customerId: this.customerId,
      totalAmount: this.totalAmount,
      ocurridoEn: this.ocurridoEn.toISOString(),
    };
  }
}
