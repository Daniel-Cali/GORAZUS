import * as React from 'react';
import { ScanLine } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Input } from './input';

export interface BarcodeScannerInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'onChange'
> {
  onScan: (code: string) => void;
  onManualChange?: (value: string) => void;
}

/**
 * Soporta lectoras USB/Bluetooth tipo "keyboard wedge" (la inmensa mayoría
 * de lectoras de código de barra de retail): el dispositivo escribe el
 * código como si fuera un teclado y termina con Enter — este componente
 * es un input siempre enfocable que dispara `onScan` en el Enter,
 * funciona igual para tipeo manual que para el lector físico, sin
 * heurística de timing (frágil, distinto por modelo de lector).
 * **No soporta escaneo por cámara** (`getUserMedia` + decodificación de
 * imagen) — eso es una feature aparte, no implementada (Fase 2).
 */
export const BarcodeScannerInput = React.forwardRef<HTMLInputElement, BarcodeScannerInputProps>(
  ({ onScan, onManualChange, className, ...props }, ref) => {
    const [value, setValue] = React.useState('');

    return (
      <div className="relative">
        <ScanLine className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={ref}
          className={cn('pl-9', className)}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            onManualChange?.(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && value.trim().length > 0) {
              e.preventDefault();
              onScan(value.trim());
              setValue('');
            }
          }}
          placeholder="Escaneá o escribí el código..."
          autoComplete="off"
          {...props}
        />
      </div>
    );
  },
);
BarcodeScannerInput.displayName = 'BarcodeScannerInput';
