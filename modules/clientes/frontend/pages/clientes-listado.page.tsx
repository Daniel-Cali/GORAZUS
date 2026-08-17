import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import {
  ApiClientError,
  Badge,
  Button,
  DataTable,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Loader,
  useAppStore,
} from '@gorazus/ui-kit';
import { useClientes, type ClienteRecord } from '../hooks/use-clientes';
import {
  useCrearCliente,
  crearClienteSchema,
  type CrearClienteInput,
} from '../hooks/use-crear-cliente';

const columns: ColumnDef<ClienteRecord>[] = [
  { accessorKey: 'legal_name', header: 'Nombre / Razón social' },
  { accessorKey: 'tax_id', header: 'Identificador fiscal' },
  { accessorKey: 'preferred_currency_code', header: 'Moneda' },
  {
    accessorKey: 'is_blocked',
    header: 'Estado',
    cell: ({ row }) =>
      row.original.is_blocked ? (
        <Badge variant="destructive">Bloqueado</Badge>
      ) : (
        <Badge>Activo</Badge>
      ),
  },
];

/**
 * `/clientes` — listado real, wireado a `modules/clientes/backend`.
 * Búsqueda por nombre/identificador fiscal (único filtro que el backend
 * soporta hoy — `ClienteRepository.findMany`, ver `CRM_ARCHITECTURE.md
 * §13`); orden de columnas aplicado sobre la página cargada, no hay
 * parámetro de orden en el backend todavía.
 */
export function ClientesListadoPage() {
  const navigate = useNavigate();
  const activeCompanyId = useAppStore((s) => s.activeCompanyId);
  const activeBranchId = useAppStore((s) => s.activeBranchId);

  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [searchInput, setSearchInput] = React.useState('');
  const [query, setQuery] = React.useState<string | undefined>(undefined);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [createOpen, setCreateOpen] = React.useState(false);

  const { data, isLoading } = useClientes(page, pageSize, query);
  const crearCliente = useCrearCliente();

  /**
   * `DataTable` marca `manualSorting: true` en cuanto se le pasa
   * `onSortingChange` (asume que el orden ya viene resuelto) — el backend
   * no tiene parámetro de orden todavía (`CRM_ARCHITECTURE.md §13`), así
   * que se ordena acá mismo la página ya cargada, no las 20/50 filas de
   * golpe desde el servidor. Alcance honesto: ordena lo que está en
   * pantalla, no el listado completo.
   */
  const sortedData = React.useMemo(() => {
    const rows = data?.data ?? [];
    const [sort] = sorting;
    if (!sort) return rows;
    const factor = sort.desc ? -1 : 1;
    return [...rows].sort((a, b) => {
      const valueA = a[sort.id as keyof ClienteRecord];
      const valueB = b[sort.id as keyof ClienteRecord];
      if (valueA === valueB) return 0;
      if (valueA === null || valueA === undefined) return 1;
      if (valueB === null || valueB === undefined) return -1;
      return valueA > valueB ? factor : -factor;
    });
  }, [data, sorting]);

  const form = useForm<CrearClienteInput>({
    resolver: zodResolver(crearClienteSchema),
    defaultValues: {
      companyId: activeCompanyId ?? '',
      branchId: activeBranchId ?? undefined,
      legalName: '',
      taxId: '',
      tradeName: '',
      preferredCurrencyCode: 'USD',
    },
  });

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      setQuery(searchInput.trim() || undefined);
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const onSubmit = (values: CrearClienteInput) => {
    crearCliente.mutate(values, {
      onSuccess: () => {
        setCreateOpen(false);
        form.reset({
          companyId: activeCompanyId ?? '',
          branchId: activeBranchId ?? undefined,
          legalName: '',
          taxId: '',
          tradeName: '',
          preferredCurrencyCode: 'USD',
        });
      },
    });
  };

  const createError =
    crearCliente.error instanceof ApiClientError
      ? crearCliente.error.message
      : crearCliente.error
        ? 'No se pudo crear el cliente.'
        : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            Listado de clientes — contactos, direcciones y datos de crédito se administran desde el
            detalle de cada cliente.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button disabled={!activeCompanyId}>Nuevo cliente</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo cliente</DialogTitle>
              <DialogDescription>
                Se crea en la empresa activa de la sesión actual.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                  control={form.control}
                  name="legalName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre / Razón social</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tradeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre comercial (opcional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="taxId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Identificador fiscal</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="preferredCurrencyCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Moneda (ISO 4217)</FormLabel>
                      <FormControl>
                        <Input {...field} maxLength={3} className="uppercase" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {createError && (
                  <p className="text-sm font-medium text-destructive">{createError}</p>
                )}
                <DialogFooter>
                  <Button type="submit" disabled={crearCliente.isPending}>
                    {crearCliente.isPending && <Loader className="h-4 w-4" />}
                    Crear
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Input
        placeholder="Buscar por nombre o identificador fiscal..."
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        aria-label="Buscar clientes"
        className="max-w-sm"
      />

      <DataTable
        columns={columns}
        data={sortedData}
        isLoading={isLoading}
        sorting={sorting}
        onSortingChange={setSorting}
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
        onRowClick={(row) => navigate(`/clientes/${row.id}`)}
        enableColumnVisibility
        emptyMessage="No hay clientes que coincidan con la búsqueda."
      />
    </div>
  );
}
