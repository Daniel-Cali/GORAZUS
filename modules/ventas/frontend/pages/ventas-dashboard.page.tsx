import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, FileClock, ClipboardList, Wallet } from 'lucide-react';
import { SalesKpiCard } from '../components/sales-kpi-card';
import { SalesStatusBadge } from '../components/sales-status-badge';
import { ESTADO_FACTURA_VISUAL, formatearMonto } from '../components/sales-status';
import { formatId } from '../components/format-id';
import { mapaEstadoPorId, useEstadosFactura } from '../hooks/use-catalogos';
import { useFacturas } from '../hooks/use-facturas';
import { useCotizaciones } from '../hooks/use-cotizaciones';
import { usePedidos } from '../hooks/use-pedidos';

const TAMANO_MUESTRA_MONTO = 200;

/**
 * "Ventas Control Center" — mismo lenguaje de diseño "GORAZUS Operational
 * Intelligence" que `InventarioDashboardPage`: strip de KPIs con datos
 * reales (nunca mocks), seguido de un teaser de documentos recientes. El
 * monto facturado se calcula sobre una muestra acotada (`pageSize: 200`),
 * igual que el dashboard de Inventario, para no traer todo el dataset al
 * cliente — se declara explícitamente cuando la muestra es parcial.
 */
export function VentasDashboardPage() {
  const navigate = useNavigate();

  const facturas = useFacturas({ page: 1, pageSize: TAMANO_MUESTRA_MONTO });
  const facturasRecientes = useFacturas({ page: 1, pageSize: 5 });
  const cotizaciones = useCotizaciones({ page: 1, pageSize: 1 });
  const pedidos = usePedidos({ page: 1, pageSize: 1 });
  const estadosFactura = useEstadosFactura();
  const mapaEstados = mapaEstadoPorId(estadosFactura.data?.data);

  const totalFacturas = facturas.data?.meta?.total ?? 0;
  const muestraParcial = totalFacturas > TAMANO_MUESTRA_MONTO;
  const montoFacturado = (facturas.data?.data ?? []).reduce(
    (acc, f) => acc + Number(f.total_amount),
    0,
  );
  const monedaMuestra = facturas.data?.data[0]?.currency_code ?? 'USD';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Ventas — Control Center
        </h1>
        <p className="text-sm text-muted-foreground">
          Cotización → Pedido → Factura, en un solo vistazo. Datos reales del backend.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SalesKpiCard
          label="Facturas"
          value={totalFacturas.toLocaleString('es')}
          icon={FileText}
          nivel="good"
          onAction={() => navigate('/ventas/facturas')}
          actionLabel="Ver todas"
        />
        <SalesKpiCard
          label="Monto facturado"
          value={formatearMonto(montoFacturado, monedaMuestra)}
          icon={Wallet}
          nivel="good"
          contexto={muestraParcial ? `Muestra de ${TAMANO_MUESTRA_MONTO} registros` : 'Total real'}
        />
        <SalesKpiCard
          label="Cotizaciones"
          value={(cotizaciones.data?.meta?.total ?? 0).toLocaleString('es')}
          icon={FileClock}
          nivel="neutral"
          onAction={() => navigate('/ventas/cotizaciones')}
          actionLabel="Ver todas"
        />
        <SalesKpiCard
          label="Pedidos de venta"
          value={(pedidos.data?.meta?.total ?? 0).toLocaleString('es')}
          icon={ClipboardList}
          nivel="neutral"
          onAction={() => navigate('/ventas/pedidos')}
          actionLabel="Ver todos"
        />
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Facturas recientes</h2>
        </div>
        <div className="divide-y divide-border">
          {(facturasRecientes.data?.data ?? []).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => navigate(`/ventas/facturas/${f.id}`)}
              className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm hover:bg-accent/50"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{f.document_number}</p>
                <p className="truncate text-xs text-muted-foreground">
                  Cliente {formatId(f.customer_id)} ·{' '}
                  {new Date(f.issued_at).toLocaleDateString('es')}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="tabular-nums text-foreground">
                  {formatearMonto(f.total_amount, f.currency_code)}
                </span>
                <SalesStatusBadge
                  catalogo={ESTADO_FACTURA_VISUAL}
                  code={mapaEstados[f.status_id]}
                />
              </div>
            </button>
          ))}
          {facturasRecientes.data?.data.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No hay facturas registradas todavía.
            </p>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        El nombre del cliente no se muestra — la tabla de facturas solo trae customer_id (sin
        relación incluida). El detalle de cada factura sí resuelve el nombre real (ver &quot;Known
        limitations&quot;).
      </p>
    </div>
  );
}
