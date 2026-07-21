# 03 — Arquitectura de un módulo frontend

## 1. Plantilla de carpetas

```
modules/ventas/frontend/
├── components/
│   ├── tabla-ventas.tsx            # Componentes específicos de ESTE módulo
│   ├── formulario-venta.tsx
│   └── selector-cliente.tsx
│
├── pages/
│   ├── ventas-listado.page.tsx
│   ├── venta-crear.page.tsx
│   └── venta-detalle.page.tsx
│
├── hooks/
│   ├── use-ventas.ts                # useQuery: listado, detalle
│   ├── use-crear-venta.ts           # useMutation
│   └── use-venta-realtime.ts        # Suscripción WebSocket del módulo
│
└── routes/
    └── ventas.routes.tsx            # Objetos de ruta que expone el módulo
```

No hay `services/` ni `repositories/` en el frontend: la capa de acceso
a datos **es** el hook de TanStack Query, que llama directamente al
cliente HTTP tipado generado desde `modules/ventas/shared/contracts`. No
se introduce una capa adicional de "servicio HTTP" que no aporte nada
sobre lo que TanStack Query ya resuelve (KISS).

## 2. Componentes: propios del módulo vs. compartidos

- `ui-kit/components/` contiene componentes **sin conocimiento de
  negocio**: `Button`, `DataTable`, `FormField`, `Modal` — construidos
  sobre Shadcn UI + TailwindCSS. Cualquier módulo los usa.
- `modules/<x>/frontend/components/` contiene componentes que sí saben
  de negocio (`SelectorCliente` sabe qué es un cliente y cómo buscarlo).
- Regla práctica: si un componente necesita conocer el nombre de una
  entidad de negocio o llamar a un hook de un módulo específico, vive en
  el módulo. Si solo recibe props genéricas y no importa nada de
  `modules/*`, vive en `ui-kit/`.
- Un componente de `ventas` puede usar componentes de `clientes` (p. ej.
  el selector de cliente) **solo si `clientes` lo expone en su
  `index.ts`/`shared/`** — nunca importando el archivo interno
  directamente. Ver
  [06-comunicacion-entre-modulos.md](./06-comunicacion-entre-modulos.md).

## 3. Datos: TanStack Query + contratos compartidos

```ts
// modules/ventas/frontend/hooks/use-ventas.ts
export function useVentas(filtros: VentasFiltros) {
  return useQuery({
    queryKey: ['ventas', 'listado', filtros],
    queryFn: () => api.get('/ventas', { params: filtros }),
  });
}
```

- La `queryKey` sigue siempre el patrón `[modulo, recurso, ...params]`
  para que la invalidación de cache sea predecible entre módulos.
- Las mutaciones invalidan explícitamente las queries afectadas, nunca
  se depende de refetch automático por foco de ventana como única
  estrategia en pantallas transaccionales (POS, Caja).
- El tipo de la respuesta y el schema de validación del request se
  importan de `modules/ventas/shared/contracts` — el mismo Zod schema
  que usa el backend en `validators/`. Un cambio en el contrato del
  backend rompe el build del frontend en tiempo de compilación, no en
  producción.

## 4. Formularios: React Hook Form + Zod

```ts
const form = useForm<CrearVentaInput>({
  resolver: zodResolver(crearVentaSchema), // mismo schema que el backend
  defaultValues,
});
```

- Todo formulario transaccional usa este patrón sin excepción: schema
  Zod compartido, `zodResolver`, componentes de `ui-kit/components/form`.
- La validación del backend (`validators/` del módulo) **no es
  opcional** aunque el frontend ya valide — el frontend nunca es la
  única línea de defensa.

## 5. Rutas: cómo se ensamblan sin acoplar

```ts
// modules/ventas/frontend/routes/ventas.routes.tsx
export const ventasRoutes: RouteObject[] = [
  { path: 'ventas', element: <VentasListadoPage /> },
  { path: 'ventas/nueva', element: <VentaCrearPage /> },
  { path: 'ventas/:id', element: <VentaDetallePage /> },
];
```

```ts
// apps/web/src/app/router.tsx (composition root)
const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      ...authRoutes,
      ...ventasRoutes,
      ...comprasRoutes,
      ...inventarioRoutes,
      // ...
    ],
  },
]);
```

`apps/web` es la única pieza del sistema que conoce la existencia de
**todos** los módulos a la vez. Ningún módulo importa las rutas de otro
para navegar — usa `<Link to="/clientes/:id">` con la ruta como string
conocido públicamente (documentada en el `README.md` del módulo
`clientes`), no un import de código.

## 6. Layout y shell de la aplicación

`AppShell` (en `apps/web/src/app/` o `ui-kit/components/layout/`)
contiene la navegación global, el selector de empresa (ver
[09-seguridad-y-multiempresa.md](./09-seguridad-y-multiempresa.md)) y el
menú de módulos. El menú se genera a partir de un registro declarativo
de módulos (`nombre`, `icono`, `ruta base`, `permiso requerido`) — **no**
hardcodeado ni deducido reflexivamente, para poder ocultar módulos según
el plan contratado o los permisos del usuario sin tocar el shell.

## 7. Estado: qué va en TanStack Query vs. qué va en estado local/global

- **Estado de servidor** (cualquier dato que viene de la API): siempre
  TanStack Query. Nunca se copia a `useState` "por si acaso" ni se
  duplica en un store global.
- **Estado de UI efímero** (un modal abierto, un tab activo): `useState`
  local al componente o al módulo.
- **Estado verdaderamente global de la app** (usuario autenticado,
  empresa activa, tema): un store mínimo (Zustand o Context, a definir
  en la fase de implementación) vivo en `apps/web`, expuesto por hooks
  desde `core`/`ui-kit`, nunca reimplementado por módulo.

No se introduce Redux ni una capa de estado global pesada: dado que el
estado de servidor ya lo resuelve TanStack Query, la superficie que
queda para estado global real es pequeña (KISS).
