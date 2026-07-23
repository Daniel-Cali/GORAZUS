# Almacenes Test Report — FASE 03, continuidad

> Entregable de esta parte. Primer testing de `modules/inventario/backend`
> — proyecto Nx nuevo, sin tests preexistentes que extender.

## 1. Qué se agregó

| Archivo                                        | Cobertura                                                                                                                                          |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `entities/almacen.entity.spec.ts`              | 5 tests — nombre/código vacío, tipo inválido, físico/virtual válidos                                                                               |
| `entities/zona-almacen.entity.spec.ts`         | 6 tests — nombre vacío, función inválida, las 4 funciones válidas (`it.each`)                                                                      |
| `entities/ubicacion-almacen.entity.spec.ts`    | 4 tests — código vacío, auto-referencia inválida, raíz válida, hija válida                                                                         |
| `services/almacenes.service.spec.ts`           | 6 tests — empresa/sucursal inválida, creación exitosa, 404, filtro por `branchId`, PATCH parcial                                                   |
| `services/zonas-almacen.service.spec.ts`       | 5 tests — almacén inválido, herencia de `company_id`/`branch_id`, 404, filtro, PATCH parcial                                                       |
| `services/ubicaciones-almacen.service.spec.ts` | 6 tests — zona inválida, padre de otra zona, padre inexistente, padre válido, 404, PATCH parcial                                                   |
| `controllers/almacenes.controller.e2e-spec.ts` | 4 casos — 401 sin token, 400 con FK inexistente, flujo completo (almacén→zona→ubicación con jerarquía de 2 niveles), 400 con padre de zona cruzada |

Mismo patrón que el resto del proyecto: fakes mínimos del colaborador
exacto que la clase bajo prueba necesita, nunca un mock framework
genérico.

## 2. Corrida real de esta sesión

`Docker Desktop` sin conectar durante toda la sesión (5ª sesión
consecutiva, confirmado con `docker ps` al inicio) — mismo bloqueo
documentado desde el cierre de FASE 03 Parte 01.

```
inventario-backend (unitarios, --runInBand): 32/32 ✅
  6 suites: 3 de entidades (15 tests), 3 de servicios (17 tests)

almacenes.controller.e2e-spec.ts: compila limpio (0 errores TS,
confirmado explícitamente), falla en el beforeAll al conectar a
Postgres — ECONNREFUSED, consistente con Docker caído, nunca llegó a
ejecutarse contra datos reales esta sesión.
```

Build (`nx run inventario-backend:build`) y lint (`nx run
inventario-backend:lint`) ✅ limpios. `nx run api:build` (18 tareas de
las que depende, incluidos los otros 3 módulos de negocio) ✅ sin
errores — confirma que el quinto cliente Prisma expuesto
(`InventoryPrismaClient`/`PRISMA_INVENTORY`) y el nuevo proyecto Nx no
rompieron ningún otro consumidor.

## 3. Pendiente de re-confirmar cuando Docker esté arriba

El único e2e de este módulo necesita Postgres real (crea una empresa +
sucursal descartables directamente vía Prisma, luego ejercita los 3
controllers vía HTTP real con RBAC real). Primer paso recomendado la
próxima vez que Docker esté disponible: `pnpm nx run
inventario-backend:test -- --runInBand`, y confirmar además que
`inventario.gestionar_almacenes` quedó sembrado corriendo `seed-rbac.ts`
de nuevo sobre el tenant de prueba (`demo`) si no se había corrido desde
que se agregó el permiso.
