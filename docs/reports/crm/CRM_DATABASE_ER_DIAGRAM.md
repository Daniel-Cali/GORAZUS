# Diagrama ER — Base de Datos CRM/Customers

> Entregable de la fase "CRM — Parte 02 (Base de Datos)". Cubre los dos
> schemas reales que juntos responden al pedido de "base de datos CRM
> completa": `customers` (maestro de clientes, 20 tablas + 1 vista) y `crm`
> (leads/oportunidades/campañas/agenda/seguimientos, 17 tablas). Columnas
> de auditoría universales (`tenant_id`/`company_id`/`branch_id`/
> `created_at`/`updated_at`/`deleted_at`/`created_by`/`updated_by`/
> `deleted_by`/`version`/`row_version`/`is_active`/`is_deleted`/
> `observations`/`metadata`) se omiten del diagrama por legibilidad — están
> en **todas** las tablas sin excepción, ver
> [docs/database/dictionary/03-customers.md](../../database/dictionary/03-customers.md)/
> [13-crm.md](../../database/dictionary/13-crm.md) para el detalle columna
> por columna.

## 1. Schema `customers` — maestro de clientes (20 tablas + 1 vista)

```mermaid
erDiagram
    CUSTOMERS ||--o{ CUSTOMER_ADDRESSES : tiene
    CUSTOMERS ||--o{ CUSTOMER_CONTACTS : tiene
    CUSTOMERS ||--o{ CUSTOMER_BANK_ACCOUNTS : tiene
    CUSTOMERS ||--o{ CUSTOMER_REFERENCES : tiene
    CUSTOMERS ||--o{ CUSTOMER_DISCOUNTS : tiene
    CUSTOMERS ||--o{ CUSTOMER_PRICE_LISTS : tiene
    CUSTOMERS ||--o{ CUSTOMER_CREDIT_PROFILES : tiene
    CUSTOMERS ||--o{ CUSTOMER_CREDIT_LIMIT_HISTORY : registra
    CUSTOMERS ||--o{ CUSTOMER_BLOCK_HISTORY : registra
    CUSTOMERS ||--o{ CUSTOMER_STATEMENTS : genera
    CUSTOMERS ||--o{ CUSTOMER_LOYALTY_ACCOUNTS : tiene
    CUSTOMERS ||--o{ CUSTOMER_WISHLIST_ITEMS : tiene
    CUSTOMERS ||--o{ CUSTOMER_VISITS : recibe
    CUSTOMERS ||--o{ CUSTOMER_NOTES : tiene
    CUSTOMERS ||--o{ CUSTOMER_RATINGS : tiene
    CUSTOMERS }o--o| CUSTOMER_CATEGORIES : clasificado_en
    CUSTOMERS }o--o| CUSTOMER_CLASSIFICATIONS : clasificado_en
    SALES_ROUTES ||--o{ SALES_ROUTE_CUSTOMERS : incluye
    CUSTOMERS ||--o{ SALES_ROUTE_CUSTOMERS : visitado_en
    CUSTOMERS ||--o{ V_CUSTOMER_TIMELINE : "agrega (vista, sin FK real)"

    CUSTOMERS {
        uuid id PK
        text legal_name
        text trade_name
        text tax_id
        char preferred_currency_code
        uuid assigned_salesperson_id "ID suelto -> sales.salespeople"
        boolean is_blocked
        uuid classification_id FK
        uuid category_id FK
    }
    CUSTOMER_ADDRESSES {
        uuid id PK
        uuid customer_id FK
        text address_type
        text line1
        boolean is_default
    }
    CUSTOMER_CONTACTS {
        uuid id PK
        uuid customer_id FK
        text full_name
        text email
        boolean is_primary
    }
    CUSTOMER_CREDIT_PROFILES {
        uuid id PK
        uuid customer_id FK
        numeric credit_limit
        integer payment_terms_days
    }
    CUSTOMER_CREDIT_LIMIT_HISTORY {
        uuid id PK
        uuid customer_id FK
        numeric previous_limit
        numeric new_limit
    }
    CUSTOMER_PRICE_LISTS {
        uuid id PK
        uuid customer_id FK
        uuid price_list_id "ID suelto -> configuration"
    }
    CUSTOMER_NOTES {
        uuid id PK
        uuid customer_id FK
        uuid author_user_id
        text note_text
        boolean is_pinned
    }
    CUSTOMER_RATINGS {
        uuid id PK
        uuid customer_id FK
        uuid rated_by_user_id
        text rating_type
        numeric score
    }
    CUSTOMER_STATEMENTS {
        uuid id PK
        uuid customer_id FK
        date period_start
        date period_end
        numeric closing_balance
    }
    CUSTOMER_BLOCK_HISTORY {
        uuid id PK
        uuid customer_id FK
        text action
        text reason
    }
    CUSTOMER_VISITS {
        uuid id PK
        uuid customer_id FK
        uuid route_id FK
        timestamptz visited_at
    }
    CUSTOMER_CATEGORIES {
        uuid id PK
        text name
    }
    CUSTOMER_CLASSIFICATIONS {
        uuid id PK
        text name
    }
    SALES_ROUTES {
        uuid id PK
        text name
    }
    SALES_ROUTE_CUSTOMERS {
        uuid id PK
        uuid route_id FK
        uuid customer_id FK
        smallint visit_order
    }
    V_CUSTOMER_TIMELINE {
        uuid customer_id
        text event_type
        timestamptz event_at
        text summary
    }
```

