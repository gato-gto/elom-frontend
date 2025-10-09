# Справочник API Endpoints ELOM

## Полный список всех API endpoints

---

## 1. Аутентификация (Auth)

```
POST   /api/v1/auth/token/           - Получение токенов (login)
POST   /api/v1/auth/token/refresh/   - Обновление access токена
POST   /api/v1/auth/token/verify/    - Проверка токена
```

---

## 2. Пользователи (Users)

```
GET    /api/v1/users/me/             - Текущий пользователь
```

---

## 3. Сотрудники (Employees)

```
GET    /api/v1/employees/            - Список сотрудников
POST   /api/v1/employees/            - Создание сотрудника
GET    /api/v1/employees/{id}/       - Получение сотрудника
PUT    /api/v1/employees/{id}/       - Обновление сотрудника
PATCH  /api/v1/employees/{id}/       - Частичное обновление
DELETE /api/v1/employees/{id}/       - Удаление сотрудника
POST   /api/v1/employees/{id}/set_password/ - Установка пароля
```

**Параметры фильтрации**:
- `search` - Поиск по имени, email, username
- `role` - Фильтр по роли
- `is_active` - Фильтр по активности
- `ordering` - Сортировка

---

## 4. Единицы измерения (Units)

```
GET    /api/v1/units/                - Список единиц
POST   /api/v1/units/                - Создание единицы
GET    /api/v1/units/{id}/           - Получение единицы
PUT    /api/v1/units/{id}/           - Обновление единицы
PATCH  /api/v1/units/{id}/           - Частичное обновление
DELETE /api/v1/units/{id}/           - Удаление единицы
```

---

## 5. Категории материалов (Material Categories)

```
GET    /api/v1/material-categories/       - Список категорий
POST   /api/v1/material-categories/       - Создание категории
GET    /api/v1/material-categories/{id}/  - Получение категории
PUT    /api/v1/material-categories/{id}/  - Обновление категории
PATCH  /api/v1/material-categories/{id}/  - Частичное обновление
DELETE /api/v1/material-categories/{id}/  - Удаление категории
```

**Параметры фильтрации**:
- `search` - Поиск по названию
- `parent` - Фильтр по родительской категории
- `ordering` - Сортировка

---

## 6. Материалы (Materials)

### Основные endpoints

```
GET    /api/v1/materials/             - Список материалов
POST   /api/v1/materials/             - Создание материала
GET    /api/v1/materials/{id}/        - Получение материала
PUT    /api/v1/materials/{id}/        - Обновление материала
PATCH  /api/v1/materials/{id}/        - Частичное обновление
DELETE /api/v1/materials/{id}/        - Удаление материала
```

### Дополнительные endpoints

```
POST   /api/v1/materials/{id}/upload-photo/  - Загрузка фото
DELETE /api/v1/materials/{id}/delete-photo/  - Удаление фото
GET    /api/v1/materials/lite/               - Облегченный список
GET    /api/v1/materials/search/             - Поиск материалов
GET    /api/v1/materials/stats/              - Статистика
POST   /api/v1/materials/bulk-update/        - Массовое обновление
GET    /api/v1/materials/by-object/          - Материалы по объекту
```

**Параметры фильтрации**:
- `search` - Поиск по названию, SKU, описанию
- `category` - Фильтр по категории
- `is_active` - Фильтр по активности
- `default_unit` - Фильтр по единице измерения
- `manufacturer` - Фильтр по производителю
- `ordering` - Сортировка

**Специфичные параметры `/materials/by-object/`**:
- `object_id` (required) - ID объекта
- `is_active` - Фильтр по активности (default: true)

---

## 7. Объекты (Objects)

```
GET    /api/v1/objects/              - Список объектов
POST   /api/v1/objects/              - Создание объекта
GET    /api/v1/objects/{id}/         - Получение объекта
PUT    /api/v1/objects/{id}/         - Обновление объекта
PATCH  /api/v1/objects/{id}/         - Частичное обновление
DELETE /api/v1/objects/{id}/         - Удаление объекта
GET    /api/v1/objects/responsibles/ - Список ответственных
```

