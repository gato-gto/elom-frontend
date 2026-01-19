# 🔐 Универсальная система управления UI на основе прав доступа

## Обзор

Система предоставляет набор компонентов и утилит для динамического управления видимостью и доступностью UI-элементов на основе прав доступа пользователя (RBAC).

## Принципы

1. **Основа на permissions, а не на ролях** - проверка доступа через разрешения, а не через имена ролей
2. **Централизованное управление** - все права управляются на backend
3. **Декларативный подход** - компоненты автоматически скрывают/показывают элементы
4. **Гибкость** - поддержка сложных условий через функции

---

## Компоненты

### 1. PermissionGuard

Универсальный компонент для условного рендеринга на основе прав.

```vue
<template>
  <!-- Простая проверка одного разрешения -->
  <PermissionGuard permission="materials.create">
    <button>Создать материал</button>
  </PermissionGuard>

  <!-- Проверка любого из разрешений -->
  <PermissionGuard :any="['materials.create', 'materials.edit']">
    <button>Действие</button>
  </PermissionGuard>

  <!-- Проверка всех разрешений -->
  <PermissionGuard :all="['materials.create', 'materials.delete']">
    <button>Действие (требует оба права)</button>
  </PermissionGuard>

  <!-- Проверка через resource + action -->
  <PermissionGuard resource="purchases" action="approve">
    <button>Одобрить закупку</button>
  </PermissionGuard>

  <!-- С дополнительной проверкой через show функцию -->
  <PermissionGuard 
    permission="purchases.edit" 
    :item="purchase"
    :show="item => item.status !== 'archived'"
  >
    <button>Редактировать</button>
  </PermissionGuard>
</template>
```

**Props:**
- `permission?: string` - одно разрешение для проверки
- `any?: string[]` - массив разрешений (хотя бы одно)
- `all?: string[]` - массив разрешений (все)
- `resource?: string` - ресурс для проверки
- `action?: string` - действие для проверки
- `item?: any` - элемент данных для функции show
- `show?: (item?: any) => boolean` - дополнительная функция проверки

---

### 2. PermissionButton

Кнопка с автоматической проверкой прав и условным отображением.

```vue
<template>
  <!-- Простая кнопка с проверкой прав -->
  <PermissionButton 
    permission="materials.create"
    label="Создать материал"
    @click="handleCreate"
  />

  <!-- Кнопка с иконкой и вариантом стиля -->
  <PermissionButton 
    resource="purchases"
    action="approve"
    label="Одобрить"
    icon="M5 13l4 4L19 7"
    variant="success"
    size="sm"
    @click="handleApprove"
  />

  <!-- Кнопка с условным отображением -->
  <PermissionButton 
    permission="purchases.edit"
    :item="purchase"
    :show="item => item.status === 'new'"
    label="Редактировать"
    variant="primary"
  />

  <!-- Кнопка-ссылка -->
  <PermissionButton 
    permission="reports.view"
    label="Отчеты"
    tag="router-link"
    to="/reports"
  />

  <!-- Кнопка только с иконкой -->
  <PermissionButton 
    permission="materials.delete"
    icon="M6 18L18 6M6 6l12 12"
    variant="error"
    icon-only
    tooltip="Удалить"
    @click="handleDelete"
  />
</template>
```

**Props:**
- Все props из `PermissionGuard`
- `label?: string` - текст кнопки
- `icon?: string` - SVG path для иконки
- `variant?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | 'outline' | 'ghost'`
- `size?: 'xs' | 'sm' | 'md' | 'lg'`
- `tag?: 'button' | 'a' | 'router-link'`
- `type?: 'button' | 'submit' | 'reset'`
- `to?: string | object` - для router-link
- `href?: string` - для ссылки
- `disabled?: boolean`
- `loading?: boolean`
- `iconOnly?: boolean` - показывать только иконку
- `tooltip?: string` - подсказка при iconOnly

---

### 3. PermissionSection

Секция UI с проверкой прав доступа.

```vue
<template>
  <PermissionSection 
    permission="reports.view"
    title="Отчеты"
    bordered
    background
  >
    <ReportList />
  </PermissionSection>

  <!-- С кастомным заголовком -->
  <PermissionSection permission="admin.panel">
    <template #header>
      <h2>Панель администратора</h2>
    </template>
    <AdminPanel />
  </PermissionSection>
</template>
```

**Props:**
- Все props из `PermissionGuard`
- `title?: string` - заголовок секции
- `bordered?: boolean` - показывать границы
- `background?: boolean` - показывать фон

