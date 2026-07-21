# 05 — Estrategia de Auditoría

## 1. Las cuatro capas de auditoría

Un ERP Enterprise necesita responder cuatro preguntas distintas, y cada
una tiene un mecanismo distinto — mezclarlas en una sola tabla gigante
sería tanto ineficiente como difícil de consultar.

| Pregunta                                                                    | Mecanismo                                                                                                                               | Dónde                                   |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| "¿Quién creó/modificó/borró este registro puntual y cuándo?"                | Columnas universales (`created_by`, `updated_by`, `deleted_by`, `*_at`)                                                                 | En la fila misma, toda tabla            |
| "¿Qué cambió exactamente, campo por campo, en cualquier tabla del sistema?" | Trigger genérico → `core.audit_logs`                                                                                                    | Tabla centralizada                      |
| "¿Cómo se veía este registro completo en un momento del pasado?"            | `core.change_history` (snapshot completo, no solo diff)                                                                                 | Tabla centralizada, uso selectivo       |
| "¿Por qué pasó de estado A a estado B este documento de negocio?"           | `<entidad>_status_history` por módulo (ver [02-modelo-logico §1.1](./02-modelo-logico.md#11-patrón-de-estado-_status--_status_history)) | Por módulo, solo entidades con workflow |

## 2. `core.audit_logs`: captura genérica de cambios

Trigger `AFTER INSERT OR UPDATE OR DELETE` (ver
[26_triggers.sql](./sql/26_triggers.sql)) aplicado a toda tabla marcada
como auditable (todas por defecto, con opt-out explícito solo para
tablas de puro cacheo/derivadas). Cada fila de `audit_logs` registra:

```
table_schema, table_name, row_id, operation ('INSERT'|'UPDATE'|'DELETE'),
old_values JSONB, new_values JSONB, changed_columns TEXT[],
actor_user_id, occurred_at
```

- `old_values`/`new_values` guardan solo las columnas que cambiaron
  (más `id` y las de scope), no la fila completa — eso es
  responsabilidad de `change_history` cuando se necesita snapshot
  completo, evitando duplicar el mismo dato dos veces por defecto.
- El trigger corre `SECURITY DEFINER` y **nadie tiene permiso de
  `UPDATE`/`DELETE` sobre `audit_logs`**, ni siquiera un rol
  administrador de aplicación — solo `INSERT` vía el trigger y
  `SELECT` para consulta. Esto es lo que hace la auditoría
  legalmente confiable: si se pudiera editar, no serviría como
  evidencia.

## 3. `core.change_history`: snapshot completo selectivo

No se activa por defecto en las 498 tablas — solo en las entidades
donde reconstruir el estado histórico completo tiene valor de negocio
real: documentos fiscales (`invoices`, `purchase_invoices`,
`journal_entries`), contratos (`sales_contracts`,
`service_contracts`), proyectos (`projects.projects` — agregado por
[architecture/40-modulo-projects.md §7](../architecture/40-modulo-projects.md#7-auditoría-y-particionamiento),
mismo criterio que un contrato: registro de larga vida con
presupuesto, no solo un catálogo), y configuración crítica
(`chart_of_accounts`, `tax_rates`). Guarda la fila completa serializada en cada cambio, con
el mismo trigger genérico pero un flag de tabla distinto. Es más
costoso en espacio — por eso el uso selectivo, no universal.

## 4. Auditoría de seguridad separada

`security.security_audit_logs` (ver
[02-security.md](./logico/02-security.md)) es un log **distinto** de
`core.audit_logs`: captura eventos que no son "cambios de datos" sino
"eventos de seguridad" (login fallido, escalamiento de permiso, acceso
denegado por RLS, rotación de clave). Se mantiene separado porque su
consumidor típico (equipo de seguridad, SIEM externo) y su régimen de
retención son distintos al de auditoría de negocio.

## 5. Reconstrucción de estado histórico ("time travel")

Para las tablas con `change_history` activo, reconstruir el estado a
una fecha es:

```sql
SELECT (snapshot->>'total_amount')::numeric
FROM core.change_history
WHERE table_schema = 'sales' AND table_name = 'invoices' AND row_id = :id
  AND occurred_at <= :fecha_objetivo
ORDER BY occurred_at DESC
LIMIT 1;
```

Para el resto (solo `audit_logs`, sin snapshot completo), la
reconstrucción es aplicar los diffs en orden desde el estado actual
hacia atrás — más costoso computacionalmente, aceptable porque es un
caso de uso de auditoría puntual, no una query de aplicación.

## 6. Retención y purga

`core.data_retention_policies` define, por `entity_type`, cuánto tiempo
se conserva cada tipo de auditoría antes de purgarse o archivarse a
almacenamiento frío (ver
[08-estrategia-respaldo.md](./08-estrategia-respaldo.md#4-archivado-en-frío)).
Regla general: los datos fiscales/contables se retienen según el
mínimo legal del país de la empresa (`configuration.fiscal_regimes`),
nunca menos — la purga automática respeta ese mínimo como piso duro,
no como sugerencia.

## 7. Costo de performance y mitigación

Un trigger síncrono en cada `INSERT`/`UPDATE`/`DELETE` de 494 tablas
tiene costo real. Mitigación:

- Las tablas de altísimo volumen puramente operativo y de bajo valor de
  auditoría por fila individual (`inventory.stock`, saldos calculados)
  quedan con **opt-out** de `audit_logs` fila-por-fila — su historia ya
  vive en `stock_movements`, que es en sí misma un log de auditoría de
  negocio.
- Para el resto, el trigger es liviano (un solo `INSERT` a una tabla
  particionada por fecha, ver
  [07-estrategia-particionamiento.md](./07-estrategia-particionamiento.md))
  y se mide su overhead real en carga antes de decidir mover a captura
  asíncrona vía replicación lógica/CDC (Debezium u equivalente) si
  algún módulo específico lo requiere en producción.

## 8. Notas de portabilidad

El trigger genérico usa `TG_OP`, `to_jsonb(NEW)`/`to_jsonb(OLD)` — todo
disponible en MySQL/MariaDB (con `JSON` en vez de `JSONB`) y SQL Server
(con `OUTPUT` clauses o `CDC` nativo, mecanismo distinto pero
equivalente en resultado). La imposibilidad de `UPDATE`/`DELETE` sobre
`audit_logs` se logra con `GRANT`/`REVOKE` estándar, portable sin
cambios.
