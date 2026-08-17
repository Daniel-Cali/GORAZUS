import { useNavigate } from 'react-router-dom';
import {
  Boxes,
  PackageCheck,
  Lock,
  AlertTriangle,
  CalendarClock,
  Fingerprint,
  ArrowRightLeft,
  Wallet,
  Truck,
  PackageMinus,
  ClipboardList,
  SlidersHorizontal,
  BookmarkCheck,
  Route,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Loader } from '@gorazus/ui-kit';
import { InventoryKpiCard } from '../components/inventory-kpi-card';
import { OperationalStatusPanel } from '../components/operational-status-panel';
import { StockHealthBar } from '../components/stock-health-bar';
import { TraceabilityTimeline, type TraceabilityEvent } from '../components/traceability-timeline';
import { MovementTypeBadge } from '../components/movement-type-badge';
import { formatId } from '../components/format-id';
import { resolverSaludStock, resolverMovimientoVisual } from '../components/inventory-status';
import { useStock } from '../hooks/use-stock';
import { useMovimientos } from '../hooks/use-movimientos';
import { useLotesProximosAVencer, useLotesVencidos } from '../hooks/use-lotes';
import { useTiposMovimiento } from '../hooks/use-catalogos';

const MUESTRA_AGREGACION = 200;

/**
 * GORAZUS Inventory Control Center — pantalla principal del módulo. Franja
 * de KPIs (barra de acento por nivel semántico) → Estado operativo →
 * Salud del inventario → Centro de Trazabilidad → Movimientos recientes.
 * "Operational Intelligence", no un dashboard de analítica genérico: cada
 * bloque es una decisión operativa, no una ilustración.
 */
