import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  useAppStore,
} from '@gorazus/ui-kit';

/**
 * "Composición (sin datos propios)" (docs/menus/00-convenciones.md §7, índice
 * fila 01) — agrega vistas de otros módulos, no es dueño de datos. Placeholder
 * hasta que existan los módulos fuente reales para componer (Ventas, Caja,
 * Inventario, etc., todos con `backend/` vacío al momento de escribir esto).
 */
export function DashboardPage() {
  const user = useAppStore((s) => s.user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{user ? `Hola, ${user.name}` : 'Dashboard'}</h1>
        <p className="text-sm text-muted-foreground">Vista consolidada de la operación.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Ventas de hoy</CardTitle>
            <CardDescription>Pendiente — módulo Ventas aún no implementado</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-muted-foreground">—</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Caja activa</CardTitle>
            <CardDescription>Pendiente — módulo Caja aún no implementado</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-muted-foreground">—</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Alertas de inventario</CardTitle>
            <CardDescription>Pendiente — módulo Inventario aún no implementado</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-muted-foreground">—</CardContent>
        </Card>
      </div>
    </div>
  );
}
