import { Button } from '@gorazus/ui-kit';
import { ReceiptIcon, StoreIcon } from './pos-icons';

/**
 * Header compacto (Fase 1 rediseño POS, item 1): nombre de POS, sucursal/
 * caja activa, última venta, Nueva venta y Suspendidas. Los nombres de
 * sucursal/caja llegan por prop desde `pos.page.tsx` (`useSucursales`/
 * `useCajas`, hooks reales ya existentes) — mientras cargan, simplemente
 * no se muestran, no se inventa un nombre de relleno.
 */
export function PosHeader({
  sucursalNombre,
  cajaNombre,
  ultimoComprobante,
  vista,
  onNuevaVenta,
  onVerSuspendidas,
}: {
  sucursalNombre?: string;
  cajaNombre?: string;
  ultimoComprobante: string | null;
  vista: 'venta' | 'suspendidas';
  onNuevaVenta: () => void;
  onVerSuspendidas: () => void;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-2 border-b bg-background px-3 py-2 sm:px-4">
      <div className="flex min-w-0 items-center gap-3">
        <h1 className="shrink-0 text-base font-semibold tracking-tight sm:text-lg">GORAZUS POS</h1>
        {(sucursalNombre || cajaNombre) && (
          <div className="hidden min-w-0 items-center gap-1.5 truncate text-sm text-muted-foreground md:flex">
            <StoreIcon className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {sucursalNombre}
              {sucursalNombre && cajaNombre && ' · '}
              {cajaNombre}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {ultimoComprobante && (
          <div className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:flex">
            <ReceiptIcon className="h-4 w-4 shrink-0" />
            <span>Último: {ultimoComprobante}</span>
          </div>
        )}
        <div className="flex gap-1">
          <Button
            variant={vista === 'venta' ? 'default' : 'outline'}
            size="sm"
            onClick={onNuevaVenta}
          >
            Nueva venta <span className="ml-1 hidden text-xs opacity-70 sm:inline">(F7)</span>
          </Button>
          <Button
            variant={vista === 'suspendidas' ? 'default' : 'outline'}
            size="sm"
            onClick={onVerSuspendidas}
          >
            Suspendidas <span className="ml-1 hidden text-xs opacity-70 sm:inline">(F8)</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
