import type { UserContext } from '@gorazus/contracts';
import { NotificationCenterService } from './notification-center.service';
import type { NotificationChannelAdapter } from './channels/notification-channel.adapter';

interface FakeChannel {
  id: string;
  channel_type: string;
  deleted_at: Date | null;
  is_active: boolean;
}
interface FakePreference {
  user_id: string;
  channel_id: string;
  is_opted_in: boolean;
  metadata: Record<string, unknown>;
  deleted_at: Date | null;
}
interface FakeNotification {
  id: string;
  recipient_user_id: string;
  subject: string | null;
  body: string;
}
interface FakeDeliveryLog {
  notification_id: string;
  channel_id: string;
  status: string;
  provider_response: string | null;
}

/** Fake mínimo del cliente `core` — solo los modelos/métodos que NotificationCenterService usa. */
class FakeCoreClient {
  public deliveryLogs: FakeDeliveryLog[] = [];
  public createdNotifications: FakeNotification[] = [];

  constructor(
    private readonly channels: FakeChannel[],
    private readonly preferences: FakePreference[],
  ) {}

  async $transaction<T>(fn: (tx: this) => Promise<T>): Promise<T> {
    return fn(this);
  }
  async $executeRawUnsafe(): Promise<unknown> {
    return undefined;
  }

  get notification_channels() {
    return {
      findFirst: async ({
        where,
      }: {
        where: { channel_type: string; deleted_at: null; is_active: boolean };
      }) =>
        this.channels.find(
          (c) => c.channel_type === where.channel_type && c.deleted_at === where.deleted_at,
        ) ?? null,
    };
  }

  get notification_preferences() {
    return {
      findFirst: async ({
        where,
      }: {
        where: { user_id: string; channel_id: string; deleted_at: null };
      }) =>
        this.preferences.find(
          (p) => p.user_id === where.user_id && p.channel_id === where.channel_id,
        ) ?? null,
    };
  }

  get notifications() {
    return {
      create: async ({
        data,
      }: {
        data: { recipient_user_id: string; subject: string | null; body: string };
      }) => {
        const record: FakeNotification = {
          id: `notif-${this.createdNotifications.length + 1}`,
          ...data,
        };
        this.createdNotifications.push(record);
        return record;
      },
    };
  }

  get notification_delivery_logs() {
    return {
      create: async ({ data }: { data: FakeDeliveryLog }) => {
        this.deliveryLogs.push(data);
        return data;
      },
    };
  }
}

class FakeLogger {
  errors: unknown[] = [];
  error(message: string, context?: Record<string, unknown>): void {
    this.errors.push({ message, context });
  }
}

const context: Pick<UserContext, 'tenantId' | 'companyId'> = {
  tenantId: 'tenant-1',
  companyId: 'company-1',
};
const CHANNEL: FakeChannel = {
  id: 'channel-whatsapp',
  channel_type: 'whatsapp',
  deleted_at: null,
  is_active: true,
};

describe('NotificationCenterService', () => {
  it('envía por WhatsApp y registra sent en notification_delivery_logs', async () => {
    const preference: FakePreference = {
      user_id: 'user-1',
      channel_id: CHANNEL.id,
      is_opted_in: true,
      metadata: { whatsappPhoneNumber: '+18095551234' },
      deleted_at: null,
    };
    const client = new FakeCoreClient([CHANNEL], [preference]);
    const adapter: NotificationChannelAdapter = {
      channelType: 'whatsapp',
      send: jest.fn().mockResolvedValue({ providerResponse: '{"messages":[{"id":"wamid.abc"}]}' }),
    };
    const logger = new FakeLogger();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = new NotificationCenterService(client as any, adapter as any, logger as any);

    const result = await service.send(context, {
      recipientUserId: 'user-1',
      channelType: 'whatsapp',
      body: 'Tu pedido fue confirmado',
    });

    expect(result.status).toBe('sent');
    expect(adapter.send).toHaveBeenCalledWith(context, '+18095551234', 'Tu pedido fue confirmado');
    expect(client.deliveryLogs).toHaveLength(1);
    expect(client.deliveryLogs[0]?.status).toBe('sent');
  });

  it('marca failed y registra el motivo cuando el adaptador lanza, sin relanzar', async () => {
    const preference: FakePreference = {
      user_id: 'user-1',
      channel_id: CHANNEL.id,
      is_opted_in: true,
      metadata: { whatsappPhoneNumber: '+18095551234' },
      deleted_at: null,
    };
    const client = new FakeCoreClient([CHANNEL], [preference]);
    const adapter: NotificationChannelAdapter = {
      channelType: 'whatsapp',
      send: jest.fn().mockRejectedValue(new Error('WhatsApp Graph API error 401: token inválido')),
    };
    const logger = new FakeLogger();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = new NotificationCenterService(client as any, adapter as any, logger as any);

    const result = await service.send(context, {
      recipientUserId: 'user-1',
      channelType: 'whatsapp',
      body: 'hola',
    });

    expect(result.status).toBe('failed');
    expect(result.error).toContain('token inválido');
    expect(client.deliveryLogs[0]?.status).toBe('failed');
    expect(logger.errors).toHaveLength(1);
  });

  it('rechaza sin llamar al adaptador si el canal no está configurado', async () => {
    const client = new FakeCoreClient([], []);
    const adapter: NotificationChannelAdapter = { channelType: 'whatsapp', send: jest.fn() };
    const logger = new FakeLogger();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = new NotificationCenterService(client as any, adapter as any, logger as any);

    await expect(
      service.send(context, { recipientUserId: 'user-1', channelType: 'whatsapp', body: 'hola' }),
    ).rejects.toThrow("Canal 'whatsapp' no está dado de alta");
    expect(adapter.send).not.toHaveBeenCalled();
  });

  it('rechaza sin llamar al adaptador si el destinatario desactivó el canal', async () => {
    const preference: FakePreference = {
      user_id: 'user-1',
      channel_id: CHANNEL.id,
      is_opted_in: false,
      metadata: {},
      deleted_at: null,
    };
    const client = new FakeCoreClient([CHANNEL], [preference]);
    const adapter: NotificationChannelAdapter = { channelType: 'whatsapp', send: jest.fn() };
    const logger = new FakeLogger();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = new NotificationCenterService(client as any, adapter as any, logger as any);

    await expect(
      service.send(context, { recipientUserId: 'user-1', channelType: 'whatsapp', body: 'hola' }),
    ).rejects.toThrow('desactivado');
    expect(adapter.send).not.toHaveBeenCalled();
  });

  it('rechaza si no hay número de WhatsApp en notification_preferences.metadata', async () => {
    const preference: FakePreference = {
      user_id: 'user-1',
      channel_id: CHANNEL.id,
      is_opted_in: true,
      metadata: {},
      deleted_at: null,
    };
    const client = new FakeCoreClient([CHANNEL], [preference]);
    const adapter: NotificationChannelAdapter = { channelType: 'whatsapp', send: jest.fn() };
    const logger = new FakeLogger();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = new NotificationCenterService(client as any, adapter as any, logger as any);

    await expect(
      service.send(context, { recipientUserId: 'user-1', channelType: 'whatsapp', body: 'hola' }),
    ).rejects.toThrow('Sin número de WhatsApp');
    expect(adapter.send).not.toHaveBeenCalled();
  });
});
