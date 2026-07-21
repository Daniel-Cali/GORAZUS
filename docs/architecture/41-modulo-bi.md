# 41 — Business Intelligence: cierre de gaps y plan (Fase 7)

> Versión 1.0 — 2026-07-13. A diferencia de las Fases 2-6, acá el
> módulo base ya estaba completo
> ([28-modulo-reports-bi.md](./28-modulo-reports-bi.md), ✅ desde
> antes de esta sesión) — el trabajo real fue mapear los 9 puntos
> pedidos, cerrar 3 gaps pequeños reales (charts, reportes ad-hoc,
> export a imagen) con columnas nuevas, y **dejar explícitamente fuera**
> Power BI y Forecast/ML por el mismo criterio de gobernanza ya
> aplicado repetidas veces esta sesión (LDAP/AD en Fase 3, Taxes en
> Fase 4, Routing/MRP en Producción). Sin código.

## 1. Mapeo: los 9 puntos pedidos → estado real

| #   | Pedido     | Estado                        | Documento                                                                                          |
| --- | ---------- | ----------------------------- | -------------------------------------------------------------------------------------------------- |
| 1   | Dashboards | ✅ Completo (ya existía)      | [28-modulo-reports-bi.md §4](./28-modulo-reports-bi.md)                                            |
| 2   | KPIs       | ✅ Completo (ya existía)      | [28 §5](./28-modulo-reports-bi.md)                                                                 |
| 3   | Charts     | 🆕 Gap cerrado ahora          | `dashboard_widgets.chart_type` + decisión de librería (Recharts) — ver §2                          |
| 4   | Reports    | ✅ Completo (ya existía)      | [28 §1](./28-modulo-reports-bi.md)                                                                 |
| 5   | PDF        | ✅ Completo (Fase 5)          | [32-core-platform/08 §4](./32-core-platform/08-frameworks-de-infraestructura.md#4-template-engine) |
| 6   | Excel      | ✅ Completo (Fase 5)          | [32-core-platform/10 §9](./32-core-platform/10-utilidades-comunes.md#9-serialization-utilities)    |
| 7   | Power BI   | ❌ Fuera de alcance por ahora | Ver §3 — no se diseña especulativamente                                                            |
| 8   | Forecast   | ❌ Fuera de alcance por ahora | Ver §4 — mismo criterio ya aplicado a Fase 27 (IA) del roadmap                                     |
| 9   | Indicators | ✅ Completo (ya existía)      | [28 §5](./28-modulo-reports-bi.md)                                                                 |

**6 de 9 ya estaban completos. 3 se cerraron con gaps puntuales**
(Charts, más 2 gaps adicionales encontrados al verificar los menús —
Reportes Personalizados y Exportar a Imagen, ver §2) **y 2 se dejan
explícitamente fuera** (Power BI, Forecast).

## 2. Gaps reales cerrados

**Charts:** `28-modulo-reports-bi.md` nunca mencionaba cómo se
renderiza visualmente un widget de dashboard — ni una columna de tipo
de gráfico, ni una librería decidida (a diferencia de tablas, PDF y
Excel, que sí tenían resolución explícita en otros documentos). Se
agregó `reports.dashboard_widgets.chart_type` (`table`/`line`/`bar`/
`pie`/`area`/`number`) en `sql/19_reports.sql`, y se decidió la
librería —**Recharts**— en
[29-frontend-enterprise.md §8.1](./29-frontend-enterprise.md#81-librería-de-gráficos--no-estaba-decidida-agregado-por-fase-7)
(razones y alternativas descartadas ahí, no se repiten acá).

**Reportes Personalizados (ad-hoc):** al verificar
`docs/menus/20-reportes.md` contra el schema real se encontró que el
"Generador de Reportes Personalizados" citaba tablas
`reportes.reporte_personalizado`/`reporte_personalizado_campo` que no
existen — `reports.report_definitions` es un catálogo fijo
(desarrollador define `source_module`+`base_query_name`), no soporta
que un usuario arme un reporte eligiendo campos/filtros/agrupaciones
en el momento. Se agregaron `is_ad_hoc BOOLEAN` +
`ad_hoc_config JSONB` a `report_definitions` — cuando `is_ad_hoc =
true`, `ad_hoc_config` guarda la selección del usuario (campos,
filtros, agrupaciones) aplicada sobre la misma `base_query_name`
subyacente. No se crearon 2 tablas nuevas como el menú sugería —
`metadata`/`ad_hoc_config` en JSONB es proporcional al alcance real
(configuración de un reporte, no una entidad transaccional con
volumen propio).

**Exportar Tablero a Imagen:** `docs/menus/21-bi.md` promete exportar
un tablero a PDF/Imagen, pero `report_exports.export_format` solo
aceptaba `'pdf'`/`'xlsx'`/`'csv'`. Se agregó `'image'` al `CHECK`.

**Aclaración sin cambio de schema — "Tablero BI":**
`docs/menus/21-bi.md` cita tablas `bi.tablero`/`bi.tablero_widget`
que tampoco existen — no es un gap real, es el mismo objeto ya
diseñado en `28-modulo-reports-bi.md §4`
(`reports.dashboards`/`dashboard_widgets`), simplemente referenciado
con un alias en español inconsistente con el resto de ese mismo
documento (que sí usa los nombres reales para `bi.indicador`→
`bi.indicators`, `bi.alerta`→`bi.bi_alerts`). "Tablero BI" en el menú
de BI es la misma pantalla de Dashboards ya diseñada, presentada
dentro de la navegación de BI — no se duplica el mecanismo.

## 3. Power BI: no se diseña especulativamente

Verificado: cero mención de Power BI, OData, o cualquier conector de
BI externo en toda la documentación — la única referencia tangencial
es que `security.oauth_clients`
([13-modulo-auth.md §3](./13-modulo-auth.md#3-oauth)) ya contempla,
como ejemplo genérico entre otros, que un "BI externo" podría ser un
cliente OAuth2 más. Eso es un mecanismo genérico de acceso delegado
ya diseñado, **no** un conector Power BI específico (no hay endpoint
OData, no hay definición de qué tablas/vistas se exponen, no hay
formato de autenticación específico de Power BI).

No se diseña un conector dedicado sin necesidad de negocio confirmada
— mismo criterio ya aplicado a LDAP/Active Directory en la Fase 3
([33-iam-plan-de-implementacion-fase-3.md §2](./33-iam-plan-de-implementacion-fase-3.md#2-ldap-y-active-directory-no-se-diseñan-especulativamente)).
Si en el futuro se confirma la necesidad, el punto de partida ya
existe (OAuth2 + las vistas materializadas de `bi.data_cubes` ya
diseñadas en `28-modulo-reports-bi.md §6`) — probablemente un endpoint
OData de solo lectura sobre esas mismas vistas, evaluado en su
momento, no ahora.

## 4. Forecast: mismo criterio que la Fase 27 (IA) del roadmap

`bi.forecast_models`/`bi.forecasts` ya existen y están documentados en
`28-modulo-reports-bi.md §6` con alcance explícito: es la **forma del
dato** (un modelo configurado genera predicciones con fecha y valor),
sin motor de entrenamiento/reentrenamiento modelado — eso es
"responsabilidad de la capa de aplicación o de un servicio externo de
ML, fuera de alcance" (cita textual del documento original, no se
cambia acá).

Esto es consistente, no un gap nuevo: `00-roadmap-fases.md` ya marca
la Fase 27 (Inteligencia Artificial) como "❌ Pendiente de definir
alcance" explícitamente por esta misma razón — "¿forecasting sobre
`bi.forecasts`? ¿asistente? ¿otra cosa? — no hay necesidad de negocio
concreta todavía". No se diseña el motor de forecasting en este
documento por la misma razón que no se diseñó Routing/MRP en
Producción — sería tan especulativo como esos dos.

## 5. Trazabilidad

| Punto solicitado                      | Dueño real       | Novedad de este documento                                                   |
| ------------------------------------- | ---------------- | --------------------------------------------------------------------------- |
| Dashboards, KPIs, Reports, Indicators | `reports`/`bi`   | Sin cambios — ya completos en 28                                            |
| Charts                                | `reports`        | `chart_type` agregado + librería Recharts decidida (§2)                     |
| PDF, Excel                            | Core Platform    | Sin cambios — ya completos en Fase 5                                        |
| Reportes Personalizados               | `reports`        | `is_ad_hoc`/`ad_hoc_config` agregados — cierra gap real menú-vs-schema (§2) |
| Exportar a Imagen                     | `reports`        | `'image'` agregado a `export_format` (§2)                                   |
| Power BI                              | Fuera de alcance | Señalado explícitamente, no diseñado (§3)                                   |
| Forecast                              | Fuera de alcance | Mismo criterio que Fase 27 IA del roadmap (§4)                              |
