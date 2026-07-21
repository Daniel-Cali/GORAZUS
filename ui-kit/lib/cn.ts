import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Utilidad estándar de shadcn/ui — combina clsx (condicionales) + tailwind-merge (resuelve conflictos de utilidades Tailwind). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
