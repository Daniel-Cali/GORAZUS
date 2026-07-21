import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
// Ruta relativa, no el alias `@gorazus/tooling/*` — `packages/tooling` no es un
// paquete pnpm real (sin package.json propio), el alias solo resuelve para el
// type-checker (mismo criterio ya usado en core/notifications/integrations/whatsapp-credentials.service.ts).
// eslint-disable-next-line @nx/enforce-module-boundaries -- packages/tooling no tiene project.json propio, ver comentario arriba
import { generateUuid } from '../../packages/tooling/utils';

/**
 * Lock distribuido de una sola instancia Redis — no es Redlock multi-nodo
 * (ver docs/architecture/08-infraestructura-y-despliegue.md §3: un solo
 * Redis en esta arquitectura; Redlock resuelve consenso entre varios
 * nodos, un problema que acá no existe). `SET NX PX` para adquirir; un
 * token aleatorio por titular + script Lua (GET+DEL atómico) para
 * liberar, así un proceso nunca libera un lock ajeno que ya expiró por
 * TTL y fue tomado por otro (clásico bug de "unlock sin dueño").
 */
@Injectable()
export class LockService implements OnModuleInit, OnModuleDestroy {
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
    return `lock:${key}`;
  }

  /** `null` si el lock ya está tomado. Guardar el token devuelto — hace falta para `release()`. */
  async acquire(key: string, ttlMs: number): Promise<string | null> {
    const token = generateUuid();
    const result = await this.client.set(this.namespacedKey(key), token, 'PX', ttlMs, 'NX');
    return result === 'OK' ? token : null;
  }

  /** `false` si el lock ya no existe o pertenece a otro titular (token distinto) — nunca lanza. */
  async release(key: string, token: string): Promise<boolean> {
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    const result = await this.client.eval(script, 1, this.namespacedKey(key), token);
    return result === 1;
  }

  /**
   * Adquiere, ejecuta `fn`, libera — incluso si `fn` lanza. Sin
   * reintento automático: si otro proceso ya tiene el lock, lanza de
   * inmediato (la política de reintento/backoff es decisión del
   * caller, no de esta utilidad genérica).
   */
  async withLock<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
    const token = await this.acquire(key, ttlMs);
    if (!token) {
      throw new LockAcquisitionError(key);
    }
    try {
      return await fn();
    } finally {
      await this.release(key, token);
    }
  }
}

export class LockAcquisitionError extends Error {
  constructor(key: string) {
    super(`No se pudo adquirir el lock "${key}" — ya está tomado por otro proceso.`);
    this.name = 'LockAcquisitionError';
  }
}