**Параметры фильтрации**:
- `search` - Поиск по названию, адресу
- `is_active` - Фильтр по активности
- `responsible` - Фильтр по ответственному
- `date_start` - Фильтр по дате начала
- `date_end` - Фильтр по дате окончания
- `ordering` - Сортировка

---

## 8. Закупки (Purchases)

### Основные endpoints

```
GET    /api/v1/purchases/            - Список закупок
POST   /api/v1/purchases/            - Создание закупки
GET    /api/v1/purchases/{id}/       - Получение закупки
PUT    /api/v1/purchases/{id}/       - Обновление закупки
PATCH  /api/v1/purchases/{id}/       - Частичное обновление
DELETE /api/v1/purchases/{id}/       - Удаление закупки
```

### Фото endpoints

```
POST   /api/v1/purchases/{id}/photos/upload/        - Загрузка фото
POST   /api/v1/purchases/{id}/photos/bulk-upload/   - Массовая загрузка
GET    /api/v1/purchases/{id}/photos/               - Список фото
PUT    /api/v1/purchases/{id}/photos/{photoId}/     - Обновление фото
DELETE /api/v1/purchases/{id}/photos/{photoId}/     - Удаление фото
POST   /api/v1/purchases/{id}/photos/{photoId}/set-cover/ - Установить обложку
POST   /api/v1/purchases/{id}/photos/reorder/       - Изменить порядок
```

### Импорт endpoints

```
POST   /api/v1/purchases/import/prepare  - Подготовка импорта
POST   /api/v1/purchases/import/dry_run  - Тестовый импорт
POST   /api/v1/purchases/import/commit   - Выполнение импорта
```

**Параметры фильтрации**:
- `search` - Поиск по номеру, комментарию
- `object` - Фильтр по объекту
- `supplier` - Фильтр по поставщику
- `responsible` - Фильтр по ответственному
- `status` - Фильтр по статусу (new, completed, cancelled)
- `currency` - Фильтр по валюте
- `is_archived` - Фильтр по архивированным
- `date_from` - Фильтр по дате от
- `date_to` - Фильтр по дате до
- `ordering` - Сортировка

---

## 9. Поставщики (Suppliers)

```
GET    /api/v1/suppliers/            - Список поставщиков
POST   /api/v1/suppliers/            - Создание поставщика
GET    /api/v1/suppliers/{id}/       - Получение поставщика
PUT    /api/v1/suppliers/{id}/       - Обновление поставщика
PATCH  /api/v1/suppliers/{id}/       - Частичное обновление
DELETE /api/v1/suppliers/{id}/       - Удаление поставщика
```

**Параметры фильтрации**:
- `search` - Поиск по названию, контактам
- `is_active` - Фильтр по активности
- `ordering` - Сортировка

---

## 10. Остатки (Stock Snapshots)

### Основные endpoints

```
GET    /api/v1/stock/snapshots/         - Список движений
POST   /api/v1/stock/snapshots/         - Создание движения
GET    /api/v1/stock/snapshots/{id}/    - Получение движения
PUT    /api/v1/stock/snapshots/{id}/    - Обновление движения
PATCH  /api/v1/stock/snapshots/{id}/    - Частичное обновление
DELETE /api/v1/stock/snapshots/{id}/    - Удаление движения
```

### Дополнительные endpoints

```
GET    /api/v1/stock/snapshots/balance/    - Текущий остаток
GET    /api/v1/stock/snapshots/by-objects/ - Остатки по объектам
GET    /api/v1/stock/snapshots/history/    - История движений
```

**Параметры фильтрации**:
- `search` - Поиск по материалу, объекту
- `object` - Фильтр по объекту
- `material` - Фильтр по материалу
- `stage` - Фильтр по этапу
- `source_type` - Фильтр по типу источника (purchase_item, writeoff)
- `source_id` - Фильтр по ID источника
- `responsible` - Фильтр по ответственному
- `is_archived` - Фильтр по архивированным
- `date_from` - Фильтр по дате от
- `date_to` - Фильтр по дате до
- `ordering` - Сортировка