export function InventarioDashboardPage() {
  const navigate = useNavigate();

  // Los KPIs de suma (disponible/reservado/valor) no tienen endpoint de
  // agregación en el backend todavía — se calculan sobre una muestra acotada
  // (pageSize=200) para no violar la regla de "nunca traer datasets enteros
  // al cliente". Ver "Known limitations" del informe final.
  const stockMuestra = useStock({ page: 1, pageSize: MUESTRA_AGREGACION });
  const movimientosRecientes = useMovimientos({ page: 1, pageSize: 8 });
  const lotesPorVencer = useLotesProximosAVencer(30, { page: 1, pageSize: 1 });
  const lotesVencidos = useLotesVencidos({ page: 1, pageSize: 1 });
  const tiposMovimiento = useTiposMovimiento();

  const filas = stockMuestra.data?.data ?? [];
  const totalOnHand = filas.reduce((sum, f) => sum + Number(f.quantity_on_hand), 0);
  const totalReservado = filas.reduce((sum, f) => sum + Number(f.quantity_reserved), 0);
  const disponible = totalOnHand - totalReservado;

  const salud = filas.reduce(
    (acc, f) => {
      const veredicto = resolverSaludStock({
        quantityOnHand: Number(f.quantity_on_hand),
        quantityReserved: Number(f.quantity_reserved),
      });
      if (veredicto.nivel === 'critical') acc.critico += 1;
      else if (veredicto.nivel === 'warning') acc.bajo += 1;
      else if (veredicto.nivel === 'serious') acc.sobreStock += 1;
      else acc.saludable += 1;
      return acc;
    },
    { saludable: 0, bajo: 0, critico: 0, sobreStock: 0 },
  );

  const muestraParcial = (stockMuestra.data?.meta?.total ?? 0) > MUESTRA_AGREGACION;
  const codigoPorTipoId = new Map((tiposMovimiento.data?.data ?? []).map((t) => [t.id, t.code]));

  const eventosRecientes: TraceabilityEvent[] = (movimientosRecientes.data?.data ?? []).map((m) => {
    const codigo = codigoPorTipoId.get(m.movement_type_id) ?? '';
    const visual = resolverMovimientoVisual(codigo);
    return {
      id: m.id,
      icon: visual.nivel === 'good' ? PackageCheck : PackageMinus,
      titulo: `${visual.etiqueta} · Producto ${formatId(m.product_id)}`,
      fecha: m.created_at,
      cantidad: `${Number(m.quantity).toLocaleString('es')} un.`,
      documento: m.source_entity_id ? formatId(m.source_entity_id) : undefined,
      nivel: visual.nivel,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Centro de Control de Inventario
        </h1>
        <p className="text-sm text-muted-foreground">
          Control, trazabilidad y salud del inventario en tiempo real.
        </p>
      </div>

      {/* TOP KPI STRIP */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <InventoryKpiCard
          label="Stock a mano"
          value={stockMuestra.isLoading ? '—' : totalOnHand.toLocaleString('es')}
          icon={Boxes}
          nivel="neutral"
          contexto={muestraParcial ? `muestra de ${MUESTRA_AGREGACION} registros` : 'total real'}
        />
        <InventoryKpiCard
          label="Stock disponible"
          value={stockMuestra.isLoading ? '—' : disponible.toLocaleString('es')}
          icon={PackageCheck}
          nivel={disponible > 0 ? 'good' : 'critical'}
          contexto="a mano − reservado"
        />
        <InventoryKpiCard
          label="Stock reservado"
          value={stockMuestra.isLoading ? '—' : totalReservado.toLocaleString('es')}
          icon={Lock}
          nivel="neutral"
        />
        <InventoryKpiCard
          label="Stock crítico"
          value={stockMuestra.isLoading ? '—' : salud.critico.toLocaleString('es')}
          icon={AlertTriangle}
          nivel={salud.critico > 0 ? 'critical' : 'good'}
          onAction={() => navigate('/inventario/stock')}
          actionLabel="Ver stock"
        />
        <InventoryKpiCard
          label="Lotes por vencer"
          value={
            lotesPorVencer.isLoading
              ? '—'
              : (lotesPorVencer.data?.meta?.total ?? 0).toLocaleString('es')
          }
          icon={CalendarClock}
          nivel={(lotesPorVencer.data?.meta?.total ?? 0) > 0 ? 'warning' : 'good'}
          contexto="próximos 30 días"
          onAction={() => navigate('/inventario/lotes')}
          actionLabel="Ver lotes"
        />
        <InventoryKpiCard
          label="Lotes vencidos"
          value={
            lotesVencidos.isLoading
              ? '—'
              : (lotesVencidos.data?.meta?.total ?? 0).toLocaleString('es')
          }
          icon={CalendarClock}
          nivel={(lotesVencidos.data?.meta?.total ?? 0) > 0 ? 'critical' : 'good'}
        />
        <InventoryKpiCard
          label="Movimientos recientes"
          value={
            movimientosRecientes.isLoading
              ? '—'
              : (movimientosRecientes.data?.meta?.total ?? 0).toLocaleString('es')
          }
          icon={ArrowRightLeft}
          nivel="neutral"
          onAction={() => navigate('/inventario/movimientos')}
          actionLabel="Ver historial"
        />
        <InventoryKpiCard
          label="Registros de stock"
          value={
            stockMuestra.isLoading
              ? '—'
              : (stockMuestra.data?.meta?.total ?? 0).toLocaleString('es')
          }
          icon={Wallet}
          nivel="neutral"
          contexto="producto × almacén"
        />
      </div>

      {/* OPERATIONAL STATUS */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-foreground">Estado operativo</h2>
        <OperationalStatusPanel
          items={[
            {
              id: 'recepciones',
              label: 'Recepciones',
              count: 0,
              icon: Truck,
              onClick: () => navigate('/inventario/recepciones'),
            },
            {
              id: 'salidas',
              label: 'Salidas',
              count: 0,
              icon: PackageMinus,
              onClick: () => navigate('/inventario/salidas'),
            },
            {
              id: 'transferencias',
              label: 'Transferencias',
              count: 0,
              icon: ArrowRightLeft,
              onClick: () => navigate('/inventario/transferencias'),
            },
            {
              id: 'conteos',
              label: 'Conteos abiertos',
              count: 0,
              icon: ClipboardList,
              onClick: () => navigate('/inventario/conteos'),
            },
            {
              id: 'ajustes',
              label: 'Ajustes',
              count: 0,
              icon: SlidersHorizontal,
              onClick: () => navigate('/inventario/ajustes'),
            },
            {
              id: 'reservas',
              label: 'Reservas activas',
              count: 0,
              icon: BookmarkCheck,
              onClick: () => navigate('/inventario/reservas'),
            },
          ]}
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          Los contadores de &quot;pendiente&quot; requieren un filtro de estado en cada endpoint que
          el backend todavía no expone (el estado es derivado en el servicio, no una columna
          consultable) — se muestran en 0 hasta esa extensión de API. Ver &quot;Known
          limitations&quot;.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* STOCK HEALTH */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Salud del inventario</CardTitle>
          </CardHeader>
          <CardContent>
            {stockMuestra.isLoading ? (
              <Loader />
            ) : (
              <StockHealthBar
                saludable={salud.saludable}
                bajo={salud.bajo}
                critico={salud.critico}
                sobreStock={salud.sobreStock}
                porVencer={lotesPorVencer.data?.meta?.total ?? 0}
                vencido={lotesVencidos.data?.meta?.total ?? 0}
                onSegmentClick={() => navigate('/inventario/stock')}
              />
            )}
          </CardContent>
        </Card>

        {/* TRACEABILITY CENTER (teaser) */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Route aria-hidden className="h-4 w-4 text-primary" />
              Centro de Trazabilidad
            </CardTitle>
            <span className="text-xs text-muted-foreground">Últimos movimientos</span>
          </CardHeader>
          <CardContent>
            {movimientosRecientes.isLoading ? (
              <Loader />
            ) : (
              <TraceabilityTimeline eventos={eventosRecientes.slice(0, 5)} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* RECENT MOVEMENTS */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Movimientos recientes</CardTitle>
          <button
            type="button"
            onClick={() => navigate('/inventario/movimientos')}
            className="text-xs font-medium text-primary hover:underline"
          >
            Ver todos
          </button>
        </CardHeader>
        <CardContent className="space-y-2">
          {movimientosRecientes.isLoading ? (
            <Loader />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Fecha</th>
                    <th className="pb-2 font-medium">Tipo</th>
                    <th className="pb-2 font-medium">Producto</th>
                    <th className="pb-2 font-medium">Almacén</th>
                    <th className="pb-2 text-right font-medium">Cantidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(movimientosRecientes.data?.data ?? []).map((m) => (
                    <tr key={m.id} className="text-foreground">
                      <td className="py-2 text-xs tabular-nums text-muted-foreground">
                        {new Date(m.created_at).toLocaleString('es', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-2">
                        <MovementTypeBadge code={codigoPorTipoId.get(m.movement_type_id) ?? ''} />
                      </td>
                      <td className="py-2 font-mono text-xs">{formatId(m.product_id)}</td>
                      <td className="py-2 font-mono text-xs text-muted-foreground">
                        {formatId(m.warehouse_id)}
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        {Number(m.quantity).toLocaleString('es')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Fingerprint aria-hidden className="h-3.5 w-3.5" />
        Los identificadores de producto se muestran truncados — el schema de Inventario no
        desnormaliza nombre/SKU (cross-schema hacia Productos). Ver &quot;Known limitations&quot;.
      </div>
    </div>
  );
}
