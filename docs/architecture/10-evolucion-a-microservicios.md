# 10 — Evolución hacia microservicios

## 1. Por qué monolito modular primero

Empezar con microservicios reales requiere conocer de antemano los
límites de negocio correctos — y en un ERP nuevo, esos límites se
descubren con uso real, no se adivinan el día uno. Un límite de módulo
equivocado es barato de corregir dentro de un monolito modular
(mover código entre carpetas) y muy caro de corregir entre
microservicios (coordinar despliegues, migrar datos entre bases,
versionar APIs en producción). GORAZUS sigue la estrategia
"monolito modular primero, microservicios cuando duela" — pero
construido desde el día uno para que esa extracción sea mecánica, no
una reescritura.

## 2. Qué hace a un módulo "extraíble" — y ya lo tiene desde el diseño

| Requisito para extraer un módulo                                           | Cómo ya lo cumple GORAZUS desde el diseño                                                                                                                               |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No compartir código interno con otros módulos                              | Fronteras de import forzadas por Nx (ver [01](./01-estructura-monorepo.md#5-reglas-de-import-enforcement))                                                              |
| No compartir tablas ni FKs con otros módulos                               | Schema de Postgres por módulo, sin FK cruzadas (ver [02](./02-arquitectura-modulos-backend.md#4-base-de-datos-prisma-con-schema-por-módulo))                            |
| Comunicarse por contratos explícitos, no por llamadas internas arbitrarias | Fachada pública (`index.ts`) + eventos versionados (ver [06](./06-comunicacion-entre-modulos.md))                                                                       |
| No depender de transacciones distribuidas                                  | Consistencia eventual entre módulos ya modelada así desde el monolito (ver [05](./05-flujo-de-datos.md#4-escrituras-que-cruzan-módulos-sin-transacciones-distribuidas)) |
| Tener su propio ciclo de despliegue conceptual                             | `apps/api` es un composition root reemplazable — el módulo no "sabe" que vive junto a otros                                                                             |

Esto significa que, en teoría, cualquier módulo de
[04-catalogo-modulos-negocio.md](./04-catalogo-modulos-negocio.md)
podría extraerse. En la práctica, se extraen los que lo justifiquen por
carga, equipo dedicado o necesidad de escalar independientemente —
candidatos típicos con el tiempo: `pos` (picos de tráfico distintos al
resto), `reportes` (carga de lectura pesada), `inventario` (alto
volumen de escritura).

## 3. Proceso de extracción (strangler fig)

1. **Confirmar que el módulo no tiene violaciones de frontera** — correr
   `nx graph` y el lint de boundaries; si hay deuda acumulada, pagarla
   antes de extraer, no durante.
2. **Mover su schema de Postgres a una instancia propia.** Como nunca
   tuvo FKs cruzadas, esto es una migración de infraestructura, no de
   datos relacionales.
3. **Crear `apps/<modulo>-service`** que importa
   `modules/<modulo>/backend` — el código del módulo no cambia.
4. **Apuntar los bindings de RabbitMQ del módulo al nuevo servicio.** Los
   demás módulos siguen publicando/consumiendo los mismos eventos con
   las mismas routing keys — no se enteran de que el consumidor cambió
   de proceso.
5. **Reemplazar las llamadas síncronas in-process** (`InventarioQueryService`
   inyectado directamente) por un cliente HTTP/gRPC contra el nuevo
   servicio, detrás de la misma interfaz pública que ya existía. Los
   módulos que lo consumían no cambian su código de negocio, solo la
   implementación de la fachada.
6. **Actualizar el enrutamiento de Nginx** (o introducir un API Gateway
   si el número de servicios extraídos crece) para dirigir tráfico al
   nuevo servicio.
7. **Retirar el módulo de `apps/api`** una vez el nuevo servicio esté
   validado en producción.

## 4. Qué NO se hace

- No se extraen módulos "porque sí" o por moda — cada extracción es una
  decisión de arquitectura documentada como ADR (ver
  [11-gobernanza-y-adrs.md](./11-gobernanza-y-adrs.md)) con la razón
  concreta (carga, equipo, aislamiento de fallos).
- No se introduce un API Gateway real ni un service mesh antes de tener
  más de un servicio real que lo justifique — Nginx (como `Ingress` en
  Kubernetes, ver nota abajo) es suficiente mientras GORAZUS sea un
  monolito modular o tenga solo un par de servicios extraídos (KISS).
- No se duplican datos "por si acaso" entre el monolito y un servicio
  extraído — la propiedad de datos de
  [04-catalogo-modulos-negocio.md](./04-catalogo-modulos-negocio.md) se
  mantiene intacta en la extracción.

> **Nota de revisión (2026-07-13)**: este documento originalmente
> incluía a Kubernetes en la lista de "qué no se hace todavía". Esa
> parte de la decisión fue revisada — ver
> [31-infraestructura-completa §2](./31-infraestructura-completa.md#2-kubernetes--adoptado-decisión-revisada)
> para la decisión vigente (K8s sí adoptado) y por qué no contradice
> el resto de los puntos de esta sección: adoptar un orquestador es
> una decisión de **plataforma**, independiente de si ya se extrajo
> algún módulo a microservicio — el monolito modular descrito en este
> documento se despliega igual, ahora sobre K8s en vez de Docker
> Compose puro en `staging`/`production`.
