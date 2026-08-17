/**
 * Clasificación del rol — "Roles Enterprise - Domain Entities" pedía un
 * `RoleType` con valores `System/Enterprise/Organization/Department/Project/
 * Custom` y una entidad `RoleContext` separada para modelar en qué nivel
 * vive un rol; ninguno de esos conceptos existe en GORAZUS (no hay
 * "Department"/"Project" como nivel de scoping). El scoping real
 * (tenant/empresa/sucursal) ya está resuelto por `companyId`/`branchId`
 * (nullable desde el diseño original de `core.roles`) — por eso acá los
 * valores son los que existen de verdad: `system` (roles de fábrica
 * sembrados por la plataforma) más uno por cada nivel de scoping real,
 * y `custom` para el resto. Sin `RoleContext`.
 */
export const TIPOS_ROL = ['system', 'tenant', 'company', 'branch', 'custom'] as const;
export type RoleType = (typeof TIPOS_ROL)[number];

/**
 * "Roles Enterprise - Domain Value Objects" pedía `RoleId`/`RoleName`/
 * `RoleCode` como clases separadas (Value Objects, con igualdad de valor
 * propia) — ningún otro entity del proyecto usa ese patrón (`Cliente`,
 * `Lead`, `Opportunity`, etc. validan primitivos directo en el
 * constructor). Se mantiene la consistencia: las mismas invariantes
 * (largo máximo, normalización, caracteres válidos) quedan acá adentro,
 * sin clases nuevas — `name`/`code` siguen siendo `string`/`string | null`
 * en toda la cadena (repositorio, servicio, controlador).
 */
export const NOMBRE_ROL_MAX_LENGTH = 100;
export const CODIGO_ROL_MAX_LENGTH = 50;
const CODIGO_ROL_PATTERN = /^[A-Za-z0-9_]+$/;

/**
 * Entidad de dominio pura (docs/architecture/02 §3). Roles de fábrica
 * (`isSystemRole`) no son eliminables ni renombrables — garantiza que una
 * empresa nunca quede sin un camino de administración válido
 * (docs/architecture/15-modulo-security.md §2). `name` se guarda recortado
 * (trim) y `code` recortado y en mayúsculas — normalización, no solo
 * validación (mismo criterio que pedían los Value Objects descartados).
 */
export class Rol {
  public readonly name: string;
  public readonly code: string | null;

  constructor(
    public readonly id: string,
    name: string,
    public readonly isSystemRole: boolean,
    code: string | null = null,
    public readonly description: string | null = null,
    public readonly roleType: RoleType = 'custom',
  ) {
    const nombreNormalizado = name.trim();
    if (nombreNormalizado.length === 0) {
      throw new Error('El nombre del rol no puede estar vacío');
    }
    if (nombreNormalizado.length > NOMBRE_ROL_MAX_LENGTH) {
      throw new Error(`El nombre del rol no puede superar los ${NOMBRE_ROL_MAX_LENGTH} caracteres`);
    }
    this.name = nombreNormalizado;

    let codigoNormalizado: string | null = null;
    if (code !== null) {
      codigoNormalizado = code.trim().toUpperCase();
      if (codigoNormalizado.length === 0) {
        throw new Error('El código del rol no puede estar vacío si se especifica');
      }
      if (codigoNormalizado.length > CODIGO_ROL_MAX_LENGTH) {
        throw new Error(
          `El código del rol no puede superar los ${CODIGO_ROL_MAX_LENGTH} caracteres`,
        );
      }
      if (!CODIGO_ROL_PATTERN.test(codigoNormalizado)) {
        throw new Error('El código del rol solo puede tener letras, números y guion bajo');
      }
    }
    this.code = codigoNormalizado;

    if (!TIPOS_ROL.includes(roleType)) {
      throw new Error(`El tipo de rol debe ser uno de: ${TIPOS_ROL.join(', ')}`);
    }
    if (isSystemRole && roleType !== 'system') {
      throw new Error('Un rol de fábrica (isSystemRole) debe tener roleType "system"');
    }
  }

  verificarPuedeEliminarse(): void {
    if (this.isSystemRole) {
      throw new Error(`El rol "${this.name}" es un rol de fábrica y no puede eliminarse`);
    }
  }

  verificarPuedeRenombrarse(): void {
    if (this.isSystemRole) {
      throw new Error(`El rol "${this.name}" es un rol de fábrica y no puede renombrarse`);
    }
  }
}
