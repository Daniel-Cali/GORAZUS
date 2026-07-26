/** Domain Event — Motor de Facturación Enterprise, Parte 1 (preparado, sin publicar todavía). Ver `factura-creada.event.ts` para el porqué. */
export class FacturaConfirmadaEvent {
  static readonly routingKey = 'ventas.factura.confirmada';

  constructor(
    public readonly facturaId: string,
    public readonly tenantId: string,
    public readonly documentNumber: string,
    public readonly totalAmount: number,
    public readonly ocurridoEn: Date,
  ) {}

  toPayload(): Record<string, unknown> {
    return {
      facturaId: this.facturaId,
      tenantId: this.tenantId,
      documentNumber: this.documentNumber,
      totalAmount: this.totalAmount,
      ocurridoEn: this.ocurridoEn.toISOString(),
    };
  }
}
