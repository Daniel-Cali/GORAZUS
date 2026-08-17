import * as React from 'react';
import {
  ApiClientError,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  MoneyInput,
  useToast,
} from '@gorazus/ui-kit';
import { useCerrarCaja, type CierreCajaResultado } from '../hooks/use-caja';

export interface CerrarCajaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  openingId: string;
  registerId: string;
  /** Estimado calculado en el padre a partir de los mismos datos que ya alimentan las tarjetas de resumen — el backend recalcula el valor autoritativo al cerrar, esto es solo preview de UX (sección 9/24). */
  expectedPreview: number;
  onClosed: (resultado: CierreCajaResultado) => void;
}

/** Cierre de caja — `POST /caja/cierres`. El backend es la única fuente de `expected_amount`/`difference_amount`, nunca se recalculan acá. */
export function CerrarCajaDialog({
  open,
  onOpenChange,
  openingId,
  registerId,
  expectedPreview,
  onClosed,
}: CerrarCajaDialogProps) {
  const { toast } = useToast();
  const cerrar = useCerrarCaja();
  const [contado, setContado] = React.useState<number | undefined>(undefined);

  React.useEffect(() => {
    if (open) setContado(undefined);
  }, [open]);

  function confirmar() {
    if (contado === undefined) return;
    cerrar.mutate(
      { openingId, countedAmount: contado },
      {
        onSuccess: (response) => {
          toast({ title: 'Caja cerrada' });
          onOpenChange(false);
          onClosed(response.data);
        },
        onError: (error) => {
          const mensaje =
            error instanceof ApiClientError ? error.message : 'Error al cerrar la caja';
          toast({ title: 'No se pudo cerrar la caja', description: mensaje });
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cerrar caja — {registerId}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex justify-between rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Esperado (estimado)</span>
            <span className="tabular-nums font-medium">{expectedPreview.toFixed(2)}</span>
          </div>
          <div className="space-y-2">
            <Label htmlFor="caja-monto-contado">Efectivo contado</Label>
            <MoneyInput id="caja-monto-contado" value={contado} onChange={setContado} autoFocus />
          </div>
          {contado !== undefined && (
            <p className="text-xs text-muted-foreground">
              Diferencia estimada: {(contado - expectedPreview).toFixed(2)} — el valor final lo
              confirma el servidor al cerrar.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={contado === undefined || cerrar.isPending} onClick={confirmar}>
            {cerrar.isPending ? 'Cerrando…' : 'Cerrar caja'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
