import * as React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { NavItem, SidebarProps } from '@gorazus/ui-kit';
import { MODULE_REGISTRY } from './module-registry';

/**
 * Arma el árbol `NavItem[]` que consume el `Sidebar` genérico de `ui-kit` a
 * partir de `module-registry.ts` — grupo de sitemap (`docs/product/
 * 05_INFORMATION_ARCHITECTURE.md §3`) como nodo padre expandible, ítems sin
 * grupo como hojas de nivel 1 (Dashboard, Clientes, Documentos, Ayuda).
 *
 * Filtrado por permiso (`usePermiso()`, FEATURES.md §4) queda pendiente:
 * el módulo `seguridad`/resolución de permisos todavía no existe en el
 * backend — por ahora se listan las 25 features sin ocultar ninguna.
 */
function buildNavTree(): NavItem[] {
  const groups = new Map<string, NavItem>();
  const roots: NavItem[] = [];

  for (const entry of MODULE_REGISTRY) {
    const leaf: NavItem = { id: entry.id, label: entry.label, icon: entry.icon, href: entry.path };

    if (!entry.group) {
      roots.push(leaf);
      continue;
    }

    let groupNode = groups.get(entry.group);
    if (!groupNode) {
      groupNode = { id: `group:${entry.group}`, label: entry.group, children: [] };
      groups.set(entry.group, groupNode);
      roots.push(groupNode);
    }
    groupNode.children!.push(leaf);
  }

  return roots;
}

const NAV_TREE = buildNavTree();

/** El resto de `SidebarProps` (`collapsed`, `onToggleCollapsed`) lo aporta el `uiSlice` de Zustand — ver `app-shell.tsx`. */
export function useAppSidebarProps(): Omit<SidebarProps, 'collapsed' | 'onToggleCollapsed'> {
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedGroupIds, setExpandedGroupIds] = React.useState<string[]>([]);

  const activeItem = MODULE_REGISTRY.find((entry) => location.pathname.startsWith(entry.path));
  const activeGroup = activeItem?.group;

  React.useEffect(() => {
    if (activeGroup) {
      const groupId = `group:${activeGroup}`;
      setExpandedGroupIds((current) =>
        current.includes(groupId) ? current : [...current, groupId],
      );
    }
  }, [activeGroup]);

  return {
    items: NAV_TREE,
    activeItemId: activeItem?.id,
    expandedGroupIds,
    onToggleGroup: (id) =>
      setExpandedGroupIds((current) =>
        current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
      ),
    renderLink: (item, children) => (
      <a
        href={item.href}
        onClick={(event) => {
          event.preventDefault();
          if (item.href) navigate(item.href);
        }}
      >
        {children}
      </a>
    ),
  };
}
