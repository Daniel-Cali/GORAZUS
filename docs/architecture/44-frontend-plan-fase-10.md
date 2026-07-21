# 44 — Frontend: mapeo y gate de backend (Fase 10)

> Versión 1.0 — 2026-07-13. El propio pedido puso una condición
> explícita: **"Solo cuando el backend esté bien definido."** Este
> documento existe primero para evaluar esa condición punto por punto
> —no todos los 9 la cumplen igual— y después para actuar en
> consecuencia: cerrar lo que sí está listo, y no avanzar en lo que no.

## 1. Mapeo: los 9 puntos pedidos → ¿pasa el gate de backend?

| #   | Pedido               | ¿Backend bien definido?                                                      | Estado / documento                                                                                                                                      |
| --- | -------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Dashboard            | ✅ Sí — módulo de composición pura, sin schema propio, ya acotado            | [04-catalogo-modulos-negocio.md](./04-catalogo-modulos-negocio.md#dashboard-como-composición-pura-igual-que-pos) — ver §2                               |
| 2   | Layouts              | ✅ Sí (no depende de backend)                                                | [29-frontend-enterprise.md §3](./29-frontend-enterprise.md#3-layouts) — ya completo                                                                     |
| 3   | Componentes          | ✅ Sí (no depende de backend)                                                | [29 §6-7](./29-frontend-enterprise.md#6-componentes) — ya completo, la sección más extensa del documento                                                |
| 4   | Formularios          | ✅ Sí (no depende de backend)                                                | [03-arquitectura-modulos-frontend.md §4](./03-arquitectura-modulos-frontend.md#4-formularios-react-hook-form--zod) — ya completo, React Hook Form + Zod |
| 5   | Reportes             | ✅ Sí — Fase 24/25 completas                                                 | [28-modulo-reports-bi.md](./28-modulo-reports-bi.md) + [41-modulo-bi.md](./41-modulo-bi.md)                                                             |
| 6   | Gráficas             | ✅ Sí — backend completo, librería ya decidida                               | [29 §8.1](./29-frontend-enterprise.md#81-librería-de-gráficos--no-estaba-decidida-agregado-por-fase-7) (Recharts, Fase 7)                               |
| 7   | POS                  | 🟡 Backend sí, **frontend/hardware no** — es precisamente el gap ya señalado | Cerrado ahora — [45-modulo-pos-frontend.md](./45-modulo-pos-frontend.md)                                                                                |
| 8   | Portal del cliente   | ❌ **No pasa el gate** — cero backend                                        | Ver §3 — no se diseña                                                                                                                                   |
| 9   | Portal del proveedor | ❌ **No pasa el gate** — cero backend                                        | Ver §3 — no se diseña                                                                                                                                   |

**7 de 9 ya cumplen el gate y no requerían diseño nuevo — solo
mapeo.** POS cumple el gate de backend (la venta en sí ya está
resuelta en `ventas`) pero tenía el frontend/hardware sin diseñar,
exactamente el gap que el roadmap ya señalaba — se cierra en un
documento aparte por su tamaño (§45). Los dos portales **fallan el
propio gate que el usuario puso** — no hay nada de backend contra qué
diseñar frontend.

## 2. Dashboard (home panel) — por qué no necesita documento propio

`dashboard` ya está acotado con precisión suficiente para su tamaño
real: sin schema, sin entidades propias, un ensamblador de widgets que
consume las proyecciones de solo lectura que cada módulo ya expone,
visible según los permisos que el usuario ya tiene sobre esos módulos
—nada nuevo que autorizar—. La mecánica de renderizado (qué widget usa
qué `chart_type`/`AppShell`/`ui-kit`) ya está resuelta de forma
genérica en `29-frontend-enterprise.md` (Layouts §3, Componentes §6-7,
Gráficas §8.1). Escribir un documento de módulo dedicado para
"ensambla widgets de solo lectura, sin lógica propia" sería
sobre-documentar algo que ya es, por diseño, así de simple —mismo
principio de proporcionalidad ya aplicado en toda la sesión (no se
inventa alcance donde no lo hay).

## 3. Portal del cliente y Portal del proveedor — fallan el gate, no se diseñan

Verificado a fondo: **cero mención en toda la documentación** —ni
tabla, ni columna, ni fila de roadmap, ni menú, ni siquiera un
concepto de "usuario externo" en el modelo de IAM. `core.users` es
exclusivamente para usuarios internos/empleados del sistema
(`13-modulo-auth.md`, `15-modulo-security.md`) — no existe
`customer_id`/`supplier_id` en ninguna tabla de usuarios, ni un
mecanismo de acceso con alcance restringido a "solo mis propios
datos" para alguien que no es empleado. La única traza en todo el
proyecto es una frase entre paréntesis en
[16-modulo-customers.md §5](./16-modulo-customers.md#5-estados-de-cuenta) —
"cuando un usuario o **el propio cliente (portal)** solicita un estado
de cuenta"— que es una idea de pasada, no una decisión de diseño.

Esto no es un gap de documentación (como Producción o Servicios
tenían, con modelo de datos completo esperando solo el flujo) — es
**backend inexistente**, mismo tamaño de vacío que las 11 integraciones
sin antecedente de la Fase 8. Diseñar el frontend de un portal antes
de tener siquiera el modelo de autenticación externa, el alcance de
datos visible, y las reglas de qué puede hacer un cliente/proveedor
por sí mismo, sería construir sobre nada — exactamente lo que el
propio pedido de esta fase pidió no hacer ("solo cuando el backend
esté bien definido").

**Lo que haría falta antes de poder diseñar el frontend de cualquiera
de los dos portales** (para que quede como referencia futura, no como
trabajo iniciado):

1. Decisión de negocio: ¿qué puede hacer un cliente/proveedor por sí
   mismo? (¿solo consultar? ¿descargar comprobantes? ¿aprobar
   cotizaciones? ¿confirmar recepciones?) — determina el alcance real,
   no se adivina.
2. Modelo de identidad externa — probablemente una tabla nueva
   (`core.external_users` o similar) distinta de `core.users`, con
   `customer_id`/`supplier_id` y un mecanismo de autenticación propio
   (no necesariamente JWT interno — podría ser un link firmado de un
   solo uso, un código enviado por email, u otro mecanismo de menor
   fricción que login/password completo).
3. Alcance de datos — qué endpoints/proyecciones existen ya (estados
   de cuenta de `clientes`, historial de compras de `proveedores`) y
   cuáles habría que crear.

No se avanza en ninguno de los 3 sin confirmación explícita — mismo
criterio aplicado a las 11 integraciones de la Fase 8.

## 4. Trazabilidad

| Punto solicitado                                                 | Pasa el gate                                   | Acción                                                   |
| ---------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------- |
| Dashboard, Layouts, Componentes, Formularios, Reportes, Gráficas | ✅ Sí                                          | Ya completos, solo mapeo (§1-2)                          |
| POS                                                              | 🟡 Backend sí, frontend/hardware cerrado ahora | [45-modulo-pos-frontend.md](./45-modulo-pos-frontend.md) |
| Portal del cliente, Portal del proveedor                         | ❌ No                                          | No diseñado — requiere backend inexistente primero (§3)  |
