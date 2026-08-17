import * as React from 'react';
import { Input, Label } from '@gorazus/ui-kit';
import { useClientesBusqueda } from '../hooks/use-clientes-busqueda';

export interface CustomerSelectorProps {
  /** Nombre del cliente seleccionado (o vacío) — el id vive en el estado del formulario padre, este componente es de solo texto+búsqueda. */
  label: string;
  onChange: (customerId: string, legalName: string) => void;
  disabled?: boolean;
}

/** Buscador de clientes reutilizado por el formulario de Cotización (`GET /clientes?query=`, ya soportado por el backend real). */
export function CustomerSelector({ label, onChange, disabled }: CustomerSelectorProps) {
  const [texto, setTexto] = React.useState(label);
  const [abierto, setAbierto] = React.useState(false);
  const clientes = useClientesBusqueda(texto.length >= 2 ? texto : '');

  React.useEffect(() => {
    setTexto(label);
  }, [label]);

  return (
    <div className="relative space-y-1">
      <Label htmlFor="cotizacion-cliente">Cliente</Label>
      <Input
        id="cotizacion-cliente"
        value={texto}
        disabled={disabled}
        placeholder="Buscar por nombre o RNC/cédula..."
        autoComplete="off"
        onChange={(e) => {
          setTexto(e.target.value);
          setAbierto(true);
        }}
        onFocus={() => setAbierto(true)}
        onBlur={() => setTimeout(() => setAbierto(false), 150)}
      />
      {abierto && texto.length >= 2 && (
        <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-border bg-popover shadow-md">
          {clientes.isLoading && <p className="p-2 text-xs text-muted-foreground">Buscando…</p>}
          {!clientes.isLoading && (clientes.data?.data.length ?? 0) === 0 && (
            <p className="p-2 text-xs text-muted-foreground">Sin resultados.</p>
          )}
          {clientes.data?.data.map((c) => (
            <button
              key={c.id}
              type="button"
              className="block w-full px-3 py-2 text-left text-sm hover:bg-accent"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setTexto(c.legal_name);
                setAbierto(false);
                onChange(c.id, c.legal_name);
              }}
            >
              <span className="font-medium">{c.legal_name}</span>
              <span className="ml-2 text-xs text-muted-foreground">{c.tax_id}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
