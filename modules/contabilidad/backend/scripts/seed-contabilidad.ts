/**
 * Seed operativo idempotente del plan de cuentas mínimo + año fiscal +
 * una regla contable de ejemplo (`ventas.factura.confirmada`) — mismo
 * criterio que `modules/seguridad/backend/scripts/seed-rbac.ts`: script
 * standalone, accede a los clientes Prisma generados directo, no pasa
 * por NestJS DI.
 *
 * Uso: `npx ts-node --transpile-only modules/contabilidad/backend/scripts/seed-contabilidad.ts <slug-tenant>`
 *
 * Sin este seed, `MotorContableService.registrarEvento()` sigue
 * funcionando (devuelve `null`, no-op) — este script solo existe para
 * poder DEMOSTRAR el motor end-to-end con datos reales, no es un
 * requisito para que `ventas`/`pos` sigan operando.
 */
// eslint-disable-next-line @nx/enforce-module-boundaries -- script standalone, ver cabecera
import { PrismaClient as CorePrismaClient } from '../../../../core/database/prisma/schemas/core/generated';
// eslint-disable-next-line @nx/enforce-module-boundaries -- script standalone, ver cabecera
import { PrismaClient as AccountingPrismaClient } from '../../../../core/database/prisma/schemas/accounting/generated';

const CUENTAS_MINIMAS = [
  { code: '1000', name: 'Caja y Bancos', typeCode: 'asset', normalBalance: 'debit' },
  { code: '1200', name: 'Cuentas por Cobrar', typeCode: 'asset', normalBalance: 'debit' },
  { code: '2100', name: 'ITBIS por Pagar', typeCode: 'liability', normalBalance: 'credit' },
  { code: '3000', name: 'Capital Social', typeCode: 'equity', normalBalance: 'credit' },
  { code: '4000', name: 'Ingresos por Ventas', typeCode: 'income', normalBalance: 'credit' },
] as const;

/** `accounting.account_types_code_check` (CHECK real de base de datos) solo admite estos 5 códigos. */
const TIPOS_CUENTA = [
  { code: 'asset', normalBalance: 'debit' },
  { code: 'liability', normalBalance: 'credit' },
  { code: 'equity', normalBalance: 'credit' },
  { code: 'income', normalBalance: 'credit' },
  { code: 'expense', normalBalance: 'debit' },
] as const;

function sumarMeses(fecha: Date, meses: number): Date {
  const resultado = new Date(fecha);
  resultado.setUTCMonth(resultado.getUTCMonth() + meses);
  return resultado;
}

