import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ApiClientError,
  Button,
  Card,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  useToast,
} from '@gorazus/ui-kit';
import { formatId } from '../components/format-id';
import { SalesStatusBadge } from '../components/sales-status-badge';
import { ESTADO_COTIZACION_VISUAL, formatearMonto } from '../components/sales-status';
import { mapaEstadoPorId, useEstadosCotizacion } from '../hooks/use-catalogos';
import { useCliente } from '../hooks/use-cliente';
import { useAlmacenesSucursal } from '../hooks/use-almacenes-sucursal';
import {
  useAprobarCotizacion,
  useCotizacion,
  useConvertirCotizacionAPedido,
  useDuplicarCotizacion,
  useEliminarCotizacion,
  useRechazarCotizacion,
} from '../hooks/use-cotizaciones';

/**
 * Detalle de cotización — refleja la máquina de estados real del backend
 * (`draft → approved|rejected`, `approved → converted`): las acciones
 * disponibles dependen del estado actual, no de una lista fija (Prompt V2
 * §5: "verify permissions/actions against the actual backend").
 */
export function CotizacionDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const cotizacion = useCotizacion(id);
  const estados = useEstadosCotizacion();
  const mapaEstados = mapaEstadoPorId(estados.data?.data);
  const c = cotizacion.data?.data;
  const estado = c ? mapaEstados[c.status_id] : undefined;
  const cliente = useCliente(c?.customer_id);

  const [confirmacion, setConfirmacion] = React.useState<
    'aprobar' | 'rechazar' | 'eliminar' | null
  >(null);
  const [convertirAbierto, setConvertirAbierto] = React.useState(false);
  const [warehouseId, setWarehouseId] = React.useState('');
  const almacenes = useAlmacenesSucursal(c?.branch_id);

  React.useEffect(() => {
    const lista = almacenes.data?.data;
    const unico = lista?.length === 1 ? lista[0] : undefined;
    if (unico) setWarehouseId(unico.id);
  }, [almacenes.data]);

  const aprobar = useAprobarCotizacion();
  const rechazar = useRechazarCotizacion();
  const eliminar = useEliminarCotizacion();
  const duplicar = useDuplicarCotizacion();
  const convertir = useConvertirCotizacionAPedido();

  function manejarError(error: unknown, mensajePorDefecto: string) {
    const mensaje = error instanceof ApiClientError ? error.message : mensajePorDefecto;
    toast({ title: 'No se pudo completar la acción', description: mensaje });
  }

  function confirmar() {
    if (!id || !confirmacion) return;
    if (confirmacion === 'aprobar') {
      aprobar.mutate(id, {
        onSuccess: () => toast({ title: 'Cotización aprobada' }),
        onError: (e) => manejarError(e, 'Error al aprobar'),
      });
    } else if (confirmacion === 'rechazar') {
      rechazar.mutate(id, {
        onSuccess: () => toast({ title: 'Cotización rechazada' }),
        onError: (e) => manejarError(e, 'Error al rechazar'),
      });
    } else if (confirmacion === 'eliminar') {
      eliminar.mutate(id, {
        onSuccess: () => {
          toast({ title: 'Cotización eliminada' });
          navigate('/ventas/cotizaciones');
        },
        onError: (e) => manejarError(e, 'Error al eliminar'),
      });
    }
    setConfirmacion(null);
  }

  function duplicarCotizacion() {
    if (!id) return;
    duplicar.mutate(id, {
      onSuccess: (response) => {
        toast({ title: 'Cotización duplicada', description: response.data.document_number });
        navigate(`/ventas/cotizaciones/${response.data.id}`);
      },
      onError: (e) => manejarError(e, 'Error al duplicar'),
    });
  }

  function confirmarConversion() {
    if (!id || !warehouseId) return;
    convertir.mutate(
      { cotizacionId: id, warehouseId },
      {
        onSuccess: (response) => {
          toast({
            title: 'Cotización convertida en pedido',
            description: response.data.document_number,
          });
          setConvertirAbierto(false);
          navigate('/ventas/pedidos');
        },
        onError: (e) => manejarError(e, 'Error al convertir en pedido'),
      },
    );
  }

  if (cotizacion.isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando cotización…</p>;
  }
  if (!c) {
    return <p className="text-sm text-muted-foreground">No se encontró la cotización.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {c.document_number}
          </h1>
          <p className="text-sm text-muted-foreground">
            {cliente.data?.data.legal_name ?? `Cliente ${formatId(c.customer_id)}`}
            {cliente.data?.data.tax_id && ` · RNC/Cédula ${cliente.data.data.tax_id}`}
          </p>
        </div>
        <SalesStatusBadge catalogo={ESTADO_COTIZACION_VISUAL} code={estado} className="text-sm" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Creada
          </p>
          <p className="mt-1 text-sm text-foreground">
            {new Date(c.created_at).toLocaleDateString('es')}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Vigente hasta
          </p>
          <p className="mt-1 text-sm text-foreground">
            {c.valid_until ? new Date(c.valid_until).toLocaleDateString('es') : 'Sin vencimiento'}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total</p>
          <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">
            {formatearMonto(c.total_amount, c.currency_code)}
          </p>
        </Card>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Líneas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2 font-medium">Producto</th>
                <th className="px-4 py-2 font-medium">Cantidad</th>
                <th className="px-4 py-2 font-medium">Precio unitario</th>
                <th className="px-4 py-2 font-medium">Descuento</th>
                <th className="px-4 py-2 font-medium">Total línea</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {c.quote_lines.map((line) => (
                <tr key={line.id}>
                  <td className="px-4 py-2 font-mono text-xs">{formatId(line.product_id)}</td>
                  <td className="px-4 py-2 tabular-nums">
                    {Number(line.quantity).toLocaleString('es')}
                  </td>
                  <td className="px-4 py-2 tabular-nums">
                    {formatearMonto(line.unit_price, c.currency_code)}
                  </td>
                  <td className="px-4 py-2 tabular-nums">{line.discount_percentage}%</td>
                  <td className="px-4 py-2 tabular-nums font-medium">
                    {formatearMonto(
                      Number(line.quantity) *
                        Number(line.unit_price) *
                        (1 - Number(line.discount_percentage) / 100),
                      c.currency_code,
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {estado === 'draft' && (
          <>
            <Button onClick={() => navigate(`/ventas/cotizaciones/${id}/editar`)}>Editar</Button>
            <Button
              variant="outline"
              onClick={() => setConfirmacion('aprobar')}
              disabled={aprobar.isPending}
            >
              Aprobar
            </Button>
            <Button
              variant="outline"
              onClick={() => setConfirmacion('rechazar')}
              disabled={rechazar.isPending}
            >
              Rechazar
            </Button>
            <Button
              variant="ghost"
              onClick={() => setConfirmacion('eliminar')}
              disabled={eliminar.isPending}
            >
              Eliminar
            </Button>
          </>
        )}
        {estado === 'approved' && (
          <Button onClick={() => setConvertirAbierto(true)}>Convertir a pedido</Button>
        )}
        <Button variant="outline" onClick={duplicarCotizacion} disabled={duplicar.isPending}>
          Duplicar
        </Button>
      </div>

      <ConfirmDialog
        open={confirmacion === 'aprobar'}
        onOpenChange={(open) => !open && setConfirmacion(null)}
        title="Aprobar cotización"
        description={`¿Aprobar la cotización ${c.document_number}? Podrá convertirse en pedido.`}
        confirmLabel="Aprobar cotización"
        variant="default"
        onConfirm={confirmar}
      />
      <ConfirmDialog
        open={confirmacion === 'rechazar'}
        onOpenChange={(open) => !open && setConfirmacion(null)}
        title="Rechazar cotización"
        description={`¿Rechazar la cotización ${c.document_number}? Esta acción no se puede deshacer.`}
        confirmLabel="Rechazar cotización"
        onConfirm={confirmar}
      />
      <ConfirmDialog
        open={confirmacion === 'eliminar'}
        onOpenChange={(open) => !open && setConfirmacion(null)}
        title="Eliminar cotización"
        description={`¿Eliminar la cotización ${c.document_number}? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar cotización"
        onConfirm={confirmar}
      />

      <Dialog open={convertirAbierto} onOpenChange={setConvertirAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convertir en pedido</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Se creará un Pedido de venta real con reserva de inventario. Elegí el almacén de
              origen.
            </p>
            {almacenes.isLoading && (
              <p className="text-sm text-muted-foreground">Cargando almacenes…</p>
            )}
            {!almacenes.isLoading && (almacenes.data?.data.length ?? 0) === 0 && (
              <p className="text-sm text-destructive">
                La sucursal de esta cotización no tiene un almacén configurado.
              </p>
            )}
            {(almacenes.data?.data.length ?? 0) > 1 && (
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
              >
                <option value="">Seleccioná un almacén...</option>
                {almacenes.data?.data.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertirAbierto(false)}>
              Cancelar
            </Button>
            <Button disabled={!warehouseId || convertir.isPending} onClick={confirmarConversion}>
              {convertir.isPending ? 'Convirtiendo…' : 'Convertir a pedido'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
