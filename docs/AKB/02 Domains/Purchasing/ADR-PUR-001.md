---
id: adr-pur-001
title: 'ADR-PUR-001 — Maestro de Proveedores (Suppliers)'
version: 1.0.0
status: accepted
owner: Chief Software Architect
domain: purchasing
subdomain: supplier-master
created: 2026-08-04
updated: 2026-08-04
tags: [adr, suppliers, purchasing]
related:
  - '[[Suppliers]]'
  - '[[Purchasing]]'
  - '[[ADR-PUR-003]]'
  - '[[ADR-PUR-005]]'
  - '[[Business Rules Matrix — Purchasing]]'
---

# Purpose

Primer Aggregate Root real del dominio de Compras — sin él, ningún otro aggregate de `purchases`
puede validar "¿existe este proveedor?". Alcance de esta parte: el proveedor base y su estado de
bloqueo, no el maestro de proveedores completo (13 tablas del schema `suppliers`).

# Background

`docs/database/logico/04-suppliers.md` ya definía el schema completo (`suppliers.suppliers` + 12
tablas satélite) sin ningún código de aplicación — `modules/proveedores/` era una carpeta vacía.
Verificado por listado directo antes de escribir, no asumido.

# Domain Model

`Proveedor` (entidad de dominio pura, `modules/proveedores/backend/entities/proveedor.entity.ts`):
`id`, `legalName`, `taxId`, `paymentTermsDays`, `isBlocked`. Invariantes: razón social e
identificación fiscal no vacías, plazo de pago no negativo.

# Business Rules

- Empresa (`companyId`) debe existir antes de crear el proveedor.
- Bloquear un proveedor ya bloqueado, o desbloquear uno que no lo está, se rechaza (409).
- Cada bloqueo/desbloqueo se registra en `supplier_block_history` (ledger append-only) con motivo
  opcional.
- Unicidad `(company_id, tax_id)` la impone el índice único de Postgres — sin traducción de error
  amigable adicional (mismo criterio que `sku` en Productos).

# Architecture

Clean Architecture + Hexagonal, patrón idéntico a `modules/productos/backend` (verificado archivo por
archivo antes de replicarlo, no adivinado): entidad pura → `ProveedorRepository` abstracto +
`ProveedorRepositoryPrisma` sobre `BaseRepository` (paginación, exclusión de borrados, tenant vía
`withTenantScope`) → `ProveedoresService` → `ProveedoresController` (`/proveedores`). Cliente Prisma
del schema `suppliers` (`PRISMA_SUPPLIERS`) ya estaba generado y wireado en `database.module.ts` sin
consumidor — primer uso real.

# Integration

`EmpresaLookupRepository` local (copia de solo lectura sobre `core.companies`, mismo criterio que
`productos`/`inventario` — nunca se importa entre módulos de negocio).

# Security

RBAC (`proveedores.gestionar_proveedores`), tenant/company/branch vía RLS + `withTenantScope`,
auditoría universal, soft delete, `row_version` heredados de `BaseRepository` sin código propio que
los reimplemente.

# Risks

- Satélites (contactos, direcciones, cuentas bancarias, crédito, evaluaciones, clasificación,
  contratos) sin código — 11 de las 13 tablas del schema.
- E2E escrito pero no ejecutado (Docker/Postgres inactivo en el entorno donde se construyó).

# Future Improvements

Contactos/direcciones/cuentas bancarias como siguiente parte natural (mismo patrón ya usado en
Clientes — `DireccionesTab`). Evaluación de proveedores como motor separado cuando haya necesidad de
negocio confirmada.

# Related ADRs

Ninguno previo — primer ADR del dominio de Compras.

# References

`docs/database/logico/04-suppliers.md` · `modules/proveedores/backend/` · [[Suppliers]]
