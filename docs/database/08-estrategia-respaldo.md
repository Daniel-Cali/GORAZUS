# 08 — Estrategia de Respaldo

## 1. Tres mecanismos, tres propósitos

| Mecanismo                                      | Propósito                                                     | Herramienta                                                                          |
| ---------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Respaldo físico continuo + WAL archiving       | Recuperación ante desastre de la instancia completa, con PITR | `pgBackRest`                                                                         |
| Respaldo lógico (`pg_dump`) programado         | Portabilidad, auditoría externa, exportación por tenant       | `pg_dump --format=custom`                                                            |
| Snapshot de volumen a nivel de infraestructura | Recuperación rápida de última instancia (minutos, no horas)   | Snapshot del proveedor de infraestructura, complementario — nunca el único mecanismo |

Un solo mecanismo no cubre todos los escenarios de falla: un snapshot
de volumen no sirve si el problema es corrupción lógica ya
propagada; un `pg_dump` semanal no sirve si se necesita restaurar a
"hace 20 minutos". Los tres coexisten.

## 2. Point-In-Time Recovery (PITR)

`pgBackRest` mantiene un respaldo base completo semanal +
archivado continuo de WAL, permitiendo restaurar a **cualquier segundo**
dentro de la ventana de retención — no solo al momento del último
backup completo. Esto es lo que responde a "un usuario borró por error
una tabla completa hace 40 minutos, hay que volver a 41 minutos atrás
sin perder nada de los últimos 40 minutos en otras tablas".

- **RPO objetivo: menor a 5 minutos** (determinado por la frecuencia de
  archivado de WAL, no por la frecuencia del backup completo).
- Backup completo: semanal. Incremental: diario. WAL: continuo,
  archivado cada segmento (streaming, no por lotes).

## 3. Respaldo lógico y exportación por tenant

Dado el modelo SaaS multi-tenant (ver
[01-modelo-conceptual §2](./01-modelo-conceptual.md#2-jerarquía-de-aislamiento-tenant--company--branch)),
existe una necesidad de negocio real que un backup físico completo no
resuelve: exportar/restaurar los datos de **un solo tenant** (migración
a instancia dedicada, cumplimiento ante solicitud de un cliente,
sandbox de soporte). Se implementa con una función dedicada (ver
[25_functions.sql](./sql/25_functions.sql)) que ejecuta `pg_dump` con
`--format=custom` sobre una conexión que ya tiene `app.current_tenant_id`
seteado — RLS filtra automáticamente el dump al alcance del tenant, sin
tener que enumerar manualmente las 494 tablas con un `WHERE`.

## 4. Archivado en frío

Las particiones desconectadas por antigüedad (ver
[07-estrategia-particionamiento.md §6](./07-estrategia-particionamiento.md#6-retención-y-archivado))
se exportan a un bucket de MinIO dedicado (`archive-cold`, ver
[08-infraestructura-y-despliegue.md](../architecture/08-infraestructura-y-despliegue.md#5-minio-buckets))
en formato comprimido antes de eliminarse de la base activa. Se
conservan según el mínimo legal de retención del país/régimen fiscal
aplicable (nunca menos), con metadatos suficientes (tenant, empresa,
rango de fechas, tabla origen) para poder reimportarse si una auditoría
lo exige años después.

## 5. Cifrado y ubicación

Todo respaldo (físico, lógico, snapshot) se cifra en reposo con una
clave distinta a la de cifrado de columna en producción (ver
[06-estrategia-seguridad.md §3](./06-estrategia-seguridad.md#3-cifrado)),
y se replica a una **segunda región/ubicación física** distinta de la
base productiva — un respaldo que vive en el mismo datacenter que la
base que protege no protege contra la falla más común (falla de
datacenter completo).

## 6. Pruebas de restauración: no negociable

Un respaldo nunca probado no es un respaldo, es una suposición. Se
programa (`core.scheduled_jobs`) una restauración completa **mensual**
a un entorno aislado, seguida de una verificación automatizada
(conteo de filas por tabla contra un checksum esperado, verificación de
integridad referencial). El resultado de cada prueba queda registrado
—si una prueba de restauración falla, es un incidente de severidad
alta, no una nota informativa.

## 7. Retención de respaldos

| Tipo                                      | Retención                                              |
| ----------------------------------------- | ------------------------------------------------------ |
| WAL continuo                              | 7 días (suficiente para PITR de incidentes operativos) |
| Backup completo diario/semanal            | 35 días                                                |
| Backup lógico mensual                     | 12 meses                                               |
| Backup lógico anual (cierre de ejercicio) | Según mínimo legal del país, nunca menor a 5 años      |
| Archivado en frío de particiones purgadas | Según mínimo legal del país (ver §4)                   |

## 8. Notas de portabilidad

`pgBackRest` y WAL archiving son mecanismos específicos de Postgres.
MySQL/MariaDB usan `mysqldump`/`mydumper` + binary log para PITR
equivalente; SQL Server usa backups nativos `FULL`/`DIFFERENTIAL`/`LOG`
con un modelo de recuperación muy similar en concepto (full + log
shipping). La exportación por tenant vía RLS es la pieza que menos
porta directamente — en un motor sin RLS nativo, se reemplaza por un
`pg_dump`-equivalente con `WHERE tenant_id = ?` explícito por tabla,
generado programáticamente contra el catálogo de tablas.
