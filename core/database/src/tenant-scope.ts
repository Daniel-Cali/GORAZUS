import type { UserContext } from '@gorazus/contracts';

/**
 * Puente entre el `UserContext` resuelto por `core/http` (JWT ya
 * verificado) y el aislamiento por Row-Level Security de Postgres —
 * ver docs/database/06-estrategia-seguridad.md §1: las políticas RLS
 * leen `current_setting('app.current_tenant_id')` /
 * `app.current_company_ids`, seteados **una vez por conexión/transacción**,
 * nunca confiados desde un parámetro que el cliente pueda manipular.
 *
 * Un `PrismaClient` normal reutiliza conexiones de un pool — `SET
 * LOCAL` fuera de una transacción no persiste de forma segura entre
 * requests concurrentes compartiendo el pool. Por eso este helper
 * exige envolver la operación en `$transaction`: `SET LOCAL` dentro de
 * una transacción se limpia solo al hacer commit/rollback, sin
 * arriesgar fuga de contexto de tenant entre requests que reusen la
 * misma conexión física del pool.
 *
 * Uso esperado desde `BaseRepository` (ver `base.repository.ts`) — un
 * módulo de negocio nunca llama esto directamente, lo hereda.
 *
 * `TClient` solo exige que exista un `$transaction` (sin describir su firma
 * exacta): el `$transaction` real de un `PrismaClient` generado está
 * sobrecargado (forma array-de-promesas + forma callback), y TypeScript no
 * compara de forma confiable una función sobrecargada contra una firma
 * genérica única al verificar un `extends` de tipo — describir la firma acá
 * rompía la inferencia contra los 21 clientes reales aunque el comportamiento
 * en runtime sea correcto (ver `base.repository.spec.ts`, que sí verifica el
 * comportamiento con un fake). Se castea internamente para invocar la forma
 * callback, que todo `PrismaClient` soporta.
 */
export async function withTenantScope<TClient extends { $transaction: unknown }, TResult>(
  client: TClient,
  context: Pick<UserContext, 'tenantId' | 'companyId'>,
  operation: (tx: TClient) => Promise<TResult>,
): Promise<TResult> {
  // `.call`/extraer `$transaction` como referencia suelta perdería el `this`
  // interno del cliente real de Prisma — se re-tipa el objeto entero
  // (mismo `client`, misma referencia) para conservar `cliente.$transaction(...)`
  // como forma de invocación.
  const scopedClient = client as unknown as {
    $transaction: (fn: (tx: TClient) => Promise<TResult>) => Promise<TResult>;
  };
  return scopedClient.$transaction(async (tx) => {
    // set_config(..., true) = tercer argumento "is_local", equivalente a SET
    // LOCAL pero sí acepta bind parameters (a diferencia de `SET LOCAL x = $1`,
    // que Postgres no admite vía protocolo extendido) — evita además
    // interpolar el UUID como string crudo en el SQL.
    const txWithRaw = tx as unknown as {
      $executeRawUnsafe: (query: string, ...values: unknown[]) => Promise<unknown>;
    };
    await txWithRaw.$executeRawUnsafe(
      "SELECT set_config('app.current_tenant_id', $1, true)",
      context.tenantId,
    );
    if (context.companyId) {
      await txWithRaw.$executeRawUnsafe(
        "SELECT set_config('app.current_company_ids', $1, true)",
        context.companyId,
      );
    }
    return operation(tx);
  });
}
