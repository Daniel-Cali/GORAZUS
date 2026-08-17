import { PackageSearch, Fingerprint } from 'lucide-react';

/**
 * Identidad visual de lote vs. serie — deliberadamente distinta (ícono +
 * tinte), regla de la misión ("the serial timeline must be visually
 * distinct from the lot timeline"). Lote = agrupa cantidad (ícono de
 * paquete); Serie = unidad física única (ícono de huella/identidad).
 */
export function LotBadge({ lotNumber, className }: { lotNumber: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border border-border bg-muted/50 px-1.5 py-0.5 font-mono text-xs text-foreground ${className ?? ''}`}
    >
      <PackageSearch aria-hidden className="h-3 w-3 text-muted-foreground" />
      {lotNumber}
    </span>
  );
}

export function SerialBadge({
  serialNumber,
  className,
}: {
  serialNumber: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border border-primary/30 bg-primary/5 px-1.5 py-0.5 font-mono text-xs text-foreground ${className ?? ''}`}
    >
      <Fingerprint aria-hidden className="h-3 w-3 text-primary" />
      {serialNumber}
    </span>
  );
}
