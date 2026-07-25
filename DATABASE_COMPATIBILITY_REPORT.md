# Informe de Compatibilidad — Prisma y Backend

> Diseño de cómo se mantendría el Prisma Client y el backend 100% funcionales durante y después de
> un renombrado real. Nada de esto se ejecutó — es el análisis de impacto que informa el plan de
> `DATABASE_MIGRATION_REPORT.md`.

## 1. El mecanismo: `@map()` / `@@map()`

Prisma permite que el **nombre del modelo/campo en el código** (lo que escribe el desarrollador,
`prisma.cliente.findMany()`) sea distinto del **nombre físico en la base** (`customers.customers`),
vía `@@map("nombre_fisico")` a nivel de modelo y `@map("nombre_fisico")` a nivel de campo:

```prisma
model clientes {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  nombre_legal String   @map("legal_name")
  inquilino_id String   @map("tenant_id") @db.Uuid
  // ...
  @@map("customers")
  @@schema("customers")
}
```

**Esto significa que hay dos caminos independientes, no uno solo**, y el pedido original los
mezcla — se documenta acá la decisión de diseño real entre ambos:

| Camino                                           | Qué cambia físicamente en Postgres                             | Qué ve el código TypeScript                                                                                         | Riesgo                                                                                                            |
| ------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **A — Solo `@map`, sin renombrar la base**       | Nada — `customers.customers` sigue existiendo tal cual         | `prisma.clientes.findMany()`, `cliente.nombre_legal` — 100% en español                                              | Bajo. Cero cambios de DDL, cero riesgo de particiones/índices/RLS. El código de aplicación ya sería 100% español. |
| **B — Renombrado físico real + `@map` opcional** | `customers.customers` pasa a ser `clientes.clientes` de verdad | Igual que A, pero ahora el `@map` es opcional (podría omitirse porque el nombre físico y el de Prisma ya coinciden) | Alto. Es lo que describe `DATABASE_MIGRATION_REPORT.md` completo.                                                 |

El pedido original dice explícitamente "Standardize the entire GORAZUS database to Spanish" (que
apunta al Camino B) pero también "Use `@map()`/`@@map()` where appropriate" (que es exactamente el
mecanismo del Camino A, y solo hace falta si se toma el Camino B para separar el nombre físico
final del nombre expuesto a Prisma, cosa que en B ya no sería necesaria si ambos coinciden). Dado
que el usuario ya eligió **diseño primero** para esta fase, acá se deja documentado el análisis de
ambos caminos para que la decisión entre A y B se tome con información completa cuando se apruebe
la ejecución — no se eligió unilateralmente en esta fase.

## 2. Impacto real en el backend — medido, no estimado

Se revisaron los módulos backend reales (`grep` sobre `modules/`, `core/`, `apps/`, excluyendo
tests y el cliente Prisma generado):

| Patrón de acceso                                                                                          | Archivos reales afectados |                                      Protegido por `@map`/`@@map`                                       |
| --------------------------------------------------------------------------------------------------------- | :-----------------------: | :-----------------------------------------------------------------------------------------------------: |
| Modelos de Prisma vía cliente tipado (`tx.<modelo>.create/update/findMany/...`)                           |          **61**           | ✅ Sí — el Camino A/B no requiere tocar un solo archivo de estos, Prisma resuelve el mapeo internamente |
| SQL crudo (`$queryRaw`/`$executeRaw`/`$queryRawUnsafe`) con nombres de tabla/columna embebidos como texto |           **8**           |          ❌ **No** — un string SQL literal no lo reescribe Prisma, hay que actualizarlo a mano          |

### 2.1 Los 8 archivos con SQL crudo (requieren edición manual, sin importar el camino elegido)

