import * as React from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  MoneyInput,
} from '@gorazus/ui-kit';
import type { FormaPagoRecord } from '../hooks/use-pos';

export interface PagoLinea {
  paymentFormId?: string;
  amount: number;
}

/** `configuration.payment_forms.code` → etiqueta en español — mismos 5 códigos reales sembrados (`22_seed_data.sql`), no inventados. */
const ETIQUETA_FORMA_PAGO: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  check: 'Cheque',
  credit: 'Crédito',
};

function formatearMonto(amount: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat('es', { style: 'currency', currency: currencyCode }).format(
      amount,
    );
  } catch {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
}

interface LineaPagoInterna {
  paymentFormId: string | undefined;
  amount: number | undefined;
}

/**
 * Pago único o mixto (`POS_FLOW.md` "Seleccionar forma de pago") — cada
 * línea tiene monto + forma de pago real (`configuration.payment_forms`,
 * Prompt 3C — antes no tenía endpoint de catálogo, ya corregido). Presenta
 * nada más: quién calcula "alcanza"/"cambio" acá es aritmética simple de
 * UI (total pagado − total), la autoridad real sigue siendo el backend
 * (`PosCheckoutService`, que vuelve a validar todo). Componente propio de
 * POS, no de `ui-kit` — sí puede conocer "forma de pago"/"cambio" como
 * conceptos, solo no debe calcular impuestos ni nada fiscal.
 */
export function PaymentDialog({
  open,
  onOpenChange,
  total,
  currencyCode = 'USD',
  formasPago = [],
  onConfirm,
  confirmando,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  currencyCode?: string;
  formasPago?: FormaPagoRecord[];
  onConfirm: (pagos: PagoLinea[]) => void;
  confirmando: boolean;
}) {
  const formaPagoEfectivo = formasPago.find((f) => f.code === 'cash');
  const [pagos, setPagos] = React.useState<LineaPagoInterna[]>([
    { paymentFormId: formaPagoEfectivo?.id, amount: total },
  ]);

  React.useEffect(() => {
    if (open) setPagos([{ paymentFormId: formaPagoEfectivo?.id, amount: total }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- formaPagoEfectivo cambia de referencia en cada render del padre (viene de un array de query), incluirlo reiniciaría el formulario en cada tecla
  }, [open, total]);

  const totalPagado = pagos.reduce<number>((acc, p) => acc + (p.amount ?? 0), 0);
  const cambio = totalPagado - total;
  const alcanza = totalPagado >= total;
  const esSoloEfectivo =
    pagos.length === 1 && formaPagoEfectivo && pagos[0]?.paymentFormId === formaPagoEfectivo.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cobrar — Total {formatearMonto(total, currencyCode)}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {pagos.map((pago, i) => (
            <div key={i} className="flex items-center gap-2">
              {formasPago.length > 0 && (
                <select
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                  value={pago.paymentFormId ?? ''}
                  onChange={(e) =>
                    setPagos((prev) =>
                      prev.map((p, idx) =>
                        idx === i ? { ...p, paymentFormId: e.target.value || undefined } : p,
                      ),
                    )
                  }
                >
                  <option value="">Forma de pago</option>
                  {formasPago.map((f) => (
                    <option key={f.id} value={f.id}>
                      {ETIQUETA_FORMA_PAGO[f.code] ?? f.code}
                    </option>
                  ))}
                </select>
              )}
              <MoneyInput
                value={pago.amount}
                onChange={(v) =>
                  setPagos((prev) => prev.map((p, idx) => (idx === i ? { ...p, amount: v } : p)))
                }
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
            onClick={() =>
              setPagos((prev) => [...prev, { paymentFormId: undefined, amount: undefined }])
            }
          >
            + Agregar otro pago (mixto)
          </Button>

          <div className="flex justify-between border-t pt-3 text-sm">
            <span>Total</span>
            <span className="tabular-nums">{formatearMonto(total, currencyCode)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Pagado</span>
            <span className="tabular-nums">{formatearMonto(totalPagado, currencyCode)}</span>
          </div>
          {/* El vuelto solo es un concepto real cuando el pago es 100% efectivo — un pago mixto/tarjeta que "sobra" no es "vuelto", es un error de monto (la UI no le pone nombre financiero a algo que el backend no confirmó). */}
          <div className="flex justify-between font-semibold">
            <span>{esSoloEfectivo ? 'Vuelto' : 'Diferencia'}</span>
            <span className="tabular-nums">
              {formatearMonto(Math.max(0, cambio), currencyCode)}
            </span>
          </div>

          <Button
            className="w-full"
            disabled={!alcanza || confirmando}
            onClick={() =>
              onConfirm(
                pagos
                  .filter(
                    (p): p is { paymentFormId: string | undefined; amount: number } =>
                      p.amount !== undefined && p.amount > 0,
                  )
                  .map((p) => ({ paymentFormId: p.paymentFormId, amount: p.amount })),
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
