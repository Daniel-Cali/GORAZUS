import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@gorazus/ui-kit';
import { formatId } from '../components/format-id';
import { SalesStatusBadge } from '../components/sales-status-badge';
import { ESTADO_PEDIDO_VISUAL, formatearMonto } from '../components/sales-status';
import { mapaEstadoPorId, useEstadosPedido } from '../hooks/use-catalogos';
import { usePedidos, type PedidoRow } from '../hooks/use-pedidos';

/** Listado de pedidos de venta — segundo eslabón del flujo, reserva inventario real por línea al crearse. */
export function PedidosListadoPage() {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [statusId, setStatusId] = React.useState<string | undefined>(undefined);

  const { data, isLoading } = usePedidos({ page, pageSize, statusId });
  const estados = useEstadosPedido();
  const mapaEstados = mapaEstadoPorId(estados.data?.data);

  const columns: ColumnDef<PedidoRow, unknown>[] = [
    {
      accessorKey: 'document_number',
      header: 'Documento',
      cell: ({ row }) => (
        <span className="font-medium text-foreground">{row.original.document_number}</span>
      ),
    },
    {
      accessorKey: 'customer_id',
      header: 'Cliente',
      cell: ({ row }) => (
        <span className="font-mono text-xs">{formatId(row.original.customer_id)}</span>
      ),
    },
    {
      accessorKey: 'quote_id',
      header: 'Origen',
      cell: ({ row }) =>
        row.original.quote_id ? (
          <span className="text-xs text-muted-foreground">
            Cotización {formatId(row.original.quote_id)}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Directo</span>
        ),
    },
    {
      accessorKey: 'created_at',
      header: 'Creado',
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString('es'),
    },
    {
      accessorKey: 'total_amount',
      header: 'Total',
      cell: ({ row }) => (
        <span className="tabular-nums">
          {formatearMonto(row.original.total_amount, row.original.currency_code)}
        </span>
      ),
    },
    {
      id: 'estado',
      header: 'Estado',
      cell: ({ row }) => (
        <SalesStatusBadge
          catalogo={ESTADO_PEDIDO_VISUAL}
          code={mapaEstados[row.original.status_id]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Pedidos de venta</h1>
        <p className="text-sm text-muted-foreground">
          Reservan inventario real por línea — precede a la factura.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Estado
          <select
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={statusId ?? ''}
            onChange={(e) => {
              setStatusId(e.target.value || undefined);
              setPage(1);
            }}
          >
            <option value="">Todos</option>
            {(estados.data?.data ?? []).map((e) => (
              <option key={e.id} value={e.id}>
                {ESTADO_PEDIDO_VISUAL[e.code]?.etiqueta ?? e.code}
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
        emptyMessage="No hay pedidos registrados con estos filtros."
      />
    </div>
  );
}
