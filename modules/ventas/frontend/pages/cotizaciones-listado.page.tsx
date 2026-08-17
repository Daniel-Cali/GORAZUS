import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { useNavigate } from 'react-router-dom';
import { Button, DataTable } from '@gorazus/ui-kit';
import { formatId } from '../components/format-id';
import { SalesStatusBadge } from '../components/sales-status-badge';
import { ESTADO_COTIZACION_VISUAL, formatearMonto } from '../components/sales-status';
import { mapaEstadoPorId, useEstadosCotizacion } from '../hooks/use-catalogos';
import { useCotizaciones, type CotizacionRow } from '../hooks/use-cotizaciones';

/** Listado de cotizaciones — primer eslabón del flujo Cotización → Pedido → Factura (Ventas Enterprise Parte 1). */
export function CotizacionesListadoPage() {
  const navigate = useNavigate();
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [statusId, setStatusId] = React.useState<string | undefined>(undefined);

  const { data, isLoading } = useCotizaciones({ page, pageSize, statusId });
  const estados = useEstadosCotizacion();
  const mapaEstados = mapaEstadoPorId(estados.data?.data);

  const columns: ColumnDef<CotizacionRow, unknown>[] = [
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
      accessorKey: 'created_at',
      header: 'Creada',
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString('es'),
    },
    {
      accessorKey: 'valid_until',
      header: 'Vigente hasta',
      cell: ({ row }) =>
        row.original.valid_until
          ? new Date(row.original.valid_until).toLocaleDateString('es')
          : '—',
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
          catalogo={ESTADO_COTIZACION_VISUAL}
          code={mapaEstados[row.original.status_id]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Cotizaciones</h1>
          <p className="text-sm text-muted-foreground">
            Estimaciones comerciales — sin impuesto calculado todavía.
          </p>
        </div>
        <Button onClick={() => navigate('/ventas/cotizaciones/nueva')}>Nueva cotización</Button>
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
                {ESTADO_COTIZACION_VISUAL[e.code]?.etiqueta ?? e.code}
              </option>
            ))}
          </select>
        </label>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        onRowClick={(row) => navigate(`/ventas/cotizaciones/${row.id}`)}
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
        emptyMessage="No hay cotizaciones registradas con estos filtros."
      />
    </div>
  );
}
