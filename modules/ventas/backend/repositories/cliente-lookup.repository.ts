import type { UserContext } from '@gorazus/contracts';

/** Puerto — verificación de cliente al crear una factura. Copia local de solo lectura sobre `customers.customers` (fronteras de Nx entre módulos de negocio). */
export abstract class ClienteLookupRepository {
  abstract existeCliente(context: UserContext, customerId: string): Promise<boolean>;
}
