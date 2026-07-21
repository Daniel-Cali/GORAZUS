import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Ver docs/architecture/08-infraestructura-y-despliegue.md §3: tres
 * usos de Redis sin mezclarlos (cache, adaptador WebSocket, rate
 * limiting/locks), cada uno en su propio namespace de claves para
 * poder monitorear y purgar independientemente. Este servicio cubre
 * el uso "cache de lectura" (`cache:*`) — el adaptador WebSocket vive
 * en core/realtime (todavía no construido) y el rate limiting ya lo
 * cubre `core/http` (ThrottlerModule, en memoria por ahora — migrar a
 * Redis cuando haya más de una réplica real).
 */
@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private client!: Redis;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    this.client = new Redis(this.configService.get<string>('redis.url') as string, {
      lazyConnect: false,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }

  private namespacedKey(key: string): string {
    return `cache:${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(this.namespacedKey(key));
    return raw ? (JSON.parse(raw) as T) : null;
  }

  /** `ttlSeconds` obligatorio a propósito — ver 08 §3, invalidación explícita del módulo dueño, no solo TTL, pero todo valor cacheado igual debe tener un techo de vida. */
  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    await this.client.set(this.namespacedKey(key), JSON.stringify(value), 'EX', ttlSeconds);
  }

  async del(key: string): Promise<void> {
    await this.client.del(this.namespacedKey(key));
  }

  async ping(): Promise<boolean> {
    return (await this.client.ping()) === 'PONG';
  }
}
