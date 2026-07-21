// eslint-disable-next-line @nx/enforce-module-boundaries -- `shared/` re-exporta desde `backend/` por ruta relativa dentro del mismo módulo (fuente de verdad del schema Zod vive en backend/validators), nunca por nombre de paquete
export { loginSchema } from '../../backend/validators/login.schema';
// eslint-disable-next-line @nx/enforce-module-boundaries -- mismo motivo que arriba
export type { LoginInput } from '../../backend/validators/login.schema';
