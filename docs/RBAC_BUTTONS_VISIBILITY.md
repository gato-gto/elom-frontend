# 🔐 Динамическая видимость кнопок на основе RBAC

**Дата создания:** 27 ноября 2025

---

## 📋 Обзор

Реализован универсальный механизм автоматической фильтрации кнопок действий (View, Edit, Delete, Export) на основе разрешений RBAC. Кнопки автоматически скрываются, если у пользователя отсутствуют соответствующие права в API-ответе.

## 🎯 Принципы работы

1. **Автоматическое определение permissions** - при указании `resource` в конфигурации списка
2. **Ручное указание permissions** - для кастомных действий или сложных случаев
3. **Синхронизация с бэкендом** - используются те же разрешения, что и на бэкенде
4. **Гибкость** - поддержка OR/AND логики для проверки нескольких разрешений

---

## 🚀 Использование

### Базовый пример (автоматический)

Если указан `resource`, permissions определяются автоматически:

```typescript
const listConfig = computed<GenericListConfig<Material>>(() => ({
  title: 'Материалы',
  resource: 'materials', // ✅ Указываем ресурс
  // Автоматически определяются permissions:
  // - materials.view (для просмотра)
  // - materials.create (для создания)
  // - materials.edit (для редактирования)
  // - materials.delete (для удаления)
  // - reports.export (для экспорта)
  
  actions: [
    { key: 'edit', label: 'Редактировать' },    // → materials.edit
    { key: 'delete', label: 'Удалить' },        // → materials.delete
    { key: 'view', label: 'Просмотр' },         // → materials.view
  ],
  exportable: true, // Экспорт контролируется через reports.export
}))
```

### Ручное указание permissions

Для кастомных действий или переопределения стандартных:

```typescript
actions: [
  {
    key: 'approve',
    label: 'Одобрить',
    permission: 'purchases.approve', // ✅ Явное указание permission
  },
  {
    key: 'edit',
    label: 'Редактировать',
    permission: 'purchases.edit_own', // Переопределение стандартного
  },
]
```

### Сложные проверки (OR логика)

Действие видно, если есть хотя бы одно из разрешений:

```typescript
actions: [
  {
    key: 'edit',
    label: 'Редактировать',
    anyPermission: ['purchases.edit', 'purchases.edit_own'], // ✅ OR логика
  },
]
```

### Сложные проверки (AND логика)

Действие видно, если есть все указанные разрешения:

```typescript
actions: [
  {
    key: 'delete',
    label: 'Удалить',
    allPermissions: ['purchases.delete', 'purchases.approve'], // ✅ AND логика
  },
]
```

### Комбинация с visible (условная видимость)

Можно комбинировать permissions с функцией `visible` для дополнительных проверок:

```typescript
actions: [
  {
    key: 'edit',
    label: 'Редактировать',
    permission: 'purchases.edit',
    visible: (item: Purchase) => item.status !== 'archived', // ✅ Дополнительная проверка
  },
]
```

---

## 📝 Конфигурация GenericListConfig

### Новые поля:

```typescript
interface GenericListConfig<T> {
  // ✅ Автоматическое определение permissions
  resource?: string  // 'materials', 'purchases', 'employees', etc.
  
  // ✅ Ручное переопределение permissions (опционально)
  viewPermission?: string      // Для просмотра
  createPermission?: string    // Для создания
  editPermission?: string      // Для редактирования
  deletePermission?: string    // Для удаления
  exportPermission?: string    // Для экспорта
  
  // ... остальные поля
}
```

### Конфигурация действий:

```typescript
interface ActionConfig<T> {
  key: string
  label: string
  
  // ✅ RBAC: Проверка разрешений
  permission?: string           // Одно разрешение
  anyPermission?: string[]      // OR логика (хотя бы одно)
  allPermissions?: string[]     // AND логика (все)
  
  // ✅ Условная видимость (работает вместе с permissions)
  visible?: (item: T) => boolean
  
  // ... остальные поля (class, icon, disabled, confirm)
}
```

---

## 🔄 Миграция существующих списков

### До:

