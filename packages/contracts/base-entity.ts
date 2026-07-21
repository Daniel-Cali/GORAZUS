/**
 * Las 17 columnas universales presentes en toda tabla de negocio, sin
 * excepción — ver docs/database/01-modelo-conceptual.md §1.1 (fuente de
 * verdad exacta de tipos/nullability; no editar este archivo sin
 * revisar ese documento primero, deben permanecer en sincronía).
 *
 * Esto es un tipo de **lectura** (la forma que llega desde Prisma/DB),
 * no un builder ni una clase con comportamiento — las reglas de
 * negocio de una entidad viven en `entities/` de cada módulo
 * (docs/architecture/02-arquitectura-modulos-backend.md §3, "dominio").
 * `BaseEntity` solo evita repetir estas 17 propiedades en cada tipo de
 * entidad de cada módulo.
 */
export interface BaseEntity {
  id: string;
  localId: bigint;
  tenantId: string;
  companyId: string | null;
  branchId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string;
  updatedBy: string;
  deletedBy: string | null;
  version: number;
  rowVersion: bigint;
  isActive: boolean;
  isDeleted: boolean;
  observations: string | null;
  metadata: Record<string, unknown>;
}

/**
 * Campos que la capa de aplicación completa al crear un registro nuevo
 * — el resto (id, localId, timestamps, rowVersion, isDeleted) los
 * asigna la base de datos (default/generated/trigger), nunca la
 * aplicación (docs/database/01-modelo-conceptual.md §1.1).
 */
export type BaseEntityCreateInput = Pick<BaseEntity, 'tenantId' | 'createdBy'> &
  Partial<Pick<BaseEntity, 'companyId' | 'branchId' | 'observations' | 'metadata'>>;

/** Sentinela de tenant para catálogos globales del sistema (ídem doc §1.1). */
export const SYSTEM_TENANT_ID = '00000000-0000-0000-0000-000000000000';

/** Usuario reservado para procesos automáticos/seed (ídem doc §1.1). */
export const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001';
