import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ColumnDef } from '@tanstack/react-table';
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
} from '@gorazus/ui-kit';
// eslint-disable-next-line @nx/enforce-module-boundaries -- `shared/` se importa por ruta relativa dentro del mismo módulo, nunca por nombre de paquete (ver modules/auth/shared/package.json)
import { crearUsuarioSchema, type CrearUsuarioInput } from '../../shared/contracts/usuarios.schema';
import { useUsuarios, type UsuarioRecord } from '../hooks/use-usuarios';
import { useCrearUsuario } from '../hooks/use-crear-usuario';
import { useDesactivarUsuario } from '../hooks/use-desactivar-usuario';

const columns: ColumnDef<UsuarioRecord>[] = [
  { accessorKey: 'full_name', header: 'Nombre' },
  { accessorKey: 'email', header: 'Correo' },
  {
    accessorKey: 'is_active',
    header: 'Estado',
    cell: ({ row }) =>
      row.original.is_active ? <Badge>Activo</Badge> : <Badge variant="outline">Inactivo</Badge>,
  },
  {
    id: 'created_at',
    header: 'Alta',
    cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString('es'),
  },
];

/** `/seguridad/usuarios` — administración real (alta/baja), wireada a `modules/seguridad/backend`. Requiere `seguridad.gestionar_usuarios` (el backend lo exige; esta pantalla no repite la validación). */
export function UsuariosListadoPage() {
  const [page, setPage] = React.useState(1);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [tempPassword, setTempPassword] = React.useState<{
    email: string;
    password: string;
  } | null>(null);

  const { data, isLoading } = useUsuarios(page);
  const crearUsuario = useCrearUsuario();
  const desactivarUsuario = useDesactivarUsuario();

  const form = useForm<CrearUsuarioInput>({
    resolver: zodResolver(crearUsuarioSchema),
    defaultValues: { email: '', fullName: '' },
  });

  const onSubmit = (values: CrearUsuarioInput) => {
    crearUsuario.mutate(values, {
      onSuccess: (response) => {
        setCreateOpen(false);
        form.reset();
        setTempPassword({ email: values.email, password: response.data.passwordTemporal });
      },
    });
  };

  const columnsWithActions: ColumnDef<UsuarioRecord>[] = [
    ...columns,
    {
      id: 'acciones',
      header: '',
      cell: ({ row }) =>
        row.original.is_active ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={desactivarUsuario.isPending}
            onClick={(e) => {
              e.stopPropagation();
              desactivarUsuario.mutate(row.original.id);
            }}
          >
            Desactivar
          </Button>
        ) : null,
    },
  ];

  const createError =
    crearUsuario.error instanceof ApiClientError
      ? crearUsuario.error.message
      : crearUsuario.error
        ? 'No se pudo crear el usuario.'
        : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Alta y baja de usuarios — la asignación de roles se hace desde el detalle (pendiente).
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>Nuevo usuario</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo usuario</DialogTitle>
              <DialogDescription>
                Se genera una contraseña temporal — comunicásela vos mismo, no hay envío de
                invitación por correo todavía (Fase 2).
              </DialogDescription>
            </DialogHeader>
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {createError && (
                  <p className="text-sm font-medium text-destructive">{createError}</p>
                )}
                <DialogFooter>
                  <Button type="submit" disabled={crearUsuario.isPending}>
                    {crearUsuario.isPending && <Loader className="h-4 w-4" />}
                    Crear
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        columns={columnsWithActions}
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
        emptyMessage="No hay usuarios."
      />

      <Dialog open={tempPassword !== null} onOpenChange={() => setTempPassword(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Usuario creado</DialogTitle>
            <DialogDescription>
              Esta contraseña temporal no se vuelve a mostrar — copiala ahora.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 rounded-md border bg-muted p-4">
            <p className="text-sm">
              <span className="text-muted-foreground">Correo: </span>
              {tempPassword?.email}
            </p>
            <p className="font-mono text-sm">
              <span className="text-muted-foreground">Contraseña temporal: </span>
              {tempPassword?.password}
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setTempPassword(null)}>Listo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
