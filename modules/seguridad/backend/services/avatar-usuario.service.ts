import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import { DomainException } from '@gorazus/core-http';
import { StorageService } from '@gorazus/core-storage';
// eslint-disable-next-line @nx/enforce-module-boundaries -- packages/tooling no tiene project.json propio, ver login.usecase.ts
import { generateUuid } from '../../../../packages/tooling/utils';
import { PerfilExtendidoRepository } from '../repositories/perfil-extendido.repository';

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;

export class ArchivoDemasiadoGrandeException extends DomainException {
  constructor() {
    super('ARCHIVO_DEMASIADO_GRANDE', 'La foto de perfil no puede superar los 5MB.', 400);
  }
}

function avatarBucket(tenantId: string): string {
  return `avatares-${tenantId}`;
}

/** Mismo saneamiento que `core/storage/storage.controller.ts` — evita que el nombre original termine formando una object key inesperada. */
function sanitizeFileName(originalName: string): string {
  return originalName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '_')
    .slice(-100);
}

/**
 * Foto de perfil (FASE 03 Parte 03) — reusa `StorageService` (`core/storage`,
 * `@Global()`) directamente en vez de pasar por `POST /files`: mismo
 * mecanismo (bucket por tenant, MinIO), bucket propio (`avatares-<tenantId>`)
 * en vez de compartir `archivos-<tenantId>` con archivos genéricos de
 * cualquier módulo. La key se guarda en `user_profiles.metadata.avatarKey`
 * — NO en `user_profiles.avatar_file_id` (esa columna es FK a
 * `core.files`, tabla que ningún flujo de subida llena todavía; ver
 * `USERS_REPORT.md`).
 */
@Injectable()
export class AvatarUsuarioService {
  constructor(
    private readonly storageService: StorageService,
    private readonly perfilExtendidoRepository: PerfilExtendidoRepository,
  ) {}

  async subir(
    context: UserContext,
    userId: string,
    file: { originalname: string; mimetype: string; size: number; buffer: Buffer },
  ): Promise<{ avatarKey: string; avatarUrl: string }> {
    if (file.size > MAX_AVATAR_SIZE_BYTES) throw new ArchivoDemasiadoGrandeException();

    const bucket = avatarBucket(context.tenantId);
    await this.storageService.ensureBucket(bucket);
    const key = `${userId}/${generateUuid()}-${sanitizeFileName(file.originalname)}`;
    await this.storageService.upload(bucket, key, file.buffer, file.mimetype);

    await this.perfilExtendidoRepository.upsert(context, userId, {
      metadataPatch: { avatarKey: key },
    });

    const avatarUrl = await this.storageService.getSignedUrl(bucket, key);
    return { avatarKey: key, avatarUrl };
  }

  async obtenerUrl(context: UserContext, userId: string): Promise<string | null> {
    const perfil = await this.perfilExtendidoRepository.buscarPorUsuario(context, userId);
    const metadata =
      perfil && typeof perfil.metadata === 'object' && perfil.metadata !== null
        ? (perfil.metadata as Record<string, unknown>)
        : {};
    const avatarKey = metadata['avatarKey'];
    if (typeof avatarKey !== 'string') return null;

    return this.storageService.getSignedUrl(avatarBucket(context.tenantId), avatarKey);
  }

  async eliminar(context: UserContext, userId: string): Promise<void> {
    const perfil = await this.perfilExtendidoRepository.buscarPorUsuario(context, userId);
    const metadata =
      perfil && typeof perfil.metadata === 'object' && perfil.metadata !== null
        ? (perfil.metadata as Record<string, unknown>)
        : {};
    const avatarKey = metadata['avatarKey'];
    if (typeof avatarKey !== 'string') return;

    await this.storageService.delete(avatarBucket(context.tenantId), avatarKey);
    await this.perfilExtendidoRepository.upsert(context, userId, {
      metadataPatch: { avatarKey: undefined },
    });
  }
}
