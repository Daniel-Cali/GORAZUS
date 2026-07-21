# ui-kit/

**Propósito:** design system compartido del frontend, sobre Shadcn UI.

**Responsabilidad:** componentes de UI genéricos y reutilizables — nada específico de un módulo de negocio.

## Contenido

| Carpeta       | Qué contiene                                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `components/` | Botones, tablas, formularios base, layout — piezas visuales sin lógica de negocio                                               |
| `theme/`      | Tokens de Tailwind, tema claro/oscuro                                                                                           |
| `hooks/`      | Hooks de UI genéricos (`useDebounce`, `useMediaQuery`...) — nunca hooks de negocio (esos viven en `modules/<x>/frontend/hooks`) |

**Estado actual:** escafoldado, sin componentes todavía — se construye junto con `apps/web` cuando arranque el frontend.

## Reglas

- Si un componente conoce el nombre de una entidad de negocio (`TablaVentas`, `FormularioCliente`), **no pertenece acá** — pertenece a `modules/<x>/frontend/components`.
- `ui-kit` puede importar `packages/contracts` (tipos compartidos) — nunca `modules/*` ni `core/*` (esos son de backend).
