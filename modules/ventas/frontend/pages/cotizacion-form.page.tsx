import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ApiClientError,
  Button,
  Card,
  DatePicker,
  Input,
  Label,
  MoneyInput,
  useAppStore,
  useToast,
} from '@gorazus/ui-kit';
import { CustomerSelector } from '../components/customer-selector';
import { ProductoSelector } from '../components/producto-selector';
import { formatId } from '../components/format-id';
import { formatearMonto } from '../components/sales-status';
import { mapaEstadoPorId, useEstadosCotizacion } from '../hooks/use-catalogos';
import { useCliente } from '../hooks/use-cliente';
import { useMonedas } from '../hooks/use-monedas';
import { useProductosBusqueda } from '../hooks/use-productos-busqueda';
import {
  useActualizarCotizacion,
  useCotizacion,
  useCrearCotizacion,
  type LineaCotizacionInput,
} from '../hooks/use-cotizaciones';

interface LineaFormulario extends LineaCotizacionInput {
  sku: string;
}

function calcularTotalPreview(lines: LineaFormulario[]): number {
  return lines.reduce(
    (acc, l) => acc + l.quantity * l.unitPrice * (1 - (l.discountPercentage ?? 0) / 100),
    0,
  );
}

/**
 * Crear/editar cotización — un solo componente para ambos casos (Prompt V2
 * §7: "no crear un sistema separado"). Editar solo está permitido mientras
 * la cotización sigue en `draft` (regla real del backend,
 * `CotizacionNoEsBorradorException`) — acá se refleja esa regla ANTES de
 * dejar tocar el formulario, no se descubre recién al enviar.
 */
