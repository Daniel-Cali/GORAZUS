import type { UserContext } from '@gorazus/contracts';
import { withTenantScope } from './tenant-scope';

/**
 * Forma estructural mínima que cualquier delegate de modelo Prisma
 * cumple (`client.<modelo>`) — no se importa el tipo generado de un
 * schema específico acá porque `BaseRepository` es compartido por los
 * 21 clientes independientes (ver `database.module.ts`, cada uno con
 * su propio universo de tipos). Un repositorio concreto de módulo
 * (Paso 3, todavía no existe ninguno) tipa `TDelegate` con el delegate
 * real de su propio Prisma Client generado — este archivo solo exige
 * el subconjunto de métodos que `BaseRepository` usa.
 */
export interface PrismaDelegate<
  TWhereUniqueInput,
  TWhereInput,
  TCreateInput,
  TUpdateInput,
  TRecord,
> {
  findUnique(args: { where: TWhereUniqueInput }): Promise<TRecord | null>;
  findMany(args: { where?: TWhereInput; skip?: number; take?: number }): Promise<TRecord[]>;
  count(args: { where?: TWhereInput }): Promise<number>;
  create(args: { data: TCreateInput }): Promise<TRecord>;
  update(args: { where: TWhereUniqueInput; data: TUpdateInput }): Promise<TRecord>;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number };
}

/**
 * Repositorio genérico sobre un delegate de Prisma — implementa una
 * sola vez lo que docs/architecture/02-arquitectura-modulos-backend.md §3
 * exige de cada `repositories/<entidad>.repository.prisma.ts`: excluir
 * borrados lógicos por defecto, paginación offset+limit
 * (`docs/architecture/07-convenciones-y-estandares.md §4`), y aislamiento
 * de tenant vía RLS (nunca un `WHERE tenantId = ...` manual — eso es
 * exactamente el "olvido" que RLS existe para hacer estructuralmente
 * imposible, ver `docs/database/06-estrategia-seguridad.md §1`).
 *
 * Un repositorio concreto de módulo EXTIENDE esta clase, no la usa
 * directamente — le da el delegate real (`prismaClient.ventas`) y los
 * tipos concretos de su propio schema. Ningún repositorio concreto
 * existe todavía (Paso 3) — esta clase queda lista para heredarse.
 */
export abstract class BaseRepository<
  TWhereUniqueInput,
  TWhereInput extends { deleted_at?: unknown },
  TCreateInput,
  TUpdateInput,
  TRecord,
  TClient extends { $transaction: unknown },
> {
  protected constructor(
    protected readonly client: TClient,
    protected readonly getDelegate: (
      tx: TClient,
    ) => PrismaDelegate<TWhereUniqueInput, TWhereInput, TCreateInput, TUpdateInput, TRecord>,
  ) {}

  /** Excluye soft-deleted por defecto — pasar `includeDeleted: true` explícitamente para lo contrario (caso raro: papelera/auditoría). */
  protected notDeletedFilter(includeDeleted = false): { deleted_at?: null } {
    return includeDeleted ? {} : { deleted_at: null };
  }

  async findById(context: UserContext, where: TWhereUniqueInput): Promise<TRecord | null> {
    return withTenantScope(this.client, context, async (tx) =>
      this.getDelegate(tx).findUnique({ where }),
    );
  }

  async findMany(
    context: UserContext,
    filter: TWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<TRecord>> {
    const { page, pageSize } = pagination;
    const where = { ...filter, ...this.notDeletedFilter() } as TWhereInput;
    return withTenantScope(this.client, context, async (tx) => {
      const delegate = this.getDelegate(tx);
      const [data, total] = await Promise.all([
        delegate.findMany({ where, skip: (page - 1) * pageSize, take: pageSize }),
        delegate.count({ where }),
      ]);
      return { data, meta: { page, pageSize, total } };
    });
  }

  async create(context: UserContext, data: TCreateInput): Promise<TRecord> {
    return withTenantScope(this.client, context, async (tx) =>
      this.getDelegate(tx).create({ data }),
    );
  }

  async update(
    context: UserContext,
    where: TWhereUniqueInput,
    data: TUpdateInput,
  ): Promise<TRecord> {
    return withTenantScope(this.client, context, async (tx) =>
      this.getDelegate(tx).update({ where, data }),
    );
  }

  /**
   * Borrado lógico — nunca `DELETE` físico desde un repositorio de
   * módulo (docs/database/01-modelo-conceptual.md §1.1: `deleted_at`
   * es el mecanismo, `is_deleted` es columna calculada a partir de él,
   * nunca se escribe directamente). `data` debe fijar `deleted_at`/
   * `deleted_by` — se tipa como `TUpdateInput` completo porque cada
   * schema define esos campos con nombres/tipos ligeramente distintos
   * en su Prisma Client generado.
   */
  async softDelete(
    context: UserContext,
    where: TWhereUniqueInput,
    data: TUpdateInput,
  ): Promise<TRecord> {
    return this.update(context, where, data);
  }
}
