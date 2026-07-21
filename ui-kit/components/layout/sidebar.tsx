import * as React from 'react';
import { ChevronDown, PanelLeftClose, PanelLeftOpen, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../primitives/tooltip';

/**
 * Estructura genérica de navegación — el contenido real (los 25 módulos de
 * `docs/menus/`) lo arma cada app consumidora filtrando por `usePermiso()`
 * (docs/frontend/FEATURES.md §5); este componente no conoce módulos de negocio.
 */
export interface NavItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  href?: string;
  children?: NavItem[];
}

export interface SidebarProps {
  items: NavItem[];
  collapsed: boolean;
  onToggleCollapsed: () => void;
  activeItemId?: string;
  expandedGroupIds: string[];
  onToggleGroup: (id: string) => void;
  renderLink?: (item: NavItem, children: React.ReactNode) => React.ReactNode;
  className?: string;
}

export function Sidebar({
  items,
  collapsed,
  onToggleCollapsed,
  activeItemId,
  expandedGroupIds,
  onToggleGroup,
  renderLink,
  className,
}: SidebarProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <aside
        className={cn(
          'flex h-full flex-col border-r bg-background transition-[width] duration-200',
          collapsed ? 'w-16' : 'w-64',
          className,
        )}
      >
        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {items.map((item) => (
            <SidebarNode
              key={item.id}
              item={item}
              depth={0}
              collapsed={collapsed}
              activeItemId={activeItemId}
              expandedGroupIds={expandedGroupIds}
              onToggleGroup={onToggleGroup}
              renderLink={renderLink}
            />
          ))}
        </nav>

        <button
          type="button"
          onClick={onToggleCollapsed}
          className="flex items-center gap-2 border-t p-3 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
          {!collapsed && 'Colapsar'}
        </button>
      </aside>
    </TooltipProvider>
  );
}

interface SidebarNodeProps {
  item: NavItem;
  depth: number;
  collapsed: boolean;
  activeItemId?: string;
  expandedGroupIds: string[];
  onToggleGroup: (id: string) => void;
  renderLink?: (item: NavItem, children: React.ReactNode) => React.ReactNode;
}

function SidebarNode({
  item,
  depth,
  collapsed,
  activeItemId,
  expandedGroupIds,
  onToggleGroup,
  renderLink,
}: SidebarNodeProps) {
  const Icon = item.icon;
  const isActive = item.id === activeItemId;
  const hasChildren = !!item.children?.length;
  const isExpanded = expandedGroupIds.includes(item.id);

  const rowClassName = cn(
    'flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors',
    isActive
      ? 'bg-accent font-medium text-accent-foreground'
      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
    collapsed && 'justify-center px-0',
    depth > 0 && !collapsed && 'pl-6',
  );

  const label = !collapsed && <span className="truncate">{item.label}</span>;

  const row = hasChildren ? (
    <button type="button" onClick={() => onToggleGroup(item.id)} className={rowClassName}>
      {Icon && <Icon className="h-4 w-4 shrink-0" />}
      {label}
      {!collapsed && (
        <ChevronDown
          className={cn(
            'ml-auto h-4 w-4 shrink-0 transition-transform',
            isExpanded && 'rotate-180',
          )}
        />
      )}
    </button>
  ) : (
    (() => {
      const content = (
        <span className={rowClassName}>
          {Icon && <Icon className="h-4 w-4 shrink-0" />}
          {label}
        </span>
      );
      return renderLink ? renderLink(item, content) : <a href={item.href}>{content}</a>;
    })()
  );

  const node =
    collapsed && !hasChildren ? (
      <Tooltip>
        <TooltipTrigger asChild>{row}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    ) : (
      row
    );

  return (
    <div>
      {node}
      {hasChildren && isExpanded && !collapsed && (
        <div className="mt-1 space-y-1">
          {item.children!.map((child) => (
            <SidebarNode
              key={child.id}
              item={child}
              depth={depth + 1}
              collapsed={collapsed}
              activeItemId={activeItemId}
              expandedGroupIds={expandedGroupIds}
              onToggleGroup={onToggleGroup}
              renderLink={renderLink}
            />
          ))}
        </div>
      )}
    </div>
  );
}
