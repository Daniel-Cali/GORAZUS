import type * as React from 'react';
import { cn } from '../../lib/cn';

/**
 * Placeholder de carga tipo "hueso" — reemplaza al spinner genérico donde la
 * forma final del contenido ya se conoce (filas de tabla, tarjetas), para que
 * la pantalla no "salte" cuando los datos reales llegan (FRONTEND_VISUAL_AUDIT.md,
 * auditoría de UI FASE 06: el pedido explícito de "mejorar la experiencia de
 * carga con skeleton loaders" no tenía ningún componente base todavía).
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />;
}
