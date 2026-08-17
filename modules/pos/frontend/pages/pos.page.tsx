import * as React from 'react';
import {
  ApiClientError,
  BarcodeScannerInput,
  Button,
  Card,
  CardContent,
  Drawer,
  DrawerContent,
  DrawerTitle,
  Skeleton,
  useToast,
} from '@gorazus/ui-kit';
import { CashRegisterGate, type ContextoPos } from '../components/cash-register-gate';
import { PaymentDialog, type PagoLinea } from '../components/payment-dialog';
import { PosHeader } from '../components/pos-header';
import { CategoryChips } from '../components/category-chips';
import { ProductCard } from '../components/product-card';
import { CartPanel, type CartPanelAction, type LineaCarritoVista } from '../components/cart-panel';
import { ChevronLeftIcon, SearchOffIcon } from '../components/pos-icons';
import {
  useAlmacenes,
  useBuscarProductos,
  useConfirmarVenta,
  useSuspenderVenta,
  useVentasSuspendidas,
  useVentaSuspendida,
  useCompletarVentaSuspendida,
  useCancelarVentaSuspendida,
  useFormasPago,
  useSucursales,
  useCajas,
  type ProductoPosRecord,
} from '../hooks/use-pos';

interface LineaCarrito {
  productId: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discountPercentage: number;
}

function subtotalLinea(linea: LineaCarrito): number {
  return linea.quantity * linea.unitPrice * (1 - linea.discountPercentage / 100);
}

/** Mismo formato que `PaymentDialog` — moneda real de la empresa, nunca '$' fijo (Prompt 3C). */
function formatearMonto(amount: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat('es', { style: 'currency', currency: currencyCode }).format(
      amount,
    );
  } catch {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
}

type CartConfig = {
  lineas: LineaCarritoVista[];
  total: number;
  totalLabel?: string;
  emptyMessage: string;
  notice?: string;
  primaryAction: CartPanelAction & { pending?: boolean };
  secondaryActions?: CartPanelAction[];
};

/**
 * Pantalla principal del POS (`POS_UX.md §3`, rediseño Fase 1 — prioriza
 * operación: catálogo dominante a la izquierda, carrito siempre visible a
 * la derecha). Sin `AppShell`, ocupa toda la ventana. `CashRegisterGate`
 * resuelve empresa/sucursal/caja/apertura antes de mostrar esto.
 */