- `modules/configuracion/backend/scripts/seed-tax-jurisdictions.ts`
- `modules/inventario/backend/repositories/kardex.repository.prisma.ts`
- `modules/inventario/backend/repositories/kardex.repository.ts`
- `modules/inventario/backend/repositories/stock-lock.util.ts` (el `SELECT ... FOR UPDATE` con
  `IS NOT DISTINCT FROM`, ver `TECHNICAL_DEBT.md`/sesiones previas — ya tenía un bug real de casts
  encontrado y corregido en la Fase 06 del POS, este archivo requiere atención doble)
- `modules/inventario/backend/scripts/seed-stock-adjustment-reasons.ts`
- `modules/inventario/backend/scripts/seed-stock-movement-types.ts`
- `modules/seguridad/backend/scripts/seed-rbac.ts`
- `core/database/src/tenant-scope.ts`

Estos 8 archivos son el verdadero costo de compatibilidad — no los 61 con Prisma tipado (esos
"simplemente funcionan" con `@map`).

## 3. Estrategia recomendada (para cuando se apruebe ejecutar)

**Camino A primero, Camino B después y por partes** — no simultáneo:

1. **Fase de compatibilidad (Camino A)**: agregar `@map`/`@@map` a `schema.prisma` con los nombres
   ya diseñados en `DATABASE_DICTIONARY.md`, sin tocar la base física. Regenerar el cliente
   (`prisma generate`), actualizar los 61 archivos para usar los nombres de modelo/campo en
   español (cambio mecánico, alto volumen pero bajo riesgo — son renames de identificador en
   TypeScript, el compilador señala cada uso). Los 8 archivos de SQL crudo NO cambian en esta
   fase (siguen apuntando a los nombres físicos en inglés, que siguen existiendo). **Resultado: la
   aplicación ya "habla" en español de punta a punta, con cero riesgo de romper la base.**
2. **Fase de renombrado físico (Camino B)**, solo si se decide que vale la pena además de tener ya
   el Camino A funcionando: ejecutar `DATABASE_MIGRATION_REPORT.md` schema por schema. En este
   punto el `@map`/`@@map` deja de ser necesario schema por schema (se puede quitar a medida que el
   nombre físico coincide) y los 8 archivos de SQL crudo se actualizan al mismo tiempo que se migra
   el schema que tocan.

Este orden separa el riesgo real (tocar la base de datos en producción-patrón) del beneficio
inmediato (código de aplicación en español) — se puede obtener el beneficio principal sin asumir
el riesgo principal, y decidir después si el renombrado físico realmente hace falta.

## 4. Regenerar el Prisma Client

Confirmado en esta misma fase (`DATABASE_SETUP_REPORT.md`, sesión anterior) que el proyecto fija
**Prisma 5.22.0** (`core/database/package.json`) — usar siempre el binario local
(`node_modules/.pnpm/prisma@5.22.0/...`), nunca `npx prisma` sin pin (trae la última versión de npm,
Prisma 7 en esta sesión, con sintaxis de `datasource` incompatible — error real ya encontrado y
documentado). Tras aplicar `@map`/`@@map` (Camino A) o renombrar físicamente (Camino B), el ciclo
es: `prisma validate` → `prisma generate` (nunca `prisma db push`/`migrate` — este proyecto no usa
Prisma Migrate, el DDL real vive en `docs/database/sql/`, ver `DATABASE_SETUP_REPORT.md §1`).

## 5. API y OpenAPI

Los DTOs/validators (Zod) de cada controller ya usan sus propios nombres de campo, habitualmente en
`camelCase` en español o inglés según el módulo (p. ej. `POS_API.md` ya expone `companyId`,
`branchId` en la API pública) — **la API pública no cambia mecánicamente por el `@map` de Prisma**,
porque hay una capa de DTO entre el modelo de Prisma y la respuesta HTTP en todos los controllers
ya construidos. Si se quiere una API 100% en español (no solo la base de datos), es una decisión
de diseño **separada y no pedida explícitamente en este master prompt** (que habla de "base de
datos", no de contratos de API) — se deja mencionado acá para que no se asuma incluida sin
decisión explícita.
