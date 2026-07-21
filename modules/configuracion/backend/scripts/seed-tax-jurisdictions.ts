/**
 * Siembra el prerequisito mínimo de datos para poder crear un impuesto
 * (`taxes.taxes.jurisdiction_id` es NOT NULL) — un país (`configuration.countries`)
 * y una jurisdicción fiscal (`taxes.tax_jurisdictions`) por tenant. El
 * catálogo completo de países/jurisdicciones queda fuera del alcance de
 * Fase 02 (docs/architecture/14-modulo-core.md, "Impuestos: alcance
 * mínimo") — este script solo desbloquea el caso de uso real (crear un
 * impuesto necesita una jurisdicción válida), mismo patrón operativo que
 * `modules/seguridad/backend/scripts/seed-rbac.ts`.
 *
 * Uso: `npx ts-node --transpile-only modules/configuracion/backend/scripts/seed-tax-jurisdictions.ts <slug-tenant> <codigo-iso-pais> <nombre-jurisdiccion>`
 * Ejemplo: `... demo CO "Colombia - Nacional"`
 */
// eslint-disable-next-line @nx/enforce-module-boundaries -- script standalone, ver comentario de cabecera
import { PrismaClient as ConfigurationPrismaClient } from '../../../../core/database/prisma/schemas/configuration/generated';
// eslint-disable-next-line @nx/enforce-module-boundaries -- mismo motivo
import { PrismaClient as TaxesPrismaClient } from '../../../../core/database/prisma/schemas/taxes/generated';
// eslint-disable-next-line @nx/enforce-module-boundaries -- necesita el cliente real de `core` para resolver el tenant por slug
import { PrismaClient as CorePrismaClient } from '../../../../core/database/prisma/schemas/core/generated';

async function main(): Promise<void> {
  const tenantSlug = process.argv[2];
  const countryIsoCode = process.argv[3];
  const jurisdictionName = process.argv[4];
  if (!tenantSlug || !countryIsoCode || !jurisdictionName) {
    console.error(
      'Uso: seed-tax-jurisdictions.ts <slug-tenant> <codigo-iso-pais> <nombre-jurisdiccion>',
    );
    process.exit(1);
  }

  const coreClient = new CorePrismaClient({
    datasources: { db: { url: process.env['DATABASE_URL'] } },
  });
  const configClient = new ConfigurationPrismaClient({
    datasources: { db: { url: process.env['DATABASE_URL'] } },
  });
  const taxesClient = new TaxesPrismaClient({
    datasources: { db: { url: process.env['DATABASE_URL'] } },
  });

  try {
    console.log(`Resolviendo tenant "${tenantSlug}"...`);
    const tenant = await coreClient.tenants.findFirst({
      where: { slug: tenantSlug, deleted_at: null },
    });
    if (!tenant) {
      throw new Error(`No existe ningún tenant con slug "${tenantSlug}".`);
    }

    for (const client of [configClient, taxesClient]) {
      await client.$executeRawUnsafe(
        "SELECT set_config('app.current_tenant_id', $1, false)",
        tenant.id,
      );
    }

    console.log(`Sembrando país "${countryIsoCode}"...`);
    let pais = await configClient.countries.findFirst({
      where: { tenant_id: tenant.id, iso_code: countryIsoCode, deleted_at: null },
    });
    if (!pais) {
      pais = await configClient.countries.create({
        data: { tenant_id: tenant.id, iso_code: countryIsoCode },
      });
    }

    console.log(`Sembrando jurisdicción fiscal "${jurisdictionName}"...`);
    let jurisdiccion = await taxesClient.tax_jurisdictions.findFirst({
      where: { tenant_id: tenant.id, name: jurisdictionName, deleted_at: null },
    });
    if (!jurisdiccion) {
      jurisdiccion = await taxesClient.tax_jurisdictions.create({
        data: { tenant_id: tenant.id, country_id: pais.id, name: jurisdictionName },
      });
    }

    console.log(`Listo. jurisdictionId=${jurisdiccion.id}`);
  } finally {
    await coreClient.$disconnect();
    await configClient.$disconnect();
    await taxesClient.$disconnect();
  }
}

void main();
