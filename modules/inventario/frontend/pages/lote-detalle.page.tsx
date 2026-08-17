import { useParams } from 'react-router-dom';
import { PackageCheck, PackageMinus, CalendarClock, Warehouse } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Skeleton, Badge } from '@gorazus/ui-kit';
import { TraceabilityTimeline, type TraceabilityEvent } from '../components/traceability-timeline';
import { LotBadge } from '../components/lot-serial-badge';
import { formatId } from '../components/format-id';
import {
  resolverVencimientoLote,
  resolverMovimientoVisual,
  ESTADO_COLOR,
} from '../components/inventory-status';
import { useLote, useHistorialLote } from '../hooks/use-lote';
import { useTiposMovimiento } from '../hooks/use-catalogos';

/** "LOT VIEW" — detalle de lote + timeline de trazabilidad (`TraceabilityTimeline`, mismo componente que Serie/Dashboard). */
export function LoteDetallePage() {
  const { id } = useParams<{ id: string }>();
  const { data: lote, isLoading } = useLote(id);
  const tiposMovimiento = useTiposMovimiento();
  const historial = useHistorialLote(id, lote?.data.product_id);
  const codigoPorTipoId = new Map((tiposMovimiento.data?.data ?? []).map((t) => [t.id, t.code]));

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!lote) {
    return <p className="text-sm text-muted-foreground">No se encontró el lote.</p>;
  }

  const vencimiento = resolverVencimientoLote(lote.data.expiry_date);
  const eventos: TraceabilityEvent[] = (historial.data ?? []).map((m) => {
    const visual = resolverMovimientoVisual(codigoPorTipoId.get(m.movement_type_id) ?? '');
    return {
      id: m.id,
      icon: visual.nivel === 'good' ? PackageCheck : PackageMinus,
      titulo: visual.etiqueta,
      fecha: m.created_at,
      cantidad: `${Number(m.quantity).toLocaleString('es')} un.`,
      documento: m.source_entity_id ? formatId(m.source_entity_id) : undefined,
      ubicacion: formatId(m.warehouse_id),
      nivel: visual.nivel,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <LotBadge lotNumber={lote.data.lot_number} className="text-sm" />
            {vencimiento && (
              <Badge
                variant="outline"
                style={{
                  borderColor: ESTADO_COLOR[vencimiento.nivel],
                  color: ESTADO_COLOR[vencimiento.nivel],
                }}
              >
                {vencimiento.etiqueta}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Producto {formatId(lote.data.product_id)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <PackageCheck aria-hidden className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Cantidad disponible</p>
              <p className="text-xl font-semibold tabular-nums">
                {Number(lote.data.remaining_quantity).toLocaleString('es')}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Warehouse aria-hidden className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Almacén</p>
              <p className="font-mono text-sm">
                {lote.data.warehouse_id ? formatId(lote.data.warehouse_id) : '—'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <CalendarClock aria-hidden className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Vencimiento</p>
              <p className="text-sm">
                {lote.data.expiry_date
                  ? new Date(lote.data.expiry_date).toLocaleDateString('es')
                  : 'Sin fecha registrada'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Timeline de trazabilidad</CardTitle>
        </CardHeader>
        <CardContent>
          {historial.isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <TraceabilityTimeline
              eventos={eventos}
              emptyMessage="Este lote todavía no tiene movimientos registrados."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
