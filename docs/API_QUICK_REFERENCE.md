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
POST   /materials/{id}/upload_photo/       # Upload photo
DELETE /materials/{id}/delete_photo/       # Delete photo
```

### Purchases
```bash
GET    /purchases/                         # List purchases
POST   /purchases/                         # Create purchase
PUT    /purchases/{id}/                    # Update purchase
DELETE /purchases/{id}/                    # Delete purchase
POST   /purchases/{id}/archive/            # Archive purchase
POST   /purchases/{id}/duplicate/          # Duplicate purchase

# Purchase Items
GET    /purchase-items/                    # List items
POST   /purchase-items/                    # Create item
PUT    /purchase-items/{id}/               # Update item
DELETE /purchase-items/{id}/               # Delete item

# Photos
POST   /purchases/{id}/upload_photo/       # Upload photo
DELETE /purchases/{id}/delete_photo/{photo_id}/  # Delete photo
POST   /purchases/{id}/set_cover_photo/{photo_id}/  # Set cover
```

### Stock
```bash
# Stock Snapshots (Movements)
GET    /stock/snapshots/                   # List movements

# Write-offs
GET    /writeoffs/                         # List write-offs
POST   /writeoffs/                         # Create write-off
PUT    /writeoffs/{id}/                    # Update write-off
DELETE /writeoffs/{id}/                    # Delete write-off

# Archive
GET    /archive/periods/                   # List archive periods
POST   /archive/periods/close/             # Close period
POST   /archive/periods/{id}/reopen/       # Reopen period
```

### Reports
```bash
GET    /reports/by-objects/                # Objects report
GET    /reports/by-responsibles/           # Responsibles report
GET    /reports/by-materials/              # Materials report
```

### Import
```bash
POST   /purchases/import/prepare/          # Prepare import
POST   /purchases/import/dry_run/          # Test import
POST   /purchases/import/commit/           # Commit import
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
?ordering=field1,-field2      # Multiple fields
```

### Date Filters
```bash
?date_from=2024-01-01
?date_to=2024-12-31
```

### Specific Filters
```bash
# Purchases
?object=1&responsible=1&is_archived=false

# Materials
?category=1&is_active=true

# Write-offs
?stage=post_rough&material=1

# Stock
?source_type=purchase_item&stage=delivery_fixed
```

## Data Types

### Purchase
```typescript
{
  "id": 1,
  "date": "2024-01-15",
  "object": 1,
  "object_name": "ЖК Солнечный",
  "supplier": "ООО Стройматериалы",
  "invoice_number": "INV-001",
  "vat_included": true,
  "currency": "UZS",
  "comment": "Закупка материалов",
  "responsible": 1,
  "total_amount": 5000000,
  "is_archived": false,
  "purchase_no": "PUR-2024-0001",
  "items": [...],
  "photos": [...]
}
```

### WriteOff
```typescript
{
  "id": 1,
  "date": "2024-01-15",
  "object": 1,
  "object_name": "ЖК Солнечный",
  "material": 1,
  "material_name": "Цемент М400",
  "unit": 2,
  "unit_code": "кг",
  "quantity": 25.5,
  "stage": "post_rough",
  "responsible": 1,
  "comment": "Списание после работ",
  "is_archived": false,
  "current_balance": 100.0,
  "smart_quantity": {
    "value": 25.5,
    "unit": "кг",
    "original_value": 25.5,
    "original_unit": "кг"
  },
  "validation_warnings": []
}
```

### StockSnapshot
```typescript
{
  "id": 1,
  "date": "2024-01-15",
  "object": 1,
  "object_name": "ЖК Солнечный",
  "material": 1,
  "material_name": "Цемент М400",
  "unit": 2,
  "unit_code": "кг",
  "quantity_signed": 100.0,  // + for income, - for outcome
  "stage": "delivery_fixed",
  "source_type": "purchase_item",
  "source_id": 1,
  "responsible": 1,
  "comment": "",
  "is_archived": false,
  "smart_quantity": {...},
  "source_description": "Закупка #PUR-2024-0001"
}
```

## User Roles
- `admin` - Full access
- `director` - All objects access
- `coordinator` - Assigned objects only
- `brigadier` - Assigned objects only
- `buyer` - Assigned objects only
- `site_manager` - Assigned objects only

## Stages
- `acceptance` - Object acceptance
- `request` - Request
- `delivery_fixed` - Actual delivery
- `post_rough` - After rough work
- `handover` - Handover

## Source Types
- `purchase_item` - From purchase
- `writeoff` - From write-off

## HTTP Status Codes
- `200` - OK
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Server Error
