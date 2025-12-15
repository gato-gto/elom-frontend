# Архитектура Stores (Pinia)

## Обзор

Проект использует Pinia для управления состоянием. Stores разделены на три категории:

1. **Entity Stores** — для CRUD операций с сущностями (через `createBaseStore`)
2. **Системные Stores** — для глобального состояния приложения
3. **Кастомные Stores** — для специфичной бизнес-логики

---

## 1. Entity Stores (createBaseStore)

Все entity stores создаются через фабричную функцию `createBaseStore`, которая предоставляет стандартный набор функциональности.

### Создание store

```typescript
import { createBaseStore } from '@/stores/base'
import { endpoints } from '@/api/endpoints'
import type { Entity, EntityRequest, PatchedEntityRequest } from '@/api/types'

export const useEntityStore = createBaseStore<Entity, EntityRequest, PatchedEntityRequest>({
  endpoint: endpoints.entity,
  entityName: 'entity',
  entityNamePlural: 'сущности',
  defaultOrdering: 'name',
  defaultPageSize: 20
})
```

### Использование в компонентах

```typescript
import { useEntityStore } from '@/stores/entity'

const entityStore = useEntityStore()

// Загрузка списка
await entityStore.fetchList({ page: 1, search: 'query' })

// Загрузка одной записи
await entityStore.fetchOne(id)

// Создание
await entityStore.create(data)

// Обновление
await entityStore.update(id, data)

// Удаление
await entityStore.remove(id)
```

### Стандартные свойства и методы

#### State
| Свойство | Тип | Описание |
|----------|-----|----------|
| `items` | `T[]` | Список сущностей |
| `current` | `T \| null` | Текущая выбранная сущность |
| `loading` | `boolean` | Флаг загрузки |
| `error` | `string \| null` | Текст ошибки |
| `pagination` | `PaginationState` | Состояние пагинации |
| `filters` | `BaseFilters` | Текущие фильтры |

#### Getters
| Getter | Тип | Описание |
|--------|-----|----------|
| `getById` | `(id: number) => T \| undefined` | Получить элемент по ID |
| `exists` | `(id: number) => boolean` | Проверить существование |
| `selectOptions` | `{ value: number; label: string }[]` | Опции для select |

#### Actions
| Метод | Описание |
|-------|----------|
| `fetchList(params?)` | Загрузить список с параметрами |
| `fetchOne(id)` | Загрузить одну запись |
| `create(data)` | Создать новую запись |
| `update(id, data)` | Обновить запись |
| `remove(id)` | Удалить запись |
| `setCurrent(item)` | Установить текущую запись |
| `setFilters(filters)` | Установить фильтры и перезагрузить |
| `resetFilters()` | Сбросить фильтры |
| `clearError()` | Очистить ошибку |
| `setPageSize(size)` | Установить размер страницы |
| `setPage(page)` | Перейти на страницу |
| `search(query)` | Поиск (для автокомплита) |

### Список Entity Stores

| Store | Сущность | Файл |
|-------|----------|------|
| `useEmployeesStore` | Сотрудники | `employees.ts` |
| `useObjectsStore` | Объекты | `objects.ts` |
| `useMaterialsStore` | Материалы | `materials.ts` |
| `usePurchasesStore` | Закупки | `purchases.ts` |
| `useSuppliersStore` | Поставщики | `suppliers.ts` |
| `useUnitsStore` | Единицы измерения | `units.ts` |
| `useWriteOffsStore` | Списания | `writeOffs.ts` |
| `useStockSnapshotsStore` | Движения остатков | `stockSnapshots.ts` |
| `useMaterialCategoriesStore` | Категории материалов | `materialCategories.ts` |
| `useArchiveStore` | Архивные периоды | `archive.ts` |
| `useBalancesStore` | Остатки | `balances.ts` |

---

## 2. Системные Stores

### useAuthStore
Управление аутентификацией.

```typescript
const authStore = useAuthStore()

// Вход
await authStore.login(username, password)

// Выход
authStore.logout()

// Текущий пользователь
authStore.me

// Роль пользователя
authStore.role
```

### useUiStore
Глобальное UI состояние.

```typescript
const uiStore = useUiStore()

// Показать тост
uiStore.toast({ type: 'success', text: 'Успешно!' })

// Индикатор загрузки
uiStore.start()
uiStore.done()
uiStore.busy // boolean
```

### useThemeStore
Управление темой.

```typescript
const themeStore = useThemeStore()

// Переключить тему
themeStore.toggleTheme()

// Установить тему
themeStore.setTheme('dark') // 'light' | 'dark' | 'system'

// Текущая тема
themeStore.isDark // boolean
```

### useNotificationsStore
Уведомления в приложении.

```typescript
const notificationsStore = useNotificationsStore()

// Добавить уведомление
notificationsStore.addNotification({
  type: 'info',
  title: 'Заголовок',
  message: 'Сообщение'
})

// Отметить как прочитанное
notificationsStore.markAsRead(id)
```

---

## 3. Кастомные Stores

### useToolsStore
Управление инструментами (полный кастомный store).

```typescript
const toolsStore = useToolsStore()

// Стандартные CRUD операции
await toolsStore.fetchList()
await toolsStore.create(data)

// Специфичные методы
await toolsStore.fetchCategories()
await toolsStore.bulkCreate(payload)

// Специфичные getters
toolsStore.inStockItems
toolsStore.issuedItems
```

### useToolIssuesStore
Управление выдачами инструментов.

```typescript
const toolIssuesStore = useToolIssuesStore()

// Выдача инструмента
await toolIssuesStore.create(payload)

// Возврат инструмента
await toolIssuesStore.returnTool(id, payload)

// Открытые выдачи
toolIssuesStore.openIssues
```

---

## Расширение Entity Stores

Для добавления кастомной функциональности к entity stores используйте отдельные экспортируемые функции:

```typescript
// stores/employees.ts
export const useEmployeesStore = createBaseStore<...>({...})

// Кастомные действия
export const setPassword = async (id: number, password: string) => {
  const store = useEmployeesStore()
  store.loading = true
  try {
    await api.post(endpoints.employees.setPassword(id), { password })
    return true
  } finally {
    store.loading = false
  }
}

// Helper функции
export const getActiveEmployees = () => {
  const store = useEmployeesStore()
  return store.items.filter(item => item.is_active)
}
```

---

---

## Миграция со старого формата

### ❌ Неправильно
```typescript
// Store без вызова — это StoreDefinition, не Store
const store = useMyStore
store.items // TypeError!
```

### ✅ Правильно
```typescript
// Store с вызовом — это Store instance
const store = useMyStore()
store.items // OK
```

---

## Типы

```typescript
// Состояние пагинации
interface PaginationState {
  count: number
  page: number
  pageSize: number
  next: string | null
  previous: string | null
}

// Базовые фильтры
interface BaseFilters {
  search: string
  ordering: string
  [key: string]: any
}

// Конфигурация store
interface BaseStoreConfig<T, C, U> {
  endpoint: {
    list: string
    one: (id: number) => string
  }
  entityName: string
  entityNamePlural: string
  defaultOrdering?: string
  defaultPageSize?: number
}
```

---

## Рекомендации

1. **Всегда вызывайте store как функцию**: `useMyStore()`
2. **Используйте `createBaseStore`** для стандартных CRUD сущностей
3. **Выносите кастомные действия** в отдельные экспортируемые функции
4. **Используйте helper функции** вместо computed для фильтрации
5. **Не переопределяйте методы store** — создавайте отдельные функции

