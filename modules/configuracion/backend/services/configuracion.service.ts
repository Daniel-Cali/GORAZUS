import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import { ParametroRepository } from '../repositories/parametro.repository';
import { ConfiguracionValorRepository } from '../repositories/configuracion-valor.repository';
import { ParametroNoEncontradoException } from './parametros.service';
import type { FijarValorInput } from '../validators/configuracion.schema';

/**
 * Valor efectivo de un parámetro para el tenant actual — si no hay override
 * en `system_settings`, cae al `default_value` del parámetro
 * (docs/architecture/14-modulo-core.md). Sin cascada empresa/sucursal
 * todavía (KISS, mismo criterio que `RolesService`: se agrega si un caso de
 * uso real la necesita).
 */
@Injectable()
export class ConfiguracionService {
  constructor(
    private readonly parametroRepository: ParametroRepository,
    private readonly valorRepository: ConfiguracionValorRepository,
  ) {}

  async obtenerValor(context: UserContext, key: string): Promise<string | null> {
    const parametro = await this.parametroRepository.findByKey(context, key);
    if (!parametro) throw new ParametroNoEncontradoException(key);

    const valor = await this.valorRepository.findByParameterId(context, parametro.id);
    return valor ? valor.value : parametro.default_value;
  }

  async fijarValor(context: UserContext, input: FijarValorInput): Promise<string> {
    const parametro = await this.parametroRepository.findByKey(context, input.key);
    if (!parametro) throw new ParametroNoEncontradoException(input.key);

    const existente = await this.valorRepository.findByParameterId(context, parametro.id);
    if (existente) {
      const actualizado = await this.valorRepository.update(
        context,
        { id: existente.id },
        { value: input.value },
      );
      return actualizado.value;
    }

    const creado = await this.valorRepository.create(context, {
      tenant_id: context.tenantId,
      parameter_id: parametro.id,
      value: input.value,
    });
    return creado.value;
  }
}
