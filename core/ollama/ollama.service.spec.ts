import { ConfigService } from '@nestjs/config';
import { OllamaService } from './ollama.service';

/** Fake mínimo del cliente `Ollama` — solo los métodos que OllamaService delega. */
class FakeOllamaClient {
  generate = jest.fn().mockResolvedValue({ response: 'respuesta generada' });
  chat = jest
    .fn()
    .mockResolvedValue({ message: { role: 'assistant', content: 'respuesta de chat' } });
  embed = jest.fn().mockResolvedValue({ embeddings: [[0.1, 0.2, 0.3]] });
  list = jest
    .fn()
    .mockResolvedValue({ models: [{ name: 'llama3.1' }, { name: 'mxbai-embed-large' }] });
}

function buildService(fakeClient: FakeOllamaClient): OllamaService {
  const configService = {
    get: (key: string) => (key === 'ollama.baseUrl' ? 'http://localhost:11434' : 'llama3.1'),
  } as unknown as ConfigService;
  const service = new OllamaService(configService);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (service as any).client = fakeClient;
  return service;
}

describe('OllamaService', () => {
  it('generate() usa el modelo por defecto y devuelve solo el texto de la respuesta', async () => {
    const fakeClient = new FakeOllamaClient();
    const service = buildService(fakeClient);

    const result = await service.generate('¿cuál es el stock del producto X?');

    expect(result).toBe('respuesta generada');
    expect(fakeClient.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'llama3.1',
        prompt: '¿cuál es el stock del producto X?',
        stream: false,
      }),
    );
  });

  it('generate() respeta un modelo explícito por sobre el default', async () => {
    const fakeClient = new FakeOllamaClient();
    const service = buildService(fakeClient);

    await service.generate('hola', { model: 'mistral' });

    expect(fakeClient.generate).toHaveBeenCalledWith(expect.objectContaining({ model: 'mistral' }));
  });

  it('chat() devuelve solo el contenido del mensaje del asistente', async () => {
    const fakeClient = new FakeOllamaClient();
    const service = buildService(fakeClient);

    const result = await service.chat([{ role: 'user', content: 'hola' }]);

    expect(result).toBe('respuesta de chat');
    expect(fakeClient.chat).toHaveBeenCalledWith(expect.objectContaining({ stream: false }));
  });

  it('embed() devuelve los vectores tal cual los da el cliente', async () => {
    const fakeClient = new FakeOllamaClient();
    const service = buildService(fakeClient);

    const result = await service.embed('texto a vectorizar');

    expect(result).toEqual([[0.1, 0.2, 0.3]]);
  });

  it('listModels() devuelve solo los nombres', async () => {
    const fakeClient = new FakeOllamaClient();
    const service = buildService(fakeClient);

    const result = await service.listModels();

    expect(result).toEqual(['llama3.1', 'mxbai-embed-large']);
  });
});
