import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../lib/cn';

/**
 * Solo para pantallas de detalle/edición, nunca en listas de nivel 1 ni en el
 * Dashboard (docs/product/06_NAVIGATION.md §5) — decisión de dónde montarlo
 * es de cada feature, este componente solo renderiza los segmentos recibidos.
 */
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  renderLink?: (item: BreadcrumbItem, children: React.ReactNode) => React.ReactNode;
  className?: string;
}

export function Breadcrumb({ items, renderLink, className }: BreadcrumbProps) {
  return (
    <nav
      aria-label="breadcrumb"
      className={cn('flex items-center text-sm text-muted-foreground', className)}
    >
      <ol className="flex items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const content = (
            <span className={cn(isLast && 'font-medium text-foreground')}>{item.label}</span>
          );
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 && <ChevronRight className="h-3.5 w-3.5" />}
              {!isLast && item.href ? (
                renderLink ? (
                  renderLink(item, content)
                ) : (
                  <a href={item.href} className="hover:text-foreground hover:underline">
                    {content}
                  </a>
                )
              ) : (
                content
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
