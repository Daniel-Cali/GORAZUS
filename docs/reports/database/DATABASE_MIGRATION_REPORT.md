# Plan de Migración — Base de Datos GORAZUS a Español

> **Ningún paso de este plan se ejecutó en esta fase.** Es el diseño de cómo se ejecutaría de
> forma segura si se aprueba una fase futura dedicada — con los riesgos reales, el orden correcto,
> y el mecanismo de reversión, no un boceto genérico.

## 1. Por qué NO se ejecuta en esta misma fase

- La base está certificada como "Enterprise v1.0.0" y **congelada** — `VERSION.md`: "todo cambio
  estructural futuro requiere una migración versionada". Un renombrado de 501 tablas es el cambio
  estructural más grande posible sobre este modelo.
- El pedido explícito de esta fase prohíbe "romper la aplicación" y "perder datos" — pero renombrar
  10.153 columnas + 501 tablas + ~8.700 índices/constraints/secuencias EN VIVO, y actualizar en el
  mismo movimiento los 61 archivos backend con acceso directo a Prisma + los 8 archivos con SQL
  crudo (ver `DATABASE_COMPATIBILITY_REPORT.md`), sin poder correr una suite de tests 100%
  confiable hoy (`nx run web:test` roto, e2e dependiente de Docker — `TECHNICAL_DEBT.md`), es
  exactamente el tipo de cambio de alto riesgo que esas dos reglas piden evitar.
- Decisión explícita del usuario en esta sesión: **diseño primero**, no ejecución.

## 2. Herramienta: `ALTER ... RENAME`, no recrear tablas

Postgres soporta renombrar cada tipo de objeto sin tocar los datos ni recrear nada:

```sql
ALTER TABLE inventory.stock_movements RENAME TO movimientos_inventario;
ALTER TABLE inventory.movimientos_inventario RENAME COLUMN quantity TO cantidad;
ALTER INDEX idx_inventory_stock_movements_product_id RENAME TO idx_inventario_movimientos_inventario_producto_id;
ALTER TABLE inventory.movimientos_inventario RENAME CONSTRAINT stock_movements_product_id_fkey TO movimientos_inventario_producto_id_fkey;
ALTER SEQUENCE inventory.stock_movements_local_id_seq RENAME TO movimientos_inventario_id_local_seq;
ALTER SCHEMA inventory RENAME TO inventario;
```

**Cero riesgo de pérdida de datos** — `RENAME` es un cambio de metadata (catálogo del sistema), no
mueve ni reescribe una sola fila. Confirmado contra la documentación oficial de PostgreSQL 17 antes
de proponerlo, no asumido. Las 200 particiones hijas siguen automáticamente el nombre de la tabla
padre en `ALTER TABLE ... RENAME` — no hace falta un `RENAME` aparte por partición.

**Excepción real**: renombrar un `SCHEMA` que tiene objetos con RLS, triggers y vistas
dependientes no rompe nada per se (Postgres actualiza las referencias internas automáticamente),
pero **si** algún trigger/función usa el nombre del schema **como texto** (dentro de una cadena
`EXECUTE`/`format()`, no como referencia real de objeto), eso sí se rompe silenciosamente — el
paso 5 de este plan exige grepear cada función/trigger por nombres de schema/tabla hardcodeados
como string antes de renombrar.

## 3. Orden de ejecución propuesto (fases, no todo junto)

**No renombrar todo en un solo `BEGIN/COMMIT` gigante.** Orden por riesgo creciente:

1. **Piloto — un schema chico y sin tráfico**: `taxes` → `impuestos` (13 tablas, sin triggers de
   negocio propios más allá de auditoría genérica). Objetivo: validar el proceso completo
   (SQL + Prisma + backend + tests) de punta a punta antes de tocar algo grande.
2. **Schemas de catálogo/configuración** (bajo riesgo, poco código backend construido todavía):
   `configuration`, `assets`, `banks`, `reports`, `bi`.
3. **Schemas con backend real ya construido** (`core`, `security`, `configuration` ya cubiertos —
   siguen `customers`, `inventory`, `sales`, `cash` — los módulos con código de aplicación real
   hoy, ver `ROADMAP.md`). Acá el riesgo es real: cada uno requiere el ciclo completo de §5 antes
   de pasar al siguiente.
4. **Resto de los schemas sin backend construido todavía** (`accounting`, `hr`, `payroll`,
   `products` más allá del núcleo, `projects`, `purchases`, `crm`, `services`, `suppliers`,
   `taxes`) — menor riesgo real porque no hay código de aplicación que dependa de esos nombres
   todavía (ver `ROADMAP.md`, 18 de 27 módulos de negocio sin backend), pero se mantienen para el
   final para no invertir esfuerzo de validación en tablas que nadie consume todavía.