---

### 4. PermissionFilter

Фильтр с проверкой прав доступа.

```vue
<template>
  <PermissionFilter
    permission="purchases.view_all"
    type="select"
    label="Ответственный"
    :options="employeeOptions"
    :model-value="filters.responsible"
    @update:model-value="updateFilter('responsible', $event)"
  />

  <!-- Фильтр с проверкой через resource + action -->
  <PermissionFilter
    resource="purchases"
    action="view_all"
    type="date"
    label="Дата с"
    :model-value="filters.date_after"
    @update:model-value="updateFilter('date_after', $event)"
  />
</template>
```

**Props:**
- Все props из `PermissionGuard`
- `type: 'text' | 'select' | 'date' | 'number'` - тип поля
- `label: string` - метка
- `placeholder?: string`
- `options?: Array<{ value: any; label: string }>` - для select
- `required?: boolean`
- `disabled?: boolean`
- `modelValue?: any`

---

## Утилиты

### createActionConfig / createActionsConfig

Создание конфигураций действий с проверкой прав для использования в списках и таблицах.

```typescript
import { createListActions } from '@/utils/permissionActions'
import { usePermissions } from '@/composables/usePermissions'

const { hasPermission, hasAnyPermission, hasAllPermissions, can } = usePermissions()

// Создание конфигурации действий для GenericList
const listActions = createListActions([
  {
    key: 'view',
    label: 'Просмотр',
    permission: 'purchases.view',
    variant: 'outline',
    size: 'sm'
  },
  {
    key: 'edit',
    label: 'Редактировать',
    permission: 'purchases.edit',
    variant: 'primary',
    size: 'sm',
    show: (item: Purchase) => item.status !== 'archived'
  },
  {
    key: 'approve',
    label: 'Одобрить',
    permission: 'purchases.approve',
    variant: 'success',
    size: 'sm',
    show: (item: Purchase) => item.status === 'new',
    requireConfirm: true,
    confirmMessage: 'Вы уверены, что хотите одобрить эту заявку?'
  },
  {
    key: 'delete',
    label: 'Удалить',
    permission: 'purchases.delete',
    variant: 'error',
    size: 'sm',
    requireConfirm: true,
    confirmMessage: 'Вы уверены, что хотите удалить эту закупку?'
  }
], { hasPermission, hasAnyPermission, hasAllPermissions, can })

// Использование в GenericList
const listConfig = {
  // ...
  actions: listActions
}
```

**ActionConfig:**
- `key: string` - уникальный ключ действия
- `label: string` - текст кнопки
- `shortLabel?: string` - короткий текст (для мобильных)
- `icon?: string` - SVG path
- `variant?: string` - вариант стиля
- `size?: string` - размер
- `permission?: string` - одно разрешение
- `any?: string[]` - массив разрешений (хотя бы одно)
- `all?: string[]` - массив разрешений (все)
- `resource?: string` - ресурс
- `action?: string` - действие
- `show?: (item: any) => boolean` - функция условного отображения
- `disabled?: (item: any) => boolean` - функция проверки disabled
- `requireConfirm?: boolean` - требовать подтверждение
- `confirmMessage?: string` - сообщение подтверждения
- `tooltip?: string` - подсказка
- `iconOnly?: boolean` - только иконка

---

## Примеры использования

### Пример 1: Список с действиями

```vue
<template>
  <GenericList
    :store="purchasesStore"
    :config="listConfig"
    @action="handleAction"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePermissions } from '@/composables/usePermissions'
import { createListActions } from '@/utils/permissionActions'
import { usePurchasesStore } from '@/stores/purchases'

const { hasPermission, hasAnyPermission, hasAllPermissions, can } = usePermissions()
const purchasesStore = usePurchasesStore()

const listConfig = computed(() => ({
  title: 'Закупки',
  actions: createListActions([
    {
      key: 'view',
      label: 'Просмотр',
      permission: 'purchases.view'
    },
    {
      key: 'edit',
      label: 'Редактировать',
      permission: 'purchases.edit',
      show: (item) => item.status !== 'archived'
    },
    {
      key: 'approve',
      label: 'Одобрить',
      permission: 'purchases.approve',
      show: (item) => item.status === 'new'
    }
  ], { hasPermission, hasAnyPermission, hasAllPermissions, can })
}))
</script>
```

### Пример 2: Форма с условными полями

