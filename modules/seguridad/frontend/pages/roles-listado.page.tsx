import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ColumnDef } from '@tanstack/react-table';
import {
  ApiClientError,
  Badge,
  Button,
  ConfirmDialog,
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
import { useRoles, type RolRecord } from '../hooks/use-roles';
import { useCrearRol } from '../hooks/use-crear-rol';
import { useRenombrarRol } from '../hooks/use-renombrar-rol';
import { useEliminarRol } from '../hooks/use-eliminar-rol';

// Validación de UX en el cliente — el backend (`crearRolSchema`,
// `modules/seguridad/backend/validators/roles.schema.ts`) sigue siendo la
// fuente de verdad; esto solo evita un viaje al servidor para errores
// obvios (mismo criterio que `crearUsuarioSchema`, sin compartir el
// schema porque no vive en `shared/contracts/` todavía).
const crearRolFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre del rol es obligatorio').max(100),
  code: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_]*$/, 'El código solo puede tener letras, números y guion bajo')
    .optional(),
  description: z.string().trim().optional(),
});
type CrearRolFormInput = z.infer<typeof crearRolFormSchema>;

const renombrarRolFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre del rol es obligatorio').max(100),
});
type RenombrarRolFormInput = z.infer<typeof renombrarRolFormSchema>;

const TIPOS_ROL_LABEL: Record<string, string> = {
  system: 'Sistema',
  tenant: 'Tenant',
  company: 'Empresa',
  branch: 'Sucursal',
  custom: 'Personalizado',
};

const columns: ColumnDef<RolRecord>[] = [
  { accessorKey: 'name', header: 'Nombre' },
  {
    accessorKey: 'code',
    header: 'Código',
    cell: ({ row }) => row.original.code ?? <span className="text-muted-foreground">—</span>,
  },
  {
    accessorKey: 'role_type',
    header: 'Tipo',
    cell: ({ row }) => TIPOS_ROL_LABEL[row.original.role_type] ?? row.original.role_type,
  },
  {
    accessorKey: 'is_system_role',
    header: 'Sistema',
    cell: ({ row }) =>
      row.original.is_system_role ? (
        <Badge variant="outline">Sí</Badge>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    id: 'created_at',
    header: 'Alta',
    cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString('es'),
  },
];

/** `/seguridad/roles` — CRUD de roles (crear, renombrar, eliminar), wireada a `modules/seguridad/backend`. Un rol de fábrica (`is_system_role`) no admite renombrar ni eliminar — el backend lo rechaza con 409; acá directamente no se ofrecen esas acciones. Requiere `seguridad.gestionar_roles`. */
export function RolesListadoPage() {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [renameTarget, setRenameTarget] = React.useState<RolRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<RolRecord | null>(null);

  const { data, isLoading } = useRoles();
  const crearRol = useCrearRol();
  const renombrarRol = useRenombrarRol();
  const eliminarRol = useEliminarRol();

  const createForm = useForm<CrearRolFormInput>({
    resolver: zodResolver(crearRolFormSchema),
    defaultValues: { name: '', code: '', description: '' },
  });

  const renameForm = useForm<RenombrarRolFormInput>({
    resolver: zodResolver(renombrarRolFormSchema),
    defaultValues: { name: '' },
  });

  React.useEffect(() => {
    if (renameTarget) renameForm.reset({ name: renameTarget.name });
  }, [renameTarget, renameForm]);

  const onCrear = (values: CrearRolFormInput) => {
    crearRol.mutate(
      { name: values.name, code: values.code || null, description: values.description || null },
      {
        onSuccess: () => {
          setCreateOpen(false);
          createForm.reset();
        },
      },
    );
  };

  const onRenombrar = (values: RenombrarRolFormInput) => {
    if (!renameTarget) return;
    renombrarRol.mutate(
      { id: renameTarget.id, name: values.name },
      { onSuccess: () => setRenameTarget(null) },
    );
  };

  const columnsWithActions: ColumnDef<RolRecord>[] = [
    ...columns,
    {
      id: 'acciones',
      header: '',
      enableHiding: false,
      cell: ({ row }) =>
        row.original.is_system_role ? null : (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setRenameTarget(row.original);
              }}
            >
              Renombrar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteTarget(row.original);
              }}
            >
              Eliminar
            </Button>
          </div>
        ),
    },
  ];

  const createError =
    crearRol.error instanceof ApiClientError
      ? crearRol.error.message
      : crearRol.error
        ? 'No se pudo crear el rol.'
        : null;

  const renameError =
    renombrarRol.error instanceof ApiClientError
      ? renombrarRol.error.message
      : renombrarRol.error
        ? 'No se pudo renombrar el rol.'
        : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Roles</h1>
          <p className="text-sm text-muted-foreground">
            Roles de todo el tenant y de la empresa activa — los roles de fábrica no se pueden
            renombrar ni eliminar.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>Nuevo rol</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo rol</DialogTitle>
              <DialogDescription>
                Se crea como rol personalizado (`custom`), asignable a usuarios de esta empresa.
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form className="space-y-4" onSubmit={createForm.handleSubmit(onCrear)}>
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código (opcional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción (opcional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {createError && (
                  <p className="text-sm font-medium text-destructive">{createError}</p>
                )}
                <DialogFooter>
                  <Button type="submit" disabled={crearRol.isPending}>
                    {crearRol.isPending && <Loader className="h-4 w-4" />}
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
        enableColumnVisibility
        emptyMessage="No hay roles."
      />

      <Dialog open={renameTarget !== null} onOpenChange={(open) => !open && setRenameTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renombrar rol</DialogTitle>
          </DialogHeader>
          <Form {...renameForm}>
            <form className="space-y-4" onSubmit={renameForm.handleSubmit(onRenombrar)}>
              <FormField
                control={renameForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {renameError && <p className="text-sm font-medium text-destructive">{renameError}</p>}
              <DialogFooter>
                <Button type="submit" disabled={renombrarRol.isPending}>
                  {renombrarRol.isPending && <Loader className="h-4 w-4" />}
                  Guardar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Eliminar rol"
        description={`El rol "${deleteTarget?.name}" dejará de estar disponible para asignar. Esto no afecta a los usuarios que ya lo tienen.`}
        confirmLabel="Eliminar rol"
        variant="destructive"
        onConfirm={() => {
          if (deleteTarget) eliminarRol.mutate(deleteTarget.id);
        }}
      />
    </div>
  );
}
