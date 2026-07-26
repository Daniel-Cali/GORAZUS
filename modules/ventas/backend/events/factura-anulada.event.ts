/** Domain Event — Motor de Facturación Enterprise, Parte 1 (preparado, sin publicar todavía). Ver `factura-creada.event.ts` para el porqué. */
export class FacturaAnuladaEvent {
  static readonly routingKey = 'ventas.factura.anulada';

  constructor(
    public readonly facturaId: string,
    public readonly tenantId: string,
    public readonly documentNumber: string,
    public readonly estadoAnterior: string,
    public readonly ocurridoEn: Date,
  ) {}

  toPayload(): Record<string, unknown> {
    return {
      facturaId: this.facturaId,
      tenantId: this.tenantId,
      documentNumber: this.documentNumber,
      estadoAnterior: this.estadoAnterior,
      ocurridoEn: this.ocurridoEn.toISOString(),
    };
  }
}
