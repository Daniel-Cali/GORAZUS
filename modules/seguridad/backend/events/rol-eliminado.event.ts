/** Domain Event — Roles Enterprise, Subfase 4.1 (preparado, sin publicar todavía). Ver `rol-creado.event.ts` para el porqué de "preparado, no publicado". */
export class RolEliminadoEvent {
  static readonly routingKey = 'seguridad.rol.eliminado';

  constructor(
    public readonly rolId: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly ocurridoEn: Date,
  ) {}

  toPayload(): Record<string, unknown> {
    return {
      rolId: this.rolId,
      tenantId: this.tenantId,
      name: this.name,
      ocurridoEn: this.ocurridoEn.toISOString(),
    };
  }
}
