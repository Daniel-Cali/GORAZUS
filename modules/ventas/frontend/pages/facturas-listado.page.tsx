import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '@gorazus/ui-kit';
import { formatId } from '../components/format-id';
import { SalesStatusBadge } from '../components/sales-status-badge';
import { ESTADO_FACTURA_VISUAL, formatearMonto } from '../components/sales-status';
import { mapaEstadoPorId, useEstadosFactura } from '../hooks/use-catalogos';
import { useFacturas, type FacturaRow } from '../hooks/use-facturas';

/** Listado enterprise de facturas — la venta POS también aparece acá (`sales_channel='pos'`, es una factura directa). */
export function FacturasListadoPage() {
  const navigate = useNavigate();
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [statusId, setStatusId] = React.useState<string | undefined>(undefined);

  const { data, isLoading } = useFacturas({ page, pageSize, statusId });
  const estados = useEstadosFactura();
  const mapaEstados = mapaEstadoPorId(estados.data?.data);

  const columns: ColumnDef<FacturaRow, unknown>[] = [
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
      accessorKey: 'sales_channel',
      header: 'Canal',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{row.original.sales_channel}</span>
      ),
    },
    {
      accessorKey: 'issued_at',
      header: 'Emisión',
      cell: ({ row }) => new Date(row.original.issued_at).toLocaleDateString('es'),
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
          catalogo={ESTADO_FACTURA_VISUAL}
          code={mapaEstados[row.original.status_id]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Facturas</h1>
        <p className="text-sm text-muted-foreground">
          Documentos emitidos, incluye ventas POS directas.
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
                {ESTADO_FACTURA_VISUAL[e.code]?.etiqueta ?? e.code}
              </option>
            ))}
          </select>
        </label>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        onRowClick={(row) => navigate(`/ventas/facturas/${row.id}`)}
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
        emptyMessage="No hay facturas registradas con estos filtros."
      />
    </div>
  );
}
