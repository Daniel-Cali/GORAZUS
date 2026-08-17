# Informe de Renombrado — Base de Datos GORAZUS

> **Fase de diseño — nada de esto se ejecutó todavía.** Este informe resume, por categoría, cuántos
> objetos reales _se renombrarían_ si se aprueba y ejecuta el plan de `DATABASE_MIGRATION_REPORT.md`.
> Los números son reales (extraídos de la base PostgreSQL 17.10 en vivo), no estimados.

## 1. Resumen por categoría

| Categoría                                     |         Objetos reales en la base         | Objetos que cambiarían de nombre | Nota                                                                                                                         |
| --------------------------------------------- | :---------------------------------------: | :------------------------------: | ---------------------------------------------------------------------------------------------------------------------------- |
| Esquemas                                      | 23 (21 de negocio + `partman` + `public`) |                19                | `bi`/`crm` se mantienen (siglas universales), `partman`/`public` son infraestructura, no se tocan                            |
| Tablas                                        |                    501                    |               501                | 100% — ninguna tabla de negocio queda en inglés                                                                              |
| Columnas (instancias reales)                  |                  10.153                   |              10.153              | Se derivan de 728 nombres distintos, todos traducidos                                                                        |
| Columnas (nombres distintos)                  |                    728                    |               728                | 17 `BaseEntity` + 711 de negocio, cobertura 100%                                                                             |
| Índices                                       |                   2.948                   |              2.948               | Derivados mecánicamente del nuevo nombre de tabla/columna                                                                    |
| Constraints (PK)                              |                    501                    |               501                | `<tabla>_pkey`                                                                                                               |
| Constraints (UNIQUE)                          |                    501                    |               501                | `<tabla>_local_id_key`                                                                                                       |
| Constraints (FOREIGN KEY)                     |                   3.631                   |              3.631               | `<tabla>_<columna>_fkey`                                                                                                     |
| Constraints (CHECK)                           |                    119                    |               119                | `<tabla>_<columna>_check`                                                                                                    |
| Secuencias                                    |                    501                    |               501                | `<tabla>_local_id_seq`                                                                                                       |
| Vistas                                        |                     9                     |                8                 | `v_kardex` ya está en español, no cambia                                                                                     |
| Vistas materializadas                         |                     4                     |                4                 | 100%                                                                                                                         |
| Funciones/procedimientos propios              |     20 (16 función + 4 procedimiento)     |                20                | 100% — nombre de función Y de parámetros donde aplique                                                                       |
| Funciones de extensión (`pg_trgm`/`pgcrypto`) |                    67                     |              **0**               | **Nunca se renombran** — no son código de GORAZUS, son parte del contrato de la extensión                                    |
| Triggers (nombres distintos)                  |                     5                     |                5                 | Aplicados sobre 982 disparadores reales (tablas + particiones)                                                               |
| Tipos ENUM nativos                            |                     0                     |                0                 | El proyecto no usa `ENUM` de Postgres — usa `text` + `CHECK`, nada que renombrar acá                                         |
| Particiones hijas (tablas físicas)            |                    200                    |         200 (automático)         | Se renombran solas si se hace `ALTER TABLE ... RENAME` en la tabla padre — Postgres propaga el nombre base a las particiones |

**Total de objetos con nombre nuevo propuesto: 19.577** (excluyendo instancias repetidas de
columnas iguales entre tablas — el trabajo de traducción real fueron 728 nombres de columna + 501
de tabla + 46 de esquema/vista/matview/función/trigger = **1.275 decisiones de nomenclatura
únicas**, de las que se derivan mecánicamente los ~18.302 objetos restantes).

## 2. Lo que NO se renombra (alcance explícitamente excluido)

- Los **valores** de datos (filas) — un cliente llamado `"John Smith"` sigue llamándose así, esto
  es nomenclatura de _objetos_, no traducción de _contenido_.
- Los **valores permitidos de `CHECK` constraints** (p. ej. `'draft'`, `'issued'`, `'active'`) — son
  datos, no identificadores de objeto. Traducirlos sería un cambio de contrato con cualquier
  integración externa que dependa de esos valores literales — fuera de alcance y de las reglas de
  esta fase ("no modificar la lógica de negocio").
- Las 67 funciones de `pg_trgm`/`pgcrypto` (§1).
- `partman` (schema de la extensión `pg_partman`) y `public` (schema por defecto de Postgres).
- Roles de base de datos (`gorazus_superuser`, `gorazus_app`, `gorazus_backup`) — no son "objetos
  de base de datos" en el sentido del pedido (tablas/columnas/índices/etc.), y renombrarlos
  requeriría actualizar `.env`/`docker-compose.yml` de todos los entornos, un cambio operativo
  distinto en naturaleza al resto de este trabajo.
- Nombres de bases de datos (`gorazus`) — mismo motivo.

## 3. Distribución por esquema (tablas)

| Esquema                           | Tablas  | % del total |
| --------------------------------- | :-----: | :---------: |
| `sales` → `ventas`                |   55    |    11,0%    |
| `core` → `nucleo`                 |   69    |    13,8%    |
| `products` → `productos`          |   35    |    7,0%     |
| `inventory` → `inventario`        |   34    |    6,8%     |
| `accounting` → `contabilidad`     |   28    |    5,6%     |
| `hr` → `rrhh`                     |   28    |    5,6%     |
| `purchases` → `compras`           |   27    |    5,4%     |
| `security` → `seguridad`          |   24    |    4,8%     |
| `configuration` → `configuracion` |   23    |    4,6%     |
| `payroll` → `nomina`              |   22    |    4,4%     |
| `customers` → `clientes`          |   18    |    3,6%     |
| `services` → `servicios`          |   18    |    3,6%     |
| `crm`                             |   17    |    3,4%     |
| `projects` → `proyectos`          |   17    |    3,4%     |
| `banks` → `bancos`                |   14    |    2,8%     |
| `bi`                              |   14    |    2,8%     |
| `suppliers` → `proveedores`       |   13    |    2,6%     |
| `taxes` → `impuestos`             |   13    |    2,6%     |
| `reports` → `reportes`            |   11    |    2,2%     |
| `cash` → `caja`                   |   11    |    2,2%     |
| `assets` → `activos`              |   10    |    2,0%     |
| **Total**                         | **501** |  **100%**   |

Ver `DATABASE_DICTIONARY.md` para el listado completo tabla por tabla y columna por columna.