```typescript
const listConfig = computed(() => ({
  title: 'Материалы',
  exportable: canExportReports.value,
  actions: [
    {
      key: 'edit',
      label: 'Редактировать',
      disabled: () => !canEdit.value
    },
    {
      key: 'delete',
      label: 'Удалить',
      disabled: () => !canEdit.value
    }
  ]
}))
```

### После:

```typescript
const listConfig = computed(() => ({
  title: 'Материалы',
  resource: 'materials', // ✅ Добавляем resource
  exportable: true, // Контролируется автоматически через reports.export
  actions: [
    {
      key: 'edit',
      label: 'Редактировать',
      // ✅ Permission определяется автоматически как 'materials.edit'
    },
    {
      key: 'delete',
      label: 'Удалить',
      // ✅ Permission определяется автоматически как 'materials.delete'
    }
  ]
}))
```

---

## 📊 Сопоставление действий и permissions

### Стандартные действия:

| Действие | Permission (при resource='materials') |
|----------|--------------------------------------|
| `view`, `detail`, `info` | `materials.view` |
| `edit`, `update`, `change` | `materials.edit` |
| `delete`, `remove` | `materials.delete` |
| `export` | `reports.export` |

### Создание:

Контролируется через `canCreate` computed в `GenericList`, который проверяет `{resource}.create`.

### Экспорт:

По умолчанию используется `reports.export`. Можно переопределить через `exportPermission`.

---

## ✅ Примеры для разных модулей

### Материалы:

```typescript
{
  resource: 'materials',
  actions: [
    { key: 'edit', label: 'Редактировать' },    // materials.edit
    { key: 'delete', label: 'Удалить' },        // materials.delete
  ]
}
```

### Закупки:

```typescript
{
  resource: 'purchases',
  actions: [
    { key: 'edit', label: 'Редактировать' },    // purchases.edit
    { key: 'delete', label: 'Удалить' },        // purchases.delete
    {
      key: 'approve',
      label: 'Одобрить',
      permission: 'purchases.approve',           // ✅ Кастомное разрешение
    }
  ]
}
```

### Сотрудники:

```typescript
{
  resource: 'employees',
  actions: [
    { key: 'edit', label: 'Редактировать' },    // employees.edit
    { key: 'delete', label: 'Удалить' },        // employees.delete
  ]
}
```

### Склад:

```typescript
{
  resource: 'stock',
  actions: [
    { key: 'edit', label: 'Редактировать' },    // stock.edit
    { key: 'delete', label: 'Удалить' },        // stock.delete
  ]
}
```

---

## 🔍 Внутренняя реализация

### Компоненты:

1. **`GenericList.vue`** - основной компонент списка, фильтрует действия
2. **`utils/permissions.ts`** - утилиты для работы с permissions
3. **`composables/usePermissions.ts`** - composable для проверки разрешений

### Процесс фильтрации:

1. При загрузке списка проверяются permissions пользователя из API
2. Каждое действие обогащается permission (если не указано явно)
3. Действия фильтруются на основе permissions
4. Для каждого элемента проверяется функция `visible` (если есть)
5. Кнопки скрываются, если нет соответствующих разрешений

---

## ⚠️ Важные замечания

1. **Приоритет permissions:**
   - Явно указанное `permission` > автоматически определенное
   - `anyPermission` / `allPermissions` > `permission`
   - `visible` проверяется дополнительно после permissions

2. **Экспорт:**
   - По умолчанию используется `reports.export`
   - Можно переопределить через `exportPermission` в конфиге

3. **Создание:**
   - Контролируется через `resource` + автоматическая проверка `{resource}.create`
   - Кнопка создания скрывается автоматически, если нет разрешения

4. **Обратная совместимость:**
   - Старые конфигурации без `resource` продолжают работать
   - Можно постепенно мигрировать списки на новый механизм

---

## 📚 Связанные документы

- `RBAC_FINAL.md` (backend) - Полная документация RBAC системы
- `usePermissions.ts` - Composable для работы с разрешениями
- `permissions.ts` - Утилиты для работы с permissions в списках

---

*Документация актуальна на: 27 ноября 2025*
