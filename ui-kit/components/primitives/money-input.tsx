import * as React from 'react';
import { cn } from '../../lib/cn';
import { Input } from './input';

export interface MoneyInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type'
> {
  /** Valor numérico crudo — nunca string decimal acá, esto es solo captura de UI; la conversión a `Money.amount` (string) ocurre al enviar el formulario. */
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  currencySymbol?: string;
}

/**
 * Input de dinero — separado de `Input` genérico porque valida "solo
 * dígitos + un separador decimal" mientras se escribe (nunca deja que el
 * usuario tipee texto en un campo de monto) y muestra el símbolo de
 * moneda como prefijo visual fijo, no editable.
 */
export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ value, onChange, currencySymbol = '$', className, ...props }, ref) => {
    const [raw, setRaw] = React.useState(value !== undefined ? String(value) : '');

    React.useEffect(() => {
      setRaw(value !== undefined ? String(value) : '');
    }, [value]);

    return (
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          {currencySymbol}
        </span>
        <Input
          ref={ref}
          inputMode="decimal"
          className={cn('pl-7 text-right tabular-nums', className)}
          value={raw}
          onChange={(e) => {
            const next = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.');
            if (next === '' || /^\d*\.?\d*$/.test(next)) {
              setRaw(next);
              onChange(next === '' ? undefined : Number(next));
            }
          }}
          {...props}
        />
      </div>
    );
  },
);
MoneyInput.displayName = 'MoneyInput';
