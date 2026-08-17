import * as React from 'react';
import { useParams } from 'react-router-dom';
import { PackageCheck, PackageMinus, Warehouse, ShieldCheck, ShieldX } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Skeleton, Badge } from '@gorazus/ui-kit';
import { TraceabilityTimeline, type TraceabilityEvent } from '../components/traceability-timeline';
import { SerialBadge } from '../components/lot-serial-badge';
import { formatId } from '../components/format-id';
import { resolverMovimientoVisual, ESTADO_COLOR } from '../components/inventory-status';
import { useSerie, useHistorialSerie } from '../hooks/use-serie';
import { useTiposMovimiento } from '../hooks/use-catalogos';

const ESTADO_SERIE_ETIQUETA: Record<string, string> = { in_stock: 'En stock', issued: 'Emitida' };

/**
 * "SERIAL VIEW" — deliberadamente distinta de Lote: ícono de identidad
 * (`Fingerprint` en `SerialBadge`), estado binario real (`in_stock`/`issued`
 * — una serie SÍ tiene columna de estado, a diferencia de lotes/recepciones/
 * salidas, ver `inventory_serials.status`), sin cantidad (una serie es
 * siempre 1 unidad física).
 */
export function SerieDetallePage() {
  const { serialNumber } = useParams<{ serialNumber: string }>();
  const { data: serie, isLoading } = useSerie(serialNumber);
  const [page] = React.useState(1);
  const historial = useHistorialSerie(serialNumber, { page, pageSize: 50 });
  const tiposMovimiento = useTiposMovimiento();
  const codigoPorTipoId = new Map((tiposMovimiento.data?.data ?? []).map((t) => [t.id, t.code]));

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!serie) {
    return <p className="text-sm text-muted-foreground">No se encontró la serie.</p>;
  }

  const enStock = serie.data.status === 'in_stock';
  const eventos: TraceabilityEvent[] = (historial.data?.data ?? []).map((m) => {
    const visual = resolverMovimientoVisual(codigoPorTipoId.get(m.movement_type_id) ?? '');
    return {
      id: m.id,
      icon: visual.nivel === 'good' ? PackageCheck : PackageMinus,
      titulo: visual.etiqueta,
      fecha: m.created_at,
      documento: m.source_entity_id ? formatId(m.source_entity_id) : undefined,
      ubicacion: formatId(m.warehouse_id),
      nivel: visual.nivel,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <SerialBadge serialNumber={serie.data.serial_number} className="text-sm" />
        <Badge
          variant="outline"
          style={{
            borderColor: enStock ? ESTADO_COLOR.good : ESTADO_COLOR.neutral,
            color: enStock ? ESTADO_COLOR.good : ESTADO_COLOR.neutral,
          }}
        >
          {ESTADO_SERIE_ETIQUETA[serie.data.status] ?? serie.data.status}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">Producto {formatId(serie.data.product_id)}</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            {enStock ? (
              <ShieldCheck aria-hidden className="h-5 w-5" style={{ color: ESTADO_COLOR.good }} />
            ) : (
              <ShieldX aria-hidden className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <p className="text-xs text-muted-foreground">Disponibilidad</p>
              <p className="text-sm font-medium">
                {enStock ? 'Disponible para emitir' : 'Ya emitida — no disponible'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Warehouse aria-hidden className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Almacén actual</p>
              <p className="font-mono text-sm">
                {serie.data.warehouse_id ? formatId(serie.data.warehouse_id) : '—'}
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
              emptyMessage="Esta serie todavía no tiene movimientos registrados."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
