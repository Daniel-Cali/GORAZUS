import * as React from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ApiClientError,
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@gorazus/ui-kit';
import { useCliente } from '../hooks/use-cliente';
import {
  useActualizarCliente,
  actualizarClienteSchema,
  type ActualizarClienteInput,
} from '../hooks/use-actualizar-cliente';
import { ContactosTab } from '../components/contactos-tab';
import { DireccionesTab } from '../components/direcciones-tab';

/**
 * `/clientes/:id` — detalle real de un cliente + pestañas de Contactos y
 * Direcciones (únicos sub-recursos con backend hoy — Clientes Parte
 * 02.1, ver `CRM_ROADMAP.md` anexo). Categorías, Notas, Timeline, Crédito,
 * Listas de precio, Tags y Documentos quedan para partes siguientes, sin
 * backend todavía — no se agregan pestañas vacías para no aparentar una
 * funcionalidad que no existe.
 */
export function ClienteDetallePage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useCliente(id);
  const actualizarCliente = useActualizarCliente(id ?? '');
  const [editOpen, setEditOpen] = React.useState(false);

  const cliente = data?.data;

  const form = useForm<ActualizarClienteInput>({
    resolver: zodResolver(actualizarClienteSchema),
    values: cliente
      ? {
          legalName: cliente.legal_name,
          tradeName: cliente.trade_name ?? '',
          preferredCurrencyCode: cliente.preferred_currency_code,
        }
      : undefined,
  });

  const onSubmit = (values: ActualizarClienteInput) => {
    actualizarCliente.mutate(values, { onSuccess: () => setEditOpen(false) });
  };

  const editError =
    actualizarCliente.error instanceof ApiClientError
      ? actualizarCliente.error.message
      : actualizarCliente.error
        ? 'No se pudo actualizar el cliente.'
        : null;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!cliente) {
    return <p className="text-sm text-muted-foreground">No se encontró el cliente.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{cliente.legal_name}</h1>
            {cliente.is_blocked ? (
              <Badge variant="destructive">Bloqueado</Badge>
            ) : (
              <Badge>Activo</Badge>
            )}
          </div>
          {cliente.trade_name && (
            <p className="text-sm text-muted-foreground">{cliente.trade_name}</p>
          )}
        </div>
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">Editar</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar cliente</DialogTitle>
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
                {editError && <p className="text-sm font-medium text-destructive">{editError}</p>}
                <DialogFooter>
                  <Button type="submit" disabled={actualizarCliente.isPending}>
                    {actualizarCliente.isPending && <Loader className="h-4 w-4" />}
                    Guardar
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Identificador fiscal</p>
            <p className="text-sm font-medium">{cliente.tax_id}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Moneda preferida</p>
            <p className="text-sm font-medium">{cliente.preferred_currency_code}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Alta</p>
            <p className="text-sm font-medium">
              {new Date(cliente.created_at).toLocaleDateString('es')}
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="contactos">
        <TabsList>
          <TabsTrigger value="contactos">Contactos</TabsTrigger>
          <TabsTrigger value="direcciones">Direcciones</TabsTrigger>
        </TabsList>
        <TabsContent value="contactos">
          <ContactosTab customerId={cliente.id} />
        </TabsContent>
        <TabsContent value="direcciones">
          <DireccionesTab customerId={cliente.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