function PosScreen({ ctx }: { ctx: ContextoPos }) {
  const { toast } = useToast();
  const almacenes = useAlmacenes(ctx.branchId);
  const warehouseId = almacenes.data?.data[0]?.id ?? null;
  // Nombres reales para el header compacto (item 1) — mismos hooks que ya
  // usa `CashRegisterGate` para resolver el mismo contexto, no se inventan.
  const sucursales = useSucursales(ctx.companyId);
  const cajas = useCajas(ctx.branchId);
  const sucursalNombre = sucursales.data?.data.find((s) => s.id === ctx.branchId)?.name;
  const cajaNombre = cajas.data?.data.find((c) => c.id === ctx.registerId)?.name;

  const [query, setQuery] = React.useState('');
  const [resultados, setResultados] = React.useState<ProductoPosRecord[]>([]);
  const [carrito, setCarrito] = React.useState<LineaCarrito[]>([]);
  const [pagoAbierto, setPagoAbierto] = React.useState(false);
  const [ultimoComprobante, setUltimoComprobante] = React.useState<string | null>(null);
  const [carritoMovilAbierto, setCarritoMovilAbierto] = React.useState(false);
  // P0-1: una key por intento lógico de checkout — se mantiene igual
  // durante los reintentos de ESE checkout (doble clic, timeout de red) y
  // solo cambia al empezar una venta nueva (`nuevaVenta`). `crypto.randomUUID()`
  // nativo del navegador, mismo formato UUID que ya usa el backend
  // (`generateUuid()`, `node:crypto`) — no se inventa un formato propio.
  const [idempotencyKey, setIdempotencyKey] = React.useState(() => crypto.randomUUID());

  // Prompt 3B — "Nueva venta" / "Ventas suspendidas" como dos vistas de la
  // misma pantalla (item 12/13: rápida para el cajero, sin dashboard).
  const [vista, setVista] = React.useState<'venta' | 'suspendidas'>('venta');
  const [recuperadaId, setRecuperadaId] = React.useState<string | null>(null);
  const [idempotencyKeyCompletar, setIdempotencyKeyCompletar] = React.useState(() =>
    crypto.randomUUID(),
  );
  const [pagoCompletarAbierto, setPagoCompletarAbierto] = React.useState(false);

  const buscar = useBuscarProductos();
  const confirmarVenta = useConfirmarVenta();
  const suspenderVenta = useSuspenderVenta();
  const formasPago = useFormasPago();
  const suspendidas = useVentasSuspendidas(vista === 'suspendidas' ? ctx.branchId : null);
  const recuperada = useVentaSuspendida(recuperadaId);
  const completarSuspendida = useCompletarVentaSuspendida();
  const cancelarSuspendida = useCancelarVentaSuspendida();

  const searchRef = React.useRef<HTMLInputElement>(null);

  const total = carrito.reduce((acc, l) => acc + subtotalLinea(l), 0);
  const totalRecuperada = Number(recuperada.data?.data.total_amount ?? 0);

  // Catálogo inicial (item 2, "área de catálogo dominante") — reutiliza el
  // mismo endpoint real de búsqueda con query vacía (`ProductoLookupRepositoryPrisma.buscar`
  // matchea todo con `contains: ''`, hasta 20 productos), no un endpoint
  // nuevo ni datos inventados. Un solo mount, no una búsqueda reactiva.
  React.useEffect(() => {
    buscar.mutate('', { onSuccess: (response) => setResultados(response.data) });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- carga inicial única al montar; `buscar.mutate` es estable (useMutation)
  }, []);

  const agregarProducto = React.useCallback((producto: ProductoPosRecord) => {
    setCarrito((prev) => {
      const existente = prev.find((l) => l.productId === producto.id);
      if (existente) {
        return prev.map((l) =>
          l.productId === producto.id ? { ...l, quantity: l.quantity + 1 } : l,
        );
      }
      return [
        ...prev,
        {
          productId: producto.id,
          sku: producto.sku,
          quantity: 1,
          unitPrice: producto.listPrice ?? 0,
          discountPercentage: 0,
        },
      ];
    });
  }, []);

  const buscarYAgregar = React.useCallback(
    (codigo: string) => {
      buscar.mutate(codigo, {
        onSuccess: (response) => {
          setResultados(response.data);
          const [unico] = response.data;
          if (response.data.length === 1 && unico) {
            agregarProducto(unico);
          } else if (response.data.length === 0) {
            toast({ title: 'Sin resultados', description: `No se encontró "${codigo}"` });
          }
        },
      });
    },
    [buscar, agregarProducto, toast],
  );

  const nuevaVenta = React.useCallback(() => {
    setCarrito([]);
    setQuery('');
    setVista('venta');
    setRecuperadaId(null);
    setCarritoMovilAbierto(false);
    // Venta nueva = intento lógico nuevo → key nueva (P0-1).
    setIdempotencyKey(crypto.randomUUID());
  }, []);

  const confirmar = (pagos: PagoLinea[]) => {
    if (!warehouseId) {
      toast({ title: 'Sin almacén', description: 'La sucursal no tiene un almacén configurado.' });
      return;
    }
    confirmarVenta.mutate(
      {
        idempotencyKey,
        companyId: ctx.companyId,
        branchId: ctx.branchId,
        registerId: ctx.registerId,
        currencyCode: ctx.currencyCode,
        lines: carrito.map((l) => ({
          productId: l.productId,
          warehouseId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          discountPercentage: l.discountPercentage,
        })),
        payments: pagos,
      },
      {
        onSuccess: (response) => {
          setUltimoComprobante(response.data.factura.document_number);
          setPagoAbierto(false);
          nuevaVenta();
          toast({
            title: 'Venta confirmada',
            description: `Comprobante ${response.data.factura.document_number} — cambio ${formatearMonto(response.data.cambio, ctx.currencyCode)}`,
          });
        },
        onError: (error: unknown) => {
          // P0-1: la key de este intento ya quedó "usada" para otra venta
          // (ej. el carrito cambió sin pasar por "Nueva venta") — no tiene
          // sentido reintentar con la misma key, así que se rota acá.
          if (error instanceof ApiClientError && error.code === 'IDEMPOTENCY_KEY_REUSADA') {
            setIdempotencyKey(crypto.randomUUID());
            toast({
              title: 'Esta operación ya fue utilizada para otra venta',
              description: 'Inicie una venta nueva e intente cobrar de nuevo.',
            });
            return;
          }
          const message = error instanceof Error ? error.message : 'Error al confirmar la venta';
          toast({ title: 'No se pudo cobrar', description: message });
        },
      },
    );
  };

  const suspender = React.useCallback(() => {
    if (!warehouseId || carrito.length === 0) return;
    suspenderVenta.mutate(
      {
        companyId: ctx.companyId,
        branchId: ctx.branchId,
        registerId: ctx.registerId,
        currencyCode: ctx.currencyCode,
        lines: carrito.map((l) => ({
          productId: l.productId,
          warehouseId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          discountPercentage: l.discountPercentage,
        })),
      },
      {
        onSuccess: () => {
          toast({
            title: 'Venta suspendida',
            description: 'El carrito se guardó para retomarlo después.',
          });
          nuevaVenta();
        },
      },
    );
  }, [warehouseId, carrito, ctx, suspenderVenta, toast, nuevaVenta]);

  const recuperar = React.useCallback((id: string) => {
    setRecuperadaId(id);
    setIdempotencyKeyCompletar(crypto.randomUUID());
  }, []);

  const volverASuspendidas = React.useCallback(() => {
    setRecuperadaId(null);
    setCarritoMovilAbierto(false);
  }, []);

  const completar = (pagos: PagoLinea[]) => {
    if (!recuperadaId) return;
    completarSuspendida.mutate(
      {
        invoiceId: recuperadaId,
        payload: {
          idempotencyKey: idempotencyKeyCompletar,
          registerId: ctx.registerId,
          payments: pagos,
        },
      },
      {
        onSuccess: (response) => {
          setUltimoComprobante(response.data.factura.document_number);
          setPagoCompletarAbierto(false);
          toast({
            title: 'Venta suspendida cobrada',
            description: `Comprobante ${response.data.factura.document_number} — cambio ${formatearMonto(response.data.cambio, ctx.currencyCode)}`,
          });
          nuevaVenta();
        },
        onError: (error: unknown) => {
          if (error instanceof ApiClientError && error.code === 'IDEMPOTENCY_KEY_REUSADA') {
            setIdempotencyKeyCompletar(crypto.randomUUID());
            toast({
              title: 'Esta operación ya fue utilizada',
              description: 'Vuelva a intentar cobrar esta venta suspendida.',
            });
            return;
          }
          const message =
            error instanceof Error ? error.message : 'Error al cobrar la venta suspendida';
          toast({ title: 'No se pudo cobrar', description: message });
        },
      },
    );
  };

  const cancelarRecuperada = React.useCallback(() => {
    if (!recuperadaId) return;
    cancelarSuspendida.mutate(recuperadaId, {
      onSuccess: () => {
        toast({ title: 'Venta suspendida cancelada' });
        setRecuperadaId(null);
      },
      onError: (error: unknown) => {
        const message = error instanceof Error ? error.message : 'Error al cancelar';
        toast({ title: 'No se pudo cancelar', description: message });
      },
    });
  }, [recuperadaId, cancelarSuspendida, toast]);

  // Atajos de teclado — `POS_SHORTCUTS.md`.
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const enCampoDeTexto = (e.target as HTMLElement)?.tagName === 'INPUT';
      if (e.key === 'F1') {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === 'F4' || e.key === 'F5') {
        if (vista === 'venta') {
          if (carrito.length === 0) return;
          e.preventDefault();
          setPagoAbierto(true);
        } else if (recuperadaId) {
          e.preventDefault();
          setPagoCompletarAbierto(true);
        }
      } else if (e.key === 'F6') {
        e.preventDefault();
        suspender();
      } else if (e.key === 'F7') {
        e.preventDefault();
        nuevaVenta();
      } else if (e.key === 'F8') {
        e.preventDefault();
        setVista((v) => (v === 'venta' ? 'suspendidas' : 'venta'));
      } else if (e.key === 'Escape' && !enCampoDeTexto) {
        setPagoAbierto(false);
        setPagoCompletarAbierto(false);
        setCarritoMovilAbierto(false);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [carrito.length, suspender, nuevaVenta, vista, recuperadaId]);

  // Configuración del carrito para el panel/drawer compartido — null en la
  // vista "suspendidas" (listado), que no tiene concepto de carrito.
  let cartConfig: CartConfig | null = null;
  if (vista === 'venta') {
    cartConfig = {
      lineas: carrito.map((linea) => ({
        id: linea.productId,
        label: linea.sku,
        quantity: linea.quantity,
        unitPrice: linea.unitPrice,
        subtotal: subtotalLinea(linea),
        onDecrementar: () =>
          setCarrito((prev) =>
            prev.map((l) =>
              l.productId === linea.productId ? { ...l, quantity: Math.max(1, l.quantity - 1) } : l,
            ),
          ),
        onIncrementar: () =>
          setCarrito((prev) =>
            prev.map((l) =>
              l.productId === linea.productId ? { ...l, quantity: l.quantity + 1 } : l,
            ),
          ),
        onEliminar: () => setCarrito((prev) => prev.filter((l) => l.productId !== linea.productId)),
      })),
      total,
      emptyMessage: 'Carrito vacío — buscá un producto (F1).',
      primaryAction: {
        label: 'Cobrar (F5)',
        onClick: () => setPagoAbierto(true),
        disabled: carrito.length === 0,
      },
      secondaryActions: [
        { label: 'Suspender (F6)', onClick: suspender, disabled: carrito.length === 0 },
        { label: 'Nueva (F7)', onClick: nuevaVenta },
      ],
    };
  } else if (vista === 'suspendidas' && recuperadaId) {
    cartConfig = {
      lineas: (recuperada.data?.data.invoice_lines ?? []).map((linea) => ({
        id: linea.id,
        label: linea.product_id.slice(0, 8).toUpperCase(),
        quantity: Number(linea.quantity),
        unitPrice: Number(linea.unit_price),
        subtotal: Number(linea.line_total),
      })),
      total: totalRecuperada,
      emptyMessage: 'Sin líneas.',
      primaryAction: { label: 'Cobrar (F5)', onClick: () => setPagoCompletarAbierto(true) },
      secondaryActions: [
        {
          label: 'Cancelar venta suspendida',
          onClick: cancelarRecuperada,
          disabled: cancelarSuspendida.isPending,
        },
      ],
    };
  }

  return (
    <div className="flex h-screen w-full flex-col bg-muted/20">
      <PosHeader
        sucursalNombre={sucursalNombre}
        cajaNombre={cajaNombre}
        ultimoComprobante={ultimoComprobante}
        vista={vista}
        onNuevaVenta={nuevaVenta}
        onVerSuspendidas={() => setVista('suspendidas')}
      />

      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className={`overflow-y-auto p-3 sm:p-4 ${cartConfig ? 'pb-24 lg:pb-4' : ''}`}>
          {vista === 'venta' && (
            <div className="flex flex-col gap-3">
              <BarcodeScannerInput
                ref={searchRef}
                onScan={buscarYAgregar}
                onManualChange={setQuery}
                value={query}
              />
              {/* Item 3 — preparado para datos reales, oculto mientras no exista una API de categorías con alcance POS (ver `category-chips.tsx`). */}
              <CategoryChips categorias={undefined} categoriaActivaId={null} onSelect={() => {}} />

              {buscar.isPending && resultados.length === 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-square rounded-lg" />
                  ))}
                </div>
              )}

              {!buscar.isPending && resultados.length === 0 && (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
                  <SearchOffIcon className="h-8 w-8" />
                  <p className="text-sm">No se encontraron productos.</p>
                </div>
              )}

              {resultados.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
                  {resultados.map((producto) => (
                    <ProductCard
                      key={producto.id}
                      producto={producto}
                      currencyCode={ctx.currencyCode}
                      onSelect={agregarProducto}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {vista === 'suspendidas' && !recuperadaId && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
                Ventas suspendidas
              </h2>
              {suspendidas.isLoading && <p className="text-sm text-muted-foreground">Cargando…</p>}
              {!suspendidas.isLoading && suspendidas.data?.data.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No hay ventas suspendidas en esta sucursal.
                </p>
              )}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {suspendidas.data?.data.map((f) => (
                  <Card
                    key={f.id}
                    className="cursor-pointer transition hover:border-primary"
                    onClick={() => recuperar(f.id)}
                  >
                    <CardContent className="space-y-1 p-3">
                      <p className="font-medium">{f.document_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {f.issued_at ? new Date(f.issued_at).toLocaleString() : ''}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {f.invoice_lines?.length ?? 0} línea(s)
                      </p>
                      <p className="text-right font-semibold tabular-nums">
                        {formatearMonto(Number(f.total_amount), ctx.currencyCode)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {vista === 'suspendidas' && recuperadaId && (
            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                size="sm"
                className="w-fit gap-1.5"
                onClick={volverASuspendidas}
              >
                <ChevronLeftIcon className="h-4 w-4" /> Volver a suspendidas
              </Button>
              {recuperada.isLoading && <p className="text-sm text-muted-foreground">Cargando…</p>}
              {recuperada.data && (
                <p className="text-sm text-muted-foreground">
                  {recuperada.data.data.document_number} — las líneas de esta venta no se pueden
                  modificar acá; para cambiarlas, cancele y empiece una venta nueva.
                </p>
              )}
            </div>
          )}
        </div>

        {cartConfig && (
          <aside className="hidden border-l bg-background lg:flex lg:flex-col">
            <CartPanel {...cartConfig} currencyCode={ctx.currencyCode} />
          </aside>
        )}
      </div>

      {/* Móvil (item 6) — el carrito no vive en un panel fijo (no entra),
          se accede desde una barra inferior siempre visible sin perder el
          catálogo ni romper el flujo de cobro. */}
      {cartConfig && (
        <>
          <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background p-3 lg:hidden">
            <Button
              className="flex w-full items-center justify-between"
              size="lg"
              onClick={() => setCarritoMovilAbierto(true)}
            >
              <span>
                {cartConfig.lineas.length} línea{cartConfig.lineas.length === 1 ? '' : 's'}
              </span>
              <span className="tabular-nums">
                {formatearMonto(cartConfig.total, ctx.currencyCode)} · Ver carrito
              </span>
            </Button>
          </div>
          <Drawer open={carritoMovilAbierto} onOpenChange={setCarritoMovilAbierto}>
            <DrawerContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-sm">
              <DrawerTitle className="sr-only">Carrito</DrawerTitle>
              <CartPanel {...cartConfig} currencyCode={ctx.currencyCode} />
            </DrawerContent>
          </Drawer>
        </>
      )}

      <PaymentDialog
        open={pagoAbierto}
        onOpenChange={setPagoAbierto}
        total={total}
        currencyCode={ctx.currencyCode}
        formasPago={formasPago.data?.data}
        onConfirm={confirmar}
        confirmando={confirmarVenta.isPending}
      />
      <PaymentDialog
        open={pagoCompletarAbierto}
        onOpenChange={setPagoCompletarAbierto}
        total={totalRecuperada}
        currencyCode={ctx.currencyCode}
        formasPago={formasPago.data?.data}
        onConfirm={completar}
        confirmando={completarSuspendida.isPending}
      />
    </div>
  );
}

export function PosPage() {
  return <CashRegisterGate>{(ctx) => <PosScreen ctx={ctx} />}</CashRegisterGate>;
}