**Параметры `/stock/snapshots/balance/`**:
- `object_id` (required) - ID объекта
- `material_id` (required) - ID материала
- `date` (optional) - Дата для расчета остатка

**Параметры `/stock/snapshots/by-objects/`**:
- `date` - Дата для расчета остатков
- `object` - Фильтр по объекту
- `search` - Поиск по объекту/материалу

---

## 11. Списания (WriteOffs)

```
GET    /api/v1/writeoffs/            - Список списаний
POST   /api/v1/writeoffs/            - Создание списания
GET    /api/v1/writeoffs/{id}/       - Получение списания
PUT    /api/v1/writeoffs/{id}/       - Обновление списания
PATCH  /api/v1/writeoffs/{id}/       - Частичное обновление
DELETE /api/v1/writeoffs/{id}/       - Удаление списания
```

**Параметры фильтрации**:
- `search` - Поиск по материалу, объекту
- `object` - Фильтр по объекту
- `material` - Фильтр по материалу
- `stage` - Фильтр по этапу
- `responsible` - Фильтр по ответственному
- `is_archived` - Фильтр по архивированным
- `date_from` - Фильтр по дате от
- `date_to` - Фильтр по дате до
- `ordering` - Сортировка

---

## 12. Архив (Archive)

### Архивные периоды

```
GET    /api/v1/archive/periods/         - Список периодов
POST   /api/v1/archive/periods/         - Создание периода
GET    /api/v1/archive/periods/{id}/    - Получение периода
PUT    /api/v1/archive/periods/{id}/    - Обновление периода
DELETE /api/v1/archive/periods/{id}/    - Удаление периода
POST   /api/v1/archive/periods/close/   - Закрытие периода
POST   /api/v1/archive/periods/reopen/  - Открытие периода
```

**Параметры фильтрации**:
- `month` - Фильтр по месяцу (YYYY-MM)
- `month_from` - Фильтр по месяцу от
- `month_to` - Фильтр по месяцу до
- `object` - Фильтр по объекту
- `object_name` - Поиск по названию объекта
- `closed_by` - Фильтр по пользователю
- `closed_by_name` - Поиск по имени пользователя
- `closed_at_from` - Фильтр по дате закрытия от
- `closed_at_to` - Фильтр по дате закрытия до
- `year` - Фильтр по году
- `month_number` - Фильтр по номеру месяца (1-12)
- `ordering` - Сортировка

---

## 13. Отчеты (Reports)

### Отчет по периодам

```
GET    /api/v1/reports/purchases/by-period/
```

**Параметры**:
- `period` - Период группировки (day, month)
- `object` - Фильтр по объекту (множественный)
- `responsible` - Фильтр по ответственному
- `date_from` - Фильтр по дате от
- `date_to` - Фильтр по дате до
- `is_archived` - Фильтр по архивированным
- `export` - Экспорт (xlsx, pdf)
- `ordering` - Сортировка
- `page` - Номер страницы
- `page_size` - Размер страницы (max: 1000)

### Отчет по объектам

```
GET    /api/v1/reports/purchases/by-object/
```

**Параметры**:
- `object` - Фильтр по объекту (множественный)
- `responsible` - Фильтр по ответственному
- `date_from` - Фильтр по дате от
- `date_to` - Фильтр по дате до
- `is_archived` - Фильтр по архивированным
- `export` - Экспорт (xlsx, pdf)
- `ordering` - Сортировка
- `page` - Номер страницы
- `page_size` - Размер страницы (max: 1000)

### Отчет по ответственным

```
GET    /api/v1/reports/purchases/by-responsible/
```

**Параметры**:
- `object` - Фильтр по объекту (множественный)
- `responsible` - Фильтр по ответственному
- `date_from` - Фильтр по дате от
- `date_to` - Фильтр по дате до
- `is_archived` - Фильтр по архивированным
- `export` - Экспорт (xlsx, pdf)
- `ordering` - Сортировка
- `page` - Номер страницы
- `page_size` - Размер страницы (max: 1000)

### Отчет по материалам

