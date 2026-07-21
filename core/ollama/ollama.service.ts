import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ollama } from 'ollama';
import type { OllamaCallOptions, OllamaChatMessage } from './types';

/**
 * Wrapper delgado sobre el cliente oficial `ollama` — FASE 04, infraestructura
 * técnica reutilizable (mismo criterio que `core/storage`/`core/messaging`
 * sobre MinIO/RabbitMQ), sin lógica de negocio ni prompts específicos de
 * ningún módulo. Sin streaming (Fase 1): cada llamada espera la respuesta
 * completa — un asistente concreto que necesite streaming lo agrega cuando
 * exista, no esta capa genérica.
 */
@Injectable()
export class OllamaService {
  private readonly client: Ollama;
  private readonly defaultModel: string;

  constructor(private readonly configService: ConfigService) {
    this.client = new Ollama({ host: this.configService.get<string>('ollama.baseUrl') as string });
    this.defaultModel = this.configService.get<string>('ollama.defaultModel') as string;
  }

  async generate(
    prompt: string,
    options?: OllamaCallOptions & { system?: string },
  ): Promise<string> {
    const response = await this.client.generate({
      model: options?.model ?? this.defaultModel,
      prompt,
      system: options?.system,
      stream: false,
    });
    return response.response;
  }

  async chat(messages: OllamaChatMessage[], options?: OllamaCallOptions): Promise<string> {
    const response = await this.client.chat({
      model: options?.model ?? this.defaultModel,
      messages,
      stream: false,
    });
    return response.message.content;
  }

  async embed(input: string | string[], options?: OllamaCallOptions): Promise<number[][]> {
    const response = await this.client.embed({
      model: options?.model ?? this.defaultModel,
      input,
    });
    return response.embeddings;
  }

  async listModels(): Promise<string[]> {
    const response = await this.client.list();
    return response.models.map((model) => model.name);
  }
}
