import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  ShoppingCart,
  Store,
  Handshake,
  Truck,
  Boxes,
  Factory,
  Users,
  Cog,
  Wrench,
  Wallet,
  Landmark,
  BookText,
  Banknote,
  Contact,
  Receipt,
  Building2,
  KanbanSquare,
  FileBarChart,
  LineChart,
  FolderArchive,
  Settings,
  Shield,
  ServerCog,
  CircleHelp,
} from 'lucide-react';

/**
 * Único archivo que enumera las 25 features navegables (nombre, ícono, ruta
 * base, permiso `.ver`, grupo de sitemap) — FEATURES.md §5. `router.tsx`
 * importa cada `*.routes.tsx` por separado; este registro solo alimenta el
 * sidebar (`app-shell/sidebar.tsx`). `auth` no aparece — no tiene menú
 * (docs/menus/00-convenciones.md §6, su contraparte visible es `Seguridad`).
 * Grupos de nivel 1 tal como `docs/product/05_INFORMATION_ARCHITECTURE.md §3`.
 */
export interface ModuleRegistryEntry {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  permission: string;
  /** `undefined` = ítem de nivel 1 standalone, sin grupo (Dashboard, Clientes, Documentos, Ayuda). */
  group?: string;
}

export const MODULE_REGISTRY: ModuleRegistryEntry[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
    permission: 'dashboard.ver',
  },

  {
    id: 'ventas',
    label: 'Ventas',
    icon: ShoppingCart,
    path: '/ventas',
    permission: 'ventas.ver',
    group: 'Ventas',
  },
  {
    id: 'pos',
    label: 'POS',
    icon: Store,
    path: '/pos',
    permission: 'pos.operar_pos',
    group: 'Ventas',
  },
  {
    id: 'crm',
    label: 'CRM',
    icon: Handshake,
    path: '/crm',
    permission: 'crm.ver',
    group: 'Ventas',
  },

  {
    id: 'compras',
    label: 'Compras',
    icon: Truck,
    path: '/compras',
    permission: 'compras.ver',
    group: 'Compras e Inventario',
  },
  {
    id: 'inventario',
    label: 'Inventario',
    icon: Boxes,
    path: '/inventario',
    permission: 'inventario.ver',
    group: 'Compras e Inventario',
  },
  {
    id: 'proveedores',
    label: 'Proveedores',
    icon: Factory,
    path: '/proveedores',
    permission: 'proveedores.ver',
    group: 'Compras e Inventario',
  },

  { id: 'clientes', label: 'Clientes', icon: Users, path: '/clientes', permission: 'clientes.ver' },

  {
    id: 'produccion',
    label: 'Producción',
    icon: Cog,
    path: '/produccion',
    permission: 'produccion.ver',
    group: 'Producción y Servicios',
  },
  {
    id: 'servicios',
    label: 'Servicios',
    icon: Wrench,
    path: '/servicios',
    permission: 'servicios.ver',
    group: 'Producción y Servicios',
  },

  {
    id: 'caja',
    label: 'Caja',
    icon: Wallet,
    path: '/caja',
    permission: 'caja.ver',
    group: 'Finanzas',
  },
  {
    id: 'bancos',
    label: 'Bancos',
    icon: Landmark,
    path: '/bancos',
    permission: 'bancos.ver',
    group: 'Finanzas',
  },
  {
    id: 'contabilidad',
    label: 'Contabilidad',
    icon: BookText,
    path: '/contabilidad',
    permission: 'contabilidad.ver',
    group: 'Finanzas',
  },
  {
    id: 'tesoreria',
    label: 'Tesorería',
    icon: Banknote,
    path: '/tesoreria',
    permission: 'tesoreria.ver',
    group: 'Finanzas',
  },

  {
    id: 'recursos-humanos',
    label: 'RRHH',
    icon: Contact,
    path: '/recursos-humanos',
    permission: 'recursos-humanos.ver',
    group: 'Gente',
  },
  {
    id: 'nomina',
    label: 'Nómina',
    icon: Receipt,
    path: '/nomina',
    permission: 'nomina.ver',
    group: 'Gente',
  },

  {
    id: 'activos-fijos',
    label: 'Activos Fijos',
    icon: Building2,
    path: '/activos-fijos',
    permission: 'activos-fijos.ver',
    group: 'Activos y Proyectos',
  },
  {
    id: 'proyectos',
    label: 'Proyectos',
    icon: KanbanSquare,
    path: '/proyectos',
    permission: 'proyectos.ver',
    group: 'Activos y Proyectos',
  },

  {
    id: 'reportes',
    label: 'Reportes',
    icon: FileBarChart,
    path: '/reportes',
    permission: 'reportes.ver',
    group: 'Análisis',
  },
  {
    id: 'bi',
    label: 'Business Intelligence',
    icon: LineChart,
    path: '/bi',
    permission: 'bi.ver',
    group: 'Análisis',
  },

  {
    id: 'documentos',
    label: 'Documentos',
    icon: FolderArchive,
    path: '/documentos',
    permission: 'documentos.ver',
  },

  {
    id: 'configuracion',
    label: 'Configuración',
    icon: Settings,
    path: '/configuracion',
    permission: 'configuracion.ver',
    group: 'Sistema',
  },
  {
    id: 'seguridad',
    label: 'Seguridad',
    icon: Shield,
    path: '/seguridad/usuarios',
    permission: 'seguridad.ver',
    group: 'Sistema',
  },
  {
    id: 'administracion',
    label: 'Administración',
    icon: ServerCog,
    path: '/administracion',
    permission: 'administracion.ver',
    group: 'Sistema',
  },

  { id: 'ayuda', label: 'Ayuda', icon: CircleHelp, path: '/ayuda', permission: 'ayuda.ver' },
];
