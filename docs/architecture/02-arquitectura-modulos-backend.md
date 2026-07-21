# 02 — Arquitectura de un módulo backend (Clean Architecture / Hexagonal)

## 1. Las capas y la regla de dependencia

Cada `modules/<x>/backend` está organizado en cuatro capas concéntricas.
La única regla que importa: **las dependencias apuntan siempre hacia
adentro**. El dominio no sabe que Prisma, NestJS o HTTP existen.

```
┌───────────────────────────────────────────────────────────┐
│  INTERFAZ (controllers, events consumers, gateways)        │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  APLICACIÓN (services / use cases, dto, validators)  │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │  DOMINIO (entities, value objects, reglas puras) │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  │  repositories: INTERFAZ (puerto) definida aquí        │  │
│  └─────────────────────────────────────────────────────┘  │
│  repositories: IMPLEMENTACIÓN (adaptador Prisma) aquí       │
└───────────────────────────────────────────────────────────┘
        ▲ las flechas de dependencia siempre apuntan hacia adentro ▲
```

- **Dominio** (`entities/`): objetos de negocio puros. Sin decoradores
  de Nest, sin Prisma, sin HTTP. Si el dominio de `ventas` dice que una
  factura no puede tener líneas con cantidad negativa, esa regla vive
  acá como método de la entidad, no en el controller ni en el service.
- **Aplicación** (`services/`, `dto/`, `validators/`): orquesta
  entidades y repositorios para ejecutar casos de uso
  (`CrearVenta`, `ConfirmarVenta`, `AnularFactura`). Define **interfaces**
  de repositorio (los puertos) — no sabe qué motor de base de datos hay
  detrás.
- **Infraestructura** (`repositories/` — implementación): adaptadores
  concretos. La implementación Prisma de `VentaRepository` vive acá e
  implementa la interfaz definida en la capa de aplicación (Dependency
  Inversion Principle).
- **Interfaz** (`controllers/`, `events/` como consumidores): traduce el
  mundo exterior (HTTP, mensajes de RabbitMQ, WebSocket) a llamadas de
  casos de uso. No contiene lógica de negocio — un controller nunca hace
  un `if` de reglas de negocio, solo valida forma (vía `validators/`) y
  delega.

## 2. Plantilla de carpetas de un módulo backend

```
modules/ventas/backend/
├── entities/
│   ├── venta.entity.ts             # Entidad de dominio + invariantes
│   ├── linea-venta.entity.ts
│   └── venta.entity.spec.ts        # Tests unitarios de reglas de dominio
│
├── repositories/
│   ├── venta.repository.ts         # INTERFAZ (puerto) — usada por services
│   └── venta.repository.prisma.ts  # Implementación concreta (adaptador)
│
├── services/
│   ├── crear-venta.usecase.ts
│   ├── confirmar-venta.usecase.ts
│   └── ventas-query.service.ts     # Lecturas — expuesto como fachada pública
│
├── dto/
│   ├── crear-venta.dto.ts
│   └── venta-response.dto.ts
│
├── validators/
│   └── crear-venta.schema.ts       # Zod schema, reusado por DTO y por frontend vía shared/contracts
│
├── controllers/
│   └── ventas.controller.ts
│
├── events/
│   ├── venta-confirmada.event.ts   # Evento de dominio (contrato)
│   └── venta-confirmada.publisher.ts
│
├── ventas.module.ts                # Wiring de Nest: providers, imports, exports
└── ventas.module.spec.ts
```

## 3. Convenciones de cada capa

### `entities/`

- Clases TypeScript planas, sin decoradores de framework.
- Contienen invariantes (`throw` si el estado propuesto es inválido) y
  comportamiento (`venta.confirmar()`, no `venta.estado = 'confirmada'`
  desde afuera).
- 100% testeable sin levantar Nest ni base de datos.

### `repositories/`

- La interfaz (`venta.repository.ts`) declara solo los métodos que la
  capa de aplicación necesita (`findById`, `save`, `findPendientesPorCliente`),
  nunca expone detalles de Prisma (sin `Prisma.VentaWhereInput` en la
  firma pública).
- La implementación Prisma vive en el mismo directorio pero es
  intercambiable — esto es lo que permite testear `services/` con un
  repositorio en memoria (fake) sin tocar PostgreSQL.
- **Ningún módulo accede a las tablas de otro módulo directamente.** Si
  `ventas` necesita datos de `inventario`, pasa por el servicio público
  de `inventario`, nunca por su repositorio (ver
  [06-comunicacion-entre-modulos.md](./06-comunicacion-entre-modulos.md)).

### `services/`

- Un caso de uso = una clase con un método público (`execute()`), o
  agrupados en un service más amplio cuando la cohesión lo justifica
  (KISS: no forzar un archivo por acción trivial).
