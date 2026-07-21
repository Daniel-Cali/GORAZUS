import { z } from 'zod';

/**
 * Fuente de verdad del schema de login — reexportado tal cual desde
 * `modules/auth/shared/contracts/login.schema.ts` para que el frontend
 * valide exactamente lo mismo que el backend (docs/architecture/02 §3,
 * "dto/validators"). `tenantSlug` resuelve `core.tenants` antes de poder
 * buscar el usuario por email (único por tenant, no global — ver
 * `modules/auth/backend/repositories/tenant.repository.ts`).
 */
export const loginSchema = z.object({
  tenantSlug: z.string().min(1, 'Falta el identificador de la organización'),
  email: z.string().min(1, 'El correo es obligatorio').email('Ingresá un correo válido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export type LoginInput = z.infer<typeof loginSchema>;
