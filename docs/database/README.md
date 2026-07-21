# Base de Datos GORAZUS — Documentación Enterprise

> Versión 1.0 — 2026-07-12. Diseño de base de datos para un ERP
> Enterprise (~700-1000 tablas) sobre PostgreSQL 17, con notas de
> portabilidad hacia MySQL 8, MariaDB y SQL Server. Este set de
> documentos es la **fuente de verdad del schema** de GORAZUS (ver
> [[decision_sql_crudo_fuente_de_verdad]] y
> [docs/architecture/02-arquitectura-modulos-backend.md](../architecture/02-arquitectura-modulos-backend.md#4-base-de-datos-sql-crudo-como-fuente-de-verdad-prisma-como-consumidor)).
> Prisma consume este schema vía introspección (`prisma db pull`); no
> lo gestiona.

## Cómo leer este set de documentos

Sigue el orden pedido: primero se decide **qué existe** (conceptual),
después **cómo se estructura exactamente** (lógico — inventario
completo de tablas), después **cómo se relaciona** (diagramas), y recién
entonces las estrategias operativas (índices, auditoría, seguridad,
particionamiento, respaldo, replicación, alta disponibilidad). El SQL
ejecutable es el último paso, no el primero — todo el SQL de
`sql/*.sql` es una consecuencia directa de las decisiones tomadas en
estos documentos, no al revés.

| #   | Documento                                                                      | Contenido                                                                                                                                                                                                                       |
| --- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | [00-modelo-general.md](./00-modelo-general.md)                                 | Vista consolidada: módulos, entidades, relaciones, dependencias, catálogos/maestras/transaccionales, y estrategias de multiempresa, multisucursal, auditoría, seguridad e índices — con trazabilidad al resto de los documentos |
| 1   | [01-modelo-conceptual.md](./01-modelo-conceptual.md)                           | Patrón universal (Tenant/Company/Branch + columnas base), entidades y relaciones de negocio por módulo, sin atributos completos                                                                                                 |
| 2   | [02-modelo-logico.md](./02-modelo-logico.md)                                   | Inventario completo de tablas (~700-1000) por módulo, con propósito y claves foráneas                                                                                                                                           |
| 2a  | [02a-restricciones-e-indices.md](./02a-restricciones-e-indices.md)             | Llave primaria universal, cardinalidad, restricciones e índices por rol de tabla — con ejemplo completo aplicado a un módulo real                                                                                               |
| 3   | [03-diagrama-relaciones.md](./03-diagrama-relaciones.md)                       | Diagramas ER (mermaid) por módulo y diagrama maestro de dependencias entre módulos                                                                                                                                              |
| 4   | [04-estrategia-indices.md](./04-estrategia-indices.md)                         | Qué se indexa, por qué, y con qué tipo de índice                                                                                                                                                                                |
| 5   | [05-estrategia-auditoria.md](./05-estrategia-auditoria.md)                     | Cómo se registra quién hizo qué, cuándo, y cómo se reconstruye el estado histórico                                                                                                                                              |
| 6   | [06-estrategia-seguridad.md](./06-estrategia-seguridad.md)                     | Row-Level Security, cifrado, roles de base de datos, gestión de secretos                                                                                                                                                        |
| 7   | [07-estrategia-particionamiento.md](./07-estrategia-particionamiento.md)       | Qué tablas se particionan, por qué clave, y cómo evoluciona con el tiempo                                                                                                                                                       |
| 8   | [08-estrategia-respaldo.md](./08-estrategia-respaldo.md)                       | Backups físicos/lógicos, PITR, retención, pruebas de restauración                                                                                                                                                               |
| 9   | [09-estrategia-replicacion.md](./09-estrategia-replicacion.md)                 | Réplicas de lectura, replicación lógica selectiva, uso por los otros módulos (BI, Reportes)                                                                                                                                     |
| 10  | [10-estrategia-alta-disponibilidad.md](./10-estrategia-alta-disponibilidad.md) | Failover, RPO/RTO objetivo, topología multi-nodo                                                                                                                                                                                |
| 11  | [11-estrategia-integridad.md](./11-estrategia-integridad.md)                   | Las cinco capas de integridad (entidad, dominio, referencial, definida por el usuario, transaccional/multiempresa) consolidadas — nuevo, auditoría Fase 1 (2026-07-21)                                                          |
| —   | [AUDIT_FASE1_ENTERPRISE.md](./AUDIT_FASE1_ENTERPRISE.md)                       | Auditoría Enterprise Fase 1 (2026-07-21) — índice de los 10 entregables pedidos, verificación en vivo, hallazgos nuevos                                                                                                         |
| —   | [sql/](./sql/)                                                                 | 34 archivos SQL ejecutables, numerados según el pedido original                                                                                                                                                                 |

## Principio rector de todo el diseño

Cada decisión de este set de documentos se mide contra tres preguntas:

1. **¿Sostiene 100M+ registros y miles de usuarios concurrentes sin
   rediseño?** (particionamiento, índices, aislamiento de tenant desde
   el día uno).
2. **¿Sostiene multiempresa/multisucursal/multialmacén/multimoneda sin
   excepciones ad-hoc?** (las dimensiones de "multi-" pedidas no son
   funcionalidades — son columnas de alcance presentes en el modelo
   base de cada tabla de negocio).
3. **¿Es auditable y reversible por diseño?** (soft delete, versión,
   metadata, quién/cuándo en cada fila — no como añadido posterior).

Ver el detalle del patrón universal que responde a estas tres preguntas
en [01-modelo-conceptual.md](./01-modelo-conceptual.md#1-el-patrón-universal-toda-tabla-de-negocio).
