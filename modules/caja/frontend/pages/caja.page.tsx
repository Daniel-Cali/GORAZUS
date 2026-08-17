import * as React from 'react';
import { Badge, Button, Card, useAppStore } from '@gorazus/ui-kit';
import { AbrirCajaDialog } from '../components/abrir-caja-dialog';
import { MovimientoCajaDialog } from '../components/movimiento-caja-dialog';
import { CerrarCajaDialog } from '../components/cerrar-caja-dialog';
import { formatId, formatearMonto } from '../components/caja-format';
import { useEmpresaActual } from '../hooks/use-empresa-actual';
import {
  useCajas,
  useAperturaActiva,
  useMovimientosCaja,
  useTiposMovimientoCaja,
  type CierreCajaResultado,
} from '../hooks/use-caja';

/**
 * Pantalla de Caja — apertura/movimientos/cierre (Prompt V2 "Cash Register
 * Frontend"). El backend es la fuente de verdad: `expected_amount`/
 * `difference_amount` siempre vienen del servidor, nunca se recalculan acá
 * como valor final (sección 24).
 */
export function CajaPage() {
  const companyId = useAppStore((s) => s.activeCompanyId);
  const branchId = useAppStore((s) => s.activeBranchId);
  const empresa = useEmpresaActual(companyId ?? undefined);
  const currencyCode = empresa.data?.functional_currency_code;

  const cajas = useCajas(branchId ?? undefined);
  const [registerId, setRegisterId] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    const lista = cajas.data?.data;
    const unica = !registerId && lista?.length === 1 ? lista[0] : undefined;
    if (unica) setRegisterId(unica.id);
  }, [cajas.data, registerId]);

  const apertura = useAperturaActiva(registerId);
  const aperturaActiva = apertura.data?.data?.is_open ? apertura.data.data : undefined;
  const movimientos = useMovimientosCaja(aperturaActiva?.id);
  const tipos = useTiposMovimientoCaja();
  const mapaTipos = React.useMemo(
    () => Object.fromEntries((tipos.data?.data ?? []).map((t) => [t.id, t.code])),
    [tipos.data],
  );

  const [abrirAbierto, setAbrirAbierto] = React.useState(false);
  const [movimientoDireccion, setMovimientoDireccion] = React.useState<'in' | 'out' | null>(null);
  const [cerrarAbierto, setCerrarAbierto] = React.useState(false);
  const [ultimoCierre, setUltimoCierre] = React.useState<CierreCajaResultado | null>(null);

  const registro = cajas.data?.data.find((c) => c.id === registerId);
  const listaMovimientos = movimientos.data?.data ?? [];
  const openingAmount = aperturaActiva ? Number(aperturaActiva.opening_amount) : 0;
  const totalIngresos = listaMovimientos
    .filter((m) => Number(m.amount) > 0)
    .reduce((acc, m) => acc + Number(m.amount), 0);
  const totalEgresos = listaMovimientos
    .filter((m) => Number(m.amount) < 0)
    .reduce((acc, m) => acc + Math.abs(Number(m.amount)), 0);
  const ventasEfectivo = listaMovimientos
    .filter((m) => m.source_module === 'pos' && Number(m.amount) > 0)
    .reduce((acc, m) => acc + Number(m.amount), 0);
  const otrosIngresos = totalIngresos - ventasEfectivo;
  const expectedPreview =
    openingAmount + listaMovimientos.reduce((acc, m) => acc + Number(m.amount), 0);

  if (!branchId) {
    return <p className="text-sm text-muted-foreground">No hay sucursal activa en la sesión.</p>;
  }

  if (!registerId) {
    return (
      <div className="max-w-lg space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Caja</h1>
        {cajas.isLoading && <p className="text-sm text-muted-foreground">Cargando cajas…</p>}
        {!cajas.isLoading && (cajas.data?.data.length ?? 0) === 0 && (
          <p className="text-sm text-muted-foreground">
            Esta sucursal todavía no tiene cajas configuradas.
          </p>
        )}
        {(cajas.data?.data.length ?? 0) > 0 && (
          <Card className="space-y-2 p-4">
            <p className="text-sm text-muted-foreground">Elegí una caja para continuar.</p>
            <div className="flex flex-wrap gap-2">
              {cajas.data?.data.map((c) => (
                <Button key={c.id} variant="outline" onClick={() => setRegisterId(c.id)}>
                  {c.name}
                </Button>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {registro?.name ?? 'Caja'}
          </h1>
          {aperturaActiva ? (
            <p className="text-sm text-muted-foreground">
              Abierta desde {new Date(aperturaActiva.created_at).toLocaleString('es')} · Por{' '}
              {formatId(aperturaActiva.opened_by_user_id)}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Sin apertura activa.</p>
          )}
        </div>
        <Badge variant={aperturaActiva ? 'default' : 'secondary'}>
          {aperturaActiva ? 'ABIERTA' : 'CERRADA'}
        </Badge>
      </div>

      {!aperturaActiva && (
        <Card className="space-y-3 p-6 text-center">
          <p className="text-sm text-muted-foreground">No hay una caja abierta en este registro.</p>
          <Button onClick={() => setAbrirAbierto(true)}>Abrir caja</Button>
        </Card>
      )}

      {aperturaActiva && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card className="p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Apertura
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {formatearMonto(openingAmount, currencyCode)}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Ventas en efectivo
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {formatearMonto(ventasEfectivo, currencyCode)}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Otros ingresos
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {formatearMonto(otrosIngresos, currencyCode)}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Egresos
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {formatearMonto(totalEgresos, currencyCode)}
              </p>
            </Card>
          </div>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Efectivo esperado (estimado)</p>
              <p className="text-lg font-semibold tabular-nums">
                {formatearMonto(expectedPreview, currencyCode)}
              </p>
            </div>
          </Card>

          <div className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold text-foreground">Movimientos</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-2 font-medium">Hora</th>
                    <th className="px-4 py-2 font-medium">Tipo</th>
                    <th className="px-4 py-2 font-medium">Descripción</th>
                    <th className="px-4 py-2 font-medium">Usuario</th>
                    <th className="px-4 py-2 font-medium">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {listaMovimientos.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                        Todavía no hay movimientos en este turno.
                      </td>
                    </tr>
                  )}
                  {listaMovimientos.map((m) => (
                    <tr key={m.id}>
                      <td className="px-4 py-2">
                        {new Date(m.created_at).toLocaleTimeString('es')}
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {mapaTipos[m.movement_type_id] ?? formatId(m.movement_type_id)}
                      </td>
                      <td className="px-4 py-2">{m.observations ?? '—'}</td>
                      <td className="px-4 py-2 font-mono text-xs">
                        {m.created_by ? formatId(m.created_by) : '—'}
                      </td>
                      <td
                        className={`px-4 py-2 tabular-nums font-medium ${Number(m.amount) < 0 ? 'text-destructive' : ''}`}
                      >
                        {formatearMonto(m.amount, currencyCode)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
              &ldquo;Tipo&rdquo; no distingue forma de pago (efectivo/tarjeta/transferencia) — esa
              relación no existe todavía en <code>cash_movements</code> (limitación real, ver
              informe).
            </p>
          </div>

          {ultimoCierre && (
            <Card className="space-y-1 border-primary/40 p-4">
              <p className="text-sm font-semibold text-foreground">Último cierre</p>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <span>
                  Esperado: {formatearMonto(ultimoCierre.cierre.expected_amount, currencyCode)}
                </span>
                <span>
                  Contado: {formatearMonto(ultimoCierre.cierre.counted_amount, currencyCode)}
                </span>
                <span>
                  Diferencia:{' '}
                  {ultimoCierre.cierre.difference_amount !== null
                    ? formatearMonto(ultimoCierre.cierre.difference_amount, currencyCode)
                    : '—'}
                </span>
              </div>
            </Card>
          )}

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setMovimientoDireccion('in')}>
              Agregar efectivo
            </Button>
            <Button variant="outline" onClick={() => setMovimientoDireccion('out')}>
              Retirar efectivo
            </Button>
            <Button onClick={() => setCerrarAbierto(true)}>Cerrar caja</Button>
          </div>
        </>
      )}

      <AbrirCajaDialog open={abrirAbierto} onOpenChange={setAbrirAbierto} registerId={registerId} />
      {movimientoDireccion && (
        <MovimientoCajaDialog
          open={movimientoDireccion !== null}
          onOpenChange={(open) => !open && setMovimientoDireccion(null)}
          registerId={registerId}
          direction={movimientoDireccion}
        />
      )}
      {aperturaActiva && (
        <CerrarCajaDialog
          open={cerrarAbierto}
          onOpenChange={setCerrarAbierto}
          openingId={aperturaActiva.id}
          registerId={registro?.name ?? registerId}
          expectedPreview={expectedPreview}
          onClosed={setUltimoCierre}
        />
      )}
    </div>
  );
}
