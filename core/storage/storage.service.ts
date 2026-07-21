import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client as MinioClient } from 'minio';

/**
 * Ver docs/architecture/08-infraestructura-y-despliegue.md §5: un
 * bucket por módulo (no genérico), acceso siempre vía backend con URLs
 * firmadas de corta duración — nunca se exponen credenciales de MinIO
 * al frontend. El nombre del bucket lo decide cada módulo al llamar
 * (`ventas-comprobantes`, `compras-facturas`...), este servicio no
 * conoce ningún bucket de negocio de antemano.
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private client!: MinioClient;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    this.client = new MinioClient({
      endPoint: this.configService.get<string>('storage.endpoint') as string,
      port: this.configService.get<number>('storage.port'),
      useSSL: false, // TLS lo termina nginx (ver 08 §2), no MinIO directo
      accessKey: this.configService.get<string>('storage.rootUser') as string,
      secretKey: this.configService.get<string>('storage.rootPassword') as string,
    });
  }

  async ensureBucket(bucket: string): Promise<void> {
    const exists = await this.client.bucketExists(bucket).catch(() => false);
    if (!exists) {
      await this.client.makeBucket(bucket);
    }
  }

  async upload(
    bucket: string,
    objectName: string,
    data: Buffer,
    contentType?: string,
  ): Promise<void> {
    await this.client.putObject(
      bucket,
      objectName,
      data,
      undefined,
      contentType ? { 'Content-Type': contentType } : undefined,
    );
  }

  /** URL firmada de corta duración — ver 08 §5, nunca credenciales directas al frontend. */
  async getSignedUrl(bucket: string, objectName: string, expirySeconds = 300): Promise<string> {
    return this.client.presignedGetObject(bucket, objectName, expirySeconds);
  }

  async delete(bucket: string, objectName: string): Promise<void> {
    await this.client.removeObject(bucket, objectName);
  }
}
