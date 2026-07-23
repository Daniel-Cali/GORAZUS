/** Domain Event — Parte 2.1 (preparado, sin publicar todavía). Ver `usuario-autenticado.event.ts` para el porqué de "preparado, no publicado". */
export class LoginFallidoEvent {
  static readonly routingKey = 'auth.login.fallido';

  constructor(
    public readonly tenantId: string,
    public readonly emailIntentado: string,
    public readonly userId: string | null,
    public readonly ipAddress: string | null,
    public readonly ocurridoEn: Date,
  ) {}

  toPayload(): Record<string, unknown> {
    return {
      tenantId: this.tenantId,
      emailIntentado: this.emailIntentado,
      userId: this.userId,
      ipAddress: this.ipAddress,
      ocurridoEn: this.ocurridoEn.toISOString(),
    };
  }
}
