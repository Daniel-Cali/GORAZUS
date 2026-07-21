# Database Audit — GORAZUS

> "Fase 1, Parte 1" (2026-07-21, rama `feature/database-audit`) — auditoría
> de calidad consolidada, pedida explícitamente como entregable propio. Los
> hallazgos de este documento **no son nuevos**: cada uno ya fue encontrado y
> analizado en detalle en una de las 3 auditorías previas de esta sesión
> ([AUDIT_FASE1_ENTERPRISE.md](./AUDIT_FASE1_ENTERPRISE.md),
> [DATABASE_HEALTH_REPORT.md](./DATABASE_HEALTH_REPORT.md),
> [AUDIT_DATABASE_ENTERPRISE_V2_FERRETERIA.md](./AUDIT_DATABASE_ENTERPRISE_V2_FERRETERIA.md)) —
> este documento los **consolida en un solo archivo de auditoría de calidad**,
> en el formato pedido, sin volver a re-analizar lo mismo tres veces. Cero
> DDL aplicado, cero cambio de schema — auditoría de solo lectura.

## 1. Duplicados y redundancias

| Chequeo                                                    | Resultado        | Detalle                                                                                                                                          |
| ---------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Tablas duplicadas (mismo propósito, dos nombres)           | ✅ 0 encontradas | [AUDIT_FASE1_ENTERPRISE.md §4](./AUDIT_FASE1_ENTERPRISE.md#4-verificación-en-vivo--nomenclatura-y-normalización-hallazgos-nuevos-de-esta-pasada) |
| Columnas duplicadas dentro de una misma tabla              | ✅ 0 encontradas | Verificado por inspección de `information_schema.columns` en el muestreo dirigido de la Fase 1                                                   |
| Índices duplicados                                         | ✅ 0 de 3.201    | [INDEX_CATALOG.md §3](./INDEX_CATALOG.md#3-optimización-aplicada-en-esta-fase-575-índices-fk-nuevos)                                             |
| Relaciones redundantes (2+ FK cubriendo la misma relación) | ✅ 0 encontradas | Sin hallazgos en el muestreo de `pg_constraint`                                                                                                  |

## 2. Relaciones huérfanas y dependencias

| Chequeo                                                          | Resultado                                                                            | Detalle                                                                                                                                                                       |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tablas huérfanas (sin FK entrante ni saliente)                   | ✅ 0 de 501                                                                          | [DATABASE_HEALTH_REPORT.md §4](./DATABASE_HEALTH_REPORT.md#4-validaciones-de-integridad-verificado-de-nuevo-tras-la-optimización)                                             |
| FK inválidas (`pg_constraint.convalidated = false`)              | ✅ 0 de 5.164                                                                        | [AUDIT_FASE1_ENTERPRISE.md §3](./AUDIT_FASE1_ENTERPRISE.md#3-verificación-en-vivo--estructura-general)                                                                        |
| Dependencias circulares entre schemas de módulos                 | ✅ 0 encontradas — regla de error de build, no advertencia                           | [docs/architecture/06-comunicacion-entre-modulos.md §1a](../architecture/06-comunicacion-entre-modulos.md#a-síncrona-in-process--a-través-de-la-fachada-pública)              |
| **FK reales que cruzan schemas de módulos de negocio distintos** | 🟠 185 encontradas — contradice la regla ya documentada de "ID suelto entre módulos" | [FOREIGN_KEYS.md §3](./FOREIGN_KEYS.md#3-hallazgo-real-185-fk-cruzan-schemas-de-módulos-de-negocio) — **pendiente de decisión de negocio/ADR, no se corrige unilateralmente** |

## 3. Índices

| Chequeo                                     | Resultado                                                                                                                             | Detalle                                                                                                                                        |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Índices faltantes en columnas FK de negocio | ✅ 575 agregados (gap cerrado en fase previa)                                                                                         | [INDEX_CATALOG.md §3](./INDEX_CATALOG.md#3-optimización-aplicada-en-esta-fase-575-índices-fk-nuevos)                                           |
| Índices duplicados                          | ✅ 0                                                                                                                                  | ídem                                                                                                                                           |
| Índices sin uso (0 escaneos)                | 🟢 Presentes, pero esperado — particiones de meses futuros/tablas sin tráfico real en dev, no una señal de rendimiento válida todavía | [DATABASE_HEALTH_REPORT.md §6](./DATABASE_HEALTH_REPORT.md#6-segunda-pasada-2026-07-20--auditoría-solicitada-explícitamente-fase-01--database) |

## 4. Nomenclatura y tipos de datos

| Chequeo                                                   | Resultado                                                                                                     | Detalle                                                                                                                                                                                                              |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| snake_case consistente en tablas/columnas                 | ✅ 0 violaciones                                                                                              | [AUDIT_FASE1_ENTERPRISE.md §6](./AUDIT_FASE1_ENTERPRISE.md#6-convenciones-globales-y-nomenclatura--verificación-de-vigencia-entregables-5-y-6)                                                                       |
| Nombres de tabla en plural                                | ✅ Patrón dominante sin excepciones                                                                           | ídem                                                                                                                                                                                                                 |
| Columnas booleanas sin convención de prefijo formalizada  | 🟡 36 columnas (`accepts_postings`, `succeeded`, `matched`, etc.) — cosmético, no rompe ninguna regla escrita | [AUDIT_FASE1_ENTERPRISE.md §5.3](./AUDIT_FASE1_ENTERPRISE.md#53--36-columnas-booleanas-sin-convención-de-prefijo-formalizada) — **no se renombra sin autorización** (cambio de alto riesgo para beneficio cosmético) |
| Tipos de datos inconsistentes entre columnas equivalentes | ✅ 0 encontrados en el muestreo dirigido                                                                      | Verificado en `numeric(18,6)` para cantidades, `uuid` para toda PK/FK, consistente en las 501 tablas                                                                                                                 |
| Formas normales (1NF/2NF/3NF/BCNF)                        | ✅ Sin violaciones reales — 2 columnas `ARRAY` justificadas                                                   | [AUDIT_DATABASE_ENTERPRISE_V2_FERRETERIA.md §3](./AUDIT_DATABASE_ENTERPRISE_V2_FERRETERIA.md#3-verificación-explícita-de-formas-normales-1nf--2nf--3nf--bcnf)                                                        |

## 5. Comparación funcional de referencia

Instrucción explícita del pedido: usar como referencia los **procesos de
negocio**, nunca copiar tablas ni relaciones.

### 5.1 — Referencia académica: "Sistema de Base de Datos para una Ferretería"

Consultada (vista previa pública, documento con paywall completo — Scribd,
Lucero Pérez Morales, tesis sobre Ferretería Méndez S.A. de C.V.). Alcance
identificado: 4 procesos — gestión de productos, control de inventario,
procesamiento de pedidos, administración de nómina. **GORAZUS ya cubre los 4
procesos a escala Enterprise** (multiempresa/multisucursal/particionado,
ver [productos](./00-modelo-general.md), [inventario](./00-modelo-general.md),
[ventas/compras](./00-modelo-general.md), [nómina](./00-modelo-general.md)) —
la referencia confirma que no falta ningún proceso central del rubro, no
revela ningún gap nuevo. No se copió ninguna tabla ni relación de esa fuente.

### 5.2 — ERP comerciales de referencia

| ERP                                     | Qué se comparó                                                        | Resultado                                                                                                                                                                            |
| --------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SAP Business One                        | Procesos de PyME/distribución (compras, inventario, ventas, finanzas) | Ya cubierto — ver [architecture/48-erp-enterprise-readiness.md](../architecture/48-erp-enterprise-readiness.md) para el comparativo completo contra el tier enterprise (SAP S/4HANA) |
| Microsoft Dynamics 365 Business Central | Procesos de gestión financiera y cadena de suministro SMB             | Ya cubierto — mismo documento                                                                                                                                                        |
| Oracle NetSuite                         | Procesos cloud ERP multiempresa                                       | Ya cubierto — mismo documento, y comparado explícitamente en la Fase 5 de arquitectura                                                                                               |
| Odoo Enterprise                         | Modularidad y procesos de distribución                                | Ya cubierto — ver [AUDIT_DATABASE_ENTERPRISE_V2_FERRETERIA.md §5](./AUDIT_DATABASE_ENTERPRISE_V2_FERRETERIA.md#5-comparación-funcional--erp-de-nivel-smbdistribución)                |
| ERPNext                                 | Procesos de manufactura/distribución open source                      | Ya cubierto — mismo documento                                                                                                                                                        |

**Único gap funcional real identificado** (heredado de la auditoría
inmediatamente anterior, no nuevo en esta pasada): ausencia de campos de
clasificación de materiales peligrosos/hoja de seguridad en
`products.products` — ver
[AUDIT_DATABASE_ENTERPRISE_V2_FERRETERIA.md §4.1](./AUDIT_DATABASE_ENTERPRISE_V2_FERRETERIA.md#41--detalle-del-gap-materiales-peligrosos).
No se agrega en esta fase (solo auditoría, sin DDL).

## 6. Escalabilidad y rendimiento

| Chequeo                                          | Resultado                                                                               | Detalle                                                                                                                       |
| ------------------------------------------------ | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Particionamiento aprovisionado                   | ✅ 27 de 27 tablas                                                                      | [DATABASE_HEALTH_REPORT.md §1.1](./DATABASE_HEALTH_REPORT.md#-11--particionamiento-era--crítico--resuelto)                    |
| Row-Level Security forzado                       | 🟡 500 de 501 (`core.restore_test_logs` pendiente de confirmación)                      | [DATABASE_HEALTH_REPORT.md §2.2](./DATABASE_HEALTH_REPORT.md#-22--corerestore_test_logs-es-la-única-tabla-sin-rls-habilitado) |
| Rol de aplicación sin superusuario/bypass de RLS | ✅ Corregido y verificado (`rolsuper=false`, `rolbypassrls=false`)                      | [SECURITY.md §2.1](./SECURITY.md#-21--corregido-más-tarde-el-mismo-día-fase-05-2026-07-20--re-verificado-en-vivo-2026-07-21)  |
| Datos reales de carga para `EXPLAIN ANALYZE`     | 🟡 Sin datos de producción todavía — procedimiento ya fijado, pendiente de volumen real | [PERFORMANCE.md](./PERFORMANCE.md)                                                                                            |

## 7. Resumen priorizado

1. 🟢 **Sin acción requerida** — duplicados, huérfanas, formas normales,
   nomenclatura estructural, particionamiento: todo limpio.
2. 🟡 **Cosmético, no urgente** — 36 columnas booleanas sin prefijo
   uniforme; documentar la convención hacia adelante sin renombrar lo
   existente.
3. 🟠 **Pendiente de decisión de negocio, no de esta auditoría** — 185 FK
   cross-schema (requiere ADR), RLS de `core.restore_test_logs`
   (requiere confirmación de si es intencional).
4. 🔵 **Gap funcional real, acotado** — materiales peligrosos/hoja de
   seguridad en `products.products`; recomendado para una fase de
   aplicación de DDL futura, no diseñado ni aplicado aquí.

**Ningún hallazgo de este documento bloquea el uso o crecimiento del
sistema.**

## 8. Trazabilidad

Este documento no re-audita nada — es la consolidación, en el formato de
"auditoría de calidad" pedido, de tres auditorías ya realizadas en esta
misma sesión el mismo día. Ver
[PROJECT_STATUS.md](../../PROJECT_STATUS.md) para cómo esto encaja en el
estado general del proyecto.
