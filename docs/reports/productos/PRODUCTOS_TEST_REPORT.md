# Productos Test Report — FASE 04

> Entregable de esta parte. Primer testing de `modules/productos/backend`
> — proyecto Nx nuevo, sin tests preexistentes que extender.

## 1. Qué se agregó

| Archivo                                        | Cobertura                                                                                                                                                                                                       |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `entities/unidad-medida.entity.spec.ts`        | 2 tests — código vacío, unidad válida                                                                                                                                                                           |
| `entities/categoria-producto.entity.spec.ts`   | 4 tests — código vacío, auto-referencia inválida, raíz válida, con padre válido                                                                                                                                 |
| `entities/marca.entity.spec.ts`                | 2 tests — nombre vacío, marca válida                                                                                                                                                                            |
| `entities/modelo-producto.entity.spec.ts`      | 2 tests — nombre vacío, modelo válido                                                                                                                                                                           |
| `entities/producto.entity.spec.ts`             | 10 tests — SKU vacío, tipo/costeo inválidos, servicio con serie/lote (rechazado), good con serie/lote (aceptado), los 5 tipos válidos                                                                           |
| `services/unidades-medida.service.spec.ts`     | 4 tests — empresa inválida, creación, 404, PATCH                                                                                                                                                                |
| `services/categorias-producto.service.spec.ts` | 5 tests — empresa inválida, padre inválido, padre válido, 404, PATCH                                                                                                                                            |
| `services/marcas.service.spec.ts`              | 4 tests — empresa inválida, creación, 404, PATCH                                                                                                                                                                |
| `services/modelos-producto.service.spec.ts`    | 6 tests — empresa inválida, marca inválida, creación, 404, filtro por marca, PATCH                                                                                                                              |
| `services/productos.service.spec.ts`           | 13 tests — empresa/unidad/categoría/marca/modelo inválidos, modelo-de-otra-marca rechazado (creación y edición), creación exitosa con jerarquía completa, invariante servicio+serie, 404, filtro, PATCH parcial |
| `controllers/productos.controller.e2e-spec.ts` | 4 casos — 401 sin token, 400 con FK inexistente, flujo completo (unidad→categoría→marca→modelo→producto, incluida la validación cruzada marca↔modelo), 400 servicio que rastrea serie                           |

Mismo patrón que el resto del proyecto: fakes mínimos del colaborador
exacto que la clase bajo prueba necesita, nunca un mock framework
genérico.

## 2. Corrida real de esta sesión

`Docker Desktop` sin conectar durante toda la sesión (6ª sesión
consecutiva, confirmado con `docker ps` al inicio) — mismo bloqueo
documentado desde el cierre de FASE 03 Parte 01.

```
productos-backend (unitarios, --runInBand): 53/53 ✅
  10 suites: 5 de entidades (20 tests), 5 de servicios (33 tests)

productos.controller.e2e-spec.ts: compila limpio (0 errores TS,
confirmado explícitamente), falla al conectar a Postgres real —
ECONNREFUSED, consistente con Docker caído, nunca llegó a ejecutarse
contra datos reales esta sesión.
```

Build (`nx run productos-backend:build`) y lint (`nx run
productos-backend:lint`) ✅ limpios, a la primera corrida (sin errores
de tipos que corregir). `nx run api:build` (todas las tareas de las que
depende, incluidos los otros 4 módulos de negocio) ✅ sin errores —
confirma que el sexto cliente Prisma expuesto (`ProductsPrismaClient`/
`PRISMA_PRODUCTS`) y el nuevo proyecto Nx no rompieron ningún otro
consumidor.

## 3. Pendiente de re-confirmar cuando Docker esté arriba

El único e2e de este módulo necesita Postgres real (crea una empresa
descartable directamente vía Prisma, luego ejercita los 5 controllers
vía HTTP real con RBAC real, incluida la validación cruzada
marca↔modelo con datos reales). Primer paso recomendado la próxima vez
que Docker esté disponible: `pnpm nx run productos-backend:test --
--runInBand`, y confirmar que `productos.gestionar_productos` quedó
sembrado corriendo `seed-rbac.ts` de nuevo sobre el tenant de prueba
(`demo`) si no se había corrido desde que se agregó el permiso.
