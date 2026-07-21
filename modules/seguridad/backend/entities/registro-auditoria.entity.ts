/** Operaciones auditadas — mismo CHECK que `core.audit_logs.operation` (docs/database/sql/01_core.sql). */
export const OPERACIONES_AUDITORIA = ['INSERT', 'UPDATE', 'DELETE'] as const;
export type OperacionAuditoria = (typeof OPERACIONES_AUDITORIA)[number];

/**
 * Entidad de dominio pura (docs/architecture/02 §3). `core.audit_logs` es
 * de solo lectura desde la aplicación — la fila la escribe un trigger de
 * base de datos (docs/database/05-estrategia-auditoria.md §2), nunca un
 * caso de uso de este módulo. Esta entidad solo documenta la forma mínima
 * de un registro, sin invariantes de escritura.
 */
export class RegistroAuditoria {
  constructor(
    public readonly id: string,
    public readonly tableName: string,
    public readonly operation: string,
  ) {
    if (tableName.trim().length === 0) {
      throw new Error('El nombre de la tabla auditada no puede estar vacío');
    }
    if (!OPERACIONES_AUDITORIA.includes(operation as OperacionAuditoria)) {
      throw new Error(
        `La operación "${operation}" no es válida — debe ser una de: ${OPERACIONES_AUDITORIA.join(', ')}`,
      );
    }
  }
}