```
GET    /api/v1/reports/purchases/by-material/
```

**Параметры**:
- `object` - Фильтр по объекту (множественный)
- `material` - Фильтр по материалу
- `date_from` - Фильтр по дате от
- `date_to` - Фильтр по дате до
- `responsible` - Фильтр по ответственному
- `is_archived` - Фильтр по архивированным
- `export` - Экспорт (xlsx, pdf)
- `ordering` - Сортировка
- `page` - Номер страницы
- `page_size` - Размер страницы (max: 1000)

---

## Общие параметры

### Пагинация (для всех списков)

- `page` - Номер страницы (default: 1)
- `page_size` - Размер страницы (default: 20, max: 100 или 1000 для отчетов)

### Поиск

- `search` - Полнотекстовый поиск по релевантным полям

### Сортировка

- `ordering` - Поле для сортировки
  - Формат: `field_name` (по возрастанию) или `-field_name` (по убыванию)
  - Примеры: `name`, `-date`, `created_at`

### Фильтрация по датам

- `date_from` - Дата от (YYYY-MM-DD)
- `date_to` - Дата до (YYYY-MM-DD)

---

## Структура ответов

### Списки с пагинацией

```json
{
  "count": 100,
  "next": "http://localhost:8000/api/v1/endpoint/?page=2",
  "previous": null,
  "results": [
    { "id": 1, "name": "Item 1", ... },
    { "id": 2, "name": "Item 2", ... }
  ]
}
```

### Без пагинации

```json
[
  { "id": 1, "name": "Item 1", ... },
  { "id": 2, "name": "Item 2", ... }
]
```

### Одиночный объект

```json
{
  "id": 1,
  "name": "Item 1",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

---

## Обработка ошибок

### HTTP коды

- `200 OK` - Успешный запрос
- `201 Created` - Ресурс создан
- `204 No Content` - Успешное удаление
- `400 Bad Request` - Некорректный запрос
- `401 Unauthorized` - Не авторизован
- `403 Forbidden` - Нет прав доступа
- `404 Not Found` - Ресурс не найден
- `422 Unprocessable Entity` - Ошибка валидации
- `500 Internal Server Error` - Внутренняя ошибка

### Формат ошибок

```json
{
  "detail": "Общее описание ошибки",
  "field_name": ["Ошибка для поля"],
  "non_field_errors": ["Общая ошибка"]
}
```

### Вложенные ошибки

```json
{
  "items": [
    { "material": ["Это поле обязательно"] },
    { "quantity": ["Количество должно быть больше 0"] }
  ]
}
```

**Frontend обработка**:
```typescript
// Преобразуется в:
{
  "items[0].material": ["Это поле обязательно"],
  "items[1].quantity": ["Количество должно быть больше 0"]
}
```

---

## Аутентификация

### Заголовки запросов

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Получение токенов

```http
POST /api/v1/auth/token/
Content-Type: application/json

{
  "username": "admin",
  "password": "password"
}
```

**Ответ**:
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

**Ответ**:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

---

## Специальные endpoints

### Валидация закупки

```
GET /api/v1/purchases/{id}/validate/
```

**Ответ**:
```json
{
  "is_valid": true,
  "warnings": [],
  "errors": [],
  "instruction_photos_count": 2,
  "report_photos_count": 1
}
```

### Получение текущего остатка

```
GET /api/v1/stock/snapshots/balance/?object_id=1&material_id=1&date=2024-01-20
```

**Ответ**:
```json
{
  "current_balance": "1500.000000"
}
```

### Материалы по объекту

```
GET /api/v1/materials/by-object/?object_id=1&is_active=true
```

**Ответ**:
```json
[
  {
    "id": 1,
    "name": "Цемент М400",
    "sku": "CEM-400-50",
    "default_unit": 1,
    "default_unit_code": "кг",
    ...
  }
]
```

---

## Итого

**Всего endpoints**: 100+
**Модулей**: 13
**CRUD endpoints**: 11
**Специальных endpoints**: 10+
**Отчетных endpoints**: 4

**Все endpoints покрыты типами TypeScript! ✅**


