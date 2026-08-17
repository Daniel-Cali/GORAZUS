import * as React from 'react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Loader,
  MoneyInput,
} from '@gorazus/ui-kit';
import {
  useEmpresas,
  useSucursales,
  useCajas,
  useCrearCaja,
  useAperturaActiva,
  useAbrirCaja,
} from '../hooks/use-pos';

export interface ContextoPos {
  companyId: string;
  branchId: string;
  registerId: string;
  openingId: string;
  /** Prompt 3C — moneda real de la empresa (`companies.functional_currency_code`), nunca 'USD' fijo. */
  currencyCode: string;
}

/**
 * Empresa → Sucursal → Caja → Apertura. No hay switcher global de empresa
 * activa todavía (`ui-kit/store/app.store.ts.switchCompanyContext` apunta
 * a un endpoint sin implementar) — el POS resuelve su propio contexto acá,
 * autocontenido (`POS_COMPONENTS.md`, `CashRegisterGate`).
 */
export function CashRegisterGate({
  children,
}: {
  children: (ctx: ContextoPos) => React.ReactNode;
}) {
  const [companyId, setCompanyId] = React.useState<string | null>(null);
  const [branchId, setBranchId] = React.useState<string | null>(null);
  const [registerId, setRegisterId] = React.useState<string | null>(null);
  const [nombreCajaNueva, setNombreCajaNueva] = React.useState('');
  const [montoApertura, setMontoApertura] = React.useState<number | undefined>(0);

  const empresas = useEmpresas();
  const sucursales = useSucursales(companyId);
  const cajas = useCajas(branchId);
  const apertura = useAperturaActiva(registerId);
  const crearCaja = useCrearCaja();
  const abrirCaja = useAbrirCaja();

  if (apertura.data?.data?.is_open && registerId && companyId && branchId) {
    const currencyCode =
      empresas.data?.data.find((e) => e.id === companyId)?.functional_currency_code ?? 'USD';
    return (
      <>
        {children({
          companyId,
          branchId,
          registerId,
          openingId: apertura.data.data.id,
          currencyCode,
        })}
      </>
    );
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Abrir caja</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pos-empresa">Empresa</Label>
            <select
              id="pos-empresa"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={companyId ?? ''}
              onChange={(e) => {
                setCompanyId(e.target.value || null);
                setBranchId(null);
                setRegisterId(null);
              }}
            >
              <option value="">Seleccioná una empresa...</option>
              {empresas.data?.data.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.legal_name}
                </option>
              ))}
            </select>
          </div>

          {companyId && (
            <div className="space-y-2">
              <Label htmlFor="pos-sucursal">Sucursal</Label>
              <select
                id="pos-sucursal"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={branchId ?? ''}
                onChange={(e) => {
                  setBranchId(e.target.value || null);
                  setRegisterId(null);
                }}
              >
                <option value="">Seleccioná una sucursal...</option>
                {sucursales.data?.data.map((sucursal) => (
                  <option key={sucursal.id} value={sucursal.id}>
                    {sucursal.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {branchId && (
            <div className="space-y-2">
              <Label htmlFor="pos-caja">Caja</Label>
              <select
                id="pos-caja"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={registerId ?? ''}
                onChange={(e) => setRegisterId(e.target.value || null)}
              >
                <option value="">Seleccioná una caja...</option>
                {cajas.data?.data
                  .filter((caja) => caja.register_type === 'pos')
                  .map((caja) => (
                    <option key={caja.id} value={caja.id}>
                      {caja.name}
                    </option>
                  ))}
              </select>
              <div className="flex gap-2">
                <Input
                  placeholder="Nombre de caja nueva"
                  value={nombreCajaNueva}
                  onChange={(e) => setNombreCajaNueva(e.target.value)}
                />
                <Button
                  variant="outline"
                  disabled={!nombreCajaNueva.trim() || crearCaja.isPending}
                  onClick={() => {
                    if (!companyId || !branchId) return;
                    crearCaja.mutate(
                      { companyId, branchId, name: nombreCajaNueva.trim() },
                      {
                        onSuccess: (response) => {
                          setRegisterId(response.data.id);
                          setNombreCajaNueva('');
                        },
                      },
                    );
                  }}
                >
                  Crear
                </Button>
              </div>
            </div>
          )}

          {registerId && apertura.isFetched && !apertura.data?.data?.is_open && (
            <div className="space-y-2 border-t pt-4">
              <Label htmlFor="pos-monto-apertura">Monto de apertura</Label>
              <MoneyInput
                id="pos-monto-apertura"
                value={montoApertura}
                onChange={setMontoApertura}
              />
              <Button
                className="w-full"
                disabled={montoApertura === undefined || abrirCaja.isPending}
                onClick={() => {
                  if (!registerId) return;
                  abrirCaja.mutate({ registerId, openingAmount: montoApertura ?? 0 });
                }}
              >
                {abrirCaja.isPending ? <Loader className="h-4 w-4" /> : 'Abrir caja'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
