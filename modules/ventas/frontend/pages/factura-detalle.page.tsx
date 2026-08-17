import { useParams } from 'react-router-dom';
import { Card } from '@gorazus/ui-kit';
import { formatId } from '../components/format-id';
import { SalesStatusBadge } from '../components/sales-status-badge';
import { ESTADO_FACTURA_VISUAL, formatearMonto } from '../components/sales-status';
import { mapaEstadoPorId, useEstadosFactura } from '../hooks/use-catalogos';
import { useFactura } from '../hooks/use-facturas';
import { useCliente } from '../hooks/use-cliente';

/**
 * Detalle de factura — el único lugar de esta UI donde el nombre del
 * cliente se resuelve de verdad (`GET /clientes/:id`, un solo lookup),
 * a diferencia de los listados que solo muestran el id truncado. No hay
 * endpoint de recibos por factura (`FacturasController` solo expone
 * `POST :id/recibos`, sin `GET`), así que esta vista es de solo lectura
 * sobre encabezado + líneas — ver "Known limitations" del informe.
 */
export function FacturaDetallePage() {
  const { id } = useParams<{ id: string }>();
  const { data: factura, isLoading } = useFactura(id);
  const estados = useEstadosFactura();
  const mapaEstados = mapaEstadoPorId(estados.data?.data);
  const cliente = useCliente(factura?.data.customer_id);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando factura…</p>;
  }
  if (!factura?.data) {
    return <p className="text-sm text-muted-foreground">No se encontró la factura.</p>;
  }

  const f = factura.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {f.document_number}
          </h1>
          <p className="text-sm text-muted-foreground">
            {cliente.data?.data.legal_name ?? `Cliente ${formatId(f.customer_id)}`}
            {cliente.data?.data.tax_id && ` · RFC/RUC ${cliente.data.data.tax_id}`}
          </p>
        </div>
        <SalesStatusBadge
          catalogo={ESTADO_FACTURA_VISUAL}
          code={mapaEstados[f.status_id]}
          className="text-sm"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Emisión
          </p>
          <p className="mt-1 text-sm text-foreground">
            {new Date(f.issued_at).toLocaleDateString('es')}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Canal</p>
          <p className="mt-1 text-sm text-foreground">{f.sales_channel}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total</p>
          <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">
            {formatearMonto(f.total_amount, f.currency_code)}
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
              {f.invoice_lines.map((line) => (
                <tr key={line.id}>
                  <td className="px-4 py-2 font-mono text-xs">{formatId(line.product_id)}</td>
                  <td className="px-4 py-2 tabular-nums">
                    {Number(line.quantity).toLocaleString('es')}
                  </td>
                  <td className="px-4 py-2 tabular-nums">
                    {formatearMonto(line.unit_price, f.currency_code)}
                  </td>
                  <td className="px-4 py-2 tabular-nums">{line.discount_percentage}%</td>
                  <td className="px-4 py-2 tabular-nums font-medium">
                    {formatearMonto(line.line_total, f.currency_code)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border">
                <td
                  colSpan={4}
                  className="px-4 py-2 text-right text-xs font-medium uppercase text-muted-foreground"
                >
                  Subtotal
                </td>
                <td className="px-4 py-2 tabular-nums">
                  {formatearMonto(f.subtotal_amount, f.currency_code)}
                </td>
              </tr>
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-2 text-right text-xs font-medium uppercase text-muted-foreground"
                >
                  Impuesto
                </td>
                <td className="px-4 py-2 tabular-nums">
                  {formatearMonto(f.tax_amount, f.currency_code)}
                </td>
              </tr>
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-2 text-right text-xs font-semibold uppercase text-foreground"
                >
                  Total
                </td>
                <td className="px-4 py-2 tabular-nums font-semibold">
                  {formatearMonto(f.total_amount, f.currency_code)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        El producto se muestra por id truncado — requiere un lookup de catálogo de Productos para
        SKU/nombre real (mismo límite que Inventario). No hay endpoint para listar los recibos de
        cobro de esta factura.
      </p>
    </div>
  );
}
