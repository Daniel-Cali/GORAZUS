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
import { useContactos, type ContactoRecord } from '../hooks/use-contactos';
import {
  useActualizarContacto,
  useCrearContacto,
  useEliminarContacto,
  contactoSchema,
  type ContactoInput,
} from '../hooks/use-contacto-mutations';

function ContactoForm({
  defaultValues,
  onSubmit,
  isPending,
  error,
  submitLabel,
}: {
  defaultValues: ContactoInput;
  onSubmit: (values: ContactoInput) => void;
  isPending: boolean;
  error: string | null;
  submitLabel: string;
}) {
  const form = useForm<ContactoInput>({ resolver: zodResolver(contactoSchema), defaultValues });

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre completo</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="jobTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cargo (opcional)</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email (opcional)</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono (opcional)</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isPrimary"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2 space-y-0">
              <FormControl>
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  id="contacto-is-primary"
                />
              </FormControl>
              <FormLabel htmlFor="contacto-is-primary" className="!mt-0">
                Contacto principal
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

const EMPTY_CONTACTO: ContactoInput = {
  fullName: '',
  jobTitle: '',
  email: '',
  phone: '',
  isPrimary: false,
};

/** Pestaña "Contactos" del detalle de cliente — CRUD completo sobre `customers.customer_contacts`. */
export function ContactosTab({ customerId }: { customerId: string }) {
  const { data, isLoading } = useContactos(customerId);
  const crear = useCrearContacto(customerId);
  const actualizar = useActualizarContacto(customerId);
  const eliminar = useEliminarContacto(customerId);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ContactoRecord | null>(null);
  const [deleting, setDeleting] = React.useState<ContactoRecord | null>(null);

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

  const contactos = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">Nuevo contacto</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo contacto</DialogTitle>
              <DialogDescription>
                Marcarlo como principal desmarca cualquier otro.
              </DialogDescription>
            </DialogHeader>
            <ContactoForm
              defaultValues={EMPTY_CONTACTO}
              submitLabel="Crear"
              isPending={crear.isPending}
              error={errorMessage(crear.error, 'No se pudo crear el contacto.')}
              onSubmit={(values) => crear.mutate(values, { onSuccess: () => setCreateOpen(false) })}
            />
          </DialogContent>
        </Dialog>
      </div>

      {contactos.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Este cliente no tiene contactos registrados.
        </p>
      ) : (
        <div className="space-y-2">
          {contactos.map((contacto) => (
            <Card key={contacto.id} className="flex items-center justify-between gap-4 p-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{contacto.full_name}</span>
                  {contacto.is_primary && <Badge>Principal</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">
                  {[contacto.job_title, contacto.email, contacto.phone]
                    .filter(Boolean)
                    .join(' · ') || 'Sin datos adicionales'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditing(contacto)}>
                  Editar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleting(contacto)}>
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
            <DialogTitle>Editar contacto</DialogTitle>
          </DialogHeader>
          {editing && (
            <ContactoForm
              defaultValues={{
                fullName: editing.full_name,
                jobTitle: editing.job_title ?? '',
                email: editing.email ?? '',
                phone: editing.phone ?? '',
                isPrimary: editing.is_primary,
              }}
              submitLabel="Guardar"
              isPending={actualizar.isPending}
              error={errorMessage(actualizar.error, 'No se pudo actualizar el contacto.')}
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
        title="Eliminar contacto"
        description={`Se eliminará el contacto "${deleting?.full_name}". Esta acción es una baja lógica, se puede recuperar desde la base de datos si hace falta.`}
        confirmLabel="Eliminar contacto"
        onConfirm={() => deleting && eliminar.mutate(deleting.id)}
      />
    </div>
  );
}
