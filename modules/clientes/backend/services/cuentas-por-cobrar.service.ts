import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import { DomainException } from '@gorazus/core-http';
import {
  CuentaPorCobrarRepository,
  type CuentaPorCobrar,
} from '../repositories/cuenta-por-cobrar.repository';
import { ClienteRepository } from '../repositories/cliente.repository';

export class ClienteNoEncontradoParaCuentasPorCobrarException extends DomainException {
  constructor(customerId: string) {
    super('CLIENTE_NO_ENCONTRADO', `No existe el cliente "${customerId}".`, 404);
  }
}

/**
 * Integración real Clientes↔Ventas↔Cuentas por Cobrar — de solo lectura,
 * sobre `customers.v_accounts_receivable_aging` (facturas de `sales` ya
 * emitidas, saldo abierto calculado por la vista). Primera pieza de
 * integración de la fase "preparar CRM para producción" — Caja no tiene
 * un punto de integración real hoy (`CRM_ARCHITECTURE.md §14`), y
 * Cotizaciones/Pedidos/Compras/Contabilidad todavía no existen como
 * módulos, no hay nada con qué integrar.
 */
@Injectable()
export class CuentasPorCobrarService {
  constructor(
    private readonly cuentaPorCobrarRepository: CuentaPorCobrarRepository,
    private readonly clienteRepository: ClienteRepository,
  ) {}

  async listarPorCliente(context: UserContext, customerId: string): Promise<CuentaPorCobrar[]> {
    const cliente = await this.clienteRepository.findById(context, { id: customerId });
    if (!cliente) throw new ClienteNoEncontradoParaCuentasPorCobrarException(customerId);
    return this.cuentaPorCobrarRepository.listarPorCliente(context, customerId);
  }
}