**Nuevo en esta fase** (2026-07-25, `sql/36_crm_customer_completion.sql`):
`CUSTOMER_NOTES`, `CUSTOMER_RATINGS`, `V_CUSTOMER_TIMELINE`. El resto (17
tablas + 1 vista) ya existía, certificado Enterprise v1.1.0 — no se tocó su
estructura.

## 2. Schema `crm` — leads, oportunidades, campañas, agenda, seguimientos (17 tablas)

```mermaid
erDiagram
    LEADS ||--o{ LEAD_STATUS_HISTORY : registra
    LEAD_STATUS ||--o{ LEAD_STATUS_HISTORY : referencia
    LEAD_SOURCES ||--o{ LEADS : origina
    LEAD_STATUS ||--o{ LEADS : estado_actual
    LEADS ||--o{ OPPORTUNITIES : origina
    LEADS ||--o{ CAMPAIGN_MEMBERS : participa
    LEADS ||--o{ CALENDAR_EVENTS : referencia
    LEADS ||--o{ FOLLOW_UP_ACTIVITIES : tiene
    LEADS ||--o{ CALL_LOGS : registra
    LEADS ||--o{ EMAIL_LOGS : registra
    LEADS ||--o{ WHATSAPP_LOGS : registra
    LEADS }o--o| CUSTOMERS_EXTERNO : "convierte en (customers, ID suelto)"

    OPPORTUNITIES ||--o{ OPPORTUNITY_LINES : contiene
    SALES_FUNNELS ||--o{ SALES_FUNNEL_STAGES : define
    SALES_FUNNEL_STAGES ||--o{ OPPORTUNITIES : etapa_actual
    OPPORTUNITY_LOSS_REASONS ||--o{ OPPORTUNITIES : motivo_perdida
    OPPORTUNITIES ||--o{ CALENDAR_EVENTS : referencia
    OPPORTUNITIES }o--o| CUSTOMERS_EXTERNO : "origina desde (alternativo, ID suelto)"
    OPPORTUNITIES }o--o| SALES_ORDER_EXTERNO : "materializa al ganar (ventas, ID suelto)"

    CAMPAIGNS ||--o{ CAMPAIGN_MEMBERS : agrupa
    CALENDAR_EVENTS ||--o{ CALENDAR_EVENT_ATTENDEES : convoca
    FOLLOW_UP_ACTIVITIES }o--o| CUSTOMERS_EXTERNO : "aplica a (nuevo 2026-07-25, ID suelto)"
    CALL_LOGS }o--o| CUSTOMERS_EXTERNO : "aplica a (ID suelto, ya existía)"
    EMAIL_LOGS }o--o| CUSTOMERS_EXTERNO : "aplica a (ID suelto, ya existía)"
    WHATSAPP_LOGS }o--o| CUSTOMERS_EXTERNO : "aplica a (ID suelto, ya existía)"

    LEADS {
        uuid id PK
        text full_name
        uuid source_id FK
        uuid status_id FK
        uuid converted_customer_id "ID suelto -> customers.customers"
    }
    OPPORTUNITIES {
        uuid id PK
        uuid lead_id FK "nullable"
        uuid customer_id "nullable, ID suelto"
        uuid funnel_stage_id FK
        text status
        uuid loss_reason_id FK
        uuid resulting_sales_order_id "ID suelto -> ventas"
    }
    OPPORTUNITY_LINES {
        uuid id PK
        uuid opportunity_id FK
        uuid product_id "ID suelto -> products"
    }
    SALES_FUNNEL_STAGES {
        uuid id PK
        uuid funnel_id FK
        numeric win_probability_percentage
    }
    CAMPAIGNS {
        uuid id PK
        text name
        numeric budget
    }
    CAMPAIGN_MEMBERS {
        uuid id PK
        uuid campaign_id FK
        uuid lead_id FK "NOT NULL — nunca customer_id"
    }
    CALENDAR_EVENTS {
        uuid id PK
        uuid lead_id FK "nullable"
        uuid opportunity_id FK "nullable"
    }
    CALENDAR_EVENT_ATTENDEES {
        uuid id PK
        uuid event_id FK
        uuid user_id "xor external_email"
        text external_email "xor user_id"
    }
    FOLLOW_UP_ACTIVITIES {
        uuid id PK
        uuid lead_id FK "nullable"
        uuid opportunity_id FK "nullable"
        uuid customer_id "nullable, ID suelto — NUEVO 2026-07-25"
        uuid assigned_to_user_id
        timestamptz due_at
        timestamptz completed_at
    }
    CALL_LOGS {
        uuid id PK
        uuid lead_id "nullable"
        uuid customer_id "nullable"
        integer duration_seconds
    }
```

