/** Domain Event — Parte 2.1 (preparado, sin publicar todavía). Ver `usuario-autenticado.event.ts` para el porqué de "preparado, no publicado". */
export class SesionRevocadaEvent {
  static readonly routingKey = 'auth.sesion.revocada';

  constructor(
    public readonly sessionId: string,
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly motivo: 'logout' | 'reset_password' | 'admin',
    public readonly ocurridoEn: Date,
  ) {}

  toPayload(): Record<string, unknown> {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      tenantId: this.tenantId,
      motivo: this.motivo,
      ocurridoEn: this.ocurridoEn.toISOString(),
    };
  }
}
