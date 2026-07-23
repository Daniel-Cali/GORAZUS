/**
 * Domain Event — Parte 2.1 (preparado, sin publicar todavía).
 * `EventBusService` (`core/messaging`) existe desde Fase 5 sin ningún
 * módulo de negocio que lo use para publicar — `LoginUseCase`/
 * `CompleteTwoFactorLoginUseCase` (Parte 2 — Backend Core) no lo llaman
 * todavía, para no tocar el login en esta parte. Esta clase deja lista
 * la forma del evento para cuando Parte 2.2 (u otra fase) decida
 * publicarlo — `routingKey` ya sigue la convención `<modulo>.<entidad>.
 * <evento>` documentada en `docs/architecture/08-infraestructura-y-despliegue.md §4`.
 */
export class UsuarioAutenticadoEvent {
  static readonly routingKey = 'auth.usuario.autenticado';

  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly sessionId: string,
    public readonly viaDosFactores: boolean,
    public readonly ocurridoEn: Date,
  ) {}

  toPayload(): Record<string, unknown> {
    return {
      userId: this.userId,
      tenantId: this.tenantId,
      sessionId: this.sessionId,
      viaDosFactores: this.viaDosFactores,
      ocurridoEn: this.ocurridoEn.toISOString(),
    };
  }
}
