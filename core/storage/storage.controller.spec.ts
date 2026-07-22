import type { ConfigService } from '@nestjs/config';
import type { UserContext } from '@gorazus/contracts';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';

/**
 * Contra MinIO real (no mockeado) — mismo criterio que `core/cache/lock.service.spec.ts`
 * contra Redis real. Requiere el MinIO del compose de desarrollo arriba
 * (MINIO_*, ver .env.example).
 */
describe('StorageController', () => {
  let controller: StorageController;
  const user: UserContext = {
    userId: 'user-test',
    tenantId: `test-storage-controller-${Date.now()}`,
    companyId: null,
    branchId: null,
    sessionId: 'session-test',
  };

  const fakeConfigService = {
    get: (key: string) => {
      const values: Record<string, unknown> = {
        'storage.endpoint': process.env['MINIO_ENDPOINT'],
        'storage.port': Number(process.env['MINIO_PORT']),
        'storage.rootUser': process.env['MINIO_ROOT_USER'],
        'storage.rootPassword': process.env['MINIO_ROOT_PASSWORD'],
      };
      return values[key];
    },
  } as unknown as ConfigService;

  beforeAll(() => {
    const storageService = new StorageService(fakeConfigService);
    storageService.onModuleInit();
    controller = new StorageController(storageService);
  });

  function fakeFile(contents: string, originalname: string): Express.Multer.File {
    const buffer = Buffer.from(contents);
    return {
      buffer,
      originalname,
      mimetype: 'text/plain',
      size: buffer.length,
    } as Express.Multer.File;
  }

  it('sube un archivo, devuelve una URL firmada de descarga y después lo borra', async () => {
    const uploadResult = await controller.upload(fakeFile('contenido de prueba', 'nota.txt'), user);
    expect(uploadResult.data.key).toEqual(expect.any(String));
    expect(uploadResult.data.contentType).toBe('text/plain');
    expect(uploadResult.data.size).toBeGreaterThan(0);

    const downloadResult = await controller.getDownloadUrl(uploadResult.data.key, user);
    expect(downloadResult.data.url).toMatch(/^http/);

    await expect(controller.remove(uploadResult.data.key, user)).resolves.toBeUndefined();
  });

  it('sanitiza nombres de archivo con caracteres fuera de lo esperado (sin barras/rutas)', async () => {
    const uploadResult = await controller.upload(
      fakeFile('otro contenido', '../../etc/passwd'),
      user,
    );
    expect(uploadResult.data.key).not.toContain('/');
    expect(uploadResult.data.key).not.toContain('..');

    await controller.remove(uploadResult.data.key, user);
  });

  it('subir sin archivo lanza BadRequestException', async () => {
    await expect(controller.upload(undefined, user)).rejects.toThrow(
      'Falta el archivo (campo "file").',
    );
  });
});
