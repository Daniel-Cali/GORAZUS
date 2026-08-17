import * as React from 'react';
import {
  ApiClientError,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  MoneyInput,
  useToast,
} from '@gorazus/ui-kit';
import { useRegistrarMovimiento } from '../hooks/use-caja';

export interface MovimientoCajaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registerId: string;
  direction: 'in' | 'out';
}

/** Ingreso/egreso manual — `POST /caja/movimientos` (agregado en este bloque, reutiliza `CajaService.registrarMovimiento` internamente, mismo mecanismo que ya usa POS). */
export function MovimientoCajaDialog({
  open,
  onOpenChange,
  registerId,
  direction,
}: MovimientoCajaDialogProps) {
  const { toast } = useToast();
  const registrar = useRegistrarMovimiento();
  const [monto, setMonto] = React.useState<number | undefined>(undefined);
  const [observaciones, setObservaciones] = React.useState('');

  React.useEffect(() => {
    if (open) {
      setMonto(undefined);
      setObservaciones('');
    }
  }, [open]);

  const titulo = direction === 'in' ? 'Agregar efectivo' : 'Retirar efectivo';

  function confirmar() {
    if (!monto) return;
    registrar.mutate(
      { registerId, direction, amount: monto, observations: observaciones || undefined },
      {
        onSuccess: () => {
          toast({ title: titulo });
          onOpenChange(false);
        },
        onError: (error) => {
          const mensaje =
            error instanceof ApiClientError ? error.message : 'Error al registrar el movimiento';
          toast({ title: 'No se pudo registrar', description: mensaje });
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="caja-monto-movimiento">Monto</Label>
            <MoneyInput id="caja-monto-movimiento" value={monto} onChange={setMonto} autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="caja-observaciones">Motivo</Label>
            <Input
              id="caja-observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder={
                direction === 'in' ? 'Ej: depósito de refuerzo' : 'Ej: retiro para gastos menores'
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={!monto || registrar.isPending} onClick={confirmar}>
            {registrar.isPending ? 'Guardando…' : titulo}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
