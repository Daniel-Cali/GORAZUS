import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@gorazus/ui-kit';
import { MovementTypeBadge } from '../components/movement-type-badge';
import { LotBadge, SerialBadge } from '../components/lot-serial-badge';
import { formatId } from '../components/format-id';
import { useMovimientos, type MovimientoRow } from '../hooks/use-movimientos';
import { useAlmacenes, useTiposMovimiento } from '../hooks/use-catalogos';

/** "RECENT MOVEMENTS" (vista completa) — tabla enterprise, filtrable por almacén/producto. */
export function MovimientosListadoPage() {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [warehouseId, setWarehouseId] = React.useState<string | undefined>(undefined);

  const { data, isLoading } = useMovimientos({ page, pageSize, warehouseId });
  const almacenes = useAlmacenes();
  const tiposMovimiento = useTiposMovimiento();
  const codigoPorTipoId = new Map((tiposMovimiento.data?.data ?? []).map((t) => [t.id, t.code]));

  const columns: ColumnDef<MovimientoRow, unknown>[] = [
    {
      accessorKey: 'created_at',
      header: 'Fecha',
      cell: ({ row }) => (
        <span className="text-xs tabular-nums text-muted-foreground">
          {new Date(row.original.created_at).toLocaleString('es', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
    {
      accessorKey: 'movement_type_id',
      header: 'Tipo',
      cell: ({ row }) => (
        <MovementTypeBadge code={codigoPorTipoId.get(row.original.movement_type_id) ?? ''} />
      ),
    },
    {
      accessorKey: 'source_entity_id',
      header: 'Documento',
      cell: ({ row }) =>
        row.original.source_entity_id ? (
          <span className="font-mono text-xs">{formatId(row.original.source_entity_id)}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: 'product_id',
      header: 'Producto',
      cell: ({ row }) => (
        <span className="font-mono text-xs">{formatId(row.original.product_id)}</span>
      ),
    },
    {
      id: 'lote_serie',
      header: 'Lote/Serie',
      cell: ({ row }) =>
        row.original.lot_id ? (
          <LotBadge lotNumber={formatId(row.original.lot_id)} />
        ) : row.original.serial_id ? (
          <SerialBadge serialNumber={formatId(row.original.serial_id)} />
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: 'warehouse_id',
      header: 'Almacén',
      cell: ({ row }) => {
        const almacen = almacenes.data?.data.find((a) => a.id === row.original.warehouse_id);
        return <span>{almacen?.name ?? formatId(row.original.warehouse_id)}</span>;
      },
    },
    {
      accessorKey: 'quantity',
      header: 'Cantidad',
      cell: ({ row }) => (
        <span className="tabular-nums font-medium">
          {Number(row.original.quantity).toLocaleString('es')}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Movimientos</h1>
        <p className="text-sm text-muted-foreground">
          Historial completo de entradas, salidas, transferencias y ajustes.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Almacén
          <select
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={warehouseId ?? ''}
            onChange={(e) => {
              setWarehouseId(e.target.value || undefined);
              setPage(1);
            }}
          >
            <option value="">Todos</option>
            {(almacenes.data?.data ?? []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        pagination={
          data?.meta
            ? {
                pageIndex: page - 1,
                pageSize: data.meta.pageSize,
                pageCount: Math.ceil(data.meta.total / data.meta.pageSize),
              }
            : undefined
        }
        onPaginationChange={({ pageIndex }) => setPage(pageIndex + 1)}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        enableColumnVisibility
        emptyMessage="No hay movimientos registrados con estos filtros."
      />
    </div>
  );
}
