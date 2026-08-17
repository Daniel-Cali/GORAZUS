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
import { useAbrirCaja } from '../hooks/use-caja';

export interface AbrirCajaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registerId: string;
}

/** Apertura de caja — `POST /caja/aperturas`, monto de apertura obligatorio (`abrirCajaSchema`). */
export function AbrirCajaDialog({ open, onOpenChange, registerId }: AbrirCajaDialogProps) {
  const { toast } = useToast();
  const abrir = useAbrirCaja();
  const [monto, setMonto] = React.useState<number | undefined>(0);

  React.useEffect(() => {
    if (open) setMonto(0);
  }, [open]);

  function confirmar() {
    if (monto === undefined) return;
    abrir.mutate(
      { registerId, openingAmount: monto },
      {
        onSuccess: () => {
          toast({ title: 'Caja abierta' });
          onOpenChange(false);
        },
        onError: (error) => {
          const mensaje =
            error instanceof ApiClientError ? error.message : 'Error al abrir la caja';
          toast({ title: 'No se pudo abrir la caja', description: mensaje });
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Abrir caja</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="caja-monto-apertura">Monto de apertura</Label>
          <MoneyInput id="caja-monto-apertura" value={monto} onChange={setMonto} autoFocus />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={monto === undefined || abrir.isPending} onClick={confirmar}>
            {abrir.isPending ? 'Abriendo…' : 'Abrir caja'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
