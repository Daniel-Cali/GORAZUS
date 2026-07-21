# 03 — Diagrama de Relaciones

## 1. Cómo leer estos diagramas

Con 494 tablas, un único diagrama ER es ilegible e inútil como
herramienta de trabajo. Se ofrecen dos niveles:

1. **Diagrama maestro**: relaciones entre _schemas_ (módulos), el mismo
   nivel que [04-catalogo-modulos-negocio.md](../architecture/04-catalogo-modulos-negocio.md),
   ahora con los 21 schemas de base de datos.
2. **Diagrama por módulo**: entidades principales de cada schema con
   cardinalidad real. Se muestran las tablas estructurales (encabezados,
   catálogos centrales) — las tablas `_translations`, `_status_history`
   y de auditoría fina se omiten del dibujo por ruido visual, pero están
   completas en [02-modelo-logico.md](./02-modelo-logico.md).

Toda FK hacia `core.tenants`/`companies`/`branches`/`users` (presente en
las 494 tablas) se omite de los diagramas por el mismo motivo — es
constante y ya está explicada en
[01-modelo-conceptual §1.5](./01-modelo-conceptual.md#15-excepción-a-no-fk-entre-schemas).

## 2. Diagrama maestro: relaciones entre módulos

```mermaid
flowchart TB
    subgraph Fundacion
        core[core]
        security[security]
        configuration[configuration]
    end

    core --> security
    core --> configuration

    customers[customers] --> sales[sales]
    customers --> crm[crm]
    suppliers[suppliers] --> purchases[purchases]

    products[products] --> sales
    products --> purchases
    products --> inventory[inventory]

    sales --> inventory
    purchases --> inventory
    inventory --> accounting[accounting]

    sales --> cash[cash]
    sales --> accounting
    purchases --> banks[banks]
    purchases --> accounting
    cash --> accounting
    banks --> accounting
    banks --> tesoreria_note[["(tesorería = vista, ver nota)"]]

    taxes[taxes] --> sales
    taxes --> purchases

    crm --> sales

    hr[hr] --> payroll[payroll]
    payroll --> accounting
    payroll --> banks

    services[services] --> customers
    services --> inventory
    services --> products

    projects[projects] --> sales
    projects --> purchases
    projects --> hr

    assets[assets] --> accounting
    assets --> purchases

    reports[reports] -.solo lectura.-> sales
    reports -.solo lectura.-> purchases
    reports -.solo lectura.-> inventory
    reports -.solo lectura.-> accounting
    bi[bi] -.solo lectura.-> reports

    core -.FK fundacional.-> customers & suppliers & products & inventory & sales & purchases & cash & banks & accounting & taxes & crm & hr & payroll & services & projects & assets & reports & bi & configuration & security
```

Nota: no existe schema `tesoreria` en esta base de datos — es
completamente una capa de proyección de solo lectura sobre `cash` +
`banks` + `customers` + `suppliers`, resuelta con vistas (ver
[24_views.sql](./sql/24_views.sql)), consistente con
[04-catalogo-modulos-negocio.md](../architecture/04-catalogo-modulos-negocio.md#tesoreria-vs-caja--bancos-por-qué-son-módulos-distintos).

## 3. Core

```mermaid
erDiagram
    TENANTS ||--o{ COMPANIES : posee
    COMPANIES ||--o{ BRANCHES : posee
    COMPANIES ||--o{ DEPARTMENTS : organiza
    USERS }o--o{ COMPANIES : "acceso (user_companies)"
    USERS ||--o{ USER_ROLES : tiene
    ROLES ||--o{ USER_ROLES : asignado
    ROLES ||--o{ ROLE_PERMISSIONS : incluye
    PERMISSIONS ||--o{ ROLE_PERMISSIONS : incluido_en
    USERS ||--o{ SESSIONS : abre
    USERS ||--o{ API_KEYS : emite
    DOCUMENTS }o--|| DOCUMENT_TYPES : clasificado_por
    DOCUMENTS ||--o{ DOCUMENT_VERSIONS : tiene
    WORKFLOWS ||--o{ WORKFLOW_STEPS : define
    WORKFLOWS ||--o{ WORKFLOW_INSTANCES : ejecuta
    WORKFLOW_INSTANCES ||--o{ WORKFLOW_INSTANCE_STEPS : avanza
    APPROVALS ||--o{ APPROVAL_STEPS : requiere
```

## 4. Security

```mermaid
erDiagram
    USERS ||--o{ TWO_FACTOR_CREDENTIALS : configura
    USERS ||--o{ OAUTH_TOKENS : autoriza
    OAUTH_CLIENTS ||--o{ OAUTH_TOKENS : emite
    OAUTH_CLIENTS }o--o{ OAUTH_SCOPES : "oauth_client_scopes"
    ACCESS_CONTROL_LISTS ||--o{ ACL_ENTRIES : contiene
    USERS ||--o{ LOGIN_ATTEMPTS : genera
    SECURITY_POLICIES ||--|| PASSWORD_POLICIES : referencia
```

## 5. Customers

```mermaid
erDiagram
    CUSTOMERS ||--o{ CUSTOMER_CONTACTS : tiene
    CUSTOMERS ||--o{ CUSTOMER_ADDRESSES : tiene
    CUSTOMERS ||--|| CUSTOMER_CREDIT_PROFILES : tiene
    CUSTOMERS ||--o{ CUSTOMER_CREDIT_LIMIT_HISTORY : historial
    CUSTOMERS }o--o{ SALES_ROUTES : "sales_route_customers"
    CUSTOMERS ||--o{ CUSTOMER_VISITS : recibe
    CUSTOMERS ||--|| CUSTOMER_LOYALTY_ACCOUNTS : tiene
    CUSTOMERS }o--|| CUSTOMER_CLASSIFICATIONS : clasificado_como
```

## 6. Suppliers

```mermaid
erDiagram
    SUPPLIERS ||--o{ SUPPLIER_CONTACTS : tiene
    SUPPLIERS ||--o{ SUPPLIER_ADDRESSES : tiene
    SUPPLIERS ||--|| SUPPLIER_CREDIT_PROFILES : tiene
    SUPPLIERS ||--o{ SUPPLIER_EVALUATIONS : evaluado_en
    SUPPLIER_EVALUATIONS ||--o{ SUPPLIER_EVALUATION_SCORES : detalla
```

## 7. Products

```mermaid
erDiagram
    PRODUCTS }o--|| PRODUCT_CATEGORIES : pertenece_a
    PRODUCT_CATEGORIES ||--o{ PRODUCT_CATEGORIES : subcategoria_de
    PRODUCTS }o--|| BRANDS : de_marca
    PRODUCTS ||--o{ PRODUCT_VARIANTS : tiene
    PRODUCT_VARIANTS }o--o{ PRODUCT_ATTRIBUTE_VALUES : "product_variant_attribute_values"
    PRODUCT_ATTRIBUTES ||--o{ PRODUCT_ATTRIBUTE_VALUES : define
    PRODUCTS ||--o{ PRODUCT_KIT_COMPONENTS : compuesto_de
    PRODUCTS ||--o{ BOM_COMPONENTS : requiere
    PRODUCTS }o--o{ SUPPLIERS : "product_suppliers"
    PRODUCTS ||--o{ PRODUCT_BARCODES : identificado_por
```

## 8. Inventory

```mermaid
erDiagram
    WAREHOUSES ||--o{ WAREHOUSE_ZONES : divide
    WAREHOUSE_ZONES ||--o{ WAREHOUSE_LOCATIONS : contiene
    WAREHOUSES ||--o{ STOCK : mantiene
    PRODUCTS ||--o{ STOCK : "existencia de"
    STOCK ||--o{ STOCK_MOVEMENTS : origina
    WAREHOUSES ||--o{ STOCK_TRANSFERS : origen_destino
    STOCK_TRANSFERS ||--o{ STOCK_TRANSFER_LINES : detalla
    PRODUCTS ||--o{ INVENTORY_SERIALS : rastreado_por
    PRODUCTS ||--o{ INVENTORY_LOTS : rastreado_por
    PRODUCTION_ORDERS ||--o{ PRODUCTION_ORDER_COMPONENTS : consume
    PRODUCTION_ORDERS ||--o{ PRODUCTION_ORDER_OUTPUTS : produce
```

## 9. Sales

```mermaid
erDiagram
    CUSTOMERS ||--o{ QUOTES : solicita
    QUOTES ||--o{ QUOTE_LINES : detalla
    QUOTES ||--o| SALES_ORDERS : deriva_en
    SALES_ORDERS ||--o{ SALES_ORDER_LINES : detalla
    SALES_ORDERS ||--o{ DELIVERY_NOTES : genera
    SALES_ORDERS ||--o| INVOICES : factura
    INVOICES ||--o{ INVOICE_LINES : detalla
    INVOICES ||--o{ CREDIT_NOTES : ajustado_por
    INVOICES ||--o{ ELECTRONIC_INVOICE_LOGS : timbrado_en
    INVOICES }o--o{ RECEIPTS : "receipt_allocations"
    INVOICES ||--o{ SALES_RETURNS : devuelto_en
    SALESPEOPLE ||--o{ SALES_ORDERS : gestiona
    SALESPEOPLE ||--o{ COMMISSION_ENTRIES : devenga
    SUBSCRIPTIONS ||--o{ SUBSCRIPTION_BILLING_CYCLES : factura_en
```

## 10. Purchases

```mermaid
erDiagram
    SUPPLIERS ||--o{ PURCHASE_ORDERS : recibe
    PURCHASE_REQUISITIONS ||--o| PURCHASE_ORDERS : deriva_en
    PURCHASE_ORDERS ||--o{ PURCHASE_ORDER_LINES : detalla
    PURCHASE_ORDERS ||--o{ GOODS_RECEIPT_NOTES : recibido_en
    PURCHASE_ORDERS ||--o{ PURCHASE_INVOICES : facturado_en
    PURCHASE_ORDERS ||--o{ PURCHASE_INVOICE_MATCHING : cotejado_en
    GOODS_RECEIPT_NOTES ||--o{ PURCHASE_INVOICE_MATCHING : cotejado_en
    PURCHASE_INVOICES ||--o{ PURCHASE_INVOICE_MATCHING : cotejado_en
    PURCHASE_INVOICES ||--o{ PURCHASE_WITHHOLDINGS : retenido_en
    IMPORTS ||--o{ IMPORT_EXPENSES : incurre
```

## 11. Cash

```mermaid
erDiagram
    CASH_REGISTERS ||--o{ CASH_REGISTER_OPENINGS : abre
    CASH_REGISTER_OPENINGS ||--o| CASH_REGISTER_CLOSINGS : cierra
    CASH_REGISTER_CLOSINGS ||--o{ CASH_COUNTS : arquea
    CASH_REGISTER_OPENINGS ||--o{ CASH_MOVEMENTS : registra
    PETTY_CASH_FUNDS ||--o{ PETTY_CASH_VOUCHERS : emite
```

## 12. Banks

```mermaid
erDiagram
    BANK_ACCOUNTS ||--o{ CHECKBOOKS : emite
    CHECKBOOKS ||--o{ CHECKS_ISSUED : contiene
    BANK_ACCOUNTS ||--o{ CHECKS_RECEIVED : deposita
    BANK_ACCOUNTS ||--o{ BANK_STATEMENTS : recibe
    BANK_STATEMENTS ||--o{ BANK_STATEMENT_LINES : detalla
    BANK_ACCOUNTS ||--o{ BANK_RECONCILIATIONS : concilia
    BANK_RECONCILIATIONS ||--o{ BANK_RECONCILIATION_LINES : detalla
    BANK_ACCOUNTS ||--o{ BANK_PAYMENT_BATCHES : origina
```

## 13. Accounting

```mermaid
erDiagram
    CHART_OF_ACCOUNTS ||--o{ CHART_OF_ACCOUNTS : subcuenta_de
    CHART_OF_ACCOUNTS ||--o{ JOURNAL_ENTRY_LINES : afectada_por
    JOURNAL_ENTRIES ||--o{ JOURNAL_ENTRY_LINES : detalla
    ACCOUNTING_RULES ||--o{ ACCOUNTING_RULE_LINES : plantilla
    FISCAL_YEARS ||--o{ FISCAL_PERIODS : divide
    FISCAL_PERIODS ||--o{ JOURNAL_ENTRIES : contiene
    BUDGETS ||--o{ BUDGET_LINES : detalla
    COST_CENTERS ||--o{ JOURNAL_ENTRY_LINES : imputa
```

## 14. Taxes

```mermaid
erDiagram
    TAXES ||--o{ TAX_RATES : tiene_historico
    TAX_JURISDICTIONS ||--o{ TAXES : aplica_en
    TAXES ||--o{ TAX_RULES : condiciona
    WITHHOLDING_RULES ||--o{ WITHHOLDING_CERTIFICATES : emite
    TAX_DECLARATIONS ||--o{ TAX_DECLARATION_LINES : detalla
```

## 15. CRM

```mermaid
erDiagram
    LEADS }o--|| LEAD_SOURCES : proviene_de
    LEADS ||--o{ OPPORTUNITIES : genera
    SALES_FUNNELS ||--o{ SALES_FUNNEL_STAGES : define
    OPPORTUNITIES }o--|| SALES_FUNNEL_STAGES : en_etapa
    OPPORTUNITIES ||--o{ OPPORTUNITY_LINES : detalla
    CAMPAIGNS }o--o{ LEADS : "campaign_members"
    LEADS ||--o{ FOLLOW_UP_ACTIVITIES : requiere
```

## 16. HR

```mermaid
erDiagram
    EMPLOYEES }o--|| JOB_POSITIONS : ocupa
    EMPLOYEES ||--o{ EMPLOYEE_CONTRACTS : tiene
    EMPLOYEES ||--o{ LEAVE_REQUESTS : solicita
    LEAVE_TYPES ||--o{ LEAVE_REQUESTS : clasifica
    EMPLOYEES ||--o{ VACATION_BALANCES : acumula
    EMPLOYEES ||--o{ PERFORMANCE_EVALUATIONS : evaluado_en
    JOB_VACANCIES ||--o{ CANDIDATES : recibe
```

## 17. Payroll

```mermaid
erDiagram
    SALARY_STRUCTURES ||--o{ SALARY_STRUCTURE_CONCEPTS : incluye
    PAYROLL_CONCEPTS ||--o{ SALARY_STRUCTURE_CONCEPTS : usado_en
    PAYROLL_PERIODS ||--o{ PAYROLL_RUNS : ejecuta
    PAYROLL_RUNS ||--o{ PAYROLL_ENTRIES : genera
    PAYROLL_ENTRIES ||--o{ PAYROLL_ENTRY_LINES : detalla
    LOANS ||--o{ LOAN_INSTALLMENTS : amortiza
```

## 18. Services

```mermaid
erDiagram
    CUSTOMERS ||--o{ EQUIPMENT : posee
    EQUIPMENT ||--o{ SERVICE_ORDERS : recibe
    SERVICE_ORDERS ||--o{ SERVICE_ORDER_LINES : detalla
    SERVICE_ORDERS ||--o{ TECHNICIAN_ASSIGNMENTS : asigna
    SERVICE_CONTRACTS ||--o{ MAINTENANCE_PLANS : origina
    MAINTENANCE_PLANS ||--o{ SCHEDULED_MAINTENANCES : programa
```

## 19. Projects

```mermaid
erDiagram
    PROJECTS ||--o{ PROJECT_TASKS : contiene
    PROJECT_TASKS ||--o{ PROJECT_TASKS : subtarea_de
    PROJECT_TASKS ||--o{ PROJECT_RESOURCE_ASSIGNMENTS : asigna
    PROJECT_TASKS ||--o{ PROJECT_TIMESHEETS : registra_horas
    PROJECTS ||--o{ PROJECT_BUDGETS : presupuesta
    PROJECTS ||--o{ PROJECT_BILLING_PLANS : factura_segun
```

## 20. Assets

```mermaid
erDiagram
    ASSET_CATEGORIES ||--o{ FIXED_ASSETS : clasifica
    FIXED_ASSETS ||--o{ ASSET_DEPRECIATION_ENTRIES : deprecia
    FIXED_ASSETS ||--o{ ASSET_MAINTENANCES : recibe
    FIXED_ASSETS ||--o{ ASSET_TRANSFERS : mueve
    FIXED_ASSETS ||--o| ASSET_DISPOSALS : da_de_baja
```

## 21. Reports & BI

```mermaid
erDiagram
    REPORT_DEFINITIONS ||--o{ REPORT_TEMPLATES : presenta
    REPORT_DEFINITIONS ||--o{ REPORT_EXECUTIONS : ejecuta
    REPORT_EXECUTIONS ||--o{ REPORT_EXPORTS : genera
    REPORT_DEFINITIONS ||--o{ REPORT_SCHEDULES : programa
    DASHBOARDS ||--o{ DASHBOARD_WIDGETS : contiene
    DATA_CUBES ||--o{ DATA_CUBE_DIMENSIONS : expone
    KPIS ||--o{ KPI_SNAPSHOTS : historiza
```

## 22. Configuration

```mermaid
erDiagram
    COUNTRIES ||--o{ STATE_PROVINCES : divide
    STATE_PROVINCES ||--o{ MUNICIPALITIES : divide
    CURRENCIES ||--o{ EXCHANGE_RATES : cotiza
    NUMBERING_SERIES ||--|| CORRELATIVES : controla
    PRICE_LISTS ||--o{ PRICE_LIST_ITEMS : detalla
```
