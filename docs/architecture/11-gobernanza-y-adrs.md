# 11 — Gobernanza de la arquitectura

## 1. Cómo se agrega un módulo nuevo

1. Confirmar que existe una necesidad de negocio real y delimitada (no
   se crea un módulo especulativo "por si se necesita después").
2. Definir, antes de escribir código: nombre del módulo (español,
   ubiquitous language), de qué entidades es dueño, con qué otros
   módulos colabora (síncrono) y a qué eventos reacciona (asíncrono).
   Esto se documenta en el `README.md` del módulo desde el primer commit.
3. Agregar la fila correspondiente en
   [04-catalogo-modulos-negocio.md](./04-catalogo-modulos-negocio.md) y,
   si corresponde, la especificación de menú en `docs/menus/`.
4. Crear la carpeta siguiendo exactamente la plantilla de
   [01](./01-estructura-monorepo.md#4-anatomía-de-un-módulo-vista-desde-la-raíz),
   [02](./02-arquitectura-modulos-backend.md) y
   [03](./03-arquitectura-modulos-frontend.md).
5. Declarar sus tags de Nx (`scope:<modulo>`) y sus dependencias
   permitidas — sin esto, el módulo no puede importar ni ser importado
   por nadie (fail-safe: por defecto, aislado).
6. Registrar el módulo en el menú principal del shell (`apps/web`) según
   [09-seguridad-y-multiempresa.md](./09-seguridad-y-multiempresa.md#2-autorización-seguridad)
   con su permiso base.

## 2. Architecture Decision Records (ADR)

Cualquier decisión que afecte a más de un módulo o que sea costosa de
revertir (elegir Nx, el modelo de multiempresa, el formato de eventos,
agregar algo al Shared Kernel, cambiar de RabbitMQ a otro bus, etc.) se
documenta como ADR en `docs/adr/NNNN-titulo-en-kebab-case.md`.

Plantilla mínima:

```markdown
# NNNN — Título de la decisión

**Estado:** Propuesta | Aceptada | Reemplazada por ADR-XXXX
**Fecha:** AAAA-MM-DD

## Contexto

Qué problema o disyuntiva motiva esta decisión.

## Decisión

Qué se decidió, en una o dos frases directas.

## Alternativas consideradas

Qué otras opciones se evaluaron y por qué no se eligieron.

## Consecuencias

Qué se gana, qué se sacrifica, qué queda más difícil de cambiar después.
```

Los documentos numerados de `docs/architecture/` (este set) reflejan el
**estado actual acordado**; los ADRs reflejan **por qué se llegó ahí** y
quedan como registro histórico aunque la decisión se reemplace después.

## 3. Versionado de este documento de arquitectura

- Cambios menores (aclaraciones, ejemplos, correcciones) se commitean
  directo con mensaje `docs(architecture): ...`.
- Cambios estructurales (nueva regla de dependencia, cambio de capa,
  cambio de convención) requieren un ADR asociado y se reflejan en el
  encabezado de versión del [README.md](./README.md) de esta carpeta.
- Ningún cambio de arquitectura se aplica retroactivamente "en silencio"
  a módulos ya construidos — se migra explícitamente, módulo por
  módulo, cuando se toca ese módulo por otra razón o cuando el costo de
  la deuda lo justifica.

## 4. Quién puede aprobar qué

| Tipo de cambio                                           | Aprobación necesaria                                                                                                                                     |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Código dentro de un módulo, sin tocar su fachada pública | Dueño del módulo (CODEOWNERS)                                                                                                                            |
| Cambio en la fachada pública (`index.ts`) de un módulo   | Dueño del módulo + revisión de los módulos consumidores declarados                                                                                       |
| Nueva dependencia entre módulos                          | ADR + actualización de [06](./06-comunicacion-entre-modulos.md) si introduce un patrón nuevo                                                             |
| Cambio en Shared Kernel (`packages/contracts`)           | ADR obligatorio — afecta a todos los módulos                                                                                                             |
| Cambio de infraestructura (`core/`, `infra/`)            | ADR + validación de que no rompe el checklist de extraibilidad de [10](./10-evolucion-a-microservicios.md#2-qué-hace-a-un-módulo-ya-extraíble-checklist) |

## 5. Revisión periódica

Este documento se revisa cuando el número de módulos, el equipo o la
carga real de datos cambien de orden de magnitud respecto a lo asumido
hoy (pyme, 14+ módulos iniciales, monolito modular con un solo Postgres).
No hay una cadencia fija de revisión — se revisa cuando la realidad del
sistema empieza a contradecir alguno de estos documentos, no antes.