**Nuevo en esta fase**: solo `FOLLOW_UP_ACTIVITIES.customer_id`. Las 17
tablas siguen siendo 17 — ninguna tabla nueva en este schema, era el que
menos brechas reales tenía (`call_logs`/`email_logs`/`whatsapp_logs` ya
soportaban `customer_id` desde el diseño original).

## 3. Qué NO se modeló como tabla nueva (decisión explícita, no omisión)

| Item pedido                                   | Dónde vive realmente                                                                                               | Por qué no es una tabla nueva                                                                                                                                       |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Customer tags                                 | `core.entity_tags` (`entity_type='customers.customers'`) + `core.tags`                                             | Mecanismo polimórfico genérico ya construido, usado por todo el proyecto — una tabla `customer_tags` sería una segunda implementación redundante del mismo concepto |
| Customer documents / Customer attachments     | `core.documents` (`source_module='customers'`, `source_entity_id`) + `core.files`                                  | Mismo argumento — mecanismo de adjuntos genérico ya construido y usado por todos los módulos                                                                        |
| Customer groups                               | `customer_categories` + `customer_classifications` (dos taxonomías ya existentes)                                  | Una tercera tabla de "grupos" sería una tercera taxonomía redundante sin diferencia estructural real frente a las dos que ya existen                                |
| Sales representatives                         | `sales.salespeople` (ya existe, referenciado por `assigned_salesperson_id` como ID suelto desde `customers`/`crm`) | Entidad ya modelada en otro schema — `customers`/`crm` correctamente no duplican al vendedor, solo lo referencian                                                   |
| Customer activities (bitácora de interacción) | `crm.call_logs`/`email_logs`/`whatsapp_logs` — **ya tenían `customer_id`** antes de esta fase                      | No era un gap — verificado en la auditoría antes de escribir la migración                                                                                           |

Ver [`CRM_ARCHITECTURE.md`](./CRM_ARCHITECTURE.md) para la arquitectura de
código (entidades, servicios, repositorios) y
[`CRM_ROADMAP.md`](./CRM_ROADMAP.md) para el plan de implementación.
