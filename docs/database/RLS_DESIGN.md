# RLS Design — GORAZUS

> "Database Enterprise v1.0" — Fase 1, Parte 8 (2026-07-21). **Este es el
> hallazgo más importante de las 8 partes de esta auditoría.** Row-Level
> Security ya está activo y genuinamente forzado (`FORCE ROW LEVEL
SECURITY`, rol de aplicación sin bypass, verificado en la Parte 1) —
> pero **solo a nivel de Tenant**. No existen políticas de RLS para
> Empresa ni Sucursal, verificado ahora con precisión total contra
> `pg_policies` real.

## 1. Hallazgo crítico — verificado con precisión total

```sql
SELECT DISTINCT policyname FROM pg_policies;
```

**Resultado real:** solo 3 políticas nombradas existen en toda la base:
`tenant_isolation` (700 instancias — una por tabla con RLS), y 2
políticas técnicas puntuales (`session_lookup_by_refresh_hash`,
`tenant_lookup_by_slug`, ambas de `core`, sin relación con
multiempresa/multisucursal).

**Definición real de `tenant_isolation`** (idéntica en las 700
instancias, verificado en `sales.sales_orders`/`sales.invoices` y por
extensión en el resto):

```sql
(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)
OR (tenant_id = '00000000-0000-0000-0000-000000000000'::uuid)
```

**No existe ninguna política que compare `company_id` ni `branch_id`
contra una variable de sesión** — confirmado buscando
`current_company`/`current_branch` en el texto de todas las políticas
reales: **0 resultados**.

## 2. Qué significa esto exactamente (ni más ni menos)

- **El aislamiento entre Tenants (empresas cliente de GORAZUS, distintas
  organizaciones) es real y está forzado por Postgres**, no solo por
  disciplina de aplicación — esto ya estaba verificado y sigue siendo
  cierto.
- **El aislamiento entre Empresas de un mismo Tenant** (el caso de un
  Grupo Corporativo/Holding con varias `company_id` bajo el mismo
  `tenant_id`, diseñado en Fase 5 de arquitectura) **depende
  exclusivamente de que `Repository Base` inyecte el filtro
  `company_id` en cada consulta de aplicación** — si ese filtro tuviera
  un bug, o si alguien consultara la base directamente (un reporte
  ad-hoc, una herramienta de BI externa, un script de mantenimiento con
  el rol de aplicación), **Postgres no lo impediría**.
- Lo mismo aplica a **Sucursal** dentro de una Empresa.

## 3. Severidad — evaluación honesta, sin exagerar ni minimizar

| Escenario                                                                                                                          | Severidad real                                                                                                                             |
| ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Tenant con una sola Empresa y una sola Sucursal (la mayoría de PyMEs)                                                              | 🟢 Ninguna — no hay otra Empresa/Sucursal de la que aislarse dentro del mismo Tenant                                                       |
| Tenant con múltiples Empresas (Grupo Corporativo, Fase 5) sin RLS de Empresa                                                       | 🟠 Real — la separación entre Empresas del mismo grupo depende 100% de la aplicación, sin segunda capa de defensa a nivel de base de datos |
| Cualquier acceso que no pase por `Repository Base` (BI directo, script de mantenimiento, consulta ad-hoc con el rol de aplicación) | 🔴 Real — Postgres permitiría ver/escribir datos de cualquier Empresa/Sucursal del mismo Tenant sin que el filtro de aplicación aplique    |

**No es una vulnerabilidad explotable desde fuera** (el aislamiento de
Tenant, la primera línea real de defensa contra otros clientes de
GORAZUS, sigue intacta) — es una ausencia de **defensa en profundidad**
dentro de un mismo Tenant multiempresa, exactamente el patrón que RLS
está diseñado para prevenir y que el resto del modelo ya usa para
Tenant.

## 4. Diseño de las políticas faltantes (especificado, no aplicado)

Mismo patrón que `tenant_isolation`, aplicado a `company_id` y
`branch_id`, con la misma convención de sentinela nulo:

```sql
-- Por cada tabla con columna company_id (la gran mayoría de las 501):
CREATE POLICY company_isolation ON <schema>.<tabla>
  USING (
    company_id IS NULL
    OR company_id = (current_setting('app.current_company_id', true))::uuid
    OR company_id = '00000000-0000-0000-0000-000000000000'::uuid
  );

-- Por cada tabla con columna branch_id:
CREATE POLICY branch_isolation ON <schema>.<tabla>
  USING (
    branch_id IS NULL
    OR branch_id = (current_setting('app.current_branch_id', true))::uuid
    OR branch_id = '00000000-0000-0000-0000-000000000000'::uuid
  );
```

**Por qué `IS NULL OR`:** `company_id`/`branch_id` son nullable por
diseño ("NULL = aplica a todo el Tenant/Empresa" — regla ya fijada en
`01-modelo-conceptual.md` y reafirmada en `DATABASE_HEALTH_REPORT.md
§1.3`) — la política debe respetar esa semántica, no romperla.

**Complejidad de aplicar esto:** requiere (a) que `Security Context`
(`docs/ddd/16_domain_policies.md`) ya propague `company_id`/`branch_id`
activos a la sesión de Postgres (`current_setting`) igual que ya hace
con `tenant_id` — verificar que `TenantInterceptor`
(`09-seguridad-y-multiempresa.md §3`) también setea
`app.current_company_id`/`app.current_branch_id`, no solo
`app.current_tenant_id`; (b) generar y aplicar 2 políticas × ~450 tablas
con `company_id`/`branch_id` (la mayoría de las 501, excluyendo
catálogos globales sin alcance de empresa) — un cambio de alto volumen
de sentencias, aunque cada una es de bajo riesgo individual (aditiva, no
destructiva).

## 5. Por qué no se aplica en esta pasada

Mismo acuerdo de alcance de toda esta auditoría: solo documentación, sin
DDL contra `dev`. A diferencia de los gaps de columnas (Partes 1, 6 —
bajo volumen, 3-6 `ALTER` cada uno), este es un cambio de **~900
sentencias `CREATE POLICY`** (2 por tabla × ~450 tablas) — el de mayor
volumen de todos los identificados en las 8 partes, y el más importante
de aplicar cuando se autorice DDL real, dado que es el único de los
gaps encontrados con una dimensión de seguridad real (los demás son
funcionales).

## 6. Recomendación de secuencia si se autoriza

1. Confirmar que `Security Context` ya propaga `company_id`/`branch_id`
   a la sesión de Postgres (verificación de código, no de base de
   datos — fuera de alcance de esta auditoría).
2. Generar las políticas para un módulo piloto (`sales`, el más grande y
   más crítico) y verificar con pruebas reales antes de extender a los
   21 schemas.
3. Aplicar como migración `sql/36_*.sql` (append-only, mismo patrón ya
   usado).

## 7. Trazabilidad

Este hallazgo **no es nuevo como sospecha** —
`database/00-modelo-general.md §13` ya señalaba "falta política RLS de
`branch_isolation` (solo existen `tenant_isolation`/`company_isolation`)"
como gap conocido. **Lo que esta pasada corrige es la precisión del
hallazgo**: verificado ahora contra `pg_policies` real, `company_isolation`
**tampoco existe** — la afirmación previa de que sí existía no estaba
verificada contra la base real (mismo patrón de error ya encontrado y
corregido varias veces en esta sesión: una afirmación de documentación
que no se había confirmado contra el sistema real). Se corrige aquí con
la fuente exacta.

**Siguiente documento:** [SECURITY_REPORT.md](./SECURITY_REPORT.md).
