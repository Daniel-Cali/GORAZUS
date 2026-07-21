# 07 — Convenciones y estándares

## 1. Naming

| Elemento                            | Convención                                 | Ejemplo                                                                   |
| ----------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------- |
| Carpetas de módulo de negocio       | kebab-case, español                        | `cuentas-por-cobrar/`                                                     |
| Carpetas técnicas                   | kebab-case, inglés                         | `core/`, `ui-kit/`                                                        |
| Archivos                            | kebab-case + sufijo de tipo                | `crear-venta.usecase.ts`, `venta.entity.ts`, `venta.repository.prisma.ts` |
| Clases / Componentes React          | PascalCase                                 | `CrearVentaUseCase`, `TablaVentas`                                        |
| Variables, funciones, métodos       | camelCase                                  | `calcularTotalVenta()`                                                    |
| Constantes                          | UPPER_SNAKE_CASE                           | `MAX_LINEAS_POR_VENTA`                                                    |
| Interfaces de repositorio (puertos) | sufijo `.repository.ts` sin prefijo `I`    | `venta.repository.ts`                                                     |
| Eventos de dominio                  | sufijo `Event`, verbo en participio pasado | `VentaConfirmadaEvent`                                                    |
| DTO                                 | sufijo `Dto`                               | `CrearVentaDto`                                                           |
| Schemas Zod                         | sufijo `Schema`                            | `crearVentaSchema`                                                        |

## 2. Idioma: dominio en español, técnica en inglés

- Nombres de módulos, entidades de dominio, campos de negocio, eventos
  de dominio y mensajes de error de usuario: **español**. Es el
  vocabulario real del negocio y de los usuarios finales del ERP.
- Términos de arquitectura/infraestructura (`controller`, `service`,
  `repository`, `guard`, `interceptor`, nombres de carpetas técnicas):
  **inglés**, por ser terminología estándar de la industria y de los
  frameworks usados (NestJS, React).
- No mezclar dentro de un mismo identificador (`crearVentaUseCase`, no
  `createVentaCaseDeUso`).

## 3. Git

- **Trunk-based development**: rama `main` siempre desplegable, ramas de
  feature de corta vida (`feat/ventas-confirmar-venta`,
  `fix/inventario-stock-negativo`), sin ramas de release largas.
- **Conventional Commits** (`feat:`, `fix:`, `refactor:`, `test:`,
  `docs:`, `chore:`) con el módulo como scope cuando aplique:
  `feat(ventas): agregar confirmación de venta`.
- **CODEOWNERS por módulo**: cada carpeta de `modules/<x>/` tiene un
  dueño declarado en `.github/CODEOWNERS`. Un PR que toca un módulo
  requiere aprobación de su dueño, aunque cualquiera pueda contribuir.
- Un PR que modifica más de un módulo de negocio a la vez es una señal
  de alerta (posible violación de fronteras) — se revisa con más
  atención, no se bloquea automáticamente.

## 4. API REST

- Prefijo versionado: `/api/v1/...`. Un cambio breaking de contrato
  implica `/api/v2/...` conviviendo con `v1` hasta deprecar.
- Recursos en plural y en el idioma del dominio cuando el recurso es de
  negocio: `/api/v1/ventas`, `/api/v1/clientes/:id/facturas`.
- Formato de respuesta consistente en todos los módulos:

```json
{
  "data": {},
  "meta": { "page": 1, "pageSize": 20, "total": 134 }
}
```

- Formato de error consistente (inspirado en RFC 7807):

```json
{
  "error": {
    "code": "VENTA_YA_CONFIRMADA",
    "message": "La venta ya fue confirmada previamente",
    "details": []
  }
}
```

- `code` es estable y forma parte del contrato (el frontend puede
  ramificar lógica sobre él); `message` es para mostrar al usuario y
  puede cambiar de redacción sin ser un breaking change.
- Paginación: offset+limit (`page`, `pageSize`) como estándar por
  simplicidad (KISS); se evalúa cursor-based solo para el/los módulos
  que demuestren necesitarlo por volumen real de datos (p. ej.
  `MovimientoStock` en `inventario`).

## 5. Testing

Pirámide por capa, dentro de cada módulo:

| Capa                           | Qué se testea                                       | Herramienta                       |
| ------------------------------ | --------------------------------------------------- | --------------------------------- |
| `entities/`                    | Invariantes de dominio, sin mocks                   | Jest (backend)                    |
| `services/` (use cases)        | Orquestación, con repositorio fake/in-memory        | Jest                              |
| `repositories/`                | Query real contra Postgres de test                  | Jest + testcontainers             |
| `controllers/`                 | Contrato HTTP, request/response                     | Jest + supertest                  |
| `frontend/hooks`, `components` | Comportamiento de UI                                | Vitest + Testing Library          |
| Flujo completo entre módulos   | Un caso de negocio real end-to-end (`apps/api-e2e`) | Jest e2e contra stack Dockerizado |
| Flujo de usuario en navegador  | `apps/web-e2e`                                      | Playwright                        |

No se exige el mismo nivel de cobertura e2e para todos los módulos por
igual — se prioriza donde el costo de un bug es alto (flujos
transaccionales: ventas, compras, caja, contabilidad) sobre pantallas
de solo consulta.

## 6. Logging y observabilidad

- Logging estructurado (JSON) desde `core/http` — cada log incluye
  `empresaId`, `userId` y `requestId` de correlación cuando aplican.
- Un módulo nunca implementa su propio logger — usa el provisto por
  `core`.
- Los eventos de dominio publicados y consumidos se loguean siempre
  (auditoría técnica mínima, distinta de una eventual funcionalidad de
  "Auditoría" de negocio, que solo se construye si un módulo la
  necesita de verdad).

## 7. Validación

- Zod es la única fuente de verdad de validación, tanto en backend
  (`validators/`) como en frontend (formularios), a través de
  `shared/contracts` de cada módulo. No se duplican reglas de
  validación escritas a mano en dos lugares.

## 8. Documentación mínima por módulo

Cada `modules/<x>/README.md` debe responder, sin extenderse más de lo
necesario:

- ¿Qué responsabilidad tiene este módulo?
- ¿De qué entidades es dueño?
- ¿De qué otros módulos depende (síncrono) y a qué eventos reacciona (asíncrono)?
- ¿Qué eventos publica?
