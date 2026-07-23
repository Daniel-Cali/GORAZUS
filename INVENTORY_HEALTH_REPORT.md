# Health Report — Fase 05, Inventario Enterprise, Parte 01 (Diseño)

## 1. Alcance de esta verificación

Esta parte no tocó código de negocio (confirmado: `git status --short` en
`feature/inventory-core` solo muestra los `.md` nuevos de esta fase). El
"health check" acá es sobre la **auditoría de base de datos** que
sustenta el diseño (`INVENTORY_ARCHITECTURE.md`), no sobre build/lint/test
del código — esos no cambiaron desde `v0.7.0` (ver `PRODUCTOS_TEST_REPORT.md`
para el último estado real verificado: 21/21 proyectos compilan, 25/25
lintean, 53/53 tests unitarios de Productos pasando).

## 2. Discrepancias encontradas entre el pedido y la realidad (documentadas, no corregidas en el pedido)

| Lo que decía el pedido                                                                                                            | Lo que confirma el SQL real                                                                                                                                   |
| --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Schema `inventory` de 32 tablas                                                                                                   | **34 tablas** (`docs/database/sql/06_inventory.sql`, footer del archivo lo confirma)                                                                          |
| "Detectar duplicados" (implica que podría haberlos)                                                                               | No se encontró ninguna tabla duplicada — las 34 de `inventory` y las 35 de `products` tienen responsabilidad única, sin solapamiento                          |
| Ubicaciones en 9 niveles con nombre propio cada uno                                                                               | Solo 4 niveles tienen tabla propia (Empresa/Sucursal/Almacén/Zona); los 5 restantes son la misma tabla auto-referenciada — ver `INVENTORY_ARCHITECTURE.md §3` |
| Varios "inventarios" por estado (comprometido/reservado/tránsito/dañado/obsoleto/consignación) como si fueran entidades separadas | Es **una sola tabla** `stock` + una vista + el `status` de documentos relacionados — ver `INVENTORY_ARCHITECTURE.md §5.1`                                     |

Ninguna de estas discrepancias bloquea el diseño — se resolvieron
traduciendo el pedido a la estructura real (mismo criterio aplicado en
todas las fases anteriores del proyecto).

## 3. Riesgos identificados en esta fase

- **Riesgo bajo, ya mitigado en el diseño**: la ambigüedad de "tipo de
  ubicación" (pasillo vs. estante vs. nivel) sin columna dedicada podría
  llevar a datos inconsistentes si cada desarrollador futuro inventa su
  propia convención. Mitigado proponiendo `metadata.locationType` como
  convención única desde el diseño, no dejado abierto.
- **Riesgo medio, no mitigado — requiere decisión de negocio**: 4 gaps
  reales sin columna ni tabla (QR/RFID, fecha de fabricación, peso/
  volumen/dimensiones, obsolescencia) — ver `INVENTORY_ARCHITECTURE.md
§5.2`. Si el negocio los necesita pronto, hay que decidir explícitamente
  una migración versionada antes de que Parte 02+ los necesite — no se
  puede resolver con código solo.
- **Riesgo bajo**: `stock.quantity_reserved` es un total denormalizado
  mantenido por la aplicación (no recalculado por `SUM` en cada lectura,
  por rendimiento). Esto significa que la implementación (Parte 02+) tiene
  que ser disciplinada actualizando ese campo en cada reserva/liberación —
  un bug ahí desincroniza "disponible" sin que ninguna constraint de base
  de datos lo detecte. Recomendación para Parte 02: un test de integración
  explícito que verifique la sincronización tras cada operación de
  reserva.
- **Riesgo bajo**: `inventory.stock_movements` y
  `inventory.production_consumptions` están particionadas mensualmente —
  Prisma expone claves compuestas `(id, created_at)`, no `id` a secas
  (mismo patrón ya resuelto para `core.audit_logs` en Auditoría, FASE 02)
  — hay que replicar ese mismo tratamiento de repositorio, no asumir un
  `findById` simple.

## 4. Qué NO se verificó en esta fase (fuera de alcance de un diseño)

- No se corrieron migraciones ni se tocó Postgres real — la auditoría fue
  100% contra los archivos SQL fuente del repo (`docs/database/sql/`), que
  ya están certificados (`DATABASE_CERTIFICATION.md`, Enterprise v1.0.0).
- No se verificó Docker/infraestructura — sigue caída (7ª sesión
  consecutiva), pero no aplica a una fase que no ejecuta código.
- No se escribió ningún test — no hay código de negocio nuevo que probar
  todavía.
