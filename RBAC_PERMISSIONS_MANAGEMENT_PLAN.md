# План реализации управления разрешениями ролей на фронтенде

## Архитектурный анализ

### Backend API

#### Endpoints:
- `GET /api/v1/rbac/permissions/` - Список всех разрешений (read-only, требует `rbac.view`)
- `GET /api/v1/rbac/roles/` - Список ролей (требует `rbac.manage_roles`)
- `GET /api/v1/rbac/roles/{id}/` - Детали роли с разрешениями
- `POST /api/v1/rbac/roles/` - Создать роль
- `PATCH /api/v1/rbac/roles/{id}/` - Обновить роль (включая разрешения через `permission_ids`)
- `DELETE /api/v1/rbac/roles/{id}/` - Удалить роль (системные нельзя)

#### Сериализаторы:
- `RoleSerializer`:
  - Принимает: `permission_ids` (массив ID разрешений, write-only)
  - Возвращает: `permissions` (массив Permission объектов, read-only)
  - Поля: `id`, `name`, `display_name`, `description`, `is_system`, `is_active`, `parent`

- `PermissionSerializer`:
  - Поля: `id`, `codename`, `name`, `resource`, `action`, `description`, `is_active`

### Frontend архитектура

#### Существующие компоненты:
- `RoleAssignment.vue` - Назначение ролей пользователям (аналог для разрешений)
- `GenericList.vue` - Список с пагинацией, фильтрами, экспортом
- `GenericForm.vue` - Универсальная форма с секциями
- `Modal.vue` - Модальное окно

#### Stores:
- `rbacStore` - Управление ролями (нужно расширить для разрешений)
- `permissionsStore` - Разрешения текущего пользователя

#### Композаблы:
- `usePermissions()` - Проверка разрешений пользователя

## План реализации

### 1. Расширение rbacStore
- `fetchPermissions()` - Загрузить все разрешения из API
- `fetchRoleWithPermissions(roleId)` - Загрузить роль с разрешениями
- `createRole(data)` - Создать роль
- `updateRole(roleId, data)` - Обновить роль (включая разрешения)
- `deleteRole(roleId)` - Удалить роль

### 2. Компонент PermissionAssignment
- Аналогичен `RoleAssignment.vue`
- Группировка разрешений по ресурсам (materials, purchases, etc.)
- Чекбоксы для выбора разрешений
- Поиск и фильтрация разрешений
- Отображение выбранных разрешений

### 3. Страница RBAC/List.vue
- Список ролей с использованием `GenericList`
- Колонки: название, описание, количество разрешений, системная роль
- Действия: создать, редактировать, удалить
- Фильтры: системные/пользовательские роли

### 4. Страница RBAC/RoleForm.vue
- Форма создания/редактирования роли
- Поля: name, display_name, description
- Компонент `PermissionAssignment` для управления разрешениями
- Валидация: name уникален, display_name обязателен

### 5. Маршруты
- `/rbac/roles` - Список ролей
- `/rbac/roles/create` - Создать роль
- `/rbac/roles/:id/edit` - Редактировать роль

### 6. Навигация
- Добавить пункт "Управление ролями" в AppSidebar
- Требует разрешение `rbac.manage_roles`

## Структура файлов

```
src/
├── stores/
│   └── rbac.ts (расширить)
├── components/
│   └── PermissionAssignment.vue (новый)
├── pages/
│   └── RBAC/
│       ├── List.vue (новый)
│       └── RoleForm.vue (новый)
└── router/
    └── index.ts (добавить маршруты)
```

## Приоритеты

1. ✅ Расширение rbacStore
2. ✅ Компонент PermissionAssignment
3. ✅ Страница List.vue
4. ✅ Страница RoleForm.vue
5. ✅ Маршруты и навигация
