# infra/scripts — scripts de operación

Carpeta ya designada en
[docs/architecture/01-estructura-monorepo.md §2](../../docs/architecture/01-estructura-monorepo.md#2-árbol-de-carpetas-raíz)
para: seed de datos, backup/restore ejecutable (implementación de
[docs/database/08-estrategia-respaldo.md](../../docs/database/08-estrategia-respaldo.md)
y de `nightly-restore-test.yml`), y migraciones batch.

**Vacía intencionalmente por ahora**: EPIC 02 (infraestructura) no
crea scripts de migración ni de seed — eso requiere que exista al
menos un módulo con schema real corriendo sobre las herramientas ya
fijadas (SQL de `docs/database/sql/` aplicado con la herramienta de
migración versionada mencionada en
[docs/architecture/02-arquitectura-modulos-backend.md §4](../../docs/architecture/02-arquitectura-modulos-backend.md#4-base-de-datos-prisma-con-schema-por-módulo)),
que todavía no se ha escafoldado. Se puebla cuando el Core Platform
(`core/database`) esté implementado.
