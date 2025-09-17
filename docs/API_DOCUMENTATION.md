# ELOM API Documentation

## Общая информация

**Base URL:** `http://localhost:8000/api/v1/`  
**Аутентификация:** JWT Bearer Token  
**Формат данных:** JSON  
**Документация:** `http://localhost:8000/api/docs/`

## Аутентификация

### Получение токена
```http
POST /api/v1/auth/token/
Content-Type: application/json

{
  "username": "admin",
  "password": "password123"
}
```

**Ответ:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### Обновление токена
```http
POST /api/v1/auth/token/refresh/
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### Проверка токена
```http
POST /api/v1/auth/token/verify/
Content-Type: application/json

{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

## Роли пользователей

- **director/admin** - Полные права на все операции
- **coordinator** - Только чтение
- **buyer/site_manager** - CRUD только по закрепленным объектам

## Общие параметры

### Пагинация
Все списки поддерживают пагинацию:
- `page` - номер страницы
- `page_size` - размер страницы (по умолчанию 50)

### Поиск и сортировка
- `search` - текстовый поиск
- `ordering` - сортировка (используйте `-` для убывания)

### Фильтрация
Каждый endpoint поддерживает специфичные фильтры.

## Endpoints

### 1. Пользователи

#### Текущий пользователь
```http
GET /api/v1/users/me
Authorization: Bearer <token>
```

**Ответ:**
```json
{
  "id": 1,
  "username": "admin",
  "first_name": "Admin",
  "last_name": "",
  "email": "admin@example.com",
  "role": "director"
}
```

#### Список сотрудников
```http
GET /api/v1/employees/
Authorization: Bearer <token>
```

**Параметры:**
- `search` - поиск по username, first_name, last_name, email
- `role` - фильтр по роли (admin|buyer|site_manager|director|coordinator)
- `is_active` - фильтр по активности
- `object` - фильтр по закрепленному объекту

**Ответ:**
```json
{
  "count": 5,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "username": "admin",
      "first_name": "Admin",
      "last_name": "",
      "email": "admin@example.com",
      "is_active": true,
      "role": "director",
      "assigned_object_ids": [1, 2]
    }
  ]
}
```

#### Создание сотрудника
```http
POST /api/v1/employees/
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "newuser",
  "first_name": "New",
  "last_name": "User",
  "email": "new@example.com",
  "password": "password123",
  "role": "buyer",
  "assigned_object_ids": [1, 2]
}
```

#### Смена пароля
```http
POST /api/v1/employees/{id}/set_password/
Authorization: Bearer <token>
Content-Type: application/json

{
  "password": "newpassword123"
}
```

### 2. Справочники

#### Единицы измерения
```http
GET /api/v1/units/
Authorization: Bearer <token>
```

**Параметры:**
- `search` - поиск по code, name
- `code` - точное совпадение кода
- `name` - точное совпадение имени

**Ответ:**
```json
{
  "count": 10,
  "results": [
    {
      "id": 1,
      "code": "шт",
      "name": "Штука"
    }
  ]
}
```

#### Категории материалов
```http
GET /api/v1/material-categories/
Authorization: Bearer <token>
```

**Ответ:**
```json
{
  "count": 5,
  "results": [
    {
      "id": 1,
      "name": "Кабели",
      "parent": null
    }
  ]
}
```

#### Материалы
```http
GET /api/v1/materials/
Authorization: Bearer <token>
```

**Параметры:**
- `search` - поиск по name, sku, category__name
- `name` - точное имя
- `sku` - артикул/код
- `category` - ID категории
- `default_unit` - ID базовой единицы

**Ответ:**
```json
{
  "count": 50,
  "results": [
    {
      "id": 1,
      "name": "Кабель ВВГ 3x2.5",
      "sku": "CAB-001",
      "category": 1,
      "category_name": "Кабели",
      "default_unit": 2,
      "default_unit_code": "м",
      "photo_url": "http://localhost:8000/media/materials/2025/01/cable.jpg"
    }
  ]
}
```

#### Загрузка фото материала
```http
POST /api/v1/materials/{id}/photo/
Authorization: Bearer <token>
Content-Type: multipart/form-data

photo: <file>
```

#### Удаление фото материала
```http
DELETE /api/v1/materials/{id}/photo/
Authorization: Bearer <token>
```

#### Объекты
```http
GET /api/v1/objects/
Authorization: Bearer <token>
```

**Параметры:**
- `search` - поиск по name, address
- `name` - точное имя
- `is_active` - только активные

**Ответ:**
```json
{
  "count": 3,
  "results": [
    {
      "id": 1,
      "name": "Объект А",
      "address": "ул. Примерная, 1",
      "is_active": true
    }
  ]
}
```

### 3. Закупки

#### Список закупок
```http
GET /api/v1/purchases/
Authorization: Bearer <token>
```

**Параметры:**
- `search` - поиск по supplier, invoice_number, comment
- `date_from` - дата >= (YYYY-MM-DD)
- `date_to` - дата <= (YYYY-MM-DD)
- `object` - ID объекта
- `responsible` - ID ответственного
- `is_archived` - только архив/неархив

**Ответ:**
```json
{
  "count": 25,
  "results": [
    {
      "id": 1,
      "date": "2025-01-15",
      "object": 1,
      "object_name": "Объект А",
      "supplier": "Ali-Termiz",
      "invoice_number": "INV-001",
      "vat_included": false,
      "currency": "UZS",
      "comment": "",
      "responsible": 3,
      "responsible_name": "Aziz I.",
      "total_amount": "125000.00",
      "is_archived": false,
      "cover_photo_url": null,
      "items": [
        {
          "id": 1,
          "material": 5,
          "material_name": "Кабель ВВГ",
          "unit": 2,
          "unit_code": "м",
          "quantity": "50.000",
          "price": "2500.00",
          "amount": "125000.00"
        }
      ],
      "photos": [],
      "created_at": "2025-01-15T08:00:00Z",
      "updated_at": "2025-01-15T08:05:00Z"
    }
  ]
}
```

#### Создание закупки
```http
POST /api/v1/purchases/
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2025-01-15",
  "object": 1,
  "supplier": "Ali-Termiz",
  "invoice_number": "INV-001",
  "vat_included": false,
  "currency": "UZS",
  "comment": "",
  "responsible": 3,
  "items": [
    {
      "material": 5,
      "unit": 2,
      "quantity": "50.000",
      "price": "2500.00"
    }
  ]
}
```

#### Загрузка фото закупки
```http
POST /api/v1/purchases/{id}/photos/
Authorization: Bearer <token>
Content-Type: multipart/form-data

photo: <file>
is_cover: true
```

### 4. Импорт закупок

#### Анализ Excel файла
```http
POST /api/v1/purchases/import/prepare
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <excel_file>
```

**Ответ:**
```json
{
  "header": ["Дата", "Объект", "Поставщик", "Материал", "Ед.", "Кол-во", "Цена"],
  "auto_mapping": {
    "date": 0,
    "object": 1,
    "supplier": 2,
    "invoice_number": null,
    "material": 3,
    "unit": 4,
    "quantity": 5,
    "price": 6,
    "comment": null
  }
}
```

#### Проверка данных (dry-run)
```http
POST /api/v1/purchases/import/dry_run
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <excel_file>
mapping: {"date": 0, "object": 1, ...}
```

**Ответ:**
```json
{
  "rows_scanned": 120,
  "errors": [
    {
      "row": 2,
      "field": "date",
      "message": "invalid date"
    }
  ]
}
```

#### Импорт данных
```http
POST /api/v1/purchases/import/commit
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <excel_file>
mapping: {"date": 0, "object": 1, ...}
```

**Ответ:**
```json
{
  "created": 4,
  "content_hash": "8b3f...a9"
}
```

### 5. Остатки

#### Список снапшотов
```http
GET /api/v1/stock/snapshots/
Authorization: Bearer <token>
```

**Параметры:**
- `search` - поиск по comment, material__name, object__name
- `date_from` - дата >= (YYYY-MM-DD)
- `date_to` - дата <= (YYYY-MM-DD)
- `object` - ID объекта
- `material` - ID материала
- `stage` - after_rough|after_handover
- `is_archived` - флаг архива

**Ответ:**
```json
{
  "count": 15,
  "results": [
    {
      "id": 1,
      "date": "2025-01-15",
      "object": 1,
      "object_name": "Объект А",
      "material": 5,
      "material_name": "Кабель ВВГ",
      "unit": 2,
      "unit_code": "м",
      "quantity": "12.500",
      "stage": "after_rough",
      "responsible": 3,
      "responsible_name": "Aziz I.",
      "comment": "",
      "is_archived": false,
      "created_at": "2025-01-15T08:10:00Z",
      "updated_at": "2025-01-15T08:10:00Z"
    }
  ]
}
```

#### Создание снапшота
```http
POST /api/v1/stock/snapshots/
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2025-01-15",
  "object": 1,
  "material": 5,
  "unit": 2,
  "quantity": "12.500",
  "stage": "after_rough",
  "responsible": 3,
  "comment": ""
}
```

### 6. Архив

#### Список закрытых периодов
```http
GET /api/v1/archive/periods/
Authorization: Bearer <token>
```

**Ответ:**
```json
{
  "count": 3,
  "results": [
    {
      "id": 1,
      "month": "2025-01-01",
      "object": 1,
      "object_name": "Объект А",
      "closed_at": "2025-01-31T18:05:00Z",
      "closed_by": 2,
      "closed_by_name": "Director"
    }
  ]
}
```

#### Закрытие периода
```http
POST /api/v1/archive/periods/close
Authorization: Bearer <token>
Content-Type: application/json

{
  "object": 1,
  "month": "2025-01"
}
```

#### Открытие периода
```http
POST /api/v1/archive/periods/reopen
Authorization: Bearer <token>
Content-Type: application/json

{
  "id": 1
}
```

### 7. Отчеты

#### Отчет по периодам
```http
GET /api/v1/reports/purchases/by-period?period=month&date_from=2025-01-01&date_to=2025-01-31&export=xlsx
Authorization: Bearer <token>
```

**Параметры:**
- `period` - day|month (по умолчанию month)
- `date_from` - дата начала (YYYY-MM-DD)
- `date_to` - дата окончания (YYYY-MM-DD)
- `object` - ID объектов (множественный)
- `responsible` - ID ответственного
- `is_archived` - флаг архива
- `export` - xlsx|pdf

**Ответ (JSON):**
```json
{
  "rows": [
    ["2025-01", 12, 3450000.0],
    ["2025-02", 8, 1250000.0]
  ]
}
```

#### Отчет по объектам
```http
GET /api/v1/reports/purchases/by-object?date_from=2025-01-01&export=xlsx
Authorization: Bearer <token>
```

**Ответ:**
```json
{
  "rows": [
    [1, "Объект А", 7, 980000.0],
    [2, "Объект Б", 3, 270000.0]
  ]
}
```

#### Отчет по ответственным
```http
GET /api/v1/reports/purchases/by-responsible?date_from=2025-01-01&export=xlsx
Authorization: Bearer <token>
```

**Ответ:**
```json
{
  "rows": [
    [3, "Aziz I.", 6, 750000.0],
    [7, "Javlon R.", 4, 520000.0]
  ]
}
```

#### Отчет по материалам
```http
GET /api/v1/reports/purchases/by-material?date_from=2025-01-01&export=xlsx
Authorization: Bearer <token>
```

**Ответ:**
```json
{
  "rows": [
    [5, "Кабель ВВГ", "м", 150.0, 3750000.0, 12],
    [9, "Автомат 16A", "шт", null, 820000.0, 7]
  ]
}
```

## Коды ошибок

### Общие ошибки
- `400` - Ошибка валидации
- `401` - Не авторизован
- `403` - Доступ запрещен
- `404` - Не найдено
- `500` - Внутренняя ошибка сервера

### Формат ошибок
```json
{
  "detail": "Validation error",
  "errors": {
    "field_name": ["Error message"],
    "non_field_errors": ["General error"]
  }
}
```

## Особенности

### Архивирование
- Архивные записи (`is_archived=true`) доступны только для чтения
- Закрытие периода архивирует все закупки и снапшоты за месяц
- Только director/admin могут закрывать/открывать периоды

### Импорт Excel
- Поддерживает автоматическое маппирование колонок
- Идемпотентность по хешу файла
- Dry-run для проверки данных перед импортом
- Группировка по (дата, объект, поставщик, накладная)

### Конвертация единиц
- Система поддерживает конвертацию между единицами измерения
- В отчетах по материалам количество приводится к базовой единице
- Если конвертация невозможна, возвращается `null`

### Файлы
- Фото материалов: `/media/materials/YYYY/MM/`
- Фото закупок: `/media/purchases/YYYY/MM/`
- Поддержка multipart/form-data для загрузки

## Примеры использования

### Получение всех материалов с поиском
```javascript
const response = await fetch('/api/v1/materials/?search=кабель&category=1', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const data = await response.json();
```

### Создание закупки
```javascript
const purchaseData = {
  date: '2025-01-15',
  object: 1,
  supplier: 'Поставщик',
  items: [
    {
      material: 5,
      unit: 2,
      quantity: '50.000',
      price: '2500.00'
    }
  ]
};

const response = await fetch('/api/v1/purchases/', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(purchaseData)
});
```

### Экспорт отчета в Excel
```javascript
const response = await fetch('/api/v1/reports/purchases/by-period?export=xlsx&date_from=2025-01-01', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

if (response.ok) {
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'report.xlsx';
  a.click();
}
```