export function CotizacionFormPage() {
  const { id } = useParams<{ id: string }>();
  const esEdicion = Boolean(id);
  const navigate = useNavigate();
  const { toast } = useToast();

  const companyId = useAppStore((s) => s.activeCompanyId);
  const branchId = useAppStore((s) => s.activeBranchId);

  const cotizacion = useCotizacion(id);
  const estados = useEstadosCotizacion();
  const mapaEstados = mapaEstadoPorId(estados.data?.data);
  const estadoActual = cotizacion.data?.data
    ? mapaEstados[cotizacion.data.data.status_id]
    : undefined;
  const catalogoProductos = useProductosBusqueda();
  const monedas = useMonedas();

  const [clienteId, setClienteId] = React.useState('');
  const [clienteNombre, setClienteNombre] = React.useState('');
  const clienteInicial = useCliente(esEdicion ? cotizacion.data?.data.customer_id : undefined);
  const [salespersonId, setSalespersonId] = React.useState('');
  const [currencyCode, setCurrencyCode] = React.useState('');
  const [validUntil, setValidUntil] = React.useState<Date | undefined>(undefined);
  const [lines, setLines] = React.useState<LineaFormulario[]>([]);
  const [inicializado, setInicializado] = React.useState(false);

  // Precarga en modo edición — una sola vez, cuando llegan cotización + nombre de cliente.
  React.useEffect(() => {
    if (!esEdicion || inicializado || !cotizacion.data?.data) return;
    if (esEdicion && clienteInicial.isLoading) return;
    const c = cotizacion.data.data;
    setClienteId(c.customer_id);
    setClienteNombre(clienteInicial.data?.data.legal_name ?? `Cliente ${formatId(c.customer_id)}`);
    setCurrencyCode(c.currency_code);
    setValidUntil(c.valid_until ? new Date(c.valid_until) : undefined);
    setLines(
      c.quote_lines.map((l) => {
        const producto = catalogoProductos.data?.data.find((p) => p.id === l.product_id);
        return {
          productId: l.product_id,
          sku: producto?.sku ?? formatId(l.product_id),
          quantity: Number(l.quantity),
          unitPrice: Number(l.unit_price),
          discountPercentage: Number(l.discount_percentage),
        };
      }),
    );
    setInicializado(true);
  }, [
    esEdicion,
    inicializado,
    cotizacion.data,
    clienteInicial.data,
    clienteInicial.isLoading,
    catalogoProductos.data,
  ]);

  const crear = useCrearCotizacion();
  const actualizar = useActualizarCotizacion();
  const guardando = crear.isPending || actualizar.isPending;

  const total = calcularTotalPreview(lines);

  function agregarLinea(producto: { id: string; sku: string; list_price: string | null }) {
    setLines((prev) => {
      const existente = prev.find((l) => l.productId === producto.id);
      if (existente) {
        return prev.map((l) =>
          l.productId === producto.id ? { ...l, quantity: l.quantity + 1 } : l,
        );
      }
      return [
        ...prev,
        {
          productId: producto.id,
          sku: producto.sku,
          quantity: 1,
          unitPrice: producto.list_price ? Number(producto.list_price) : 0,
          discountPercentage: 0,
        },
      ];
    });
  }

  function actualizarLinea(productId: string, cambios: Partial<LineaFormulario>) {
    setLines((prev) => prev.map((l) => (l.productId === productId ? { ...l, ...cambios } : l)));
  }

  function quitarLinea(productId: string) {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }

  function manejarError(error: unknown, mensajePorDefecto: string) {
    const mensaje = error instanceof ApiClientError ? error.message : mensajePorDefecto;
    toast({ title: 'No se pudo guardar', description: mensaje });
  }

  function guardar() {
    if (!clienteId || lines.length === 0) {
      toast({
        title: 'Faltan datos',
        description: 'Elegí un cliente y agregá al menos un producto.',
      });
      return;
    }
    const lineasPayload: LineaCotizacionInput[] = lines.map((l) => ({
      productId: l.productId,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      discountPercentage: l.discountPercentage,
    }));

    if (esEdicion && id) {
      actualizar.mutate(
        {
          id,
          payload: {
            salespersonId: salespersonId || undefined,
            validUntil: validUntil?.toISOString(),
            lines: lineasPayload,
          },
        },
        {
          onSuccess: () => {
            toast({ title: 'Cotización actualizada' });
            navigate(`/ventas/cotizaciones/${id}`);
          },
          onError: (error) => manejarError(error, 'Error al actualizar la cotización'),
        },
      );
      return;
    }

    if (!companyId || !branchId) {
      toast({ title: 'Sin sucursal activa', description: 'No hay empresa/sucursal en la sesión.' });
      return;
    }
    if (!currencyCode) {
      toast({ title: 'Falta la moneda', description: 'Elegí una moneda para la cotización.' });
      return;
    }
    crear.mutate(
      {
        companyId,
        branchId,
        customerId: clienteId,
        salespersonId: salespersonId || undefined,
        currencyCode,
        validUntil: validUntil?.toISOString(),
        lines: lineasPayload,
      },
      {
        onSuccess: (response) => {
          toast({ title: 'Cotización creada', description: response.data.document_number });
          navigate(`/ventas/cotizaciones/${response.data.id}`);
        },
        onError: (error) => manejarError(error, 'Error al crear la cotización'),
      },
    );
  }

  if (esEdicion && cotizacion.isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando cotización…</p>;
  }
  if (esEdicion && estados.data && estadoActual && estadoActual !== 'draft') {
    return (
      <Card className="p-6 text-sm">
        <p className="text-foreground">
          Esta cotización ya no es un borrador (estado actual: <strong>{estadoActual}</strong>) — no
          se puede editar.
        </p>
        <Button
          className="mt-3"
          variant="outline"
          onClick={() => navigate(`/ventas/cotizaciones/${id}`)}
        >
          Volver al detalle
        </Button>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {esEdicion ? 'Editar cotización' : 'Nueva cotización'}
        </h1>
        <p className="text-sm text-muted-foreground">
          Estimación comercial — sin impuesto calculado todavía.
        </p>
      </div>

      <Card className="space-y-4 p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CustomerSelector
            label={clienteNombre}
            disabled={esEdicion}
            onChange={(cid, nombre) => {
              setClienteId(cid);
              setClienteNombre(nombre);
            }}
          />
          <div className="space-y-1">
            <Label htmlFor="cotizacion-vendedor">Vendedor (id, opcional)</Label>
            <Input
              id="cotizacion-vendedor"
              value={salespersonId}
              onChange={(e) => setSalespersonId(e.target.value)}
              placeholder="UUID de usuario/vendedor"
            />
          </div>
          {!esEdicion && (
            <div className="space-y-1">
              <Label htmlFor="cotizacion-moneda">Moneda</Label>
              <select
                id="cotizacion-moneda"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value)}
              >
                <option value="">Seleccioná una moneda...</option>
                {monedas.data?.data.map((m) => (
                  <option key={m.id} value={m.iso_code}>
                    {m.iso_code}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="space-y-1">
            <Label>Vigente hasta (opcional)</Label>
            <DatePicker value={validUntil} onChange={setValidUntil} placeholder="Sin vencimiento" />
          </div>
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <h2 className="text-sm font-semibold text-foreground">Productos</h2>
        <ProductoSelector onSelect={agregarLinea} />

        {lines.length === 0 && (
          <p className="text-sm text-muted-foreground">Todavía no agregaste productos.</p>
        )}
        {lines.length > 0 && (
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2 font-medium">SKU</th>
                  <th className="px-3 py-2 font-medium">Cantidad</th>
                  <th className="px-3 py-2 font-medium">Precio</th>
                  <th className="px-3 py-2 font-medium">Descuento %</th>
                  <th className="px-3 py-2 font-medium">Total línea</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lines.map((l) => (
                  <tr key={l.productId}>
                    <td className="px-3 py-2 font-mono text-xs">{l.sku}</td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min={1}
                        className="w-20"
                        value={l.quantity}
                        onChange={(e) =>
                          actualizarLinea(l.productId, {
                            quantity: Math.max(1, Number(e.target.value)),
                          })
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <MoneyInput
                        value={l.unitPrice}
                        onChange={(v) => actualizarLinea(l.productId, { unitPrice: v ?? 0 })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        className="w-20"
                        value={l.discountPercentage ?? 0}
                        onChange={(e) =>
                          actualizarLinea(l.productId, {
                            discountPercentage: Math.min(100, Math.max(0, Number(e.target.value))),
                          })
                        }
                      />
                    </td>
                    <td className="px-3 py-2 tabular-nums font-medium">
                      {formatearMonto(
                        l.quantity * l.unitPrice * (1 - (l.discountPercentage ?? 0) / 100),
                        currencyCode || 'USD',
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <Button variant="ghost" size="sm" onClick={() => quitarLinea(l.productId)}>
                        Quitar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end border-t border-border pt-3 text-sm font-semibold">
          <span>Total estimado: {formatearMonto(total, currencyCode || 'USD')}</span>
        </div>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Cancelar
        </Button>
        <Button disabled={guardando} onClick={guardar}>
          {guardando ? 'Guardando…' : 'Guardar cotización'}
        </Button>
      </div>
    </div>
  );
}
