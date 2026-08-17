import { Button } from '@gorazus/ui-kit';
import { MinusIcon, PlusIcon, ShoppingCartIcon, TrashIcon } from './pos-icons';

export interface LineaCarritoVista {
  id: string;
  /** SKU real para el carrito activo; para una venta suspendida recuperada
   * no hay SKU en la factura (`invoice_lines` solo trae `product_id`), así
   * que el llamador pasa el id truncado — nunca se inventa un SKU acá. */
  label: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  /** Ausentes = línea de solo lectura (venta suspendida recuperada, que no se puede editar). */
  onIncrementar?: () => void;
  onDecrementar?: () => void;
  onEliminar?: () => void;
}

export interface CartPanelAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
}

/**
 * Carrito — panel fijo a la derecha en escritorio, contenido del Drawer
 * en móvil (mismo componente, dos contenedores distintos en
 * `pos.page.tsx`). Solo presentación: cantidades/eliminar disparan los
 * callbacks que ya traían la lógica real (idempotencia, suspensión,
 * cobro) sin tocarla.
 */
export function CartPanel({
  lineas,
  currencyCode,
  total,
  totalLabel = 'Total',
  emptyMessage,
  notice,
  primaryAction,
  secondaryActions = [],
}: {
  lineas: LineaCarritoVista[];
  currencyCode: string;
  total: number;
  totalLabel?: string;
  emptyMessage: string;
  notice?: string;
  primaryAction: CartPanelAction & { pending?: boolean };
  secondaryActions?: CartPanelAction[];
}) {
  const formatear = (amount: number) => {
    try {
      return new Intl.NumberFormat('es', { style: 'currency', currency: currencyCode }).format(
        amount,
      );
    } catch {
      return `${currencyCode} ${amount.toFixed(2)}`;
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <ShoppingCartIcon className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">Carrito</h2>
        {lineas.length > 0 && (
          <span className="ml-auto text-xs text-muted-foreground">
            {lineas.length} línea{lineas.length === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {notice && (
        <p className="border-b bg-muted/40 px-4 py-2 text-xs text-muted-foreground">{notice}</p>
      )}

      <div className="flex-1 divide-y overflow-y-auto">
        {lineas.length === 0 && <p className="p-4 text-sm text-muted-foreground">{emptyMessage}</p>}
        {lineas.map((linea) => (
          <div key={linea.id} className="flex items-center justify-between gap-2 p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{linea.label}</p>
              <p className="text-xs text-muted-foreground">
                {linea.quantity} × {formatear(linea.unitPrice)}
              </p>
            </div>
            {(linea.onIncrementar || linea.onDecrementar || linea.onEliminar) && (
              <div className="flex items-center gap-1">
                {linea.onDecrementar && (
                  <Button variant="outline" size="sm" onClick={linea.onDecrementar}>
                    <MinusIcon className="h-3.5 w-3.5" />
                  </Button>
                )}
                <span className="w-6 text-center text-sm tabular-nums">{linea.quantity}</span>
                {linea.onIncrementar && (
                  <Button variant="outline" size="sm" onClick={linea.onIncrementar}>
                    <PlusIcon className="h-3.5 w-3.5" />
                  </Button>
                )}
                {linea.onEliminar && (
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Eliminar línea"
                    onClick={linea.onEliminar}
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            )}
            <span className="w-16 shrink-0 text-right text-sm tabular-nums">
              {formatear(linea.subtotal)}
            </span>
          </div>
        ))}
      </div>

      <div className="space-y-3 border-t bg-background p-4">
        <div className="flex justify-between text-lg font-semibold">
          <span>{totalLabel}</span>
          <span className="tabular-nums">{formatear(total)}</span>
        </div>
        <Button
          className="w-full"
          size="lg"
          disabled={primaryAction.disabled}
          onClick={primaryAction.onClick}
        >
          {primaryAction.pending ? 'Confirmando...' : primaryAction.label}
        </Button>
        {secondaryActions.length > 0 && (
          <div className="flex gap-2">
            {secondaryActions.map((action) => (
              <Button
                key={action.label}
                variant={action.variant ?? 'outline'}
                className="flex-1"
                disabled={action.disabled}
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
