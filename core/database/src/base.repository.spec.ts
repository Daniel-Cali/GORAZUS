import type { UserContext } from '@gorazus/contracts';
import { BaseRepository, PrismaDelegate } from './base.repository';

interface FakeRecord {
  id: string;
  name: string;
  deleted_at: Date | null;
}

/** Fake mínimo de un PrismaClient — solo lo que withTenantScope/$transaction necesitan. */
class FakeClient {
  public executedRawCalls: string[] = [];

  async $transaction<T>(fn: (tx: FakeClient) => Promise<T>): Promise<T> {
    return fn(this);
  }

  async $executeRawUnsafe(query: string): Promise<unknown> {
    this.executedRawCalls.push(query);
    return undefined;
  }
}

class FakeRepository extends BaseRepository<
  { id: string },
  { deleted_at?: null },
  { name: string },
  { name?: string },
  FakeRecord,
  FakeClient
> {
  constructor(
    client: FakeClient,
    private readonly records: FakeRecord[],
  ) {
    super(client, () => this.buildDelegate());
  }

  private buildDelegate(): PrismaDelegate<
    { id: string },
    { deleted_at?: null },
    { name: string },
    { name?: string },
    FakeRecord
  > {
    return {
      findUnique: async ({ where }) => this.records.find((r) => r.id === where.id) ?? null,
      findMany: async ({ where }) =>
        this.records.filter((r) => (where?.deleted_at === null ? r.deleted_at === null : true)),
      count: async ({ where }) =>
        this.records.filter((r) => (where?.deleted_at === null ? r.deleted_at === null : true))
          .length,
      create: async ({ data }) => {
        const record: FakeRecord = {
          id: `new-${this.records.length}`,
          name: data.name,
          deleted_at: null,
        };
        this.records.push(record);
        return record;
      },
      update: async ({ where, data }) => {
        const record = this.records.find((r) => r.id === where.id);
        if (!record) throw new Error('not found');
        if (data.name) record.name = data.name;
        return record;
      },
    };
  }
}

describe('BaseRepository', () => {
  const context: UserContext = {
    userId: 'user-1',
    tenantId: 'tenant-1',
    companyId: 'company-1',
    branchId: null,
    sessionId: 'session-1',
  };

  it('setea el contexto de tenant vía set_config antes de cada operación (RLS)', async () => {
    const client = new FakeClient();
    const repo = new FakeRepository(client, []);
    await repo.create(context, { name: 'foo' });
    expect(client.executedRawCalls.some((q) => q.includes('app.current_tenant_id'))).toBe(true);
    expect(client.executedRawCalls.some((q) => q.includes('app.current_company_ids'))).toBe(true);
  });

  it('no setea company_ids cuando companyId es null (alcance "todas las empresas")', async () => {
    const client = new FakeClient();
    const repo = new FakeRepository(client, []);
    await repo.create({ ...context, companyId: null }, { name: 'foo' });
    expect(client.executedRawCalls.some((q) => q.includes('app.current_company_ids'))).toBe(false);
  });

  it('findMany excluye soft-deleted por defecto', async () => {
    const client = new FakeClient();
    const records: FakeRecord[] = [
      { id: '1', name: 'activo', deleted_at: null },
      { id: '2', name: 'borrado', deleted_at: new Date() },
    ];
    const repo = new FakeRepository(client, records);
    const result = await repo.findMany(context, {}, { page: 1, pageSize: 10 });
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.name).toBe('activo');
    expect(result.meta).toEqual({ page: 1, pageSize: 10, total: 1 });
  });

  it('softDelete delega en update (nunca DELETE físico)', async () => {
    const client = new FakeClient();
    const records: FakeRecord[] = [{ id: '1', name: 'activo', deleted_at: null }];
    const repo = new FakeRepository(client, records);
    await repo.softDelete(context, { id: '1' }, { name: 'activo (borrado)' });
    expect(records[0]?.name).toBe('activo (borrado)');
  });
});
