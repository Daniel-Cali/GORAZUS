import { z } from 'zod';

export const crearUsuarioSchema = z.object({
  email: z.string().min(1, 'El correo es obligatorio').email('Ingresá un correo válido'),
  fullName: z.string().min(1, 'El nombre es obligatorio'),
});
export type CrearUsuarioInput = z.infer<typeof crearUsuarioSchema>;

export const asignarRolSchema = z.object({
  rolId: z.string().uuid('rolId debe ser un UUID válido'),
});
export type AsignarRolInput = z.infer<typeof asignarRolSchema>;

/** Autoedición — `fullName` obligatorio, `email` opcional (cambio de correo propio). */
export const actualizarPerfilSchema = z.object({
  fullName: z.string().min(1, 'El nombre es obligatorio'),
  email: z.string().email('Ingresá un correo válido').optional(),
});
export type ActualizarPerfilInput = z.infer<typeof actualizarPerfilSchema>;

export const cambiarPasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es obligatoria'),
  newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
});
export type CambiarPasswordInput = z.infer<typeof cambiarPasswordSchema>;

/** Edición administrativa — a diferencia de `actualizarPerfilSchema`, ambos campos son opcionales (PATCH parcial). */
export const editarUsuarioSchema = z
  .object({
    fullName: z.string().min(1, 'El nombre no puede quedar vacío').optional(),
    email: z.string().email('Ingresá un correo válido').optional(),
  })
  .refine((data) => data.fullName !== undefined || data.email !== undefined, {
    message: 'Indicá al menos un campo para editar (fullName o email).',
  });
export type EditarUsuarioInput = z.infer<typeof editarUsuarioSchema>;

const ESTADOS_USUARIO = [
  'active',
  'inactive',
  'suspended',
  'blocked',
  'pending_activation',
] as const;
export const cambiarEstadoSchema = z.object({
  status: z.enum(ESTADOS_USUARIO),
});
export type CambiarEstadoInput = z.infer<typeof cambiarEstadoSchema>;
export type EstadoUsuario = (typeof ESTADOS_USUARIO)[number];

export const asignarEmpresaSchema = z.object({
  companyId: z.string().uuid('companyId debe ser un UUID válido'),
  isDefault: z.boolean().optional().default(false),
});
export type AsignarEmpresaInput = z.infer<typeof asignarEmpresaSchema>;

/** Preferencias — todos opcionales (PATCH parcial); `idioma`/`zonaHoraria` mapean a columnas reales de `core.user_profiles`, el resto vive en su `metadata` JSONB (sin columnas propias, ver `USERS_REPORT.md`). */
export const actualizarPreferenciasSchema = z.object({
  idioma: z.string().min(2).max(10).optional(),
  zonaHoraria: z.string().min(1).max(64).optional(),
  tema: z.enum(['light', 'dark', 'system']).optional(),
  formatoFecha: z.string().min(1).max(32).optional(),
  formatoHora: z.string().min(1).max(32).optional(),
  formatoNumero: z.string().min(1).max(32).optional(),
  paginaInicial: z.string().min(1).max(200).optional(),
  registrosPorPagina: z.number().int().min(5).max(200).optional(),
  notificaciones: z.boolean().optional(),
});
export type ActualizarPreferenciasInput = z.infer<typeof actualizarPreferenciasSchema>;
