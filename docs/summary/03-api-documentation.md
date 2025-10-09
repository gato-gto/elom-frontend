# API документация ELOM

## Обзор API

ELOM использует Django REST Framework для предоставления RESTful API с полной поддержкой CRUD операций, аутентификации, фильтрации и пагинации.

## Базовые настройки

### Base URL
```
http://localhost:8000/api/v1/
```

### Аутентификация
API использует JWT (JSON Web Tokens) для аутентификации:
- **Access Token**: Короткоживущий токен для доступа к API
- **Refresh Token**: Долгоживущий токен для обновления access token

### Заголовки запросов
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

## Аутентификация

### 1. Получение токенов
```http
POST /auth/token/
Content-Type: application/json

{
    "username": "admin",
    "password": "password"
}
```

**Ответ:**
```json
{
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### 2. Обновление токена
```http
POST /auth/token/refresh/
Content-Type: application/json

{
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Ответ:**
```json
{
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### 3. Проверка токена
```http
POST /auth/token/verify/
Content-Type: application/json

{
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

## Пользователи

### 1. Текущий пользователь
```http
GET /users/me/
Authorization: Bearer <access_token>
```

**Ответ:**
```json
{
    "id": 1,
    "username": "admin",
    "first_name": "Admin",
    "last_name": "User",
    "email": "admin@example.com",
    "role": "admin",
    "is_active": true,
    "assigned_object_ids": [1, 2, 3]
}
```

### 2. Список сотрудников
```http
GET /employees/
Authorization: Bearer <access_token>
```

**Параметры запроса:**
- `page`: Номер страницы (по умолчанию: 1)
- `page_size`: Размер страницы (по умолчанию: 20)
- `search`: Поиск по имени, email, username
- `role`: Фильтр по роли (admin, director, coordinator, brigadier, buyer, site_manager)
- `is_active`: Фильтр по активности (true/false)
- `ordering`: Сортировка (username, -created_at, etc.)

**Ответ:**
```json
{
    "count": 10,
    "next": "http://localhost:8000/api/v1/employees/?page=2",
    "previous": null,
    "results": [
        {
            "id": 1,
            "username": "admin",
            "first_name": "Admin",
            "last_name": "User",
            "email": "admin@example.com",
            "role": "admin",
            "is_active": true,
            "assigned_object_ids": [],
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-01T00:00:00Z"
        }
    ]
}
```

### 3. Создание сотрудника
```http
POST /employees/
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "username": "newuser",
    "first_name": "New",
    "last_name": "User",
    "email": "newuser@example.com",
    "role": "buyer",
    "assigned_object_ids": [1, 2],
    "password": "securepassword"
}
```

### 4. Обновление сотрудника
```http
PUT /employees/{id}/
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "first_name": "Updated",
    "last_name": "Name",
    "email": "updated@example.com",
    "role": "coordinator",
    "assigned_object_ids": [1, 2, 3]
}
```

### 5. Установка пароля
```http
POST /employees/{id}/set_password/
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "password": "newpassword"
}
```

## Объекты

### 1. Список объектов
```http
GET /objects/
Authorization: Bearer <access_token>
```

**Параметры запроса:**
- `page`, `page_size`: Пагинация
- `search`: Поиск по названию, адресу
- `is_active`: Фильтр по активности
- `responsible`: Фильтр по ответственному
- `date_start`: Фильтр по дате начала
- `date_end`: Фильтр по дате окончания
- `ordering`: Сортировка (name, id, responsible)

**Ответ:**
```json
{
    "count": 5,
    "next": null,
    "previous": null,
    "results": [
        {
            "id": 1,
            "name": "ЖК Солнечный",
            "address": "ул. Солнечная, 1",
            "is_active": true,
            "responsible": 2,
            "responsible_name": "Иван Иванов",
            "key_person_name": "Петр Петров",
            "key_person_contacts": "+998 90 123 45 67",
            "date_start": "2024-01-01",
            "date_end": null,
            "lat": "41.311081",
            "lng": "69.240562",
            "location_url": "https://maps.google.com/...",
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-01T00:00:00Z"
        }
    ]
}
```

### 2. Создание объекта
```http
POST /objects/
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "name": "Новый объект",
    "address": "ул. Новая, 1",
    "is_active": true,
    "responsible": 2,
    "key_person_name": "Иван Иванов",
    "key_person_contacts": "+998 90 123 45 67",
    "date_start": "2024-01-01",
    "lat": "41.311081",
    "lng": "69.240562",
    "location_url": "https://maps.google.com/..."
}
```

## Материалы

### 1. Список материалов
```http
GET /materials/
Authorization: Bearer <access_token>
```

**Параметры запроса:**
- `page`, `page_size`: Пагинация
- `search`: Поиск по названию, SKU, описанию
- `category`: Фильтр по категории
- `is_active`: Фильтр по активности
- `default_unit`: Фильтр по единице измерения
- `ordering`: Сортировка

**Ответ:**
```json
{
    "count": 100,
    "next": "http://localhost:8000/api/v1/materials/?page=2",
    "previous": null,
    "results": [
        {
            "id": 1,
            "name": "Цемент М400",
            "sku": "CEM-400-50",
            "category": 1,
            "category_name": "Строительные материалы",
            "default_unit": 1,
            "default_unit_code": "кг",
            "description": "Портландцемент марки М400",
            "manufacturer": "Узбекцемент",
            "average_price": "2500.00",
            "photo_url": "http://localhost:8000/media/materials/2024/01/cement.jpg",
            "is_active": true,
            "created_date": "2024-01-01",
            "purchases_count": 5,
            "total_purchased_amount": "125000.00",
            "last_purchase_date": "2024-01-15",
            "current_stock": "2500.00",
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-01T00:00:00Z"
        }
    ]
}
```

### 2. Создание материала
```http
POST /materials/
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "name": "Новый материал",
    "sku": "NEW-001",
    "category": 1,
    "default_unit": 1,
    "description": "Описание материала",
    "manufacturer": "Производитель",
    "average_price": "1000.00",
    "is_active": true,
    "created_date": "2024-01-01"
}
```

### 3. Загрузка фото материала
```http
POST /materials/{id}/upload-photo/
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

photo: <file>
```

### 4. Материалы по объекту
```http
GET /materials/by-object/
Authorization: Bearer <access_token>
```

**Параметры запроса:**
- `object_id` (обязательный): ID объекта для фильтрации материалов
- `is_active` (опциональный): Фильтр по активности материалов (по умолчанию: true)

**Пример запроса:**
```http
GET /materials/by-object/?object_id=1&is_active=true
Authorization: Bearer <access_token>
```

**Ответ:**
```json
[
    {
        "id": 1,
        "name": "Цемент М400",
        "sku": "CEM-400-50",
        "category": 1,
        "category_name": "Строительные материалы",
        "default_unit": 1,
        "default_unit_code": "кг",
        "description": "Портландцемент марки М400",
        "manufacturer": "Узбекцемент",
        "average_price": "2500.00",
        "photo_url": "http://localhost:8000/media/materials/2024/01/cement.jpg",
        "is_active": true,
        "created_date": "2024-01-01",
        "purchases_count": 5,
        "total_purchased_amount": "125000.00",
        "last_purchase_date": "2024-01-15",
        "current_stock": "2500.00",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
    },
    {
        "id": 2,
        "name": "Песок речной",
        "sku": "SAND-001",
        "category": 1,
        "category_name": "Строительные материалы",
        "default_unit": 2,
        "default_unit_code": "м³",
        "description": "Песок речной для строительства",
        "manufacturer": "Карьер №1",
        "average_price": "1500.00",
        "photo_url": null,
        "is_active": true,
        "created_date": "2024-01-01",
        "purchases_count": 3,
        "total_purchased_amount": "45000.00",
        "last_purchase_date": "2024-01-10",
        "current_stock": "15.00",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
    }
]
```

**Описание:**
Этот endpoint возвращает список материалов, которые были закуплены для указанного объекта. Материалы фильтруются на основе записей в таблице закупок (`PurchaseItem`), где закупка связана с указанным объектом.

**Использование:**
- В форме списаний для фильтрации доступных материалов по выбранному объекту
- Для получения списка материалов, которые можно списать с конкретного объекта
- Для валидации доступности материалов на объекте

## Закупки

### 1. Список закупок
```http
GET /purchases/
Authorization: Bearer <access_token>
```

**Параметры запроса:**
- `page`, `page_size`: Пагинация
- `search`: Поиск по номеру закупки, комментарию
- `object`: Фильтр по объекту
- `responsible`: Фильтр по ответственному
- `is_archived`: Фильтр по архивированным
- `currency`: Фильтр по валюте
- `date_from`: Фильтр по дате от
- `date_to`: Фильтр по дате до
- `status`: Фильтр по статусу (new, completed, cancelled)
- `ordering`: Сортировка

**Ответ:**
```json
{
    "count": 25,
    "next": "http://localhost:8000/api/v1/purchases/?page=2",
    "previous": null,
    "results": [
        {
            "id": 1,
            "date": "2024-01-15",
            "object": 1,
            "object_name": "ЖК Солнечный",
            "supplier": 1,
            "supplier_name": "ООО Стройматериалы",
            "invoice_number": "INV-001",
            "currency": "UZS",
            "comment": "Закупка материалов для фундамента",
            "responsible": 2,
            "responsible_name": "Иван Иванов",
            "total_amount": "5000000.00",
            "is_archived": false,
            "cover_photo_url": "http://localhost:8000/media/purchases/2024/01/cover.jpg",
            "purchase_no": "PUR-2024-0001",
            "status": "new",
            "items": [
                {
                    "id": 1,
                    "material": 1,
                    "material_name": "Цемент М400",
                    "unit": 1,
                    "unit_code": "кг",
                    "quantity": "2000.00",
                    "price": "2500.00",
                    "amount": "5000000.00",
                    "created_at": "2024-01-15T00:00:00Z",
                    "updated_at": "2024-01-15T00:00:00Z"
                }
            ],
            "photos": [
                {
                    "id": 1,
                    "url": "http://localhost:8000/media/purchases/2024/01/photo1.jpg",
                    "is_cover": true,
                    "type": "general",
                    "mime": "image/jpeg",
                    "size_bytes": 1024000,
                    "created_at": "2024-01-15T00:00:00Z"
                }
            ],
            "created_at": "2024-01-15T00:00:00Z",
            "updated_at": "2024-01-15T00:00:00Z"
        }
    ]
}
```

### 2. Создание закупки
```http
POST /purchases/
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "date": "2024-01-15",
    "object": 1,
    "supplier": 1,
    "invoice_number": "INV-001",
    "currency": "UZS",
    "comment": "Закупка материалов",
    "responsible": 2,
    "status": "new",
    "items": [
        {
            "material": 1,
            "unit": 1,
            "quantity": "2000.00",
            "price": "2500.00",
            "amount": "5000000.00"
        }
    ]
}
```

### 3. Обновление закупки
```http
PUT /purchases/{id}/
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "status": "completed",
    "comment": "Закупка завершена"
}
```

### 4. Загрузка фото закупки
```http
POST /purchases/{id}/photos/upload/
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

photo: <file>
is_cover: true
type: "report"
```

### 5. Массовая загрузка фото
```http
POST /purchases/{id}/photos/bulk-upload/
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

files: <file1>, <file2>, <file3>
```

### 6. Валидация закупки
```http
GET /purchases/{id}/validate/
Authorization: Bearer <access_token>
```

**Ответ:**
```json
{
    "is_valid": true,
    "warnings": [],
    "errors": [],
    "instruction_photos_count": 2,
    "report_photos_count": 1
}
```

## Поставщики

### 1. Список поставщиков
```http
GET /suppliers/
Authorization: Bearer <access_token>
```

**Параметры запроса:**
- `page`, `page_size`: Пагинация
- `search`: Поиск по названию, контактам
- `is_active`: Фильтр по активности
- `ordering`: Сортировка

**Ответ:**
```json
{
    "count": 10,
    "next": null,
    "previous": null,
    "results": [
        {
            "id": 1,
            "name": "ООО Стройматериалы",
            "contact_person": "Иван Петров",
            "phone": "+998 90 123 45 67",
            "email": "info@stroymat.uz",
            "address": "ул. Строительная, 1, Ташкент",
            "is_active": true,
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-01T00:00:00Z"
        }
    ]
}
```

### 2. Создание поставщика
```http
POST /suppliers/
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "name": "Новый поставщик",
    "contact_person": "Контактное лицо",
    "phone": "+998 90 123 45 67",
    "email": "info@newsupplier.uz",
    "address": "Адрес поставщика",
    "is_active": true
}
```

## Остатки

### 1. Список движений остатков
```http
GET /stock/snapshots/
Authorization: Bearer <access_token>
```

**Параметры запроса:**
- `page`, `page_size`: Пагинация
- `search`: Поиск по материалу, объекту
- `object`: Фильтр по объекту
- `material`: Фильтр по материалу
- `stage`: Фильтр по этапу
- `source_type`: Фильтр по типу источника (purchase_item, writeoff)
- `source_id`: Фильтр по ID источника
- `responsible`: Фильтр по ответственному
- `is_archived`: Фильтр по архивированным
- `date_from`: Фильтр по дате от
- `date_to`: Фильтр по дате до
- `ordering`: Сортировка

**Ответ:**
```json
{
    "count": 50,
    "next": "http://localhost:8000/api/v1/stock/snapshots/?page=2",
    "previous": null,
    "results": [
        {
            "id": 1,
            "date": "2024-01-15",
            "object": 1,
            "object_name": "ЖК Солнечный",
            "material": 1,
            "material_name": "Цемент М400",
            "unit": 1,
            "unit_code": "кг",
            "quantity_signed": "2000.00",
            "stage": "delivery_fixed",
            "source_type": "purchase_item",
            "source_id": 1,
            "responsible": 2,
            "responsible_name": "Иван Иванов",
            "comment": "",
            "is_archived": false,
            "smart_quantity": {
                "value": 2000.0,
                "unit": "кг",
                "original_value": 2000.0,
                "original_unit": "кг",
                "display_value": 2000.0,
                "display_unit": "кг",
                "conversion_applied": false
            },
            "source_description": "Закупка #PUR-2024-0001",
            "created_at": "2024-01-15T00:00:00Z",
            "updated_at": "2024-01-15T00:00:00Z"
        }
    ]
}
```

### 2. Создание движения остатков
```http
POST /stock/snapshots/
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "date": "2024-01-15",
    "object": 1,
    "material": 1,
    "unit": 1,
    "quantity_signed": "2000.00",
    "stage": "delivery_fixed",
    "source_type": "purchase_item",
    "source_id": 1,
    "responsible": 2,
    "comment": "Приход материалов"
}
```

## Списания

### 1. Список списаний
```http
GET /writeoffs/
Authorization: Bearer <access_token>
```

**Параметры запроса:**
- `page`, `page_size`: Пагинация
- `search`: Поиск по материалу, объекту
- `object`: Фильтр по объекту
- `material`: Фильтр по материалу
- `stage`: Фильтр по этапу
- `responsible`: Фильтр по ответственному
- `is_archived`: Фильтр по архивированным
- `date_from`: Фильтр по дате от
- `date_to`: Фильтр по дате до
- `ordering`: Сортировка

**Ответ:**
```json
{
    "count": 20,
    "next": null,
    "previous": null,
    "results": [
        {
            "id": 1,
            "date": "2024-01-20",
            "object": 1,
            "object_name": "ЖК Солнечный",
            "material": 1,
            "material_name": "Цемент М400",
            "unit": 1,
            "unit_code": "кг",
            "quantity": "500.00",
            "stage": "post_rough",
            "responsible": 2,
            "responsible_name": "Иван Иванов",
            "comment": "Списание после черновых работ",
            "is_archived": false,
            "current_balance": "1500.00",
            "smart_quantity": {
                "value": 500.0,
                "unit": "кг",
                "original_value": 500.0,
                "original_unit": "кг",
                "display_value": 500.0,
                "display_unit": "кг",
                "conversion_applied": false
            },
            "created_at": "2024-01-20T00:00:00Z",
            "updated_at": "2024-01-20T00:00:00Z"
        }
    ]
}
```

### 2. Создание списания
```http
POST /writeoffs/
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "date": "2024-01-20",
    "object": 1,
    "material": 1,
    "unit": 1,
    "quantity": "500.00",
    "stage": "post_rough",
    "responsible": 2,
    "comment": "Списание после работ"
}
```

### 3. Получение текущего остатка
```http
GET /stock/snapshots/balance/?object_id=1&material_id=1&date=2024-01-20
Authorization: Bearer <access_token>
```

**Параметры запроса:**
- `object_id` (required): ID объекта
- `material_id` (required): ID материала
- `date` (optional): Дата для расчета остатка (по умолчанию: сегодня)

**Ответ:**
```json
{
    "current_balance": "1500.000000"
}
```

**Описание:**
Этот endpoint возвращает текущий остаток материала на объекте на указанную дату. Используется в форме списаний для отображения актуального остатка перед операцией списания.

## Единицы измерения

### 1. Список единиц измерения
```http
GET /units/
Authorization: Bearer <access_token>
```

**Ответ:**
```json
{
    "count": 10,
    "next": null,
    "previous": null,
    "results": [
        {
            "id": 1,
            "code": "кг",
            "name": "килограмм",
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-01T00:00:00Z"
        }
    ]
}
```

## Категории материалов

### 1. Список категорий
```http
GET /material-categories/
Authorization: Bearer <access_token>
```

**Ответ:**
```json
{
    "count": 5,
    "next": null,
    "previous": null,
    "results": [
        {
            "id": 1,
            "name": "Строительные материалы",
            "parent": null,
            "parent_name": null,
            "children_count": 3,
            "materials_count": 25,
            "full_path": "Строительные материалы",
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-01T00:00:00Z"
        }
    ]
}
```

## Отчеты

### 1. Отчет по объектам
```http
GET /reports/purchases/by-object/
Authorization: Bearer <access_token>
```

**Параметры запроса:**
- `object`: Фильтр по объекту (множественный: ?object=1&object=2)
- `responsible`: Фильтр по ответственному
- `date_from`: Фильтр по дате от (YYYY-MM-DD)
- `date_to`: Фильтр по дате до (YYYY-MM-DD)
- `is_archived`: Фильтр по архивированным (true/false)
- `export`: Экспорт в xlsx или pdf
- `ordering`: Сортировка (object_id, object_name, purchases, total_amount)
- `page`: Номер страницы (по умолчанию: 1)
- `page_size`: Размер страницы (по умолчанию: 100, максимум: 1000)

**Ответ:**
```json
{
    "count": 50,
    "next": "http://localhost:8000/api/v1/reports/purchases/by-object/?page=2",
    "previous": null,
    "results": [
        {
            "object_id": 1,
            "object_name": "ЖК Солнечный",
            "object_address": "ул. Солнечная, 1",
            "object_is_active": true,
            "purchases": 7,
            "total_amount": 9800000.0,
            "avg_amount": 1400000.0,
            "min_amount": 500000.0,
            "max_amount": 2500000.0,
            "unique_responsibles": 2,
            "first_purchase_date": "2024-01-15",
            "last_purchase_date": "2024-01-30"
        }
    ]
}
```

### 2. Отчет по материалам
```http
GET /reports/purchases/by-material/
Authorization: Bearer <access_token>
```

**Параметры запроса:**
- `object`: Фильтр по объекту (множественный: ?object=1&object=2)
- `material`: Фильтр по материалу
- `date_from`: Фильтр по дате от (YYYY-MM-DD)
- `date_to`: Фильтр по дате до (YYYY-MM-DD)
- `responsible`: Фильтр по ответственному
- `is_archived`: Фильтр по архивированным (true/false)
- `export`: Экспорт в xlsx или pdf
- `ordering`: Сортировка (material_id, material_name, unit, qty_total, amount_total, rows)
- `page`: Номер страницы (по умолчанию: 1)
- `page_size`: Размер страницы (по умолчанию: 100, максимум: 1000)

**Ответ:**
```json
{
    "count": 150,
    "next": "http://localhost:8000/api/v1/reports/purchases/by-material/?page=2",
    "previous": null,
    "results": [
        {
            "material_id": 5,
            "material_name": "Кабель ВВГ",
            "material_sku": "CABLE-VVG-3x2.5",
            "material_category": "Электротехнические материалы",
            "unit": "м",
            "material_description": "Кабель силовой ВВГ 3x2.5",
            "material_manufacturer": "Узкабель",
            "material_is_active": true,
            "material_created_date": "2024-01-01",
            "material_average_price": 2500.0,
            "material_min_stock_level": null,
            "qty_total": 150.0,
            "amount_total": 3750000.0,
            "avg_price": 25000.0,
            "min_price": 24000.0,
            "max_price": 26000.0,
            "rows": 12,
            "unique_objects": 3,
            "unique_responsibles": 2,
            "first_purchase_date": "2024-01-15",
            "last_purchase_date": "2024-01-30"
        }
    ]
}
```

**Особенности:**
- `qty_total` может быть `null` если нет конвертации единиц измерения
- `min_price` и `max_price` могут быть `null` если нет данных о ценах
- Конвертация количества к базовой единице материала (`material.default_unit`)
- Поддержка экспорта в Excel и PDF форматы

### 3. Отчет по ответственным
```http
GET /reports/purchases/by-responsible/
Authorization: Bearer <access_token>
```

**Параметры запроса:**
- `object`: Фильтр по объекту (множественный: ?object=1&object=2)
- `responsible`: Фильтр по ответственному
- `date_from`: Фильтр по дате от (YYYY-MM-DD)
- `date_to`: Фильтр по дате до (YYYY-MM-DD)
- `is_archived`: Фильтр по архивированным (true/false)
- `export`: Экспорт в xlsx или pdf
- `ordering`: Сортировка (responsible_id, responsible_name, purchases, total_amount)
- `page`: Номер страницы (по умолчанию: 1)
- `page_size`: Размер страницы (по умолчанию: 100, максимум: 1000)

**Ответ:**
```json
{
    "count": 21,
    "next": "http://localhost:8000/api/v1/reports/purchases/by-responsible/?page=2",
    "previous": null,
    "results": [
        {
            "responsible_id": 3,
            "responsible_name": "Aziz I.",
            "responsible_username": "aziz.ibragimov",
            "responsible_email": "aziz@example.com",
            "purchases": 6,
            "total_amount": 7500000.0,
            "avg_amount": 1250000.0,
            "min_amount": 300000.0,
            "max_amount": 2000000.0,
            "unique_objects": 2,
            "first_purchase_date": "2024-01-10",
            "last_purchase_date": "2024-01-25"
        }
    ]
}
```

### 4. Отчет по периодам
```http
GET /reports/purchases/by-period/
Authorization: Bearer <access_token>
```

**Параметры запроса:**
- `period`: Период группировки (day|month, по умолчанию: month)
- `object`: Фильтр по объекту (множественный: ?object=1&object=2)
- `responsible`: Фильтр по ответственному
- `date_from`: Фильтр по дате от (YYYY-MM-DD)
- `date_to`: Фильтр по дате до (YYYY-MM-DD)
- `is_archived`: Фильтр по архивированным (true/false)
- `export`: Экспорт в xlsx или pdf
- `ordering`: Сортировка (period, purchases, total_amount)
- `page`: Номер страницы (по умолчанию: 1)
- `page_size`: Размер страницы (по умолчанию: 100, максимум: 1000)

**Ответ:**
```json
{
    "count": 25,
    "next": "http://localhost:8000/api/v1/reports/purchases/by-period/?page=2",
    "previous": null,
    "results": [
        {
            "period": "2025-09",
            "purchases": 12,
            "total_amount": 3450000.0,
            "avg_amount": 287500.0,
            "min_amount": 100000.0,
            "max_amount": 500000.0,
            "unique_objects": 3,
            "unique_responsibles": 2
        }
    ]
}
```

## Архивные периоды

### 1. Список архивных периодов
```http
GET /archive/periods/
Authorization: Bearer <access_token>
```

**Параметры запроса:**
- `page`, `page_size`: Пагинация
- `month`: Фильтр по месяцу (YYYY-MM)
- `month_from`: Фильтр по месяцу от
- `month_to`: Фильтр по месяцу до
- `object`: Фильтр по объекту
- `object_name`: Поиск по названию объекта
- `closed_by`: Фильтр по пользователю, закрывшему период
- `closed_by_name`: Поиск по имени пользователя
- `closed_at_from`: Фильтр по дате закрытия от
- `closed_at_to`: Фильтр по дате закрытия до
- `year`: Фильтр по году
- `month_number`: Фильтр по номеру месяца (1-12)
- `ordering`: Сортировка (month, closed_at)

**Ответ:**
```json
{
    "count": 5,
    "next": null,
    "previous": null,
    "results": [
        {
            "id": 1,
            "month": "2024-01-01",
            "object": 1,
            "object_name": "ЖК Солнечный",
            "closed_at": "2024-02-01T10:30:00Z",
            "closed_by": 2,
            "closed_by_name": "Иван Иванов",
            "is_closed": true
        }
    ]
}
```

### 2. Закрытие периода
```http
POST /archive/periods/close/
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "object": 1,
    "month": "2024-01"
}
```

**Параметры:**
- `object` (integer, required): ID объекта
- `month` (string, required): Месяц в формате YYYY-MM

**Ответы:**
- `201 Created`: Период успешно закрыт
- `400 Bad Request`: Некорректные параметры или период уже закрыт
- `403 Forbidden`: Недостаточно прав

**Пример успешного ответа:**
```json
{
    "id": 4,
    "month": "2024-01-01",
    "object": 1,
    "object_name": "ЖК Солнечный",
    "closed_at": "2024-02-01T10:30:00Z",
    "closed_by": 2,
    "closed_by_name": "Иван Иванов",
    "is_closed": true
}
```

**Пример ошибки:**
```json
{
    "detail": "already closed",
    "errors": {}
}
```

### 3. Открытие периода
```http
POST /archive/periods/reopen/
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "object": 1,
    "month": "2024-01"
}
```

**Параметры:**
- `object` (integer, required): ID объекта
- `month` (string, required): Месяц в формате YYYY-MM

**Ответы:**
- `204 No Content`: Период успешно открыт
- `403 Forbidden`: Недостаточно прав (только admin, director)
- `404 Not Found`: Период не найден

### 4. Права доступа

**Закрытие периодов:**
- `director` - полный доступ
- `admin` - полный доступ  
- `coordinator` - полный доступ
- Остальные роли - запрещено

**Открытие периодов:**
- `director` - полный доступ
- `admin` - полный доступ
- Остальные роли - запрещено

**Просмотр периодов:**
- `director`, `admin`, `coordinator` - все периоды
- Остальные роли - только периоды по назначенным объектам

### 5. Бизнес-логика архивирования

**При закрытии периода:**
1. Проверка прав доступа
2. Валидация параметров (объект, месяц)
3. Проверка на дублирование (период уже закрыт)
4. Массовое обновление записей:
   - `Purchase.is_archived = True` для всех закупок за период
   - `StockSnapshot.is_archived = True` для всех складских операций за период
5. Создание записи `ArchivePeriod`
6. Логирование в аудит

**При открытии периода:**
1. Проверка прав доступа (только admin/director)
2. Поиск архивного периода
3. Массовое обновление записей:
   - `Purchase.is_archived = False` для всех закупок за период
   - `StockSnapshot.is_archived = False` для всех складских операций за период
4. Удаление записи `ArchivePeriod`
5. Логирование в аудит

### 6. Новые возможности архива (Backend доработка)

#### Management команды:
```bash
# Архивирование периода
python manage.py archive_period --object-id 1 --month 2024-01 --user-id 1

# Просмотр архивов
python manage.py list_archives --year 2024 --format json

# Dry-run (проверка без выполнения)
python manage.py archive_period --object-id 1 --month 2024-01 --user-id 1 --dry-run
```

#### Celery задачи:
```python
# Автоматическое архивирование
auto_archive_old_periods_task.delay()

# Проверка целостности
check_archive_integrity_task.delay()

# Очистка старых архивов
cleanup_old_archives_task.delay()
```

#### Расширенные API фильтры:
```http
# Фильтрация по диапазону месяцев
GET /api/v1/archive/periods/?month_from=2024-01-01&month_to=2024-12-01

# Поиск по названию объекта
GET /api/v1/archive/periods/?object_name=Склад

# Фильтрация по году
GET /api/v1/archive/periods/?year=2024
```

#### Валидация и безопасность:
- ✅ Месяц должен быть первым числом
- ✅ Нельзя архивировать будущие месяцы
- ✅ Проверка уникальности периодов
- ✅ Запрет редактирования и удаления архивных периодов
- ✅ Автоматическая установка `closed_by` при создании

#### Автоматизация:
- ✅ Сигналы для автоматического архивирования данных
- ✅ Проверка целостности архива
- ✅ Автоматическое архивирование старых периодов
- ✅ Логирование всех операций

## Импорт данных

### 1. Подготовка импорта
```http
POST /purchases/import/prepare/
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

file: <excel_file>
```

**Ответ:**
```json
{
    "file_hash": "abc123...",
    "headers": ["date", "object", "supplier", "material", "quantity", "price"],
    "preview": [
        ["2024-01-15", "ЖК Солнечный", "ООО Стройматериалы", "Цемент М400", "2000", "2500"],
        ["2024-01-15", "ЖК Солнечный", "ООО Стройматериалы", "Песок", "5000", "500"]
    ],
    "suggested_mapping": {
        "date": "date",
        "object": "object_name",
        "supplier": "supplier_name",
        "material": "material_name",
        "quantity": "quantity",
        "price": "price"
    }
}
```

### 2. Тестовый импорт
```http
POST /purchases/import/dry_run/
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "file_hash": "abc123...",
    "mapping": {
        "date": "date",
        "object": "object_name",
        "supplier": "supplier_name",
        "material": "material_name",
        "quantity": "quantity",
        "price": "price"
    }
}
```

### 3. Выполнение импорта
```http
POST /purchases/import/commit/
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "file_hash": "abc123...",
    "mapping": {
        "date": "date",
        "object": "object_name",
        "supplier": "supplier_name",
        "material": "material_name",
        "quantity": "quantity",
        "price": "price"
    },
    "object_id": 1,
    "responsible_id": 2
}
```

## Обработка ошибок

### Стандартные HTTP коды
- `200 OK`: Успешный запрос
- `201 Created`: Ресурс создан
- `204 No Content`: Успешное удаление
- `400 Bad Request`: Некорректный запрос
- `401 Unauthorized`: Не авторизован
- `403 Forbidden`: Нет прав доступа
- `404 Not Found`: Ресурс не найден
- `422 Unprocessable Entity`: Ошибка валидации
- `500 Internal Server Error`: Внутренняя ошибка сервера

### Формат ошибок
```json
{
    "detail": "Общее описание ошибки",
    "field_name": ["Ошибка для конкретного поля"],
    "non_field_errors": ["Ошибки не связанные с полями"]
}
```

### Примеры ошибок

#### Ошибка валидации
```json
{
    "name": ["Это поле обязательно."],
    "email": ["Введите корректный email адрес."],
    "non_field_errors": ["Пользователь с таким именем уже существует."]
}
```

#### Ошибка доступа
```json
{
    "detail": "У вас нет прав для выполнения этого действия."
}
```

#### Ошибка не найдено
```json
{
    "detail": "Не найдено."
}
```

## Пагинация

### Стандартная пагинация
Все списки поддерживают пагинацию с параметрами:
- `page`: Номер страницы (начиная с 1)
- `page_size`: Размер страницы (по умолчанию 20, максимум 100)

### Формат ответа с пагинацией
```json
{
    "count": 100,
    "next": "http://localhost:8000/api/v1/endpoint/?page=3",
    "previous": "http://localhost:8000/api/v1/endpoint/?page=1",
    "results": [...]
}
```

## Фильтрация и поиск

### Общие параметры
- `search`: Полнотекстовый поиск
- `ordering`: Сортировка (поле или -поле для обратной сортировки)
- `page`, `page_size`: Пагинация

### Специфичные фильтры
Каждый endpoint поддерживает свои специфичные фильтры, описанные выше.

## Схема API

### OpenAPI/Swagger документация
```http
GET /api/schema/
```

### Swagger UI
```http
GET /api/docs/
```

## Безопасность

### Аутентификация
- JWT токены с коротким временем жизни (15 минут)
- Refresh токены для обновления access токенов
- Автоматическое обновление токенов в клиенте

### Авторизация
- Роли пользователей определяют доступ к ресурсам
- Object-scope ограничения для определенных ролей
- Проверка прав на уровне ViewSet

### Валидация
- Валидация всех входных данных
- Защита от SQL инъекций через Django ORM
- Защита от XSS через сериализацию

## Производительность

### Оптимизация запросов
- Использование `select_related` и `prefetch_related`
- Индексы базы данных для часто используемых полей
- Пагинация для больших списков

### Кэширование
- Кэширование часто используемых данных (планируется)
- Кэширование результатов отчетов (планируется)

## Мониторинг

### Логирование
- Логирование всех API запросов
- Аудит действий пользователей
- Мониторинг производительности (планируется)

### Метрики
- Количество запросов по endpoint'ам
- Время ответа API
- Ошибки и исключения

