import { z } from 'zod';

export const crearEmpresaSchema = z.object({
  legalName: z.string().min(1, 'La razón social es obligatoria'),
  tradeName: z.string().optional(),
  taxId: z.string().min(1, 'El identificador tributario (NIT/RUC) es obligatorio'),
  taxRegime: z.string().optional(),
  functionalCurrencyCode: z
    .string()
    .length(3, 'El código de moneda funcional debe tener 3 caracteres (ISO 4217)'),
  fiscalYearStartMonth: z.number().int().min(1).max(12).default(1),
});
export type CrearEmpresaInput = z.infer<typeof crearEmpresaSchema>;

export const actualizarEmpresaSchema = crearEmpresaSchema.partial();
export type ActualizarEmpresaInput = z.infer<typeof actualizarEmpresaSchema>;
