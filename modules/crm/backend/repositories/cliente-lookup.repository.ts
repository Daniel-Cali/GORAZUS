import type { UserContext } from '@gorazus/contracts';

/** Puerto — verificación de solo lectura de `customers.customers`. Copia local propia de `crm` (fronteras de Nx entre módulos), análoga a la de `modules/ventas/backend`. */
export abstract class ClienteLookupRepository {
  abstract existeCliente(context: UserContext, customerId: string): Promise<boolean>;
}
