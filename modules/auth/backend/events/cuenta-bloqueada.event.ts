/** Domain Event — Parte 2.1 (preparado, sin publicar todavía). Ver `usuario-autenticado.event.ts` para el porqué de "preparado, no publicado". */
export class CuentaBloqueadaEvent {
  static readonly routingKey = 'auth.cuenta.bloqueada';

  constructor(
    public readonly tenantId: string,
    public readonly emailIntentado: string,
    public readonly ipAddress: string | null,
    public readonly ocurridoEn: Date,
  ) {}

  toPayload(): Record<string, unknown> {
    return {
      tenantId: this.tenantId,
      emailIntentado: this.emailIntentado,
      ipAddress: this.ipAddress,
      ocurridoEn: this.ocurridoEn.toISOString(),
    };
  }
}
