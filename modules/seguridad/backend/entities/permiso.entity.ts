const PERMISSION_CODE_PATTERN = /^[a-z][a-z_]*\.[a-z][a-z_]*$/;

/**
 * Formato `<modulo>.<accion>` (docs/architecture/09-seguridad-y-multiempresa.md
 * §2, docs/menus/00-convenciones.md §3). Un permiso es un contrato de
 * código — se agrega solo cuando se crea el módulo/caso de uso que lo
 * necesita, nunca en tiempo de ejecución vía UI
 * (docs/architecture/15-modulo-security.md §3) — por eso esta entidad no
 * tiene invariantes de "quién puede crear un permiso", solo de forma.
 */
export class Permiso {
  constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly moduleCode: string,
    public readonly actionCode: string,
  ) {
    if (!PERMISSION_CODE_PATTERN.test(code)) {
      throw new Error(`Código de permiso inválido: "${code}" (formato esperado <modulo>.<accion>)`);
    }
    if (code !== `${moduleCode}.${actionCode}`) {
      throw new Error(
        `El código "${code}" no coincide con module_code.action_code ("${moduleCode}.${actionCode}")`,
      );
    }
  }
}
