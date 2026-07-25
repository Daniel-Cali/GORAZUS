import * as React from 'react';
import {
  ColumnDef,
  OnChangeFn,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../primitives/table';
import { Button } from '../primitives/button';
import { Skeleton } from '../primitives/skeleton';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../primitives/dropdown-menu';
import { cn } from '../../lib/cn';

/**
 * Paginación server-side por defecto (`pageCount`/`onPaginationChange` vienen
 * del backend, ver core/shared/BaseRepository paginación estándar) — no usa
 * el paginador client-side de TanStack. Si una tabla necesita listar todo en
 * memoria, pasar los datos ya completos y omitir `pagination`/`onPaginationChange`.
 */
export interface DataTablePagination {
  pageIndex: number;
  pageSize: number;
  pageCount: number;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  emptyMessage?: string;
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  pagination?: DataTablePagination;
  onPaginationChange?: (pagination: { pageIndex: number; pageSize: number }) => void;
  /** Si se omite, no se ofrece cambiar el tamaño de página (compatibilidad con listados que todavía no lo soportan). */
  onPageSizeChange?: (pageSize: number) => void;
  onRowClick?: (row: TData) => void;
  /** Alterna la columna de "Columnas visibles" (`SlidersHorizontal`) — apagado por defecto para no romper snapshots/tests de tablas angostas ya existentes. */
  enableColumnVisibility?: boolean;
  className?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'Sin resultados.',
  sorting,
  onSortingChange,
  pagination,
  onPaginationChange,
  onPageSizeChange,
  onRowClick,
  enableColumnVisibility = false,
  className,
}: DataTableProps<TData, TValue>) {
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: !!onSortingChange,
    manualPagination: !!pagination,
    pageCount: pagination?.pageCount ?? -1,
    state: {
      sorting: sorting ?? [],
      columnVisibility,
      pagination: pagination
        ? { pageIndex: pagination.pageIndex, pageSize: pagination.pageSize }
        : undefined,
    },
    onSortingChange,
    onColumnVisibilityChange: setColumnVisibility,
  });

  const rows = table.getRowModel().rows;
  const visibleColumnCount = table.getVisibleLeafColumns().length;

  return (
    <div className={cn('space-y-4', className)}>
      {enableColumnVisibility && (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Columnas
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Mostrar columnas</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllLeafColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    onSelect={(event) => event.preventDefault()}
                  >
                    {typeof column.columnDef.header === 'string'
                      ? column.columnDef.header
                      : column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* `containerClassName` (no un `<div>` extra) — un segundo `overflow-auto`
          por fuera del wrapper propio de `Table` rompe el `sticky top-0` de las
          `<th>` (quedan ancladas al wrapper interno, que nunca scrollea de
          verdad). Ver `table.tsx`. */}
      <Table containerClassName="max-h-[60vh] rounded-md border">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sortDirection = header.column.getIsSorted();
                return (
                  // `sticky` en cada `<th>`, no en `<thead>` — `position: sticky` sobre
                  // `display: table-header-group` no es consistente entre navegadores
                  // (confirmado con Playwright/Chromium real: pegarlo en `<thead>` no
                  // fijaba nada al scrollear el body de la tabla).
                  <TableHead key={header.id} className="sticky top-0 z-10 bg-background">
                    {header.isPlaceholder ? null : canSort ? (
                      <button
                        type="button"
                        className="flex items-center gap-1 select-none hover:text-foreground"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {sortDirection === 'asc' && <ArrowUp className="h-3.5 w-3.5" />}
                        {sortDirection === 'desc' && <ArrowDown className="h-3.5 w-3.5" />}
                        {!sortDirection && <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {Array.from({ length: visibleColumnCount }).map((__, colIndex) => (
                  <TableCell key={colIndex}>
                    <Skeleton className="h-5 w-full max-w-[12rem]" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : rows.length ? (
            rows.map((row) => (
              <TableRow
                key={row.id}
                onClick={() => onRowClick?.(row.original)}
                className={cn(onRowClick && 'cursor-pointer')}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={visibleColumnCount}
                className="h-24 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {pagination && onPaginationChange && (
        <div className="flex items-center justify-between gap-2">
          {onPageSizeChange ? (
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              Filas por página
              <select
                className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                value={pagination.pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Página {pagination.pageIndex + 1} de {Math.max(pagination.pageCount, 1)}
            </span>
            <Button
              variant="outline"
              size="icon"
              disabled={pagination.pageIndex <= 0}
              onClick={() =>
                onPaginationChange({
                  pageIndex: pagination.pageIndex - 1,
                  pageSize: pagination.pageSize,
                })
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={pagination.pageIndex + 1 >= pagination.pageCount}
              onClick={() =>
                onPaginationChange({
                  pageIndex: pagination.pageIndex + 1,
                  pageSize: pagination.pageSize,
                })
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
