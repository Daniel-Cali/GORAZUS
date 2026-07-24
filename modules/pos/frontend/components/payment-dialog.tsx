import * as React from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  MoneyInput,
} from '@gorazus/ui-kit';

export interface PagoLinea {
  amount: number;
}

/**
 * Pago único o mixto (`POS_FLOW.md` "Seleccionar forma de pago") — cada
 * línea es un monto; sumadas deben cubrir el total. Sin selector de
 * `paymentFormId` todavía (`configuration.payment_forms` no tiene
 * endpoint de catálogo propio, ver `POS_ARCHITECTURE.md §3`).
 */
export function PaymentDialog({
  open,
  onOpenChange,
  total,
  onConfirm,
  confirmando,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  onConfirm: (pagos: PagoLinea[]) => void;
  confirmando: boolean;
}) {
  const [pagos, setPagos] = React.useState<Array<number | undefined>>([total]);

  React.useEffect(() => {
    if (open) setPagos([total]);
  }, [open, total]);

  const totalPagado = pagos.reduce<number>((acc, p) => acc + (p ?? 0), 0);
  const cambio = totalPagado - total;
  const alcanza = totalPagado >= total;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cobrar — Total ${total.toFixed(2)}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {pagos.map((monto, i) => (
            <div key={i} className="flex items-center gap-2">
              <MoneyInput
                value={monto}
                onChange={(v) => setPagos((prev) => prev.map((p, idx) => (idx === i ? v : p)))}
                autoFocus={i === 0}
              />
              {pagos.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPagos((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  Quitar
                </Button>
              )}
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagos((prev) => [...prev, undefined])}
          >
            + Agregar otro pago (mixto)
          </Button>

          <div className="flex justify-between border-t pt-3 text-sm">
            <span>Pagado</span>
            <span className="tabular-nums">${totalPagado.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Cambio</span>
            <span className="tabular-nums">${Math.max(0, cambio).toFixed(2)}</span>
          </div>

          <Button
            className="w-full"
            disabled={!alcanza || confirmando}
            onClick={() =>
              onConfirm(
                pagos
                  .filter((p): p is number => p !== undefined && p > 0)
                  .map((amount) => ({ amount })),
              )
            }
          >
            {confirmando ? 'Confirmando...' : 'Confirmar venta (F5)'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