## 4. Mitigación real encontrada: nombres de índice que superan 63 bytes

`DATABASE_SPANISH_STANDARD.md §7` documenta que aplicar el patrón `idx_<schema>_<tabla>_<columna>`
mecánicamente en español produce **112 nombres que superan el límite de 63 bytes** de PostgreSQL
para identificadores sin comillas (el español es en promedio más largo). Postgres trunca
silenciosamente cualquier identificador que se intente crear más largo — dos índices distintos
podrían terminar con el mismo nombre truncado y fallar por colisión.

**Mitigación propuesta** (no aplicada — es parte del plan de ejecución):

- Para los 112 casos, usar un sufijo hash corto (8 caracteres hexadecimales del `md5` del nombre
  completo) en vez de repetir la columna completa: `idx_seguridad_entradas_de_lista_de_control_de_acceso_a3f9c21b`
  en vez del nombre de 82 bytes. Mismo patrón que usan internamente varios ORMs (incluido el propio
  Prisma) para nombres de constraint largos.
- Alternativa más simple: quitar el prefijo `idx_<schema>_` cuando el índice ya está calificado por
  schema en el catálogo (Postgres no lo necesita para desambiguar, solo es convención legible) —
  reduce el promedio ~15 bytes, resolviendo la mayoría de los 112 casos sin necesitar hash.
  **Decisión de diseño pendiente de aprobación humana antes de ejecutar** — no es una decisión que
  corresponda tomar unilateralmente en esta fase.

## 5. Ciclo de validación por cada schema migrado (obligatorio, no opcional)

1. `BEGIN;` — todo el schema en una única transacción (todo o nada, Postgres soporta DDL
   transaccional real).
2. Ejecutar los `ALTER ... RENAME` del schema (tablas → columnas → índices → constraints →
   secuencias → vistas/funciones/triggers que lo referencien).
3. Verificar en la misma transacción: `SELECT count(*)` de cada tabla renombrada compara igual al
   conteo de antes (¿existe todavía toda la data?), 0 constraints `NOT convalidated`, 0 índices
   `NOT indisvalid` (mismas queries que ya se usaron para el health-check de
   `DATABASE_SETUP_REPORT.md`).
4. `COMMIT` solo si el paso 3 pasa limpio; `ROLLBACK` automático si cualquier cosa falla — dado que
   es DDL transaccional, un error a mitad de camino no deja el schema a medio renombrar.
5. Regenerar `schema.prisma` (`prisma db pull`) y comparar contra el anterior — confirmar que el
   único cambio es el de nombres, ningún modelo/campo aparece o desaparece.
6. Actualizar el backend del/los módulo(s) de ese schema (ver `DATABASE_COMPATIBILITY_REPORT.md`
   para el mecanismo exacto — `@map`/`@@map` o referencias directas actualizadas).
7. Correr la suite de tests unitarios del módulo afectado + un smoke test manual del flujo real
   (mismo patrón ya usado en cada fase anterior de este proyecto — build/lint/test real, no
   asumido).
8. Solo si todo lo anterior pasa, continuar con el siguiente schema del orden de §3.

## 6. Plan de reversión

Cada schema se migra en su propia rama (`design/database-spanish-<schema>`), con su propio commit
de "antes" (tag) para poder volver atrás con `git revert` a nivel de código en cualquier momento. A
nivel de base de datos, el `ROLLBACK` transaccional del paso 5.4 cubre el caso de fallo durante la
migración misma; para revertir DESPUÉS de un `COMMIT` exitoso (si se detecta un problema más
adelante), el `ALTER ... RENAME` es reversible ejecutando el mismo comando en sentido inverso — no
hace falta restaurar un backup mientras nadie haya insertado datos con nombres de columna nuevos
que dependan de la traducción (constraints/checks con nombres embebidos, principalmente).

## 7. Estimación de esfuerzo (orden de magnitud, no un compromiso de fecha)

No corresponde comprometer una fecha en una fase de diseño — pero para dimensionar la decisión de
si conviene ejecutar esto: 21 schemas × el ciclo completo de §5 (SQL + Prisma + backend + tests +
validación manual) es trabajo medido en **semanas de sesiones dedicadas**, no en una fase más. El
piloto de `taxes` (§3, paso 1) es el primer paso recomendado si se aprueba continuar — su duración
real serviría para calibrar el resto.
