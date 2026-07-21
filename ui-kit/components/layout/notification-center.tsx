import { Bell } from 'lucide-react';
import { Button } from '../primitives/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../primitives/dropdown-menu';
import { formatRelativeToNow } from '../../utils/format/date';

export interface NotificationItem {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
  readAt: Date | null;
}

export interface NotificationCenterProps {
  notifications: NotificationItem[];
  onOpenNotification: (id: string) => void;
}

/**
 * Campana de notificaciones del Topbar (docs/product/06_NAVIGATION.md §4) —
 * distinta del `Toaster` (ui-kit/components/layout/toaster.tsx): el
 * Toaster es feedback efímero de una acción propia ("Guardado"), esto es
 * la bandeja persistente de eventos (`core.notifications`, backend
 * pendiente — sin datos reales todavía en ningún módulo).
 */
export function NotificationCenter({ notifications, onOpenNotification }: NotificationCenterProps) {
  const unreadCount = notifications.filter((n) => n.readAt === null).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          <span className="sr-only">Notificaciones</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">Sin notificaciones.</p>
        ) : (
          <ul className="max-h-80 space-y-0.5 overflow-y-auto">
            {notifications.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => onOpenNotification(n.id)}
                  className="flex w-full flex-col gap-0.5 rounded-sm px-2 py-2 text-left text-sm hover:bg-accent"
                >
                  <span className="flex items-center gap-2 font-medium">
                    {n.readAt === null && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    )}
                    {n.title}
                  </span>
                  {n.description && (
                    <span className="text-xs text-muted-foreground">{n.description}</span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeToNow(n.createdAt)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
