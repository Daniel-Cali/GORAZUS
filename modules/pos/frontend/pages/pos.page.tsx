import * as React from 'react';
import { BarcodeScannerInput, Button, Card, CardContent, useToast } from '@gorazus/ui-kit';
import { CashRegisterGate, type ContextoPos } from '../components/cash-register-gate';
import { PaymentDialog, type PagoLinea } from '../components/payment-dialog';
import {
  useAlmacenes,
  useBuscarProductos,
  useConfirmarVenta,
  useSuspenderVenta,
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

/**
 * Pantalla principal del POS (`POS_UX.md §3`) — sin `AppShell`, ocupa
 * toda la ventana. `CashRegisterGate` resuelve empresa/sucursal/caja/
 * apertura antes de mostrar esto.
 */
function PosScreen({ ctx }: { ctx: ContextoPos }) {
  const { toast } = useToast();
  const almacenes = useAlmacenes(ctx.branchId);
  const warehouseId = almacenes.data?.data[0]?.id ?? null;

  const [query, setQuery] = React.useState('');
  const [resultados, setResultados] = React.useState<ProductoPosRecord[]>([]);
  const [carrito, setCarrito] = React.useState<LineaCarrito[]>([]);
  const [pagoAbierto, setPagoAbierto] = React.useState(false);
  const [ultimoComprobante, setUltimoComprobante] = React.useState<string | null>(null);

  const buscar = useBuscarProductos();
  const confirmarVenta = useConfirmarVenta();
  const suspenderVenta = useSuspenderVenta();

  const searchRef = React.useRef<HTMLInputElement>(null);

  const total = carrito.reduce((acc, l) => acc + subtotalLinea(l), 0);

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
            setResultados([]);
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
    setResultados([]);
    setQuery('');
  }, []);

  const confirmar = (pagos: PagoLinea[]) => {
    if (!warehouseId) {
      toast({ title: 'Sin almacén', description: 'La sucursal no tiene un almacén configurado.' });
      return;
    }
    confirmarVenta.mutate(
      {
        companyId: ctx.companyId,
        branchId: ctx.branchId,
        registerId: ctx.registerId,
        currencyCode: 'USD',
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
            description: `Comprobante ${response.data.factura.document_number} — cambio $${response.data.cambio.toFixed(2)}`,
          });
        },
        onError: (error: unknown) => {
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
        currencyCode: 'USD',
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

  // Atajos de teclado — `POS_SHORTCUTS.md`.
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const enCampoDeTexto = (e.target as HTMLElement)?.tagName === 'INPUT';
      if (e.key === 'F1') {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === 'F4' || e.key === 'F5') {
        if (carrito.length === 0) return;
        e.preventDefault();
        setPagoAbierto(true);
      } else if (e.key === 'F6') {
        e.preventDefault();
        suspender();
      } else if (e.key === 'F7') {
        e.preventDefault();
        nuevaVenta();
      } else if (e.key === 'Escape' && !enCampoDeTexto) {
        setPagoAbierto(false);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [carrito.length, suspender, nuevaVenta]);

  return (
    <div className="flex h-screen w-full flex-col bg-muted/20">
      <header className="flex items-center justify-between border-b bg-background px-4 py-2">
        <h1 className="text-lg font-semibold">GORAZUS POS</h1>
        {ultimoComprobante && (
          <span className="text-sm text-muted-foreground">Último: {ultimoComprobante}</span>
        )}
      </header>

      <div className="grid flex-1 grid-cols-[minmax(0,1fr)_360px] overflow-hidden">
        <div className="flex flex-col gap-3 overflow-y-auto p-4">
          <BarcodeScannerInput
            ref={searchRef}
            onScan={buscarYAgregar}
            onManualChange={setQuery}
            value={query}
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {resultados.map((producto) => (
              <Card
                key={producto.id}
                className="cursor-pointer transition hover:border-primary"
                onClick={() => {
                  agregarProducto(producto);
                  setResultados([]);
                  setQuery('');
                }}
              >
                <CardContent className="p-3">
                  <p className="font-medium">{producto.sku}</p>
                  <p className="text-sm text-muted-foreground">
                    {producto.listPrice !== null
                      ? `$${producto.listPrice.toFixed(2)}`
                      : 'Sin precio'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex flex-col border-l bg-background">
          <div className="flex-1 divide-y overflow-y-auto">
            {carrito.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground">
                Carrito vacío — buscá un producto (F1).
              </p>
            )}
            {carrito.map((linea) => (
              <div key={linea.productId} className="flex items-center justify-between gap-2 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{linea.sku}</p>
                  <p className="text-sm text-muted-foreground">
                    {linea.quantity} × ${linea.unitPrice.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCarrito((prev) =>
                        prev.map((l) =>
                          l.productId === linea.productId
                            ? { ...l, quantity: Math.max(1, l.quantity - 1) }
                            : l,
                        ),
                      )
                    }
                  >
                    −
                  </Button>
                  <span className="w-6 text-center tabular-nums">{linea.quantity}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCarrito((prev) =>
                        prev.map((l) =>
                          l.productId === linea.productId ? { ...l, quantity: l.quantity + 1 } : l,
                        ),
                      )
                    }
                  >
                    +
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setCarrito((prev) => prev.filter((l) => l.productId !== linea.productId))
                    }
                  >
                    ✕
                  </Button>
                </div>
                <span className="w-16 text-right tabular-nums">
                  ${subtotalLinea(linea).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-3 border-t p-4">
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span className="tabular-nums">${total.toFixed(2)}</span>
            </div>
            <Button
              className="w-full"
              size="lg"
              disabled={carrito.length === 0}
              onClick={() => setPagoAbierto(true)}
            >
              Cobrar (F5)
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={suspender}
                disabled={carrito.length === 0}
              >
                Suspender (F6)
              </Button>
              <Button variant="outline" className="flex-1" onClick={nuevaVenta}>
                Nueva (F7)
              </Button>
            </div>
          </div>
        </div>
      </div>

      <PaymentDialog
        open={pagoAbierto}
        onOpenChange={setPagoAbierto}
        total={total}
        onConfirm={confirmar}
        confirmando={confirmarVenta.isPending}
      />
    </div>
  );
}

export function PosPage() {
  return <CashRegisterGate>{(ctx) => <PosScreen ctx={ctx} />}</CashRegisterGate>;
}
