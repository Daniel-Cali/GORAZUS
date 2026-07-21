import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService, RequestContext } from '@gorazus/core-logging';
import * as amqp from 'amqplib';

const EXCHANGE = 'gorazus.eventos';

/**
 * Ver docs/architecture/08-infraestructura-y-despliegue.md §4: exchange
 * topic único (`gorazus.eventos`), routing key `<modulo>.<entidad>.<evento>`
 * (`ventas.venta.confirmada`), cada módulo consumidor declara su propia
 * cola con binding — nunca comparte cola con otro módulo. Este
 * servicio es el mecanismo genérico (publish/subscribe); ningún módulo
 * de negocio existe todavía para declarar colas reales — `subscribe`
 * queda listo para cuando el primero las declare.
 *
 * El `requestId` activo (core/logging/request-context.ts) se propaga
 * en los headers del mensaje — ver docs/architecture/32-core-platform/
 * 07-observabilidad-y-gobernanza.md §7 (Tracing): un evento procesado
 * asíncronamente conserva la trazabilidad a la request que lo originó.
 */
@Injectable()
export class EventBusService implements OnModuleInit, OnModuleDestroy {
  private connection!: amqp.ChannelModel;
  private channel!: amqp.Channel;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.connection = await amqp.connect(this.configService.get<string>('rabbitmq.url') as string);
    this.channel = await this.connection.createChannel();
    await this.channel.assertExchange(EXCHANGE, 'topic', { durable: true });
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }

  /** `routingKey` sigue la convención `<modulo>.<entidad>.<evento>` — ver 08 §4. */
  publish(routingKey: string, payload: Record<string, unknown>): boolean {
    const requestId = RequestContext.get()?.requestId;
    return this.channel.publish(EXCHANGE, routingKey, Buffer.from(JSON.stringify(payload)), {
      headers: { 'x-request-id': requestId },
      persistent: true,
    });
  }

  /**
   * Declara la cola propia del consumidor (nunca compartida, ver 08 §4)
   * con dead-letter queue, y la bindea a los `routingKeys` de interés.
   */
  async subscribe(
    queueName: string,
    routingKeys: string[],
    handler: (payload: Record<string, unknown>, requestId?: string) => Promise<void>,
  ): Promise<void> {
    const dlq = `${queueName}.dlq`;
    await this.channel.assertQueue(dlq, { durable: true });
    await this.channel.assertQueue(queueName, {
      durable: true,
      deadLetterExchange: '',
      deadLetterRoutingKey: dlq,
    });
    for (const routingKey of routingKeys) {
      await this.channel.bindQueue(queueName, EXCHANGE, routingKey);
    }

    await this.channel.consume(queueName, (msg) => {
      if (!msg) return;
      const requestId = msg.properties.headers?.['x-request-id'] as string | undefined;
      const payload = JSON.parse(msg.content.toString());
      handler(payload, requestId)
        .then(() => this.channel.ack(msg))
        .catch((error) => {
          this.logger.error('Fallo procesando evento, reenviado a DLQ', {
            queue: queueName,
            error: error instanceof Error ? error.message : String(error),
          });
          this.channel.nack(msg, false, false);
        });
    });
  }
}