```vue
<template>
  <GenericForm :config="formConfig" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePermissions } from '@/composables/usePermissions'

const { can } = usePermissions()

const formConfig = computed(() => ({
  fields: [
    { key: 'name', label: 'Название', required: true },
    { key: 'description', label: 'Описание' },
    // Поле видно только при наличии права
    ...(can('materials', 'edit_price') ? [{
      key: 'price',
      label: 'Цена',
      type: 'number'
    }] : [])
  ]
}))
</script>
```

### Пример 3: Панель действий

```vue
<template>
  <div class="action-panel">
    <PermissionButton 
      permission="materials.create"
      label="Создать"
      variant="primary"
      @click="handleCreate"
    />
    
    <PermissionButton 
      permission="materials.export"
      label="Экспорт"
      variant="outline"
      icon="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      @click="handleExport"
    />
    
    <PermissionButton 
      :any="['materials.delete', 'materials.delete_all']"
      label="Удалить выбранные"
      variant="error"
      :disabled="selectedItems.length === 0"
      @click="handleDeleteSelected"
    />
  </div>
</template>
```

### Пример 4: Условные фильтры

```vue
<template>
  <FilterPanel>
    <FilterField
      type="text"
      label="Поиск"
      :model-value="filters.search"
      @update:model-value="updateFilter('search', $event)"
    />
    
    <!-- Фильтр виден только при наличии права -->
    <PermissionFilter
      permission="purchases.view_all"
      type="select"
      label="Ответственный"
      :options="employeeOptions"
      :model-value="filters.responsible"
      @update:model-value="updateFilter('responsible', $event)"
    />
    
    <PermissionFilter
      permission="purchases.view_archived"
      type="select"
      label="Статус"
      :options="statusOptions"
      :model-value="filters.is_archived"
      @update:model-value="updateFilter('is_archived', $event)"
    />
  </FilterPanel>
</template>
```

---

## Лучшие практики

1. **Используйте permissions, а не роли**
   ```vue
   <!-- ❌ Плохо -->
   <button v-if="userRole === 'admin'">Действие</button>
   
   <!-- ✅ Хорошо -->
   <PermissionButton permission="admin.action">Действие</PermissionButton>
   ```

2. **Комбинируйте проверки для сложных условий**
   ```vue
   <!-- ✅ Хорошо -->
   <PermissionGuard 
     permission="purchases.edit"
     :item="purchase"
     :show="item => item.status === 'new' && !item.is_archived"
   >
     <button>Редактировать</button>
   </PermissionGuard>
   ```

3. **Используйте утилиты для списков действий**
   ```typescript
   // ✅ Хорошо - централизованная конфигурация
   const actions = createListActions([...], permissionChecker)
   
   // ❌ Плохо - разбросанная логика в компоненте
   const actions = computed(() => {
     const result = []
     if (hasPermission('view')) result.push({...})
     if (hasPermission('edit')) result.push({...})
     // ...
   })
   ```

4. **Кэшируйте проверки прав**
   ```typescript
   // ✅ Хорошо - computed кэширует результат
   const canEdit = computed(() => hasPermission('materials.edit'))
   
   // ❌ Плохо - функция вызывается каждый раз
   const canEdit = () => hasPermission('materials.edit')
   ```

---

## API Reference

### usePermissions()

Composable для работы с разрешениями.

```typescript
const {
  hasPermission,      // (codename: string) => boolean
  hasAnyPermission,  // (...codenames: string[]) => boolean
  hasAllPermissions,  // (...codenames: string[]) => boolean
  can,                // (resource: string, action: string) => boolean
  canCreateRequests,
  canApprovePurchases,
  canManageEmployees,
  canViewReports,
  canExportReports,
  canManageRoles,
  canManageUsers,
  getUserRoles,       // computed: Role[]
  hasRole,            // (roleName: string) => boolean
  hasAnyRole          // (...roleNames: string[]) => boolean
} = usePermissions()
```

---

## Миграция существующего кода

### До (старый подход)

```vue
<template>
  <button v-if="userRole === 'admin' || userRole === 'manager'">
    Создать
  </button>
</template>

<script setup>
const userRole = computed(() => authStore.me?.role)
</script>
```

### После (новый подход)

```vue
<template>
  <PermissionButton 
    :any="['materials.create', 'materials.create_all']"
    label="Создать"
    @click="handleCreate"
  />
</template>
```

---

## Поддержка

При возникновении вопросов или проблем:
1. Проверьте, что разрешения загружены: `permissionsStore.fetchPermissions()`
2. Убедитесь, что используете правильные codename разрешений
3. Проверьте консоль браузера на наличие ошибок
4. Используйте Vue DevTools для отладки computed свойств
