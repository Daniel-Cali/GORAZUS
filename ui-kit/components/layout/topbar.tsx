import * as React from 'react';
import { Menu } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Button } from '../primitives/button';

export interface TopbarProps {
  /** Título/breadcrumb/selector de Empresa-Sucursal — cada consumidor decide qué va acá. */
  left?: React.ReactNode;
  /** Búsqueda global, notificaciones, menú de usuario — ver docs/product/06_NAVIGATION.md §4. */
  right?: React.ReactNode;
  /** Solo en mobile/drawer — abre el Sidebar como drawer (docs/product/06_NAVIGATION.md §3). */
  onOpenMobileMenu?: () => void;
  className?: string;
}

export function Topbar({ left, right, onOpenMobileMenu, className }: TopbarProps) {
  return (
    <header className={cn('flex h-14 items-center gap-4 border-b bg-background px-4', className)}>
      {onOpenMobileMenu && (
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onOpenMobileMenu}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir menú</span>
        </Button>
      )}
      <div className="flex min-w-0 flex-1 items-center">{left}</div>
      <div className="flex items-center gap-2">{right}</div>
    </header>
  );
}
