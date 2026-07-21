import { Construction } from 'lucide-react';

export interface ComingSoonPageProps {
  moduleLabel: string;
}

/**
 * Placeholder honesto para un módulo sin backend todavía (FASE 03 Frontend
 * Enterprise, decisión explícita del usuario: "placeholder honesto" en vez
 * de datos mock/demo) — la pantalla existe, navega, tiene el layout real
 * del `AppShell`, pero no simula datos que no son reales.
 */
export function ComingSoonPage({ moduleLabel }: ComingSoonPageProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 py-24 text-center">
      <Construction className="h-10 w-10 text-muted-foreground" />
      <h1 className="text-xl font-semibold">{moduleLabel}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Este módulo todavía no tiene backend implementado — la pantalla está reservada en la
        navegación, sin datos simulados.
      </p>
    </div>
  );
}
