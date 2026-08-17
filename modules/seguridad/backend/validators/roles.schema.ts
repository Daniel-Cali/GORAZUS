import { z } from 'zod';
import { NOMBRE_ROL_MAX_LENGTH, CODIGO_ROL_MAX_LENGTH } from '../entities/rol.entity';

/**
 * `'system'` queda fuera a propósito — un rol de fábrica solo lo crea el
 * script de seed (`is_system_role: true`), nunca esta API (`crear()`
 * siempre fija `is_system_role: false`, ver `roles.service.ts`).
 */
const TIPOS_ROL_CREABLES = ['tenant', 'company', 'branch', 'custom'] as const;

/**
 * Mismo charset que valida `Rol` (mayúsculas/minúsculas — la entidad
 * normaliza a mayúsculas después, acá solo se valida el conjunto de
 * caracteres). Repetir el largo máximo/patrón acá evita que un valor
 * inválido llegue hasta el `Error` de dominio y rompa en un 500 sin
 * traducir — mismo hallazgo que `RolDeFabricaException`.
 */
const CODIGO_ROL_PATTERN = /^[A-Za-z0-9_]+$/;

export const crearRolSchema = z.object({
  name: z.string().trim().min(1, 'El nombre del rol es obligatorio').max(NOMBRE_ROL_MAX_LENGTH),
  /** Ausente = empresa activa de la sesión; `null` explícito = rol de todo el tenant. */
  companyId: z.string().uuid('El id de empresa debe ser un UUID válido').nullable().optional(),
  branchId: z.string().uuid('El id de sucursal debe ser un UUID válido').nullable().optional(),
  // `.trim()` antes del `.regex()` — la entidad normaliza con espacios
  // alrededor permitidos (`Rol` recorta y pone en mayúsculas), la
  // validación de forma acá tiene que dejar pasar lo mismo que la
  // entidad va a aceptar después.
  code: z
    .string()
    .trim()
    .min(1)
    .max(CODIGO_ROL_MAX_LENGTH)
    .regex(CODIGO_ROL_PATTERN, 'El código solo puede tener letras, números y guion bajo')
    .nullable()
    .optional(),
  description: z.string().nullable().optional(),
  roleType: z.enum(TIPOS_ROL_CREABLES).default('custom'),
});
export type CrearRolInput = z.infer<typeof crearRolSchema>;

export const actualizarRolSchema = z.object({
  name: z.string().trim().min(1, 'El nombre del rol es obligatorio').max(NOMBRE_ROL_MAX_LENGTH),
});
export type ActualizarRolInput = z.infer<typeof actualizarRolSchema>;

export const asignarPermisoSchema = z.object({
  permissionCode: z.string().min(1, 'El código de permiso es obligatorio'),
});
export type AsignarPermisoInput = z.infer<typeof asignarPermisoSchema>;