async function main(): Promise<void> {
  const tenantSlug = process.argv[2];
  if (!tenantSlug) {
    console.error('Uso: seed-contabilidad.ts <slug-tenant>');
    process.exit(1);
  }

  const core = new CorePrismaClient({ datasources: { db: { url: process.env['DATABASE_URL'] } } });
  const accounting = new AccountingPrismaClient({
    datasources: { db: { url: process.env['DATABASE_URL'] } },
  });

  try {
    console.log(`Resolviendo tenant "${tenantSlug}"...`);
    const tenant = await core.tenants.findFirst({ where: { slug: tenantSlug, deleted_at: null } });
    if (!tenant) throw new Error(`No existe el tenant "${tenantSlug}".`);
    await core.$executeRawUnsafe(
      "SELECT set_config('app.current_tenant_id', $1, false)",
      tenant.id,
    );
    await accounting.$executeRawUnsafe(
      "SELECT set_config('app.current_tenant_id', $1, false)",
      tenant.id,
    );

    const empresa = await core.companies.findFirst({ where: { deleted_at: null } });
    if (!empresa) throw new Error('No hay ninguna empresa real en este tenant.');
    console.log(`Empresa: ${empresa.id}`);

    console.log('Sembrando tipos de cuenta...');
    const tipoPorCodigo = new Map<string, string>();
    for (const tipo of TIPOS_CUENTA) {
      const existente = await accounting.account_types.findFirst({ where: { code: tipo.code } });
      const fila =
        existente ??
        (await accounting.account_types.create({
          data: { tenant_id: tenant.id, code: tipo.code, normal_balance: tipo.normalBalance },
        }));
      tipoPorCodigo.set(tipo.code, fila.id);
      console.log(`  - ${tipo.code} (${tipo.normalBalance})`);
    }

    console.log('Sembrando plan de cuentas mínimo...');
    const cuentaPorCodigo = new Map<string, string>();
    for (const cuenta of CUENTAS_MINIMAS) {
      const existente = await accounting.chart_of_accounts.findFirst({
        where: { code: cuenta.code, company_id: empresa.id },
      });
      const fila =
        existente ??
        (await accounting.chart_of_accounts.create({
          data: {
            tenant_id: tenant.id,
            company_id: empresa.id,
            code: cuenta.code,
            name: cuenta.name,
            account_type_id: tipoPorCodigo.get(cuenta.typeCode)!,
            accepts_postings: true,
          },
        }));
      cuentaPorCodigo.set(cuenta.code, fila.id);
      console.log(`  - ${cuenta.code} ${cuenta.name}`);
    }

    console.log('Verificando año fiscal del año actual...');
    const hoy = new Date();
    const inicioAnio = new Date(Date.UTC(hoy.getUTCFullYear(), 0, 1));
    const finAnio = new Date(Date.UTC(hoy.getUTCFullYear(), 11, 31));
    let anioFiscal = await accounting.fiscal_years.findFirst({
      where: { company_id: empresa.id, starts_on: inicioAnio },
    });
    if (!anioFiscal) {
      anioFiscal = await accounting.fiscal_years.create({
        data: {
          tenant_id: tenant.id,
          company_id: empresa.id,
          year_label: String(hoy.getUTCFullYear()),
          starts_on: inicioAnio,
          ends_on: finAnio,
        },
      });
      let inicioPeriodo = inicioAnio;
      for (let numero = 1; numero <= 12; numero += 1) {
        const finPeriodo =
          numero === 12 ? finAnio : new Date(sumarMeses(inicioPeriodo, 1).getTime() - 86400000);
        await accounting.fiscal_periods.create({
          data: {
            tenant_id: tenant.id,
            company_id: empresa.id,
            fiscal_year_id: anioFiscal.id,
            period_number: numero,
            starts_on: inicioPeriodo,
            ends_on: finPeriodo,
          },
        });
        inicioPeriodo = sumarMeses(inicioPeriodo, 1);
      }
      console.log(`  Año fiscal ${anioFiscal.year_label} creado con 12 períodos.`);
    } else {
      console.log(`  Año fiscal ${anioFiscal.year_label} ya existía.`);
    }

    console.log('Sembrando regla contable de ejemplo (ventas.factura.confirmada)...');
    const reglaExistente = await accounting.accounting_rules.findFirst({
      where: { event_code: 'ventas.factura.confirmada', company_id: empresa.id },
    });
    if (!reglaExistente) {
      await accounting.accounting_rules.create({
        data: {
          tenant_id: tenant.id,
          company_id: empresa.id,
          event_code: 'ventas.factura.confirmada',
          accounting_rule_lines: {
            create: [
              {
                tenant_id: tenant.id,
                company_id: empresa.id,
                account_id: cuentaPorCodigo.get('1200')!,
                entry_side: 'debit',
                amount_formula: 'total_amount',
              },
              {
                tenant_id: tenant.id,
                company_id: empresa.id,
                account_id: cuentaPorCodigo.get('4000')!,
                entry_side: 'credit',
                amount_formula: 'subtotal_amount',
              },
              {
                tenant_id: tenant.id,
                company_id: empresa.id,
                account_id: cuentaPorCodigo.get('2100')!,
                entry_side: 'credit',
                amount_formula: 'tax_amount',
              },
            ],
          },
        },
      });
      console.log('  Regla creada: débito Cuentas por Cobrar, crédito Ingresos + ITBIS por Pagar.');
    } else {
      console.log('  La regla ya existía.');
    }

    console.log('Listo.');
  } finally {
    await core.$disconnect();
    await accounting.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
