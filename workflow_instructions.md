# Ecommerce Automation System (MVP)

## Goal

Build a lightweight ecommerce automation system for the admin panel.

Focus on:
- simplicity
- fast execution
- clean UI
- ecommerce-specific workflows

Avoid unnecessary complexity in MVP.

---

# Workflow Steps

1. Select Trigger
2. Add Conditions (Optional)
3. Add Actions
4. Activate Workflow

If this workflow UI is already implemented:
- skip rebuilding
- only improve validation and UX if needed

---

# MVP Triggers

## Orders

- order_created
- order_paid
- order_failed
- order_cancelled
- order_delivered

## Customers

- customer_registered
- first_order_completed

## Products

- stock_low
- out_of_stock

## Cart

- cart_abandoned

## Payments

- payment_success
- payment_failed

If triggers are already created:
- skip recreating them
- only standardize trigger naming if inconsistent

Example:
- use `order_created`
- avoid mixed formats like `OrderCreated`

---

# MVP Conditions

## Operators

- equals
- not_equals
- greater_than
- less_than
- contains

If condition builder already exists:
- skip rebuilding UI
- only remove unused operators if unnecessary

---

# Condition Fields

## Order Fields

- order_amount
- payment_method
- order_status
- shipping_city
- items_count

## Customer Fields

- total_orders
- total_spent

## Product Fields

- stock_quantity
- category
- price

If fields are already implemented:
- keep existing structure
- remove duplicate or unused fields only if needed

---

# MVP Actions

## Notifications

- send_email
- send_whatsapp
- admin_notification

## Store Actions

- update_order_status
- generate_coupon

## Integrations

- add_to_google_sheet

If actions already exist:
- skip rebuilding
- only improve execution handling and error logging

---

# Event System

Every ecommerce action should emit an event.

Example:

```js
emitEvent("order_created", payload)
```

Workflow engine listens and executes matching workflows.

If event system already exists:
- skip rebuilding architecture
- only optimize event naming and execution flow

---

# Database Tables

## workflows

```sql
id
name
trigger
active
created_at
```

## workflow_conditions

```sql
workflow_id
field
operator
value
```

## workflow_actions

```sql
workflow_id
action_type
action_config
```

## workflow_logs

```sql
workflow_id
status
message
created_at
```

If tables already exist:
- skip creating duplicate tables
- only add missing columns if required

---

# Workflow Logs

Track:
- success
- failed
- execution time
- error message

If logging system already exists:
- improve readability only
- avoid overengineering

---

# Example Workflow JSON

```json
{
  "trigger": "order_created",
  "conditions": [
    {
      "field": "order_amount",
      "operator": "greater_than",
      "value": 5000
    }
  ],
  "actions": [
    {
      "type": "send_whatsapp"
    }
  ],
  "active": true
}
```

If workflow JSON structure already exists:
- reuse existing structure
- avoid changing schema unnecessarily

---

# Google Sheets Integration

Example:

Trigger:
- payment_success

Action:
- add_to_google_sheet

Suggested export fields:
- customer_name
- order_amount
- payment_method
- order_date

If Google Sheets integration already exists:
- only improve authentication and mapping flow if needed

---

# Excluded From MVP

Do NOT build these initially:

- drag-drop builder
- node editor
- delays/waits
- loops
- workflow branches
- AI workflow builder
- custom scripting
- webhook marketplace
- multi-step chains

Skip all advanced workflow-engine features for MVP.

---

# Recommended Stack

Frontend:
- Next.js
- React
- Tailwind CSS

Backend:
- Supabase
- PostgreSQL
- Edge Functions

Optional Later:
- Redis
- BullMQ

---

# Final Development Rule

Before creating any new feature:
1. Check if it already exists
2. Reuse existing implementation
3. Improve only where necessary
4. Avoid duplicate systems
5. Keep MVP lightweight