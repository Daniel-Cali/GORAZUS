// SUPERADO — no se compila (ver core/database/tsconfig.json exclude) ni
// se exporta desde index.ts. Diseñado para un único cliente Prisma
// monolítico (los 500 modelos de los 21 schemas juntos), lo cual hacía
// colgar `prisma generate` a esa escala — reemplazado por 21 clientes
// independientes, uno por schema, en database.module.ts. No se borra
// (regla del proyecto: no eliminar nada) — queda como referencia
// histórica de por qué el enfoque monolítico no funcionaba.
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../prisma/generated';

/**
 * Ver docs/architecture/02-arquitectura-modulos-backend.md §4: Prisma es
 * consumidor del SQL crudo, no dueño — este servicio solo envuelve el
 * cliente generado por `prisma db pull`, no declara schema.
 *
 * `DATABASE_URL` se lee directo de `process.env` (no vía ConfigService)
 * porque `core/config` (validación Zod, EPIC 04/05) todavía no existe —
 * este servicio se actualiza para consumirlo cuando esté disponible, sin
 * cambiar su interfaz pública.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    // Sin `log` de eventos todavía: requeriría suscribirse vía $on() a
    // un logger real, y core/http (Logging Framework, ver docs/architecture/
    // 32-core-platform/07 §2) no existe todavía — se conecta cuando exista,
    // en vez de loguear a un destino que nadie consume.
    super({
      datasources: { db: { url: process.env.DATABASE_URL } },
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Conexión a PostgreSQL establecida');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
