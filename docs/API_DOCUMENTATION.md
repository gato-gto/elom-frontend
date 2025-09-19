# ELOM Frontend API Documentation

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

### Использование токена
```http
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

## Роли пользователей

- **admin** - Полный доступ ко всем функциям
- **director** - Доступ к отчетам и управлению
- **coordinator** - Координация процессов
- **buyer** - Управление закупками
- **site_manager** - Управление объектами и остатками

## API Endpoints

### Пользователи

#### Получить текущего пользователя
```http
GET /api/v1/users/me
Authorization: Bearer {token}
```

**Ответ:**
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@example.com",
  "first_name": "Admin",
  "last_name": "",
  "role": "director"
}
```

### Категории материалов

#### Список категорий
```http
GET /api/v1/material-categories/
Authorization: Bearer {token}
```

**Параметры:**
- `search` - поиск по названию
- `parent` - ID родительской категории
- `has_parent` - только корневые (false) или дочерние (true)
- `has_children` - категории с дочерними элементами
- `has_materials` - категории с материалами

**Ответ:**
```json
{
  "count": 14,
  "results": [
    {
      "id": 1,
      "name": "Строительные материалы",
      "parent": null,
      "parent_name": null,
      "children_count": 4,
      "materials_count": 12,
      "full_path": "Строительные материалы",
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

#### Создать категорию
```http
POST /api/v1/material-categories/
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Новая категория",
  "parent": 1
}
```

#### Дерево категорий
```http
GET /api/v1/material-categories/tree/
Authorization: Bearer {token}
```

**Ответ:**
```json
{
  "categories": [
    {
      "id": 1,
      "name": "Строительные материалы",
      "parent": null,
      "children": [
        {
          "id": 2,
          "name": "Кирпич и блоки",
          "parent": 1,
          "children": []
        }
      ]
    }
  ]
}
```

#### Дочерние категории
```http
GET /api/v1/material-categories/children/?parent_id=1
Authorization: Bearer {token}
```

### Журнал аудита

#### Список записей аудита
```http
GET /api/v1/audit-logs/
Authorization: Bearer {token}
```

**Параметры:**
- `user` - ID пользователя
- `action` - действие (create, update, delete, etc.)
- `model` - модель (Unit, Material, Purchase, etc.)
- `ts_from` - с даты (YYYY-MM-DDTHH:MM:SS)
- `ts_to` - по дату (YYYY-MM-DDTHH:MM:SS)

**Ответ:**
```json
{
  "count": 150,
  "results": [
    {
      "id": 1,
      "ts": "2025-01-15T10:30:00Z",
      "user": 1,
      "user_name": "Admin User",
      "user_role": "admin",
      "action": "create",
      "action_display": "Создание",
      "model": "Material",
      "model_display": "Материалы",
      "object_id": "5",
      "detail": "Создан новый материал",
      "ip": "192.168.1.100"
    }
  ]
}
```

### Фото закупок

#### Список фото закупки
```http
GET /api/v1/purchases/{id}/photos/
Authorization: Bearer {token}
```

**Ответ:**
```json
[
  {
    "id": 1,
    "url": "http://localhost:8000/media/purchases/2025/01/photo1.jpg",
    "is_cover": true,
    "mime": "image/jpeg",
    "size_bytes": 245760,
    "created_at": "2025-01-15T10:30:00Z"
  }
]
```

#### Загрузить фото
```http
POST /api/v1/purchases/{id}/photos/upload/
Authorization: Bearer {token}
Content-Type: multipart/form-data

photo: [binary file]
is_cover: true
```

#### Удалить фото
```http
DELETE /api/v1/purchases/{id}/photos/{photo_id}/
Authorization: Bearer {token}
```

#### Установить обложку
```http
POST /api/v1/purchases/{id}/photos/{photo_id}/set-cover/
Authorization: Bearer {token}
```

**Ответ:**
```json
{
  "detail": "Cover photo updated"
}
```

## Коды ответов

- **200** - Успешный запрос
- **201** - Ресурс создан
- **204** - Успешное удаление
- **400** - Ошибка валидации
- **401** - Не авторизован
- **403** - Доступ запрещен
- **404** - Ресурс не найден
- **500** - Внутренняя ошибка сервера

## Обработка ошибок

### Ошибка валидации
```json
{
  "detail": "Validation error",
  "errors": {
    "name": ["Это поле обязательно."],
    "parent": ["Неверный ID родительской категории."]
  }
}
```

### Ошибка доступа
```json
{
  "detail": "You do not have permission to perform this action."
}
```

### Ошибка аутентификации
```json
{
  "detail": "Authentication credentials were not provided."
}
```

## Пагинация

Все списки поддерживают пагинацию:

```json
{
  "count": 150,
  "next": "http://localhost:8000/api/v1/material-categories/?page=3",
  "previous": "http://localhost:8000/api/v1/material-categories/?page=1",
  "results": [...]
}
```

**Параметры:**
- `page` - номер страницы (начиная с 1)
- `page_size` - количество элементов на странице (по умолчанию 20)

## Фильтрация и поиск

### Поиск
Параметр `search` поддерживается для текстовых полей:
```http
GET /api/v1/material-categories/?search=строительные
```

### Сортировка
Параметр `ordering` для сортировки:
```http
GET /api/v1/material-categories/?ordering=name
GET /api/v1/material-categories/?ordering=-created_at  # по убыванию
```

### Фильтрация
Специфичные фильтры для каждого endpoint:
```http
GET /api/v1/audit-logs/?action=create&model=Material
GET /api/v1/material-categories/?has_parent=false
```

## Примеры использования

### Получение дерева категорий для UI
```javascript
const response = await fetch('/api/v1/material-categories/tree/', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();
// data.categories содержит иерархическое дерево
```

### Загрузка фото закупки
```javascript
const formData = new FormData();
formData.append('photo', fileInput.files[0]);
formData.append('is_cover', 'true');

const response = await fetch(`/api/v1/purchases/${purchaseId}/photos/upload/`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

### Просмотр журнала аудита
```javascript
const response = await fetch('/api/v1/audit-logs/?ts_from=2025-01-01T00:00:00&action=create', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const auditLogs = await response.json();
```

## Безопасность

- Все endpoints требуют JWT аутентификации
- Роли пользователей определяют доступ к функциям
- Журнал аудита доступен только admin/director
- Файлы загружаются с валидацией типа и размера
- Все операции логируются в системе аудита

## Версионирование

API использует версионирование через URL:
- Текущая версия: `/api/v1/`
- Будущие версии: `/api/v2/`, `/api/v3/`, etc.

## Поддержка

Для вопросов по API обращайтесь к документации Swagger:
`http://localhost:8000/api/docs/`