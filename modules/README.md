# modules/

**Propósito:** el corazón del ERP. Un dominio de negocio = una carpeta.

**Responsabilidad:** contener toda la lógica de negocio del proyecto — entidades, casos de uso, controllers, componentes de UI de cada módulo. `apps/` solo ensambla lo que vive acá.

## Estado actual

27 carpetas de módulo escafoldadas (`ventas`, `compras`, `inventario`, `contabilidad`, `clientes`, `proveedores`, `productos`, `caja`, `bancos`, `crm`, `hr`, `nomina`, `pos`, `produccion`, `documentos`, `administracion`, `tesoreria`, `dashboard`, `reportes`, `bi`, `seguridad`, `configuracion`, `auth`, `impuestos`, `servicios`, `proyectos`, `activos-fijos`) — **todas vacías todavía**. La Foundation Platform (`core/*`) se construyó primero a propósito: ningún módulo de negocio puede persistir datos de verdad hasta tener su cliente Prisma disponible (ya resuelto, ver `core/database`).

## Anatomía obligatoria de un módulo

```
modules/ventas/
├── backend/            # NestJS: controllers, services, repositories, dto, entities, validators, events
├── frontend/            # React: components, pages, hooks, routes
├── shared/               # types, constants, utils, contratos Zod compartidos FE↔BE de ESTE módulo
├── index.ts               # Barrel público — lo único que otros módulos pueden importar
└── README.md               # Propósito del módulo, dueño, dependencias declaradas
```

## Reglas

- **`index.ts` es la frontera dura.** Nadie importa `modules/ventas/backend/repositories/*` desde otro módulo — el lint de fronteras de Nx lo bloquea.
- **Nombres de carpeta de módulo: español, kebab-case** (`cuentas-por-cobrar`, no `accounts-receivable`) — es vocabulario de negocio, no de infraestructura.
- **Sin FK de Postgres entre schemas de distintos módulos.** Referencias cruzadas son IDs sueltos (`ventas.venta.clienteId`), nunca `REFERENCES clientes.cliente(id)` — esto es lo que permite separar bases de datos el día que un módulo se extrae a microservicio. Ya reflejado en los 21 clientes Prisma de `core/database` (relaciones cross-schema podadas a propósito).
- Cada módulo declara sus dependencias de otros módulos en su propio `README.md` — una dependencia no declarada falla el build.
- Un dueño por módulo, ver `.github/CODEOWNERS`.

Detalle completo: [docs/architecture/01-estructura-monorepo.md §4-5](../docs/architecture/01-estructura-monorepo.md#4-anatomía-de-un-módulo-vista-desde-la-raíz) y [02-arquitectura-modulos-backend.md](../docs/architecture/02-arquitectura-modulos-backend.md).
