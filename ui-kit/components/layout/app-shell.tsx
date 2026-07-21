import * as React from 'react';
import { cn } from '../../lib/cn';
import { Footer, type FooterProps } from './footer';
import { Sidebar, type SidebarProps } from './sidebar';
import { Topbar, type TopbarProps } from './topbar';

/**
 * Composición fija Sidebar + Topbar + área de contenido (+ Footer opcional)
 * — el mecanismo único de layout descrito en docs/product/06_NAVIGATION.md
 * §10 ("ningún módulo reimplementa su propio sidebar"). Cada feature solo
 * aporta el contenido de página vía `children`.
 */
export interface AppShellProps {
  sidebar: SidebarProps;
  topbar: Omit<TopbarProps, 'onOpenMobileMenu'>;
  footer?: FooterProps;
  children: React.ReactNode;
  className?: string;
}

export function AppShell({ sidebar, topbar, footer, children, className }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className={cn('flex h-screen w-full overflow-hidden', className)}>
      <div className="hidden md:block">
        <Sidebar {...sidebar} />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative z-50">
            <Sidebar {...sidebar} collapsed={false} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar {...topbar} onOpenMobileMenu={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
        {footer && <Footer {...footer} />}
      </div>
    </div>
  );
}
