# Performance — GORAZUS Frontend

> Cierra un gap real: ningún documento anterior fijaba presupuesto de carga ni
> estrategia de virtualización/memoización a nivel de frontend, aunque varias piezas
> ya estaban decididas por separado (code-splitting en `29 §2`, caching de POS en
> `docs/architecture/45-modulo-pos-frontend.md §5`). Este documento las consolida y
> cierra lo que faltaba. Ver [FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md).
> Sin código.

## 1. Presupuesto de carga (nuevo)

No fijado antes en ningún documento — se establece acá como objetivo verificable, no
aspiracional, para un ERP donde la persona 3.1 (cajero, POS) y 3.4 (operario de
almacén con lector desde celular, `docs/product/02_USER_PERSONAS.md`) dependen de
velocidad percibida:

| Métrica                                      | Objetivo      | Aplica a                                                            |
| -------------------------------------------- | ------------- | ------------------------------------------------------------------- |
| Bundle inicial (shell + login)               | < 200 KB gzip | Todo — es lo único que paga cualquier usuario antes de autenticarse |
| Bundle por feature (lazy chunk)              | < 150 KB gzip | Cada `modules/<x>/frontend`                                         |
| Time to Interactive (TTI) en red 4G simulada | < 3 s         | Dashboard tras login                                                |
| Largest Contentful Paint (LCP)               | < 2.5 s       | Toda pantalla de listado/detalle                                    |
| Interaction to Next Paint (INP)              | < 200 ms      | Captura en POS y formularios de alto volumen (ventas, compras)      |

Estos valores son el criterio de aceptación de performance en CI (ver
[TESTING.md §6](./TESTING.md#6-performance-testing)) — un PR que empuja el bundle de
una feature por encima de su presupuesto se marca para revisión explícita, no se
bloquea automáticamente (mismo criterio de "señal de alerta, no bloqueo automático"
ya usado para PRs multi-módulo en `docs/architecture/07-convenciones-y-estandares.md §3`).

## 2. Code-splitting y lazy loading

Mecanismo ya fijado en `29 §2` y detallado a nivel de ruta en
[ROUTING.md §3](./ROUTING.md#3-code-splitting-por-módulo). Este documento agrega el
criterio de **cuándo** dividir más allá del límite por feature:

- Una página con una dependencia pesada de uso poco frecuente dentro de una feature
  (p. ej. un editor de fórmulas de BOM en `produccion`, un visor de PDF dentro de
  `documentos`) se divide en un chunk propio con `React.lazy()` adicional, anidado
  dentro del chunk de la feature — no todo lo que entra a una feature va en el mismo
  bundle solo porque comparte carpeta.
- Los diccionarios de i18n por feature (`FRONTEND_ARCHITECTURE.md §8`) se cargan en
  el mismo punto de entrada que el chunk de la feature, nunca todos los idiomas de
  golpe al arrancar la aplicación.
- Librerías pesadas de uso transversal pero no universal (Recharts, solo usado por
  Dashboard/Reportes/BI) se marcan como `manualChunks` en la config de Vite para que
  un módulo que nunca renderiza un gráfico no pague su costo de red.

## 3. Virtualización de listas largas

No estaba fijado — necesario porque varios reportes/consultas del catálogo
(`docs/product/07_SCREEN_CATALOG.md`) operan sobre volúmenes altos por diseño
(Kardex de Producto, Movimientos de Caja/Bancos, Libro Diario, Movimientos de Stock).
`ui-kit/components/data-table/DataTable` (`UI_GUIDELINES.md §8`) soporta un modo
virtualizado (renderiza solo las filas visibles + un margen, vía integración de
TanStack Table con TanStack Virtual) activado por prop cuando el total esperado de
filas supera un umbral (~500 filas sin paginación de servidor, o cualquier tabla con
scroll interno largo en vez de paginación) — la paginación offset+limit
(`docs/architecture/07-convenciones-y-estandares.md §4`) sigue siendo la estrategia
por defecto; virtualización es el complemento para las vistas que necesitan mostrar
muchas filas a la vez sin paginar (p. ej. un Kardex que se revisa scrolleando un rango
de fechas completo).

## 4. Caching e invalidación (referencia)

Estrategia completa de `staleTime`/`gcTime` por tipo de dato ya fijada en
[STATE_MANAGEMENT.md §2.2](./STATE_MANAGEMENT.md#22-staletimegctime-por-tipo-de-dato).
El caso más agresivo del sistema —caching de catálogo para operar sin conexión— ya
está diseñado en `docs/architecture/45-modulo-pos-frontend.md §5` (POS) y no se
repite; es la referencia de qué tan lejos puede llegar la estrategia de cache cuando
la necesidad de negocio lo justifica (mostrador de alta frecuencia), no el default
para el resto del sistema.

## 5. Memoización: cuándo sí, cuándo no

No estaba fijado como criterio — se cierra acá porque memoización mal aplicada
(`useMemo`/`useCallback`/`React.memo` en todo por hábito) agrega complejidad sin
beneficio medible en la mayoría de los componentes de un CRUD estándar:

- **Sí memoizar:** cálculos derivados costosos sobre listas grandes (totales de una
  tabla de líneas de factura con 200+ ítems, agregaciones para un gráfico de
  Dashboard), componentes de fila dentro de `DataTable` virtualizado (§3) donde un
  re-render innecesario de cientos de filas sí es medible.
- **No memoizar por defecto:** componentes de formulario simples, páginas completas,
  cualquier cosa donde el costo de re-renderizar es menor que el costo de mantener la
  memoización correcta (dependencias de `useMemo`/`useCallback` mal declaradas son una
  fuente de bugs más cara que el re-render que se evita). Regla práctica: se memoiza
  cuando un profiler (React DevTools Profiler) muestra un costo real, no
  preventivamente.
- Los selectores granulares de Zustand (`STATE_MANAGEMENT.md §3.4`) y las `queryKey`
  bien acotadas de TanStack Query (`STATE_MANAGEMENT.md §2.1`) ya resuelven la mayor
  parte de los re-renders innecesarios sin necesitar memoización manual adicional —
  se revisa primero si el problema es de suscripción a estado antes de envolver todo
  en `memo()`.

## 6. Imágenes y assets

- Imágenes de producto (`inventario`, catálogo grande — `docs/product/01_PRODUCT_VISION.md §4`)
  se sirven ya optimizadas/redimensionadas desde `Storage Framework`/MinIO
  (`docs/architecture/32-core-platform/08-frameworks-de-infraestructura.md §2`) — el
  frontend nunca redimensiona una imagen grande en el cliente, pide la variante de
  tamaño correcta (thumbnail para listados, tamaño completo solo en detalle).
- Todo componente de imagen usa `loading="lazy"` nativo del navegador por defecto,
  salvo la imagen visible en el primer viewport de cada pantalla (evita penalizar LCP,
  §1).

## 7. Trazabilidad

| Punto pedido         | Cerrado/detallado en                                                                      |
| -------------------- | ----------------------------------------------------------------------------------------- |
| Lazy Loading         | §2, [ROUTING.md §3](./ROUTING.md#3-code-splitting-por-módulo)                             |
| Code Splitting       | §2, `docs/architecture/29-frontend-enterprise.md §2` (referencia)                         |
| Optimización general | §1 (presupuesto), §3 (virtualización), §5 (memoización), §6 (assets)                      |
| Caching              | §4, [STATE_MANAGEMENT.md §2.2](./STATE_MANAGEMENT.md#22-staletimegctime-por-tipo-de-dato) |
