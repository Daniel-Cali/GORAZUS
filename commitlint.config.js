/**
 * Conventional Commits — ya fijado en
 * docs/architecture/07-convenciones-y-estandares.md §3: `feat:`, `fix:`,
 * `refactor:`, `test:`, `docs:`, `chore:`, con el módulo como scope
 * cuando aplique (`feat(ventas): agregar confirmación de venta`).
 *
 * Sin `scope-enum` estricto: la lista real de scopes válidos (27
 * módulos de negocio + `core/*` + `docs` + `infra`) crece con el
 * proyecto — forzar una lista fija acá requeriría mantenerla en 2
 * lugares (acá y `docs/architecture/04-catalogo-modulos-negocio.md`).
 * Se confía en `docs/standards/CODE_REVIEW.md` (revisión humana) para
 * el scope correcto, commitlint solo valida la forma (tipo + mensaje).
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
};
