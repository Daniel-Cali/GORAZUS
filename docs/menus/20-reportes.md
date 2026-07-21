# 20 — Reportes

**Ícono sugerido:** `file-bar-chart`
**Tipo:** Consumidor de solo lectura (sin datos propios) — ver
[04-catalogo-modulos-negocio.md](../architecture/04-catalogo-modulos-negocio.md#reportes-nunca-es-dueño-de-datos)
**Descripción:** Catálogo central y motor de ejecución de todos los
reportes formales del sistema. Cada reporte individual ya está
documentado dentro de su módulo de origen (sección "Reportes de
&lt;módulo&gt;" de cada archivo en `docs/menus/`); este módulo es el
**punto único de acceso, programación y exportación** a todos ellos —
no redefine su contenido.
**Módulos relacionados:** todos los módulos con reportes propios
(consumidos vía proyección de solo lectura, nunca escritura).

## Submenú: Catálogo de Reportes

| Elemento                                    | Detalle                                                                                                                                                 |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Consulta — Catálogo de Reportes Disponibles | Qué muestra: todos los reportes del sistema, agrupados por módulo de origen, filtrados según los permisos `.ver` que ya tiene el usuario en cada módulo | Permiso: `reportes.ver` (más el permiso `.ver` del módulo dueño de cada reporte listado) |
| Formulario — Favoritos de Reportes          | Qué hace: el usuario marca reportes de uso frecuente para acceso rápido                                                                                 | Tablas: `reportes.favorito`                                                              | Permiso: `reportes.configurar` |

Índice de reportes por módulo de origen (referencia, no duplicación):

| Módulo de origen                                              | Reportes                                            | Ver detalle                                                            |
| ------------------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------- |
| Ventas                                                        | Libro de Ventas, Ventas por Cliente, Márgenes, etc. | [02-ventas.md](./02-ventas.md#submenú-reportes-de-ventas)              |
| Compras                                                       | Libro de Compras, Compras por Proveedor, etc.       | [03-compras.md](./03-compras.md#submenú-reportes-de-compras)           |
| Inventario                                                    | Kardex, Existencias, Valorización, etc.             | [04-inventario.md](./04-inventario.md#submenú-reportes-de-inventario)  |
| Contabilidad                                                  | Balance General, Estado de Resultados, Libros, etc. | [09-contabilidad.md](./09-contabilidad.md#submenú-estados-financieros) |
| Tesorería                                                     | Posición Diaria, Vencimientos, Indicadores          | [10-tesoreria.md](./10-tesoreria.md#submenú-reportes-de-tesorería)     |
| Nómina                                                        | Recibos, Libro de Sueldos, Costo Laboral            | [16-nomina.md](./16-nomina.md#submenú-reportes-de-nómina)              |
| _(y así sucesivamente para cada módulo con reportes propios)_ |                                                     |                                                                        |

## Submenú: Generador de Reportes Personalizados

| Elemento                                         | Detalle                                                                                                                                                                              |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Formulario — Reporte Personalizado               | Qué hace: permite armar un reporte ad-hoc seleccionando campos, filtros y agrupaciones sobre las proyecciones de solo lectura expuestas por los módulos (no acceso directo a tablas) | Tablas: `reportes.reporte_personalizado`, `reportes.reporte_personalizado_campo` | Permiso: `reportes.crear` |
| Acción — Compartir Reporte Personalizado con Rol | Habilita que otros usuarios de un rol vean el reporte armado                                                                                                                         | Permiso: `reportes.configurar`                                                   |

## Submenú: Programación y Distribución

| Elemento                             | Detalle                                                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Formulario — Programación de Reporte | Qué hace: define ejecución periódica de un reporte (diario, semanal, mensual) y sus destinatarios | Tablas: `reportes.programacion` | Permiso: `reportes.crear` |
| Acción — Ejecutar Ahora              | Corre el reporte fuera de su programación, bajo demanda                                           | Permiso: `reportes.ver`         |
| Acción — Exportar (PDF, Excel, CSV)  | Genera el archivo de salida en el formato elegido                                                 | Permiso: `reportes.exportar`    |

## Submenú: Consultas

| Consulta                     | Qué muestra                                    | Permiso        |
| ---------------------------- | ---------------------------------------------- | -------------- |
| Historial de Ejecuciones     | Qué reportes se ejecutaron, cuándo y por quién | `reportes.ver` |
| Reportes Programados Activos | Programaciones vigentes y su próxima ejecución | `reportes.ver` |

## Configuraciones del módulo

| Parámetro                           | Qué controla                                                            |
| ----------------------------------- | ----------------------------------------------------------------------- |
| Formatos de exportación habilitados | PDF/Excel/CSV disponibles globalmente o por reporte                     |
| Retención de reportes generados     | Cuánto tiempo se conservan los archivos ya ejecutados antes de purgarse |
| Límite de filas por exportación     | Protección de performance para reportes muy grandes                     |