- Toda transacción de base de datos (`prisma.$transaction`) se abre y
  cierra acá, nunca en el controller ni en el repositorio.
- Publica eventos de dominio al final de una operación exitosa, nunca a
  mitad de una transacción sin confirmar.

### `dto/` + `validators/`

- El `validator` (Zod) es la fuente de verdad de la forma de los datos.
- El `dto` es el tipo derivado de ese schema (`z.infer<typeof Schema>`),
  no una definición paralela — evita que DTO y validación diverjan.
- El mismo schema Zod se reexporta desde `modules/ventas/shared/contracts`
  para que el frontend lo use con React Hook Form, garantizando que
  frontend y backend validan exactamente lo mismo.

### `controllers/`

- Solo traduce HTTP → caso de uso → HTTP. Sin lógica condicional de
  negocio.
- Aplica guards de autenticación/autorización (ver
  [09-seguridad-y-multiempresa.md](./09-seguridad-y-multiempresa.md)) y
  pipes de validación declarativos.

### `events/`

- Los eventos de dominio que el módulo **publica** son un contrato
  público — cambiarlos es un cambio breaking para otros módulos. Se
  versionan igual que un endpoint de API.
- Los eventos que el módulo **consume** de otros módulos tienen su
  propio handler acá (p. ej. `ventas` escuchando `StockAgotado` de
  `inventario`), nunca lógica de reacción dispersa en el controller.

## 4. Base de datos: SQL crudo como fuente de verdad, Prisma como consumidor

> **Actualizado 2026-07-12** — decisión revisada al diseñar la base de
> datos completa del ERP (ver [docs/database/](../database/README.md)).
> El texto original de esta sección asumía que Prisma sería dueño del
> schema (`multiSchema` + `schema.prisma` por módulo). Esa aproximación
> no sostiene la profundidad Enterprise requerida: particionamiento
> nativo, Row-Level Security, triggers, funciones/procedures y vistas
> materializadas son parte central del diseño y Prisma Migrate no los
> gestiona bien. La decisión vigente es la siguiente.

- Una única instancia de PostgreSQL 17 en la fase de monolito modular,
  con **un schema de Postgres por módulo** (`ventas.*`, `inventario.*`,
  `contabilidad.*`) — el principio de separación lógica por módulo se
  mantiene intacto, solo cambia la herramienta que lo gestiona.
- **El schema SQL es la fuente de verdad**, versionado a mano como los
  30 archivos `.sql` numerados de `docs/database/sql/` (`01_core.sql`,
  `02_security.sql`, ...). Cada módulo sigue siendo dueño exclusivo de
  su propio archivo/schema — un módulo nunca declara una tabla en el
  schema de otro.
- **Prisma pasa a ser consumidor, no dueño**: corre `prisma db pull`
  contra la base ya creada por el SQL crudo para generar el cliente
  tipado que usa NestJS. `prisma migrate` no se usa; las migraciones son
  los propios archivos SQL, aplicados con una herramienta de migración
  versionada (ver estrategia de despliegue en
  [docs/database/](../database/README.md)).
- **Por qué:** esto separa lógicamente los datos desde el día uno sin
  pagar el costo operativo de bases de datos separadas todavía. El día
  de la extracción a microservicio (ver
  [10-evolucion-a-microservicios.md](./10-evolucion-a-microservicios.md)),
  mover un schema completo a su propia base de datos es un procedimiento
  conocido de PostgreSQL, no una migración de datos ambigua. Mantener el
  SQL como fuente de verdad además permite usar features avanzadas de
  Postgres 17 sin pelear contra las limitaciones de un ORM.
- Las claves foráneas **entre schemas de distintos módulos siguen
  prohibidas**. Las referencias cruzadas se guardan como IDs sueltos
  (p. ej. `ventas.venta.clienteId`), nunca como FK de Postgres hacia
  `clientes.cliente.id`. Esto es intencional: una FK real impediría
  separar las bases de datos más adelante.

## 5. `ventas.module.ts`: el barrel de wiring

```ts
@Module({
  imports: [DatabaseModule, MessagingModule],
  controllers: [VentasController],
  providers: [
    CrearVentaUseCase,
    ConfirmarVentaUseCase,
    VentasQueryService,
    { provide: VentaRepository, useClass: VentaRepositoryPrisma },
  ],
  exports: [VentasQueryService], // Único punto de entrada para otros módulos
})
export class VentasModule {}
```

Solo `VentasQueryService` (u otro servicio explícitamente exportado) es
visible desde fuera del módulo, re-exportado a través del `index.ts` de
`modules/ventas/`. Todo lo demás es un detalle de implementación privado
del módulo.
