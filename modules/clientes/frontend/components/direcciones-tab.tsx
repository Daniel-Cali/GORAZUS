import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ApiClientError,
  Badge,
  Button,
  Card,
  ConfirmDialog,
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
  Skeleton,
} from '@gorazus/ui-kit';
import { useDirecciones, type DireccionRecord } from '../hooks/use-direcciones';
import {
  useActualizarDireccion,
  useCrearDireccion,
  useEliminarDireccion,
  direccionSchema,
  TIPOS_DIRECCION,
  type DireccionInput,
} from '../hooks/use-direccion-mutations';

const ETIQUETA_TIPO_DIRECCION: Record<(typeof TIPOS_DIRECCION)[number], string> = {
  billing: 'Facturación',
  shipping: 'Envío',
  other: 'Otra',
};

function DireccionForm({
  defaultValues,
  onSubmit,
  isPending,
  error,
  submitLabel,
}: {
  defaultValues: DireccionInput;
  onSubmit: (values: DireccionInput) => void;
  isPending: boolean;
  error: string | null;
  submitLabel: string;
}) {
  const form = useForm<DireccionInput>({ resolver: zodResolver(direccionSchema), defaultValues });

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="addressType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de dirección</FormLabel>
              <FormControl>
                <select
                  {...field}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                >
                  {TIPOS_DIRECCION.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {ETIQUETA_TIPO_DIRECCION[tipo]}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="line1"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Línea 1</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="line2"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Línea 2 (opcional)</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="postalCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código postal (opcional)</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isDefault"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2 space-y-0">
              <FormControl>
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  id="direccion-is-default"
                />
              </FormControl>
              <FormLabel htmlFor="direccion-is-default" className="!mt-0">
                Dirección predeterminada
              </FormLabel>
            </FormItem>
          )}
        />
        {error && <p className="text-sm font-medium text-destructive">{error}</p>}
        <DialogFooter>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader className="h-4 w-4" />}
            {submitLabel}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

const EMPTY_DIRECCION: DireccionInput = {
  addressType: 'billing',
  line1: '',
  line2: '',
  postalCode: '',
  isDefault: false,
};

/** Pestaña "Direcciones" del detalle de cliente — CRUD completo sobre `customers.customer_addresses`. */
export function DireccionesTab({ customerId }: { customerId: string }) {
  const { data, isLoading } = useDirecciones(customerId);
  const crear = useCrearDireccion(customerId);
  const actualizar = useActualizarDireccion(customerId);
  const eliminar = useEliminarDireccion(customerId);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<DireccionRecord | null>(null);
  const [deleting, setDeleting] = React.useState<DireccionRecord | null>(null);

  function errorMessage(error: unknown, fallback: string): string | null {
    if (error instanceof ApiClientError) return error.message;
    if (error) return fallback;
    return null;
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  const direcciones = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">Nueva dirección</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva dirección</DialogTitle>
              <DialogDescription>
                Marcarla como predeterminada desmarca cualquier otra.
              </DialogDescription>
            </DialogHeader>
            <DireccionForm
              defaultValues={EMPTY_DIRECCION}
              submitLabel="Crear"
              isPending={crear.isPending}
              error={errorMessage(crear.error, 'No se pudo crear la dirección.')}
              onSubmit={(values) => crear.mutate(values, { onSuccess: () => setCreateOpen(false) })}
            />
          </DialogContent>
        </Dialog>
      </div>

      {direcciones.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Este cliente no tiene direcciones registradas.
        </p>
      ) : (
        <div className="space-y-2">
          {direcciones.map((direccion) => (
            <Card key={direccion.id} className="flex items-center justify-between gap-4 p-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {ETIQUETA_TIPO_DIRECCION[
                      direccion.address_type as keyof typeof ETIQUETA_TIPO_DIRECCION
                    ] ?? direccion.address_type}
                  </span>
                  {direccion.is_default && <Badge>Predeterminada</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">
                  {[direccion.line1, direccion.line2, direccion.postal_code]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditing(direccion)}>
                  Editar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleting(direccion)}>
                  Eliminar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar dirección</DialogTitle>
          </DialogHeader>
          {editing && (
            <DireccionForm
              defaultValues={{
                addressType: editing.address_type as (typeof TIPOS_DIRECCION)[number],
                line1: editing.line1,
                line2: editing.line2 ?? '',
                postalCode: editing.postal_code ?? '',
                isDefault: editing.is_default,
              }}
              submitLabel="Guardar"
              isPending={actualizar.isPending}
              error={errorMessage(actualizar.error, 'No se pudo actualizar la dirección.')}
              onSubmit={(values) =>
                actualizar.mutate(
                  { id: editing.id, input: values },
                  { onSuccess: () => setEditing(null) },
                )
              }
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Eliminar dirección"
        description={`Se eliminará la dirección "${deleting?.line1}". Esta acción es una baja lógica, se puede recuperar desde la base de datos si hace falta.`}
        confirmLabel="Eliminar dirección"
        onConfirm={() => deleting && eliminar.mutate(deleting.id)}
      />
    </div>
  );
}
