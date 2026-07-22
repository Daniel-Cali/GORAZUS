import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@gorazus/core-http';
import type { UserContext } from '@gorazus/contracts';
// eslint-disable-next-line @nx/enforce-module-boundaries -- packages/tooling no tiene project.json propio, ver modules/auth/backend/services/login.usecase.ts
import { generateUuid } from '../../packages/tooling/utils';
import { StorageService } from './storage.service';

// Límite de arranque, sin caso de uso real todavía que pida más (ej.
// adjuntos de facturas escaneadas de un módulo de negocio futuro) —
// subirlo es un cambio de una línea cuando haga falta, no una decisión
// de arquitectura.
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

/**
 * "Archivos" genérico (FASE 2.10) — antes `core/storage` envolvía MinIO
 * pero ningún endpoint lo usaba (`StorageService` sin consumidor real).
 * Un bucket POR TENANT (`archivos-<tenantId>`), no uno global — mismo
 * aislamiento multi-tenant que el resto de la plataforma, aplicado acá
 * vía bucket en vez de RLS (MinIO no tiene RLS). Ningún módulo de
 * negocio específico todavía asocia estos archivos a sus propios
 * registros (ej. "adjuntar a una factura") — eso vive en la columna
 * `metadata JSONB` que ya tiene cada entidad (guardar acá el `key`
 * devuelto por `POST /files`), sin necesidad de una tabla de metadata
 * de archivos propia todavía.
 */
function tenantBucket(tenantId: string): string {
  return `archivos-${tenantId}`;
}

/** Evita que un nombre de archivo con `/`, `..` o similar termine formando una object key inesperada dentro del bucket. */
function sanitizeFileName(originalName: string): string {
  return originalName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '_')
    .slice(-100);
}

@ApiTags('archivos')
@ApiBearerAuth()
@Controller('files')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @ApiOperation({
    summary: 'Subir un archivo',
    description: 'Multipart, campo "file". Devuelve la key para pedir descarga o borrar después.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Archivo subido — devuelve key/contentType/size.' })
  @ApiResponse({ status: 400, description: 'Falta el archivo o excede el tamaño máximo.' })
  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE_BYTES } }))
  async upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: UserContext,
  ) {
    if (!file) {
      throw new BadRequestException('Falta el archivo (campo "file").');
    }

    const bucket = tenantBucket(user.tenantId);
    await this.storageService.ensureBucket(bucket);
    const key = `${generateUuid()}-${sanitizeFileName(file.originalname)}`;
    await this.storageService.upload(bucket, key, file.buffer, file.mimetype);

    return { data: { key, contentType: file.mimetype, size: file.size } };
  }

  @ApiOperation({
    summary: 'Obtener una URL firmada de descarga',
    description:
      'No redirige ni transmite el archivo — devuelve una URL firmada de corta duración (5 min) que el cliente usa directamente contra MinIO, sin exponerle credenciales.',
  })
  @ApiResponse({ status: 200, description: 'URL firmada.' })
  @Get(':key')
  async getDownloadUrl(@Param('key') key: string, @CurrentUser() user: UserContext) {
    const bucket = tenantBucket(user.tenantId);
    const url = await this.storageService.getSignedUrl(bucket, key);
    return { data: { url } };
  }

  @ApiOperation({ summary: 'Borrar un archivo' })
  @ApiResponse({ status: 204, description: 'Borrado (idempotente — no falla si ya no existía).' })
  @Delete(':key')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('key') key: string, @CurrentUser() user: UserContext): Promise<void> {
    const bucket = tenantBucket(user.tenantId);
    await this.storageService.delete(bucket, key);
  }
}
