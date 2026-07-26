# ELOM API Quick Reference

## Base URL
```
http://localhost:8000/api/v1/
```

## Authentication
```bash
# Login
POST /auth/token/
{"username": "user", "password": "pass"}

# Refresh token
POST /auth/token/refresh/
{"refresh": "token"}

# Headers
Authorization: Bearer <access_token>
```

## Core Endpoints

### Users
```bash
GET    /users/me                           # Current user
GET    /employees/                         # List employees
POST   /employees/                         # Create employee
PUT    /employees/{id}/                    # Update employee
POST   /employees/{id}/set_password/       # Set password
```

### Objects
```bash
GET    /objects/                           # List objects
POST   /objects/                           # Create object
PUT    /objects/{id}/                      # Update object
DELETE /objects/{id}/                      # Delete object
```

### Materials
```bash
GET    /materials/                         # List materials
POST   /materials/                         # Create material
PUT    /materials/{id}/                    # Update material
POST   /materials/{id}/upload-photo/       # Upload photo (DOC-5: было upload_photo)
DELETE /materials/{id}/photo/              # Delete photo (DOC-5: было delete_photo)
```

### Purchases
```bash
GET    /purchases/                         # List purchases
POST   /purchases/                         # Create purchase
PUT    /purchases/{id}/                    # Update purchase
DELETE /purchases/{id}/                    # Delete purchase
```

### Stock
```bash
GET    /stock/snapshots/                   # List stock movements
GET    /stock/snapshots/balance/           # Get balance
GET    /stock/snapshots/by-objects/        # Balances by objects
```

### WriteOffs
```bash
GET    /writeoffs/                         # List writeoffs
POST   /writeoffs/                         # Create writeoff
PUT    /writeoffs/{id}/                    # Update writeoff
DELETE /writeoffs/{id}/                    # Delete writeoff
```

### Archive
```bash
GET    /archive/                           # List archive periods
POST   /archive/periods/close/             # Close period
POST   /archive/periods/reopen/            # Reopen period
```

### Tools (Admin only) 🆕
```bash
# Tools
GET    /tools/                             # List tools
POST   /tools/                             # Create tool
GET    /tools/{id}/                        # Get tool
PATCH  /tools/{id}/                        # Update tool
DELETE /tools/{id}/                        # Delete tool
GET    /tools/categories/                  # Get categories for autocomplete
POST   /tools/bulk-create/                 # Bulk create tools

# Tool Issues
GET    /tool-issues/                       # List issues
POST   /tool-issues/                       # Issue tool (standard create)
POST   /tool-issues/issue/                 # Issue tool (recommended endpoint) 🆕
GET    /tool-issues/{id}/                  # Get issue
POST   /tool-issues/{id}/return/           # Return tool
GET    /tool-issues/active/                # List active issues
```

## Common Query Parameters

### Pagination
```bash
?page=1&page_size=20
```

### Search
```bash
?search=keyword
```

### Ordering
```bash
?ordering=field_name          # ASC
?ordering=-field_name         # DESC
```

### Tools Filters
```bash
?inventory_number=INV001
?category=Перфоратор           # Фильтр по категории (частичное совпадение)
?condition=good               # new|good|after_repair|needs_repair|broken|lost
?current_holder=1
?current_object=1
?in_stock=true                 # true = на складе, false = выдано
```

### Tool Issues Filters
```bash
?tool=1
?is_open=true                  # true = активна (не возвращена), false = закрыта (возвращена)
?is_returned=false             # Альтернатива is_open (true = возвращена, false = не возвращена)
?tool_inventory_number=INV001
?issued_by=1
?issued_to=1
?object=1
?is_returned=true             # true = returned, false = active
?issue_condition=good
?return_condition=good
?issued_at_from=2024-01-01
?issued_at_to=2024-12-31
```

## Data Types

### Tool 🆕
```typescript
{
  "id": 1,
  "inventory_number": "INV001",
  "name": "Перфоратор Makita HR2470",
  "category": "Перфоратор, SDS-Plus",
  "brand": "Makita",
  "current_holder": 1,
  "current_holder_name": "Иванов Петр",
  "current_object": 1,
  "current_object_name": "ЖК Солнечный",
  "condition": "good",
  "condition_display": "Хорошее",
  "is_in_stock": false,
  "status_display": "У Иванов Петр (объект: ЖК Солнечный)",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### ToolIssue 🆕
```typescript
{
  "id": 1,
  "tool": 1,
  "tool_name": "Перфоратор Makita HR2470",
  "tool_inventory_number": "INV001",
  "tool_category": "Перфоратор, SDS-Plus",  // 🆕 Категория инструмента
  "tool_brand": "Makita",                   // 🆕 Марка инструмента
  "issued_by": 1,
  "issued_by_name": "Координатор",
  "issued_to": 2,
  "issued_to_name": "Иванов Петр",
  "issued_at": "2024-01-15T10:30:00Z",
  "object": 1,
  "object_name": "ЖК Солнечный",
  "issue_condition": "good",              # Важно: issue_condition, не issued_condition
  "issue_condition_display": "Хорошее",
  "issue_comment": "",
  "return_date": null,
  "return_condition": null,               # Важно: return_condition, не returned_condition
  "return_condition_display": null,
  "return_comment": "",
  "is_returned": false,
  "is_open": true,                         # Алиас для !is_returned
  "duration_days": 5,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

## User Roles

| Role | Description |
|------|-------------|
| `admin` | Administrator (full access + tools) 🔧 |
| `manager` | Full access without accounting (operations don't create StockSnapshot) |
| `brigadier` | Create objects, writeoffs, purchases (assigned objects only) |
| `warehouse` | Full access without accounting (warehouse/workshop/project operations) |
| `requester` | View and create material requests only |

> Note: Roles updated in December 2025. Manager and warehouse work "without accounting" - operations don't create StockSnapshot records.

## Employee Profile Settings

### Accounting Mode
Controls whether operations create StockSnapshot records:

```typescript
{
  "accounting_mode": "full" | "no_accounting"
}
```

- `full` - Full accounting (default): Operations create StockSnapshot records
- `no_accounting` - No accounting: Operations don't create StockSnapshot records (for planning/documentation)

**Note:** The `accounting_mode` field is checked in `should_create_stock_snapshot()` function. If not set, falls back to legacy `role` field check (manager/warehouse = no_accounting).

## Error Responses
```typescript
// 400 Bad Request
{ "detail": "Error message" }
{ "field_name": ["Error message"] }

// 401 Unauthorized
{ "detail": "Authentication credentials were not provided." }

// 403 Forbidden
{ "detail": "You do not have permission to perform this action." }

// 404 Not Found
{ "detail": "Not found." }
```

---

**Last Updated:** 2026-07-26 (сверено с кодом)  
**Version:** 3.6

> ⚠️ Это ЧАСТИЧНАЯ шпаргалка (подмножество API). Полный контракт — сгенерированный
> `api_schema.yaml` / живой `/api/schema/`. Не источник истины.
