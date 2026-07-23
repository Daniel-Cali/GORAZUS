import type { UserContext } from '@gorazus/contracts';
import type { StorageService } from '@gorazus/core-storage';
import type { user_profiles } from '@gorazus/core-database';
import { PerfilExtendidoRepository } from '../repositories/perfil-extendido.repository';
import { AvatarUsuarioService, ArchivoDemasiadoGrandeException } from './avatar-usuario.service';

const CONTEXT: UserContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  branchId: null,
  sessionId: 'session-1',
};

describe('AvatarUsuarioService', () => {
  let perfil: user_profiles | null;
  let uploadCalls: Array<{ bucket: string; objectName: string }>;
  let deleteCalls: Array<{ bucket: string; objectName: string }>;
  let upsertCalls: Array<{ metadataPatch?: Record<string, unknown> }>;
  let storageService: StorageService;
  let perfilExtendidoRepository: PerfilExtendidoRepository;

  beforeEach(() => {
    perfil = null;
    uploadCalls = [];
    deleteCalls = [];
    upsertCalls = [];

    storageService = {
      ensureBucket: jest.fn(async () => undefined),
      upload: jest.fn(async (bucket: string, objectName: string) => {
        uploadCalls.push({ bucket, objectName });
      }),
      getSignedUrl: jest.fn(
        async (bucket: string, objectName: string) => `https://minio.local/${bucket}/${objectName}`,
      ),
      delete: jest.fn(async (bucket: string, objectName: string) => {
        deleteCalls.push({ bucket, objectName });
      }),
    } as unknown as StorageService;

    perfilExtendidoRepository = {
      buscarPorUsuario: jest.fn(async () => perfil),
      upsert: jest.fn(
        async (
          _ctx: unknown,
          userId: string,
          data: { metadataPatch?: Record<string, unknown> },
        ) => {
          upsertCalls.push(data);
          perfil = {
            id: 'profile-1',
            user_id: userId,
            metadata: data.metadataPatch ?? {},
          } as unknown as user_profiles;
          return perfil;
        },
      ),
    } as unknown as PerfilExtendidoRepository;
  });

  function buildService(): AvatarUsuarioService {
    return new AvatarUsuarioService(storageService, perfilExtendidoRepository);
  }

  it('subir: rechaza archivos de más de 5MB antes de tocar el storage', async () => {
    const archivoGrande = {
      originalname: 'foto.png',
      mimetype: 'image/png',
      size: 6 * 1024 * 1024,
      buffer: Buffer.from(''),
    };
    await expect(buildService().subir(CONTEXT, 'user-1', archivoGrande)).rejects.toThrow(
      ArchivoDemasiadoGrandeException,
    );
    expect(uploadCalls).toHaveLength(0);
  });

  it('subir: sube al bucket propio (avatares-<tenantId>) y guarda la key en metadata', async () => {
    const archivo = {
      originalname: 'foto.png',
      mimetype: 'image/png',
      size: 1024,
      buffer: Buffer.from('contenido'),
    };
    const resultado = await buildService().subir(CONTEXT, 'user-1', archivo);

    expect(uploadCalls[0]?.bucket).toBe('avatares-tenant-1');
    expect(resultado.avatarKey).toContain('foto.png');
    expect(upsertCalls[0]?.metadataPatch).toEqual({ avatarKey: resultado.avatarKey });
  });

  it('eliminar: sin avatar previo, no llama al storage (idempotente)', async () => {
    await buildService().eliminar(CONTEXT, 'user-1');
    expect(deleteCalls).toHaveLength(0);
  });

  it('eliminar: con avatar previo, borra del storage y limpia la key', async () => {
    perfil = {
      id: 'profile-1',
      user_id: 'user-1',
      metadata: { avatarKey: 'user-1/foto.png' },
    } as unknown as user_profiles;
    await buildService().eliminar(CONTEXT, 'user-1');
    expect(deleteCalls).toEqual([{ bucket: 'avatares-tenant-1', objectName: 'user-1/foto.png' }]);
  });

  it('obtenerUrl: sin avatar devuelve null', async () => {
    const url = await buildService().obtenerUrl(CONTEXT, 'user-1');
    expect(url).toBeNull();
  });
});
