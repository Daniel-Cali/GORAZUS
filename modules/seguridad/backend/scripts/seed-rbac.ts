/**
 * Bootstrap RBAC (docs/architecture/15-modulo-security.md §3, "un permiso
 * se agrega solo cuando se crea el módulo/caso de uso que lo necesita") —
 * script operativo idempotente, no un endpoint HTTP: resuelve el problema
 * de arranque de "para administrar permisos hace falta un permiso, pero
 * ninguno existe todavía" (mismo patrón que docs/database/sql/22_seed_data.sql,
 * ejecutado fuera del pipeline HTTP guardado por `PermissionsGuard`).
 *
 * Uso: `npx ts-node --transpile-only modules/seguridad/backend/scripts/seed-rbac.ts <slug-tenant> <email-admin>`
 *
 * Import relativo (no `@gorazus/core-database`) — este script no es
 * consumido por Nest ni por otro módulo, es una herramienta operativa
 * standalone; igual que `database.module.ts`, accede al cliente Prisma
 * generado directamente.
 *
 * `<slug-tenant>` requerido desde FASE 05 (2026-07-20) — antes del hallazgo
 * de RLS (`docs/database/SECURITY.md §2`), `gorazus_app` era superusuario y
 * este script veía todas las filas sin importar tenant, sin que nadie lo
 * notara. Con RLS realmente forzado, `core.users` solo es visible para el
 * tenant sentinela (`00000000...0000`) o el tenant activo de la sesión — sin
 * `set_config` previo, buscar por email simplemente no encuentra la fila
 * (no es un error de permisos, es RLS filtrando silenciosamente). Se resuelve
 * el tenant por slug primero (`core.tenants` tiene una policy
 * `tenant_lookup_by_slug` de solo lectura sin restricción, pensada
 * exactamente para este caso de "todavía no sé mi tenant"), luego se fija
 * el contexto antes de tocar `core.users`/`core.user_roles`.
 */
// eslint-disable-next-line @nx/enforce-module-boundaries -- script standalone, ver comentario de cabecera
import { PrismaClient } from '../../../../core/database/prisma/schemas/core/generated';

const SEED_TENANT_ID = '00000000-0000-0000-0000-000000000000';

const PERMISSIONS: Array<{ moduleCode: string; actionCode: string }> = [
  { moduleCode: 'seguridad', actionCode: 'gestionar_roles' },
  { moduleCode: 'seguridad', actionCode: 'gestionar_usuarios' },
  { moduleCode: 'seguridad', actionCode: 'ver_auditoria' },
  { moduleCode: 'seguridad', actionCode: 'gestionar_sesiones' },
  { moduleCode: 'configuracion', actionCode: 'gestionar_empresas' },
  { moduleCode: 'configuracion', actionCode: 'gestionar_sucursales' },
  { moduleCode: 'configuracion', actionCode: 'gestionar_parametros' },
  { moduleCode: 'configuracion', actionCode: 'gestionar_monedas' },
  { moduleCode: 'configuracion', actionCode: 'gestionar_impuestos' },
  { moduleCode: 'inventario', actionCode: 'gestionar_almacenes' },
  { moduleCode: 'inventario', actionCode: 'gestionar_stock' },
  { moduleCode: 'productos', actionCode: 'gestionar_productos' },
];

async function main(): Promise<void> {
  const tenantSlug = process.argv[2];
  const adminEmail = process.argv[3];
  if (!tenantSlug || !adminEmail) {
    console.error('Uso: seed-rbac.ts <slug-tenant> <email-del-usuario-a-hacer-administrador>');
    process.exit(1);
  }

  const client = new PrismaClient({ datasources: { db: { url: process.env['DATABASE_URL'] } } });

  try {
    console.log('Sembrando catálogo de permisos...');
    const permisos = [];
    for (const { moduleCode, actionCode } of PERMISSIONS) {
      const code = `${moduleCode}.${actionCode}`;
      let permiso = await client.permissions.findFirst({
        where: { code, tenant_id: SEED_TENANT_ID, deleted_at: null },
      });
      if (!permiso) {
        permiso = await client.permissions.create({
          data: {
            tenant_id: SEED_TENANT_ID,
            code,
            module_code: moduleCode,
            action_code: actionCode,
          },
        });
      }
      permisos.push(permiso);
      console.log(`  - ${code}`);
    }

    console.log('Sembrando rol "Administrador"...');
    let rolAdmin = await client.roles.findFirst({
      where: { tenant_id: SEED_TENANT_ID, name: 'Administrador', is_system_role: true },
    });
    if (!rolAdmin) {
      rolAdmin = await client.roles.create({
        data: { tenant_id: SEED_TENANT_ID, name: 'Administrador', is_system_role: true },
      });
    }

    console.log('Asignando todos los permisos sembrados al rol "Administrador"...');
    for (const permiso of permisos) {
      const yaAsignado = await client.role_permissions.findFirst({
        where: { role_id: rolAdmin.id, permission_id: permiso.id, deleted_at: null },
      });
      if (!yaAsignado) {
        await client.role_permissions.create({
          data: { tenant_id: SEED_TENANT_ID, role_id: rolAdmin.id, permission_id: permiso.id },
        });
      }
    }

    console.log(`Resolviendo tenant "${tenantSlug}"...`);
    const tenant = await client.tenants.findFirst({
      where: { slug: tenantSlug, deleted_at: null },
    });
    if (!tenant) {
      throw new Error(`No existe ningún tenant con slug "${tenantSlug}".`);
    }

    // A partir de acá, RLS exige el contexto de tenant seteado — ver nota de cabecera.
    await client.$executeRawUnsafe(
      "SELECT set_config('app.current_tenant_id', $1, false)",
      tenant.id,
    );

    console.log(`Buscando usuario "${adminEmail}" en el tenant "${tenantSlug}"...`);
    const usuario = await client.users.findFirst({
      where: { email: adminEmail, tenant_id: tenant.id },
    });
    if (!usuario) {
      throw new Error(
        `No existe ningún usuario con email "${adminEmail}" en el tenant "${tenantSlug}" — creá el usuario primero.`,
      );
    }

    const yaTieneRol = await client.user_roles.findFirst({
      where: { user_id: usuario.id, role_id: rolAdmin.id, deleted_at: null },
    });
    if (!yaTieneRol) {
      await client.user_roles.create({
        data: { tenant_id: usuario.tenant_id, user_id: usuario.id, role_id: rolAdmin.id },
      });
      console.log(`Rol "Administrador" asignado a ${adminEmail}.`);
    } else {
      console.log(`${adminEmail} ya tenía el rol "Administrador".`);
    }

    console.log('Listo.');
  } finally {
    await client.$disconnect();
  }
}

void main();
