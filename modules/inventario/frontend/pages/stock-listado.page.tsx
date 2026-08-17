import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable, Badge } from '@gorazus/ui-kit';
import { StockAvailabilityBar } from '../components/stock-availability-bar';
import { formatId } from '../components/format-id';
import { resolverSaludStock, ESTADO_COLOR } from '../components/inventory-status';
import { useStock, type StockRow } from '../hooks/use-stock';
import { useAlmacenes } from '../hooks/use-catalogos';

/**
 * "STOCK TABLE" — tabla enterprise de existencias. Sin nombre/SKU de
 * producto real (ver `formatId` — límite del backend actual, no del
 * frontend); columnas Lote/Serie omitidas de esta vista agregada porque
 * `inventory.stock` es por producto×almacén×ubicación, no por lote/serie
 * individual (esa granularidad vive en `/inventario/lotes`/`/series`).
 */
export function StockListadoPage() {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [warehouseId, setWarehouseId] = React.useState<string | undefined>(undefined);

  const { data, isLoading } = useStock({ page, pageSize, warehouseId });
  const almacenes = useAlmacenes();

  const columns: ColumnDef<StockRow, unknown>[] = [
    {
      accessorKey: 'product_id',
      header: 'Producto',
      cell: ({ row }) => (
        <span className="font-mono text-xs">{formatId(row.original.product_id)}</span>
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
      accessorKey: 'location_id',
      header: 'Ubicación',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.location_id ? formatId(row.original.location_id) : '—'}
        </span>
      ),
    },
    {
      id: 'disponibilidad',
      header: 'Disponible',
      cell: ({ row }) => (
        <StockAvailabilityBar
          quantityOnHand={Number(row.original.quantity_on_hand)}
          quantityReserved={Number(row.original.quantity_reserved)}
        />
      ),
    },
    {
      accessorKey: 'quantity_reserved',
      header: 'Reservado',
      cell: ({ row }) => (
        <span className="tabular-nums">
          {Number(row.original.quantity_reserved).toLocaleString('es')}
        </span>
      ),
    },
    {
      id: 'estado',
      header: 'Estado',
      cell: ({ row }) => {
        const salud = resolverSaludStock({
          quantityOnHand: Number(row.original.quantity_on_hand),
          quantityReserved: Number(row.original.quantity_reserved),
        });
        return (
          <Badge
            variant="outline"
            style={{ borderColor: ESTADO_COLOR[salud.nivel], color: ESTADO_COLOR[salud.nivel] }}
          >
            {salud.etiqueta}
          </Badge>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Stock</h1>
        <p className="text-sm text-muted-foreground">
          Existencias por producto, almacén y ubicación.
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
        emptyMessage="No hay existencias registradas con estos filtros."
      />
      <p className="text-xs text-muted-foreground">
        La columna Producto muestra el identificador interno truncado — requiere un lookup de
        catálogo de Productos para mostrar SKU/nombre real (ver informe, &quot;Known
        limitations&quot;).
      </p>
    </div>
  );
}
