import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn';

/** Spinner reutilizable. Ver `GlobalLoader` (ui-kit/components/layout) para el overlay de pantalla completa que lo usa durante navegación/mutaciones en curso. */
export function Loader({ className }: { className?: string }) {
  return <Loader2 className={cn('h-4 w-4 animate-spin', className)} />;
}
