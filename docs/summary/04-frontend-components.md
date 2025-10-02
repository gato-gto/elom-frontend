# Frontend компоненты ELOM

## Обзор архитектуры

Frontend ELOM построен на Vue 3 с использованием Composition API, TypeScript, и современного стека технологий для создания адаптивного и производительного пользовательского интерфейса.

## Технологический стек

### Основные технологии
- **Vue 3.4+**: Frontend framework с Composition API
- **TypeScript 5.3+**: Строгая типизация
- **Pinia 2.1+**: Управление состоянием
- **Vue Router 4.2+**: Роутинг и навигация с middleware
- **Tailwind CSS 3.4+**: Утилитарные стили
- **DaisyUI 4.4+**: UI компоненты
- **Vite 5.0+**: Сборщик и dev сервер

### Дополнительные библиотеки
- **@vueuse/core**: Vue композаблы
- **axios**: HTTP клиент
- **date-fns**: Работа с датами
- **chart.js**: Графики и диаграммы
- **playwright**: E2E тестирование

## Структура проекта

```
src/
├── api/                    # API клиент и типы (15+ файлов)
│   ├── client.ts          # HTTP клиент с interceptors
│   ├── endpoints.ts       # URL endpoints
│   ├── types.ts           # Основные TypeScript типы
│   └── types/             # Специализированные типы
│       ├── auth.ts        # Типы аутентификации
│       ├── materials.ts   # Типы материалов
│       ├── purchases.ts   # Типы закупок
│       ├── stocks.ts      # Типы остатков
│       ├── reports.ts     # Типы отчетов
│       └── ...            # Другие типы
├── components/            # Переиспользуемые компоненты (48 файлов)
│   ├── cards/            # Мобильные карточки (8 файлов)
│   │   ├── MaterialCard.vue
│   │   ├── PurchaseCard.vue
│   │   ├── StockCard.vue
│   │   ├── SupplierCard.vue
│   │   ├── EmployeeCard.vue
│   │   ├── ObjectCard.vue
│   │   ├── UnitCard.vue
│   │   └── WriteOffCard.vue
│   ├── __tests__/        # Тесты компонентов (4 файла)
│   │   ├── FormField.test.ts
│   │   ├── GenericForm.test.ts
│   │   ├── GenericList.test.ts
│   │   └── LoadingSpinner.test.ts
│   ├── GenericForm.vue   # Универсальная форма
│   ├── GenericList.vue   # Универсальный список
│   ├── FormField.vue     # Поле формы (14 типов)
│   ├── Modal.vue         # Модальные окна
│   ├── MaterialSearchSelect.vue # Поиск материалов
│   ├── SupplierSearchSelect.vue # Поиск поставщиков
│   ├── ListHeader.vue    # Заголовок списка
│   ├── FilterPanel.vue   # Панель фильтров
│   ├── FilterField.vue   # Поле фильтра
│   ├── TableSkeleton.vue # Скелетон таблицы
│   ├── Pagination.vue    # Пагинация
│   ├── ExportButton.vue  # Кнопка экспорта
│   ├── LoadingSpinner.vue # Спиннер загрузки
│   ├── AutoNavigation.vue # Автоматическая навигация
│   ├── AutoMobileNavigation.vue # Мобильная навигация
│   └── ...               # Другие UI компоненты
├── composables/          # Vue композаблы (13 файлов)
│   ├── useGenericForm.ts # Универсальные формы
│   ├── useGenericList.ts # Универсальные списки
│   ├── useAutoFilters.ts # Автоматические фильтры
│   ├── usePagination.ts  # Пагинация
│   ├── useResponsiveTable.ts # Адаптивность
│   ├── useErrorHandler.ts # Обработка ошибок
│   ├── useExport.ts      # Экспорт данных
│   ├── useLoading.ts     # Управление загрузкой
│   ├── useAnimations.ts  # Анимации
│   ├── useRouter.ts      # Роутинг
│   ├── useDebounce.ts    # Debounce функции
│   ├── useThrottle.ts    # Throttle функции
│   └── useMobile.ts      # Мобильные утилиты
├── layouts/              # Макеты страниц
│   └── AppLayout.vue     # Основной макет
├── pages/                # Страницы приложения (15+ страниц)
│   ├── Materials/        # Материалы (List.vue, MaterialForm.vue)
│   ├── Purchases/        # Закупки (List.vue, PurchaseForm.vue, PurchaseInfo.vue)
│   ├── Objects/          # Объекты (List.vue, ObjectForm.vue)
│   ├── Stocks/           # Остатки (List.vue, StockForm.vue, StockSnapshotForm.vue)
│   ├── WriteOffs/        # Списания (List.vue, WriteOffForm.vue)
│   ├── Suppliers/        # Поставщики (List.vue, SupplierForm.vue)
│   ├── Employees/        # Сотрудники (List.vue, EmployeeForm.vue)
│   ├── Units/            # Единицы измерения (List.vue, UnitForm.vue)
│   ├── Reports/          # Отчеты (4 типа отчетов)
│   ├── Archive/          # Архив (List.vue)
│   └── Login.vue         # Страница входа
├── router/               # Конфигурация роутинга
│   ├── index.ts          # Маршруты (15+ маршрутов)
│   ├── middleware.ts     # Middleware для аутентификации
│   └── constants.ts      # Константы роутинга
├── stores/               # Pinia stores (13 stores)
│   ├── base.ts           # Базовый store с CRUD операциями
│   ├── auth.ts           # Аутентификация (defineStore)
│   ├── materials.ts      # Материалы (defineStore)
│   ├── purchases.ts      # Закупки (createBaseStore)
│   ├── stockSnapshots.ts # Движения остатков (createBaseStore)
│   ├── writeOffs.ts      # Списания (createBaseStore)
│   ├── suppliers.ts      # Поставщики (defineStore)
│   ├── employees.ts      # Сотрудники (createBaseStore)
│   ├── objects.ts        # Объекты (createBaseStore)
│   ├── units.ts          # Единицы измерения (createBaseStore)
│   ├── materialCategories.ts # Категории материалов (defineStore)
│   ├── ui.ts             # UI состояние (defineStore)
│   ├── theme.ts          # Темы (defineStore)
│   └── notifications.ts  # Уведомления (defineStore)
├── utils/                # Утилиты (11 файлов)
│   ├── errorHandler.ts   # Обработка ошибок
│   ├── formatters.ts     # Форматирование
│   ├── export.ts         # Экспорт данных
│   ├── chartUtils.ts     # Утилиты для графиков
│   ├── debounce.ts       # Debounce функции
│   ├── unitRounding.ts   # Округление единиц измерения
│   ├── browserSupport.ts # Поддержка браузеров
│   ├── polyfills.ts      # Полифиллы
│   ├── router.ts         # Утилиты роутинга
│   ├── throttle.ts       # Throttle функции
│   └── validation.ts     # Валидация
├── types/                # Глобальные типы
│   ├── generic.ts        # Универсальные типы
│   ├── router.ts         # Типы роутинга
│   └── axios.d.ts        # Типы для Axios
├── test/                 # Тестовые утилиты
│   ├── setup.ts          # Настройка тестов
│   ├── utils.ts          # Утилиты для тестов
│   ├── basic.test.ts     # Базовые тесты
│   ├── browserCompatibility.test.ts # Тесты совместимости
│   └── validation-errors.test.ts # Тесты валидации
└── assets/               # Статические ресурсы
    ├── tailwind.css      # Стили
    └── *.css             # Дополнительные стили
```

## Система роутинга

### Основные маршруты (15+ маршрутов)
```typescript
const routes = [
  // Аутентификация
  { path: '/login', component: Login, meta: { public: true } },
  
  // Главная страница
  { path: '/', redirect: '/purchases' },
  
  // Материалы
  { path: '/materials', component: MaterialsList },
  { path: '/materials/create', component: MaterialForm },
  { path: '/materials/:id/edit', component: MaterialForm },
  
  // Закупки
  { path: '/purchases', component: PurchasesList },
  { path: '/purchases/create', component: PurchaseForm },
  { path: '/purchases/:id/edit', component: PurchaseForm },
  
  // Объекты
  { path: '/objects', component: ObjectsList },
  { path: '/objects/create', component: ObjectForm },
  { path: '/objects/:id/edit', component: ObjectForm },
  
  // Остатки
  { path: '/stocks', component: StocksList },
  { path: '/stocks/create', component: StockForm },
  { path: '/stocks/:id/edit', component: StockForm },
  
  // Списания
  { path: '/writeoffs', component: WriteOffsList },
  { path: '/writeoffs/create', component: WriteOffForm },
  { path: '/writeoffs/:id/edit', component: WriteOffForm },
  
  // Поставщики
  { path: '/suppliers', component: SuppliersList },
  { path: '/suppliers/create', component: SupplierForm },
  { path: '/suppliers/:id/edit', component: SupplierForm },
  
  // Сотрудники
  { path: '/employees', component: EmployeesList },
  { path: '/employees/create', component: EmployeeForm },
  { path: '/employees/:id/edit', component: EmployeeForm },
  
  // Единицы измерения
  { path: '/units', component: UnitsList },
  { path: '/units/create', component: UnitForm },
  { path: '/units/:id/edit', component: UnitForm },
  
  // Архив
  { path: '/archive', component: ArchiveList },
  
  // Отчеты (4 типа)
  { path: '/reports/by-period', component: ReportByPeriod },
  { path: '/reports/by-object', component: ReportByObject },
  { path: '/reports/by-material', component: ReportByMaterial },
  { path: '/reports/by-responsible', component: ReportByResponsible },
]
```

### Навигационные guards
```typescript
// Проверка аутентификации
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (!to.meta.public && !authStore.isAuthenticated) {
    next('/login')
  } else {
    next()
  }
})

// Проверка ролей
function hasRequiredRole(userRole: string, requiredRole: string | string[]): boolean {
  if (!requiredRole) return true
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole)
  }
  return userRole === requiredRole
}
```

## Управление состоянием (Pinia)

### Архитектура Stores

ELOM использует два подхода к созданию stores:

#### 1. Stores через createBaseStore (НЕ вызывать с `()`)
```typescript
const purchasesStore = usePurchasesStore    // ✅ Правильно
const unitsStore = useUnitsStore           // ✅ Правильно
const objectsStore = useObjectsStore       // ✅ Правильно
```

**Stores:**
- `usePurchasesStore` - Управление закупками
- `useUnitsStore` - Управление единицами измерения
- `useObjectsStore` - Управление объектами
- `useEmployeesStore` - Управление сотрудниками
- `useWriteOffsStore` - Управление списаниями
- `useStockSnapshotsStore` - Управление движениями остатков

#### 2. Stores через defineStore (вызывать с `()`)
```typescript
const materialsStore = useMaterialsStore()  // ✅ Правильно
const authStore = useAuthStore()           // ✅ Правильно
const uiStore = useUiStore()               // ✅ Правильно
```

**Stores:**
- `useAuthStore` - Аутентификация и профиль пользователя
- `useMaterialsStore` - Управление материалами
- `useSuppliersStore` - Управление поставщиками
- `useMaterialCategoriesStore` - Управление категориями материалов
- `useThemeStore` - Управление темами
- `useNotificationsStore` - Уведомления
- `useUiStore` - UI состояние

### Структура stores (13 stores)
```typescript
// Базовый store с CRUD операциями
export function createBaseStore<T extends Record<string, any>, C, U>(
  config: BaseStoreConfig<T, C, U>
) {
  const store = defineStore(config.entityName, () => {
    // State
    const items = ref<T[]>([])
    const current = ref<T | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)
    const pagination = ref<PaginationState>({
      count: 0, page: 1, pageSize: 20, next: null, previous: null
    })
    const filters = ref<BaseFilters>({ search: '', ordering: 'id' })
    
    // Computed getters
    const getById = computed(() => (id: number) => items.value.find(item => item.id === id))
    const exists = computed(() => (id: number) => items.value.some(item => item.id === id))
    const selectOptions = computed(() => items.value.map(item => ({
      value: item.id, label: item.name || item.title || `Item ${item.id}`
    })))
    
    // CRUD операции
    const fetchList = async (params?: any) => { /* ... */ }
    const fetchOne = async (id: number) => { /* ... */ }
    const create = async (data: C) => { /* ... */ }
    const update = async (id: number, data: U) => { /* ... */ }
    const deleteItem = async (id: number) => { /* ... */ }
    
    // Utility methods
    const setCurrent = (item: T | null) => { current.value = item }
    const setFilters = (newFilters: Partial<BaseFilters>) => { Object.assign(filters.value, newFilters) }
    const resetFilters = () => { filters.value = { search: '', ordering: 'id' } }
    const clearError = () => { error.value = null }
    const setPageSize = (size: number) => { pagination.value.pageSize = size; pagination.value.page = 1 }
    const setPage = (page: number) => { pagination.value.page = page }
    
    return {
      // State
      items, current, loading, error, pagination, filters,
      // Computed
      getById, exists, selectOptions,
      // CRUD Actions
      fetchList, fetchOne, create, update, delete: deleteItem,
      // Utility methods
      setCurrent, setFilters, resetFilters, clearError, setPageSize, setPage
    }
  })
  
  return store()
}
```

### Основные stores

#### Auth Store
```typescript
export const useAuthStore = defineStore('auth', () => {
  const me = ref<Me | null>(null)
  const accessToken = ref<string | null>(localStorage.getItem(ACCESS_KEY))
  const refreshToken = ref<string | null>(localStorage.getItem(REFRESH_KEY))
  const loading = ref(false)
  const error = ref<string | null>(null)
  const initialized = ref(false)
  
  const isAuthenticated = computed(() => !!accessToken.value)
  const role = computed(() => me.value?.role)
  
  const login = async (username: string, password: string) => { /* ... */ }
  const logout = (withRedirect = false) => { /* ... */ }
  const refreshTokens = async () => { /* ... */ }
  const tryHydrate = async () => { /* ... */ }
  const fetchMe = async () => { /* ... */ }
  
  return { me, accessToken, refreshToken, loading, error, initialized, isAuthenticated, role, login, logout, refreshTokens, tryHydrate, fetchMe }
})
```

#### Materials Store
```typescript
export const useMaterialsStore = createBaseStore<Material, MaterialRequest, PatchedMaterialRequest>({
  endpoint: {
    list: endpoints.materials.list,
    one: (id: number) => endpoints.materials.one(id)
  },
  entityName: 'materials',
  entityNamePlural: 'materials'
})

// Дополнительные методы для материалов
const materialsStore = useMaterialsStore()
materialsStore.uploadPhoto = async (id: number, photo: File) => { /* ... */ }
```

#### Purchases Store
```typescript
export const usePurchasesStore = createBaseStore<Purchase, PurchaseRequest, PatchedPurchaseRequest>({
  endpoint: {
    list: endpoints.purchases.list,
    one: (id: number) => endpoints.purchases.one(id)
  },
  entityName: 'purchases',
  entityNamePlural: 'purchases'
})
```

#### Stocks Store
```typescript
export const useStockSnapshotsStore = createBaseStore<StockSnapshot, StockSnapshotCreateRequest, StockSnapshotUpdateRequest>({
  endpoint: {
    list: endpoints.stockSnapshots.list,
    one: (id: number) => endpoints.stockSnapshots.one(id)
  },
  entityName: 'stockSnapshots',
  entityNamePlural: 'stockSnapshots'
})
```

#### WriteOffs Store
```typescript
export const useWriteOffsStore = createBaseStore<WriteOff, WriteOffCreateRequest, WriteOffUpdateRequest>({
  endpoint: {
    list: endpoints.writeOffs.list,
    one: (id: number) => endpoints.writeOffs.one(id)
  },
  entityName: 'writeOffs',
  entityNamePlural: 'writeOffs'
})
```

#### UI Store
```typescript
export const useUiStore = defineStore('ui', () => {
  const sidebarOpen = ref(false)
  const theme = ref<'light' | 'dark' | 'system'>('system')
  const notifications = ref<Notification[]>([])
  
  const toggleSidebar = () => { sidebarOpen.value = !sidebarOpen.value }
  const setTheme = (newTheme: 'light' | 'dark' | 'system') => { theme.value = newTheme }
  const toast = (notification: Omit<Notification, 'id'>) => { /* ... */ }
  
  return { sidebarOpen, theme, notifications, toggleSidebar, setTheme, toast }
})
```

## UI компоненты

### Универсальные компоненты

#### GenericForm - Универсальная система форм
```vue
<template>
  <form class="grid gap-4" @submit.prevent="submit">
    <!-- Form Sections as Cards -->
    <div v-if="config.sections && config.sections.length > 0">
      <div v-for="(section, index) in sections" :key="index" class="card bg-base-100 border">
        <div class="card-body">
          <h2 class="card-title text-lg mb-4">{{ section.title }}</h2>
          <p v-if="section.description" class="text-base-content/70 text-sm mb-4">{{ section.description }}</p>
          
          <div class="grid md:grid-cols-2 gap-4">
            <FormField
              v-for="field in getSectionFields(index)"
              :key="field.key"
              v-model="form[field.key]"
              :label="field.label"
              :type="field.type"
              :placeholder="field.placeholder"
              :required="field.required"
              :disabled="field.disabled || isSubmitting"
              :error="getFieldError(field.key) || undefined"
              :options="field.options"
              @update:model-value="handleFieldChange(field.key, $event)"
            />
          </div>
        </div>
      </div>
    </div>
  </form>
</template>
```

**Особенности GenericForm:**
- ✅ Поддержка секций с карточками
- ✅ Автоматическая валидация полей
- ✅ События изменения полей (`field-change`)
- ✅ Интеграция с `useGenericForm` composable
- ✅ Поддержка всех типов полей (text, select, textarea, number, file, multiselect)
- ✅ Адаптивная сетка (md:grid-cols-2)
- ✅ DaisyUI стилизация

#### GenericList - Универсальная система списков
```vue
<template>
  <div class="list-container">
    <!-- Desktop: Table View -->
    <div v-if="!isMobile" class="table-container desktop-only">
      <table class="modern-table">
        <thead>
          <tr>
            <th v-for="column in config.columns" :key="column.key">
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td v-for="column in config.columns" :key="column.key">
              <slot :name="`cell-${column.key}`" :item="item" :value="item[column.key]">
                {{ formatCellValue(item[column.key], column) }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Mobile: Cards View -->
    <div v-else class="mobile-cards-container mobile-only">
      <component
        v-for="item in items"
        :key="item.id"
        :is="config.cardComponent"
        :item="item"
        :actions="getCardActions(item)"
        @action="handleCardAction(item, $event)"
      />
    </div>
  </div>
</template>
```

**Особенности GenericList:**
- ✅ Адаптивный дизайн (таблица на десктопе, карточки на мобильных)
- ✅ Универсальная конфигурация колонок
- ✅ Поддержка слотов для кастомизации ячеек
- ✅ Интеграция с `useResponsiveTable` composable
- ✅ Автоматические действия для карточек

### Базовые компоненты

#### FormField
```vue
<template>
  <div class="form-control">
    <label class="label" v-if="label">
      <span class="label-text">{{ label }}</span>
      <span v-if="required" class="label-text-alt text-error">*</span>
    </label>
    
    <input
      v-if="type === 'text' || type === 'email' || type === 'number'"
      :type="type"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      :class="inputClass"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
    />
    
    <select
      v-else-if="type === 'select'"
      :value="modelValue"
      @change="$emit('update:modelValue', $event.target.value)"
      :class="inputClass"
      :required="required"
      :disabled="disabled"
    >
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
    
    <textarea
      v-else-if="type === 'textarea'"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      :class="inputClass"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :rows="rows"
    />
    
    <div v-if="error" class="label">
      <span class="label-text-alt text-error">{{ error }}</span>
    </div>
  </div>
</template>
```

#### LoadingSpinner
```vue
<template>
  <div :class="containerClass">
    <div class="loading loading-spinner" :class="spinnerClass"></div>
    <p v-if="text" class="mt-2 text-sm opacity-70">{{ text }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  size?: 'xs' | 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  text?: string
  overlay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  variant: 'primary',
  overlay: false
})

const containerClass = computed(() => ({
  'flex flex-col items-center justify-center p-8': true,
  'fixed inset-0 bg-base-100/80 backdrop-blur-sm z-50': props.overlay
}))

const spinnerClass = computed(() => ({
  'loading-xs': props.size === 'xs',
  'loading-sm': props.size === 'sm',
  'loading-md': props.size === 'md',
  'loading-lg': props.size === 'lg',
  'loading-primary': props.variant === 'primary',
  'loading-secondary': props.variant === 'secondary',
  'loading-success': props.variant === 'success',
  'loading-warning': props.variant === 'warning',
  'loading-error': props.variant === 'error'
}))
</script>
```

#### Modal
```vue
<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal modal-open">
      <div class="modal-box" :class="sizeClass">
        <h3 class="font-bold text-lg mb-4">{{ title }}</h3>
        <slot />
        <div v-if="closable" class="modal-action">
          <button class="btn btn-outline" @click="$emit('update:modelValue', false)">
            Закрыть
          </button>
        </div>
      </div>
      <div class="modal-backdrop" @click="closable && $emit('update:modelValue', false)"></div>
    </div>
  </Teleport>
</template>
```

### Специализированные компоненты

#### ListHeader
```vue
<template>
  <div class="mb-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-base-content flex items-center gap-2">
          <svg v-if="icon" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="icon" />
          </svg>
          {{ title }}
        </h1>
        <p v-if="subtitle" class="text-base-content/70 mt-1">{{ subtitle }}</p>
      </div>
      
      <div class="flex items-center gap-2">
        <slot name="actions" />
        <button
          v-if="showCreate && canCreate"
          @click="$emit('create')"
          class="btn btn-primary"
          :disabled="loading"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          {{ createText }}
        </button>
      </div>
    </div>
    
    <div v-if="showStats" class="stats stats-horizontal shadow mt-4">
      <div class="stat">
        <div class="stat-title">Всего</div>
        <div class="stat-value text-primary">{{ totalCount }}</div>
      </div>
      <div class="stat">
        <div class="stat-title">Показано</div>
        <div class="stat-value">{{ filteredCount }}</div>
      </div>
    </div>
  </div>
</template>
```

#### FilterPanel
```vue
<template>
  <div class="card bg-base-100 border mb-6">
    <div class="card-body p-4">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div class="grid gap-4" :class="gridClass">
          <slot />
        </div>
        
        <div class="flex items-center gap-2">
          <button
            @click="$emit('reset')"
            class="btn btn-outline btn-sm"
            :disabled="loading"
          >
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Сбросить
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
```

#### ModernPagination
```vue
<template>
  <div class="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
    <div class="text-sm text-base-content/70">
      Показано {{ startItem }}-{{ endItem }} из {{ totalItems }} записей
    </div>
    
    <div class="flex items-center gap-2">
      <button
        @click="$emit('page-change', 1)"
        class="btn btn-sm btn-outline"
        :disabled="currentPage === 1"
      >
        Первая
      </button>
      
      <button
        @click="$emit('page-change', currentPage - 1)"
        class="btn btn-sm btn-outline"
        :disabled="currentPage === 1"
      >
        Назад
      </button>
      
      <div class="flex items-center gap-1">
        <button
          v-for="page in visiblePages"
          :key="page"
          @click="$emit('page-change', page)"
          class="btn btn-sm"
          :class="page === currentPage ? 'btn-primary' : 'btn-outline'"
        >
          {{ page }}
        </button>
      </div>
      
      <button
        @click="$emit('page-change', currentPage + 1)"
        class="btn btn-sm btn-outline"
        :disabled="currentPage === totalPages"
      >
        Вперед
      </button>
      
      <button
        @click="$emit('page-change', totalPages)"
        class="btn btn-sm btn-outline"
        :disabled="currentPage === totalPages"
      >
        Последняя
      </button>
    </div>
    
    <div class="flex items-center gap-2">
      <span class="text-sm">На странице:</span>
      <select
        :value="pageSize"
        @change="$emit('page-size-change', Number($event.target.value))"
        class="select select-sm select-bordered"
      >
        <option value="10">10</option>
        <option value="20">20</option>
        <option value="50">50</option>
        <option value="100">100</option>
      </select>
    </div>
  </div>
</template>
```

## Мобильные карточки

### Базовый компонент MobileCard
```vue
<template>
  <div class="card bg-base-100 border shadow-sm hover:shadow-md transition-shadow">
    <div class="card-body p-4">
      <div class="flex justify-between items-start mb-3">
        <slot name="header" />
        <div v-if="actions.length > 0" class="flex gap-1">
          <button
            v-for="action in actions"
            :key="action.key"
            @click="$emit('action', action.key)"
            class="btn btn-xs"
            :class="action.class"
            :disabled="action.disabled"
          >
            {{ action.shortLabel || action.label }}
          </button>
        </div>
      </div>
      
      <div class="grid gap-2" :class="gridClass">
        <slot name="content" />
      </div>
    </div>
  </div>
</template>
```

### Специализированные карточки

#### PurchaseCard
```vue
<template>
  <MobileCard :actions="actions" @action="$emit('action', $event)">
    <template #header>
      <div>
        <h3 class="text-lg font-semibold">{{ purchase.purchase_no }}</h3>
        <p class="text-sm text-base-content/70">{{ purchase.object_name }}</p>
      </div>
      <div class="badge" :class="statusClass">
        {{ statusLabel }}
      </div>
    </template>
    
    <template #content>
      <div>
        <p class="text-xs text-base-content/60">Поставщик:</p>
        <p class="font-medium">{{ purchase.supplier_name }}</p>
      </div>
      <div>
        <p class="text-xs text-base-content/60">Сумма:</p>
        <p class="font-medium">{{ formatCurrency(purchase.total_amount) }}</p>
      </div>
      <div>
        <p class="text-xs text-base-content/60">Дата:</p>
        <p class="font-medium">{{ formatDate(purchase.date) }}</p>
      </div>
      <div>
        <p class="text-xs text-base-content/60">Ответственный:</p>
        <p class="font-medium">{{ purchase.responsible_name }}</p>
      </div>
    </template>
  </MobileCard>
</template>
```

## Адаптивный дизайн

### Breakpoints
```css
/* Tailwind CSS breakpoints */
sm: 640px   /* Small devices */
md: 768px   /* Medium devices */
lg: 1024px  /* Large devices */
xl: 1280px  /* Extra large devices */
2xl: 1536px /* 2X large devices */
```

### Адаптивные компоненты
```vue
<template>
  <div class="list-container">
    <!-- Desktop: Table View -->
    <div v-if="!isMobile" class="table-container desktop-only">
      <table class="modern-table">
        <!-- Table content -->
      </table>
    </div>
    
    <!-- Mobile: Cards View -->
    <div v-else class="mobile-cards-container mobile-only">
      <PurchaseCard
        v-for="purchase in items"
        :key="purchase.id"
        :purchase="purchase"
        :actions="getCardActions(purchase)"
        @action="handleCardAction(purchase, $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useResponsiveTable } from '@/composables/useResponsiveTable'

const { isMobile } = useResponsiveTable()
</script>
```

### CSS классы для адаптивности
```css
/* Показать только на десктопе */
.desktop-only {
  display: block;
}

@media (max-width: 767px) {
  .desktop-only {
    display: none;
  }
}

/* Показать только на мобильных */
.mobile-only {
  display: none;
}

@media (max-width: 767px) {
  .mobile-only {
    display: block;
  }
}
```

## Композаблы (Composables)

### useGenericForm - Универсальная система форм
```typescript
export function useGenericForm<T extends Record<string, any>>(
  options: UseGenericFormOptions<T>
): UseGenericFormReturn<T> {
  const { handleFormError } = useErrorHandler()
  
  // State
  const form = ref<T>({ ...options.initialData } as T)
  const errors = ref<Record<string, string>>({})
  const isSubmitting = ref(false)
  const isDirty = ref(false)
  const touched = ref<Set<string>>(new Set())

  // Computed
  const isValid = computed(() => {
    // Don't validate on computed property to avoid showing errors immediately
    // Just check if there are no current errors
    return Object.keys(errors.value).length === 0
  })

  // Methods
  function setFieldValue(key: string, value: any) {
    form.value[key] = value
    isDirty.value = true
    touched.value.add(key)
    
    // Clear error for this field when user starts typing
    if (errors.value[key]) {
      delete errors.value[key]
    }
    
    // Validate field if validation is enabled
    if (options.validateOnChange) {
      validateField(key)
    }
  }

  function setFieldError(key: string, error: string) {
    errors.value[key] = error
  }

  function clearErrors() {
    errors.value = {}
  }

  function validateField(key: string): boolean {
    const field = options.config.fields.find(f => f.key === key)
    if (!field) return true

    const value = form.value[key]
    let isValid = true

    // Required validation - only show error if field is touched or form is being submitted
    if (field.required && (!value || (typeof value === 'string' && !value.trim()))) {
      // Only show required field error if field has been touched or form is being submitted
      if (touched.value.has(key) || isSubmitting.value) {
        setFieldError(key, `${field.label} обязательно для заполнения`)
        isValid = false
      }
    }

    // Type-specific validation - only show errors if field is touched or form is being submitted
    if (value && field.validation && (touched.value.has(key) || isSubmitting.value)) {
      const validation = field.validation

      // String length validation
      if (typeof value === 'string') {
        if (validation.minLength && value.length < validation.minLength) {
          setFieldError(key, `${field.label} должно содержать минимум ${validation.minLength} символов`)
          isValid = false
        }
        if (validation.maxLength && value.length > validation.maxLength) {
          setFieldError(key, `${field.label} должно содержать максимум ${validation.maxLength} символов`)
          isValid = false
        }
      }

      // Number validation
      if (typeof value === 'number') {
        if (validation.min !== undefined && value < validation.min) {
          setFieldError(key, `${field.label} должно быть не менее ${validation.min}`)
          isValid = false
        }
        if (validation.max !== undefined && value > validation.max) {
          setFieldError(key, `${field.label} должно быть не более ${validation.max}`)
          isValid = false
        }
      }

      // Pattern validation
      if (validation.pattern && typeof value === 'string' && !validation.pattern.test(value)) {
        setFieldError(key, `${field.label} имеет неверный формат`)
        isValid = false
      }

      // Custom validation
      if (validation.custom) {
        const customError = validation.custom(value)
        if (customError) {
          setFieldError(key, customError)
          isValid = false
        }
      }
    }

    return isValid
  }

  function validate(): boolean {
    let isValid = true
    Object.keys(form.value).forEach(key => {
      touched.value.add(key)
      if (!validateField(key)) {
        isValid = false
      }
    })
    return isValid
  }

  async function submit() {
    isSubmitting.value = true
    try {
      if (!validate()) {
        throw new Error('Форма содержит ошибки')
      }
      return await options.onSubmit(form.value)
    } catch (error) {
      const errorResult = handleFormError(error)
      if (errorResult.hasErrors) {
        // Set field errors
        Object.entries(errorResult.fieldErrors).forEach(([key, error]) => {
          setFieldError(key, error)
        })
      }
      throw error
    } finally {
      isSubmitting.value = false
    }
  }

  function reset() {
    form.value = { ...options.initialData } as T
    errors.value = {}
    isDirty.value = false
    touched.value.clear()
  }

  function getFieldValue(key: string) {
    return form.value[key]
  }

  function getFieldError(key: string): string | null {
    // Handle nested error keys like items[0].material
    if (errors.value[key]) {
      return errors.value[key]
    }
    
    // Check for nested errors
    const nestedKey = Object.keys(errors.value).find(errorKey => {
      if (errorKey.startsWith(`${key}[`) && errorKey.includes(']')) {
        return true
      }
      if (errorKey.startsWith(`${key}.`)) {
        return true
      }
      return false
    })
    
    return nestedKey ? errors.value[nestedKey] : null
  }

  function isFieldTouched(key: string): boolean {
    return touched.value.has(key)
  }

  function setFormData(data: Partial<T>) {
    Object.assign(form.value, data)
    isDirty.value = true
  }

  return {
    // State
    form, errors, isSubmitting, isDirty, isValid,
    // Actions
    submit, reset, validate, setFieldValue, setFieldError, clearErrors,
    getFieldValue, getFieldError, isFieldTouched, setFormData
  }
}
```

### useGenericList - Универсальная система списков
```typescript
export function useGenericList<T extends Record<string, any>>(
  options: UseGenericListOptions<T>
): UseGenericListReturn<T> {
  const { store, config, autoFetch = true, debounceMs = 300 } = options
  const { isMobile } = useResponsiveTable()
  
  // State
  const sortBy = ref<string>('id')
  const sortOrder = ref<'asc' | 'desc'>('asc')
  
  // Computed
  const items = computed(() => store.items)
  const loading = computed(() => store.loading)
  const error = computed(() => store.error)
  const pagination = computed(() => store.pagination)
  const filters = computed(() => store.filters)
  
  // Methods
  const fetchList = async () => {
    try {
      await store.fetchList()
    } catch (err) {
      console.error('Ошибка загрузки данных:', err)
    }
  }
  
  const handleSort = (key: string) => {
    if (sortBy.value === key) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortBy.value = key
      sortOrder.value = 'asc'
    }
    
    store.setFilters({
      ...store.filters,
      ordering: sortOrder.value === 'desc' ? `-${key}` : key
    })
    fetchList()
  }
  
  const handlePageChange = (page: number) => {
    store.setPage(page)
    fetchList()
  }
  
  const handlePageSizeChange = (size: number) => {
    store.setPageSize(size)
    fetchList()
  }
  
  const handleResetFilters = () => {
    store.resetFilters()
    sortBy.value = 'id'
    sortOrder.value = 'asc'
    fetchList()
  }
  
  const handleAction = (action: string, item: T) => {
    if (config.onAction) {
      config.onAction(action, item)
    }
  }
  
  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    if (config.onExport) {
      await config.onExport(format, items.value)
    }
  }
  
  // Debounced search
  const debouncedSearch = debounce((value: string) => {
    store.setFilters({ ...store.filters, search: value })
    fetchList()
  }, debounceMs)
  
  // Auto fetch on mount
  if (autoFetch) {
    onMounted(() => {
      fetchList()
    })
  }
  
  return {
    // State
    items, loading, error, pagination, filters, isMobile,
    // Actions
    fetchList, handleSort, handlePageChange, handlePageSizeChange,
    handleResetFilters, handleAction, handleExport
  }
}
```

### useAutoFilters - Автоматические фильтры
```typescript
export function useAutoFilters<T extends Record<string, any>>(
  store: any,
  defaultFilters: T
) {
  const filters = ref<T>({ ...defaultFilters })
  const debouncedSearch = debounce((value: string) => {
    filters.value.search = value
    store.setFilters(filters.value)
    store.fetchList()
  }, 300)
  
  const updateFilter = (key: keyof T, value: any) => {
    filters.value[key] = value
    store.setFilters(filters.value)
    store.fetchList()
  }
  
  const resetFilters = () => {
    filters.value = { ...defaultFilters }
    store.resetFilters()
    store.fetchList()
  }
  
  return {
    filters, updateFilter, resetFilters, debouncedSearch
  }
}
```

### useResponsiveTable
```typescript
export function useResponsiveTable() {
  const isMobile = ref(false)
  
  const checkMobile = () => {
    isMobile.value = window.innerWidth < 768
  }
  
  onMounted(() => {
    checkMobile()
    window.addEventListener('resize', checkMobile)
  })
  
  onUnmounted(() => {
    window.removeEventListener('resize', checkMobile)
  })
  
  return { isMobile }
}
```

### useLoading
```typescript
export function useLoading(initialState: LoadingState = { isLoading: false }) {
  const loadingState = ref<LoadingState>(initialState)
  
  const startLoading = (text?: string, variant: LoadingState['loadingVariant'] = 'primary') => {
    loadingState.value = {
      isLoading: true,
      loadingText: text,
      loadingVariant: variant
    }
  }
  
  const stopLoading = () => {
    loadingState.value = {
      isLoading: false,
      loadingText: undefined,
      loadingVariant: undefined
    }
  }
  
  const withLoading = async <T>(
    asyncFn: () => Promise<T>,
    loadingText?: string,
    variant: LoadingState['loadingVariant'] = 'primary'
  ): Promise<T> => {
    startLoading(loadingText, variant)
    try {
      return await asyncFn()
    } finally {
      stopLoading()
    }
  }
  
  return { loadingState, startLoading, stopLoading, withLoading }
}
```

### useErrorHandler - Обработка ошибок
```typescript
export function useErrorHandler() {
  const handleFormError = (error: any) => {
    return ErrorHandlers.formValidation(error)
  }
  
  const handleApiError = (error: any, context?: ErrorContext) => {
    const parsedError = parseApiError(error, context)
    
    if (parsedError.displayConfig.showToast) {
      const ui = useUiStore()
      ui.toast({
        type: parsedError.displayConfig.toastType,
        text: parsedError.detail
      })
    }
    
    if (parsedError.displayConfig.logToConsole) {
      console.error('API Error:', parsedError)
    }
    
    return parsedError
  }
  
  const handleApiErrorAsync = async (error: any, context?: ErrorContext) => {
    return handleApiError(error, context)
  }
  
  return {
    handleFormError,
    handleApiError,
    handleApiErrorAsync
  }
}
```

### useExport - Экспорт данных
```typescript
export function useExport() {
  const exportToCSV = (data: any[], filename: string) => {
    const csv = convertToCSV(data)
    downloadFile(csv, `${filename}.csv`, 'text/csv')
  }
  
  const exportToExcel = (data: any[], filename: string) => {
    const workbook = convertToExcel(data)
    downloadFile(workbook, `${filename}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  }
  
  const exportToPDF = (data: any[], filename: string) => {
    const pdf = convertToPDF(data)
    downloadFile(pdf, `${filename}.pdf`, 'application/pdf')
  }
  
  const exportData = async (format: 'csv' | 'excel' | 'pdf', data: any[], filename: string) => {
    switch (format) {
      case 'csv':
        exportToCSV(data, filename)
        break
      case 'excel':
        exportToExcel(data, filename)
        break
      case 'pdf':
        exportToPDF(data, filename)
        break
    }
  }
  
  return {
    exportToCSV,
    exportToExcel,
    exportToPDF,
    exportData
  }
}
```

### useDebounce - Debounce функции
```typescript
export function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T {
  let timeoutId: NodeJS.Timeout | null = null
  
  return ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = setTimeout(() => {
      fn(...args)
    }, delay)
  }) as T
}
```

### useThrottle - Throttle функции
```typescript
export function useThrottle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T {
  let lastCall = 0
  
  return ((...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      fn(...args)
    }
  }) as T
}
```

### useMobile - Мобильные утилиты
```typescript
export function useMobile() {
  const isMobile = ref(false)
  const isTablet = ref(false)
  const isDesktop = ref(false)
  
  const checkDevice = () => {
    const width = window.innerWidth
    isMobile.value = width < 768
    isTablet.value = width >= 768 && width < 1024
    isDesktop.value = width >= 1024
  }
  
  onMounted(() => {
    checkDevice()
    window.addEventListener('resize', checkDevice)
  })
  
  onUnmounted(() => {
    window.removeEventListener('resize', checkDevice)
  })
  
  return {
    isMobile,
    isTablet,
    isDesktop
  }
}
```

### usePagination
```typescript
export function usePagination(pagination: PaginationState, config: PaginationConfig = {}) {
  const totalPages = computed(() => Math.ceil(pagination.count / pagination.pageSize))
  const hasNext = computed(() => pagination.page < totalPages.value)
  const hasPrevious = computed(() => pagination.page > 1)
  
  const startItem = computed(() => (pagination.page - 1) * pagination.pageSize + 1)
  const endItem = computed(() => Math.min(pagination.page * pagination.pageSize, pagination.count))
  
  const visiblePages = computed(() => {
    const maxVisible = config.maxVisiblePages || 5
    const current = pagination.page
    const total = totalPages.value
    
    if (total <= maxVisible) {
      return Array.from({ length: total }, (_, i) => i + 1)
    }
    
    const half = Math.floor(maxVisible / 2)
    let start = Math.max(1, current - half)
    let end = Math.min(total, start + maxVisible - 1)
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  })
  
  return {
    totalPages,
    hasNext,
    hasPrevious,
    startItem,
    endItem,
    visiblePages
  }
}
```

## Утилиты

### errorHandler.ts - Обработка ошибок
```typescript
export class ErrorHandlers {
  static formValidation(error: any): {
    detail: string
    fieldErrors: Record<string, string>
    hasErrors: boolean
  } {
    const fieldErrors: Record<string, string> = {}
    let detail = 'Произошла ошибка'
    
    if (error.response?.data) {
      const data = error.response.data
      
      // Обработка ошибок полей
      Object.keys(data).forEach(field => {
        if (Array.isArray(data[field])) {
          fieldErrors[field] = data[field][0]
        } else if (typeof data[field] === 'string') {
          fieldErrors[field] = data[field]
        }
      })
      
      // Общая ошибка
      if (data.detail) {
        detail = data.detail
      } else if (data.non_field_errors) {
        detail = Array.isArray(data.non_field_errors) 
          ? data.non_field_errors[0] 
          : data.non_field_errors
      }
    } else if (error.message) {
      detail = error.message
    }
    
    return {
      detail,
      fieldErrors,
      hasErrors: Object.keys(fieldErrors).length > 0 || detail !== 'Произошла ошибка'
    }
  }
  
  static dataLoading(error: any): void {
    const ui = useUiStore()
    const errorResult = this.formValidation(error)
    ui.toast({ type: 'error', text: errorResult.detail })
  }
}

/**
 * Парсит вложенные ошибки валидации
 * Обрабатывает структуры типа items[0].material, items[1].quantity и т.д.
 */
function parseNestedErrors(errors: any): Record<string, string[]> {
  const result: Record<string, string[]> = {}
  
  for (const [key, value] of Object.entries(errors)) {
    if (Array.isArray(value)) {
      // Обрабатываем массивы (например, items)
      value.forEach((item, index) => {
        if (typeof item === 'object' && item !== null) {
          // Обрабатываем объекты в массиве
          for (const [fieldKey, fieldErrors] of Object.entries(item)) {
            if (Array.isArray(fieldErrors)) {
              const nestedKey = `${key}[${index}].${fieldKey}`
              result[nestedKey] = fieldErrors as string[]
            }
          }
        } else if (typeof item === 'string') {
          // Простые строки в массиве
          result[`${key}[${index}]`] = [item]
        }
      })
    } else if (typeof value === 'object' && value !== null) {
      // Обрабатываем объекты
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        if (Array.isArray(nestedValue)) {
          result[`${key}.${nestedKey}`] = nestedValue as string[]
        }
      }
    } else if (Array.isArray(value)) {
      // Простые массивы строк
      result[key] = value as string[]
    } else if (typeof value === 'string') {
      // Простые строки
      result[key] = [value]
    }
  }
  
  return result
}
```

### formatters.ts - Форматирование данных
```typescript
export function formatCurrency(amount: number, currency: string = 'UZS'): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return new Intl.DateTimeFormat('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(d)
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date)
  return new Intl.DateTimeFormat('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value)
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function formatQuantity(quantity: number, unit: string): string {
  return `${formatNumber(quantity)} ${unit}`
}

export function getStatusClass(status: string): string {
  const statusClasses: Record<string, string> = {
    'new': 'badge-info',
    'in_progress': 'badge-warning',
    'completed': 'badge-success',
    'cancelled': 'badge-error',
    'pending': 'badge-warning',
    'approved': 'badge-success',
    'rejected': 'badge-error'
  }
  return statusClasses[status] || 'badge-neutral'
}

export function getStatusText(status: string): string {
  const statusTexts: Record<string, string> = {
    'new': 'Новая',
    'in_progress': 'В работе',
    'completed': 'Выполнено',
    'cancelled': 'Отменено',
    'pending': 'Ожидает',
    'approved': 'Одобрено',
    'rejected': 'Отклонено'
  }
  return statusTexts[status] || status
}
```

### debounce.ts - Debounce функции
```typescript
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
): T {
  let timeout: NodeJS.Timeout | null = null
  
  return ((...args: Parameters<T>) => {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }
    
    const callNow = immediate && !timeout
    
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    
    if (callNow) func(...args)
  }) as T
}
```

### throttle.ts - Throttle функции
```typescript
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T {
  let inThrottle: boolean
  
  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }) as T
}
```

### unitRounding.ts - Умное округление единиц измерения
```typescript
export function roundUnit(quantity: number, unit: string): { quantity: number; unit: string } {
  const unitConversions: Record<string, { factor: number; newUnit: string }> = {
    'шт': { factor: 1, newUnit: 'шт' },
    'кг': { factor: 1, newUnit: 'кг' },
    'г': { factor: 1000, newUnit: 'кг' },
    'м': { factor: 1, newUnit: 'м' },
    'см': { factor: 100, newUnit: 'м' },
    'мм': { factor: 1000, newUnit: 'м' },
    'л': { factor: 1, newUnit: 'л' },
    'мл': { factor: 1000, newUnit: 'л' }
  }
  
  const conversion = unitConversions[unit]
  if (!conversion) {
    return { quantity, unit }
  }
  
  const convertedQuantity = quantity / conversion.factor
  
  // Округляем до разумного количества знаков после запятой
  const roundedQuantity = Math.round(convertedQuantity * 1000) / 1000
  
  return {
    quantity: roundedQuantity,
    unit: conversion.newUnit
  }
}
```

### browserSupport.ts - Поддержка браузеров
```typescript
export function checkBrowserSupport(): {
  isSupported: boolean
  missingFeatures: string[]
} {
  const missingFeatures: string[] = []
  
  // Проверка поддержки современных JavaScript функций
  if (!window.fetch) missingFeatures.push('fetch')
  if (!window.Promise) missingFeatures.push('Promise')
  if (!window.Map) missingFeatures.push('Map')
  if (!window.Set) missingFeatures.push('Set')
  if (!window.Array.from) missingFeatures.push('Array.from')
  if (!window.Array.includes) missingFeatures.push('Array.includes')
  
  // Проверка поддержки CSS Grid
  if (!CSS.supports('display', 'grid')) missingFeatures.push('CSS Grid')
  
  // Проверка поддержки CSS Flexbox
  if (!CSS.supports('display', 'flex')) missingFeatures.push('CSS Flexbox')
  
  return {
    isSupported: missingFeatures.length === 0,
    missingFeatures
  }
}
```

### polyfills.ts - Полифиллы
```typescript
// Полифилл для Array.includes
if (!Array.prototype.includes) {
  Array.prototype.includes = function(searchElement: any, fromIndex?: number): boolean {
    return this.indexOf(searchElement, fromIndex) !== -1
  }
}

// Полифилл для Array.from
if (!Array.from) {
  Array.from = function<T>(arrayLike: ArrayLike<T> | Iterable<T>): T[] {
    return Array.prototype.slice.call(arrayLike)
  }
}

// Полифилл для Object.assign
if (!Object.assign) {
  Object.assign = function(target: any, ...sources: any[]): any {
    sources.forEach(source => {
      Object.keys(source).forEach(key => {
        target[key] = source[key]
      })
    })
    return target
  }
}
```

### router.ts - Утилиты роутинга
```typescript
export function generateNavigation(routes: RouteRecordNormalized[]): NavigationItem[] {
  return routes
    .filter(route => route.meta?.showInNavigation)
    .map(route => ({
      name: route.name as string,
      path: route.path,
      label: route.meta?.label || route.name as string,
      icon: route.meta?.icon,
      category: route.meta?.category || 'default',
      order: route.meta?.order || 0,
      permissions: route.meta?.permissions || []
    }))
    .sort((a, b) => a.order - b.order)
}

export function getBreadcrumbs(route: RouteLocationNormalized): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = []
  const matched = route.matched
  
  matched.forEach(match => {
    if (match.meta?.breadcrumb) {
      breadcrumbs.push({
        label: match.meta.breadcrumb.label,
        path: match.path,
        active: match.path === route.path
      })
    }
  })
  
  return breadcrumbs
}

export function hasRouteAccess(route: RouteRecordNormalized, userRole: string): boolean {
  const requiredPermissions = route.meta?.permissions || []
  if (requiredPermissions.length === 0) return true
  
  return requiredPermissions.includes(userRole)
}

export function getAccessibleRoutes(routes: RouteRecordNormalized[], userRole: string): RouteRecordNormalized[] {
  return routes.filter(route => hasRouteAccess(route, userRole))
}

export function findRouteByName(routes: RouteRecordNormalized[], name: string): RouteRecordNormalized | undefined {
  return routes.find(route => route.name === name)
}

export function getCategoryIcon(category: string): string {
  const categoryIcons: Record<string, string> = {
    'materials': 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
    'purchases': 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    'reports': 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    'settings': 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z'
  }
  return categoryIcons[category] || 'M4 6h16M4 10h16M4 14h16M4 18h16'
}

export function getRoutePermissions(route: RouteRecordNormalized): string[] {
  return route.meta?.permissions || []
}
```

## Темная тема

### Theme Store
```typescript
export const useThemeStore = defineStore('theme', () => {
  const theme = ref<Theme>('system')
  
  const setTheme = (newTheme: Theme) => {
    theme.value = newTheme
    applyTheme(newTheme)
    localStorage.setItem('theme', newTheme)
  }
  
  const toggleTheme = () => {
    const newTheme = theme.value === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
  }
  
  const applyTheme = (newTheme: Theme) => {
    const isDark = newTheme === 'dark' || (newTheme === 'system' && getSystemTheme())
    document.documentElement.classList.toggle('dark', isDark)
  }
  
  return { theme, setTheme, toggleTheme }
})
```

### CSS переменные для тем
```css
:root {
  --color-primary: 59 130 246;
  --color-secondary: 107 114 128;
  --color-success: 34 197 94;
  --color-warning: 245 158 11;
  --color-error: 239 68 68;
}

:root.dark {
  --color-primary: 96 165 250;
  --color-secondary: 156 163 175;
  --color-success: 74 222 128;
  --color-warning: 251 191 36;
  --color-error: 248 113 113;
}
```

## Производительность

### Ленивая загрузка компонентов
```typescript
// Lazy loading в роутере
const MaterialsList = () => import('@/pages/Materials/List.vue')
const MaterialForm = () => import('@/pages/Materials/MaterialForm.vue')
const PurchaseInfo = () => import('@/pages/Purchases/PurchaseInfo.vue')
```

### Виртуализация списков
```vue
<template>
  <div class="virtual-list" :style="{ height: containerHeight + 'px' }">
    <div class="virtual-list-content" :style="{ transform: `translateY(${offsetY}px)` }">
      <div
        v-for="item in visibleItems"
        :key="item.id"
        class="virtual-list-item"
        :style="{ height: itemHeight + 'px' }"
      >
        <slot :item="item" />
      </div>
    </div>
  </div>
</template>
```

### Кэширование данных
```typescript
// Кэширование в stores
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 минут

const getCachedData = (key: string) => {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  return null
}
```

### Оптимизация изображений
```typescript
// Ленивая загрузка изображений
export function useLazyImage(src: string) {
  const imageRef = ref<HTMLImageElement>()
  const isLoaded = ref(false)
  const isError = ref(false)
  
  const loadImage = () => {
    if (imageRef.value) {
      imageRef.value.src = src
      imageRef.value.onload = () => isLoaded.value = true
      imageRef.value.onerror = () => isError.value = true
    }
  }
  
  onMounted(() => {
    // Intersection Observer для ленивой загрузки
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          loadImage()
          observer.unobserve(entry.target)
        }
      })
    })
    
    if (imageRef.value) {
      observer.observe(imageRef.value)
    }
  })
  
  return { imageRef, isLoaded, isError }
}
```

### Мемоизация вычислений
```typescript
// Мемоизация тяжелых вычислений
export function useMemoizedComputation<T>(
  computation: () => T,
  dependencies: Ref<any>[]
): ComputedRef<T> {
  const cache = new Map<string, T>()
  
  return computed(() => {
    const key = dependencies.map(dep => dep.value).join('|')
    
    if (cache.has(key)) {
      return cache.get(key)!
    }
    
    const result = computation()
    cache.set(key, result)
    
    // Ограничиваем размер кэша
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value
      cache.delete(firstKey)
    }
    
    return result
  })
}
```

### Оптимизация рендеринга
```typescript
// Виртуализация для больших списков
export function useVirtualization<T>(
  items: Ref<T[]>,
  itemHeight: number,
  containerHeight: number
) {
  const scrollTop = ref(0)
  
  const visibleItems = computed(() => {
    const startIndex = Math.floor(scrollTop.value / itemHeight)
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.value.length
    )
    
    return items.value.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index
    }))
  })
  
  const offsetY = computed(() => scrollTop.value)
  
  const handleScroll = (event: Event) => {
    const target = event.target as HTMLElement
    scrollTop.value = target.scrollTop
  }
  
  return {
    visibleItems,
    offsetY,
    handleScroll
  }
}
```

### Оптимизация сети
```typescript
// Batch запросы для уменьшения количества HTTP запросов
export function useBatchRequests<T>(
  requests: Ref<(() => Promise<T>)[]>,
  batchSize: number = 5
) {
  const results = ref<T[]>([])
  const loading = ref(false)
  
  const executeBatch = async () => {
    loading.value = true
    
    try {
      const batches = []
      for (let i = 0; i < requests.value.length; i += batchSize) {
        const batch = requests.value.slice(i, i + batchSize)
        batches.push(Promise.all(batch.map(request => request())))
      }
      
      const batchResults = await Promise.all(batches)
      results.value = batchResults.flat()
    } finally {
      loading.value = false
    }
  }
  
  return {
    results,
    loading,
    executeBatch
  }
}
```

### Оптимизация памяти
```typescript
// Очистка памяти для больших объектов
export function useMemoryOptimization() {
  const cleanup = () => {
    // Очистка кэшей
    if (window.gc) {
      window.gc()
    }
    
    // Очистка неиспользуемых ссылок
    const unusedElements = document.querySelectorAll('[data-unused="true"]')
    unusedElements.forEach(el => el.remove())
  }
  
  // Периодическая очистка памяти
  const interval = setInterval(cleanup, 60000) // Каждую минуту
  
  onUnmounted(() => {
    clearInterval(interval)
    cleanup()
  })
  
  return { cleanup }
}
```

## Типы полей FormField

### Поддерживаемые типы полей (14 типов)

```typescript
type FieldType = 
  | 'input'        // Текстовое поле
  | 'textarea'     // Многострочное поле
  | 'select'       // Выпадающий список
  | 'date'         // Поле даты
  | 'number'       // Числовое поле
  | 'checkbox'     // Чекбокс
  | 'file'         // Загрузка файлов
  | 'multiselect'  // Множественный выбор
  | 'password'     // Поле пароля
  | 'email'        // Поле email
  | 'text'         // Текстовое поле (алиас для input)
  | 'switch'       // Переключатель
  | 'search'       // Поле поиска с иконкой
  | 'custom'       // Кастомное поле через слот
```

### Примеры использования

```typescript
// Базовые поля
{ key: 'name', type: 'input', label: 'Название', required: true }
{ key: 'description', type: 'textarea', label: 'Описание', rows: 4 }
{ key: 'category', type: 'select', label: 'Категория', options: categoryOptions }

// Специальные поля
{ key: 'date', type: 'date', label: 'Дата' }
{ key: 'price', type: 'number', label: 'Цена', step: 0.01 }
{ key: 'is_active', type: 'checkbox', label: 'Активен', checkboxLabel: 'Материал активен' }
{ key: 'photo', type: 'file', label: 'Фото', accept: 'image/*' }

// Поля с валидацией
{ 
  key: 'email', 
  type: 'email', 
  label: 'Email',
  validation: { 
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value) => value.includes('@') ? null : 'Неверный email'
  }
}

// Кастомные поля
{ key: 'items', type: 'custom', label: 'Позиции', width: 'full' }
```

### Валидация полей

```typescript
interface FieldValidation {
  min?: number           // Минимальное значение
  max?: number           // Максимальное значение
  minLength?: number     // Минимальная длина
  maxLength?: number     // Максимальная длина
  pattern?: RegExp       // Регулярное выражение
  step?: number          // Шаг для числовых полей
  custom?: (value: any) => string | null  // Кастомная валидация
}
```

## Тестирование

### Unit тесты компонентов
```typescript
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import FormField from '@/components/FormField.vue'

describe('FormField', () => {
  it('renders label correctly', () => {
    const wrapper = mount(FormField, {
      props: { label: 'Test Label', modelValue: '' }
    })
    
    expect(wrapper.find('.label-text').text()).toBe('Test Label')
  })
  
  it('emits update:modelValue on input', async () => {
    const wrapper = mount(FormField, {
      props: { modelValue: '' }
    })
    
    await wrapper.find('input').setValue('test value')
    
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['test value'])
  })
})
```

### Тесты валидации ошибок
```typescript
import { describe, it, expect } from 'vitest'
import { parseNestedErrors } from '@/utils/errorHandler'

describe('parseNestedErrors', () => {
  it('should parse simple field errors', () => {
    const errors = {
      name: ['Это поле обязательно'],
      email: ['Введите корректный email']
    }
    
    const result = parseNestedErrors(errors)
    
    expect(result).toEqual({
      name: ['Это поле обязательно'],
      email: ['Введите корректный email']
    })
  })
  
  it('should parse nested array errors', () => {
    const errors = {
      items: [
        { material: ['Это поле обязательно'] },
        { quantity: ['Количество должно быть больше 0'] }
      ]
    }
    
    const result = parseNestedErrors(errors)
    
    expect(result).toEqual({
      'items[0].material': ['Это поле обязательно'],
      'items[1].quantity': ['Количество должно быть больше 0']
    })
  })
  
  it('should parse complex nested errors', () => {
    const errors = {
      items: [
        { material: ['Это поле обязательно'], quantity: ['Количество должно быть больше 0'] },
        { material: ['Нельзя добавлять один материал несколько раз'] }
      ],
      object: { name: ['Объект не найден'] }
    }
    
    const result = parseNestedErrors(errors)
    
    expect(result).toEqual({
      'items[0].material': ['Это поле обязательно'],
      'items[0].quantity': ['Количество должно быть больше 0'],
      'items[1].material': ['Нельзя добавлять один материал несколько раз'],
      'object.name': ['Объект не найден']
    })
  })
})
```

### Тесты совместимости браузеров
```typescript
import { describe, it, expect } from 'vitest'
import { checkBrowserSupport } from '@/utils/browserSupport'

describe('Browser Support', () => {
  it('should detect supported browser', () => {
    // Mock modern browser features
    global.window.fetch = jest.fn()
    global.window.Promise = Promise
    global.window.Map = Map
    global.window.Set = Set
    global.Array.from = Array.from
    global.Array.prototype.includes = Array.prototype.includes
    
    const result = checkBrowserSupport()
    
    expect(result.isSupported).toBe(true)
    expect(result.missingFeatures).toEqual([])
  })
  
  it('should detect missing features', () => {
    // Mock old browser without modern features
    delete global.window.fetch
    delete global.window.Promise
    delete global.window.Map
    delete global.window.Set
    delete global.Array.from
    delete global.Array.prototype.includes
    
    const result = checkBrowserSupport()
    
    expect(result.isSupported).toBe(false)
    expect(result.missingFeatures).toContain('fetch')
    expect(result.missingFeatures).toContain('Promise')
    expect(result.missingFeatures).toContain('Map')
    expect(result.missingFeatures).toContain('Set')
    expect(result.missingFeatures).toContain('Array.from')
    expect(result.missingFeatures).toContain('Array.includes')
  })
})
```

### E2E тесты
```typescript
import { test, expect } from '@playwright/test'

test('materials list page', async ({ page }) => {
  await page.goto('/materials')
  
  await expect(page.locator('h1')).toContainText('Материалы')
  await expect(page.locator('.modern-table')).toBeVisible()
  
  await page.click('button:has-text("Новый материал")')
  await expect(page).toHaveURL('/materials/create')
})

test('purchase form validation', async ({ page }) => {
  await page.goto('/purchases/create')
  
  // Try to submit empty form
  await page.click('button[type="submit"]')
  
  // Check for validation errors
  await expect(page.locator('.input-error')).toBeVisible()
  await expect(page.locator('.alert-error')).toBeVisible()
})

test('mobile navigation', async ({ page }) => {
  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 667 })
  
  await page.goto('/materials')
  
  // Check mobile navigation is visible
  await expect(page.locator('.mobile-navigation')).toBeVisible()
  
  // Check desktop navigation is hidden
  await expect(page.locator('.desktop-navigation')).not.toBeVisible()
})
```

### Тесты производительности
```typescript
import { describe, it, expect } from 'vitest'
import { measurePerformance } from '@/test/utils'

describe('Performance Tests', () => {
  it('should render large lists efficiently', () => {
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      description: `Description for item ${i}`
    }))
    
    const renderTime = measurePerformance(() => {
      // Render large list component
      const component = mount(LargeList, {
        props: { items: largeDataset }
      })
    })
    
    expect(renderTime).toBeLessThan(100) // Should render in less than 100ms
  })
  
  it('should handle debounced search efficiently', () => {
    const debouncedSearch = debounce((query: string) => {
      // Simulate search
      console.log(`Searching for: ${query}`)
    }, 300)
    
    const startTime = performance.now()
    
    // Simulate rapid typing
    for (let i = 0; i < 10; i++) {
      debouncedSearch(`query${i}`)
    }
    
    const endTime = performance.now()
    const totalTime = endTime - startTime
    
    expect(totalTime).toBeLessThan(50) // Should complete quickly
  })
})
```

## Сборка и развертывание

### Vite конфигурация
```typescript
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          ui: ['@headlessui/vue', '@heroicons/vue']
        }
      }
    }
  }
})
```

### Environment переменные
```bash
# .env.development
VITE_API_URL=http://localhost:8000/api/v1
VITE_APP_TITLE=ELOM Development

# .env.production
VITE_API_URL=https://api.elom.com/v1
VITE_APP_TITLE=ELOM
```

## Мониторинг и аналитика

### Обработка ошибок
```typescript
// Глобальный обработчик ошибок
app.config.errorHandler = (err, instance, info) => {
  console.error('Vue error:', err, info)
  // Отправка в систему мониторинга
  if (import.meta.env.PROD) {
    // Sentry.captureException(err)
  }
}
```

### Производительность
```typescript
// Измерение производительности
const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now()
  fn()
  const end = performance.now()
  console.log(`${name} took ${end - start} milliseconds`)
}
```

### Мониторинг производительности
```typescript
// Web Vitals мониторинг
export function useWebVitals() {
  const vitals = ref({
    FCP: 0, // First Contentful Paint
    LCP: 0, // Largest Contentful Paint
    FID: 0, // First Input Delay
    CLS: 0, // Cumulative Layout Shift
    TTFB: 0 // Time to First Byte
  })
  
  const measureVitals = () => {
    // FCP
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          vitals.value.FCP = entry.startTime
        }
      }
    }).observe({ entryTypes: ['paint'] })
    
    // LCP
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      vitals.value.LCP = lastEntry.startTime
    }).observe({ entryTypes: ['largest-contentful-paint'] })
    
    // FID
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        vitals.value.FID = entry.processingStart - entry.startTime
      }
    }).observe({ entryTypes: ['first-input'] })
    
    // CLS
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          vitals.value.CLS += entry.value
        }
      }
    }).observe({ entryTypes: ['layout-shift'] })
  }
  
  onMounted(() => {
    measureVitals()
  })
  
  return { vitals }
}
```

### Аналитика пользователей
```typescript
// Отслеживание действий пользователей
export function useAnalytics() {
  const trackEvent = (eventName: string, properties?: Record<string, any>) => {
    if (import.meta.env.PROD) {
      // Google Analytics
      gtag('event', eventName, properties)
      
      // Custom analytics
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: eventName,
          properties,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      })
    }
  }
  
  const trackPageView = (pageName: string) => {
    trackEvent('page_view', { page: pageName })
  }
  
  const trackFormSubmit = (formName: string, success: boolean) => {
    trackEvent('form_submit', { form: formName, success })
  }
  
  const trackButtonClick = (buttonName: string, context?: string) => {
    trackEvent('button_click', { button: buttonName, context })
  }
  
  return {
    trackEvent,
    trackPageView,
    trackFormSubmit,
    trackButtonClick
  }
}
```

### Мониторинг ошибок
```typescript
// Централизованный мониторинг ошибок
export function useErrorMonitoring() {
  const reportError = (error: Error, context?: Record<string, any>) => {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: getCurrentUserId()
    }
    
    // Отправка в систему мониторинга
    if (import.meta.env.PROD) {
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorReport)
      }).catch(console.error)
    } else {
      console.error('Error Report:', errorReport)
    }
  }
  
  const reportApiError = (error: any, endpoint: string) => {
    reportError(new Error(`API Error: ${endpoint}`), {
      endpoint,
      status: error.response?.status,
      data: error.response?.data
    })
  }
  
  const reportValidationError = (errors: Record<string, string[]>, formName: string) => {
    reportError(new Error(`Validation Error: ${formName}`), {
      form: formName,
      errors
    })
  }
  
  return {
    reportError,
    reportApiError,
    reportValidationError
  }
}
```

### Мониторинг производительности API
```typescript
// Мониторинг времени ответа API
export function useApiMonitoring() {
  const apiMetrics = ref({
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    slowRequests: 0
  })
  
  const trackApiCall = async <T>(
    apiCall: () => Promise<T>,
    endpoint: string
  ): Promise<T> => {
    const startTime = performance.now()
    apiMetrics.value.totalRequests++
    
    try {
      const result = await apiCall()
      const endTime = performance.now()
      const responseTime = endTime - startTime
      
      apiMetrics.value.successfulRequests++
      apiMetrics.value.averageResponseTime = 
        (apiMetrics.value.averageResponseTime + responseTime) / 2
      
      if (responseTime > 1000) {
        apiMetrics.value.slowRequests++
      }
      
      return result
    } catch (error) {
      apiMetrics.value.failedRequests++
      throw error
    }
  }
  
  return {
    apiMetrics,
    trackApiCall
  }
}
```

### Мониторинг использования памяти
```typescript
// Мониторинг использования памяти
export function useMemoryMonitoring() {
  const memoryUsage = ref({
    used: 0,
    total: 0,
    percentage: 0
  })
  
  const checkMemoryUsage = () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      memoryUsage.value = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
      }
    }
  }
  
  const startMonitoring = () => {
    checkMemoryUsage()
    const interval = setInterval(checkMemoryUsage, 5000) // Каждые 5 секунд
    
    onUnmounted(() => {
      clearInterval(interval)
    })
  }
  
  return {
    memoryUsage,
    checkMemoryUsage,
    startMonitoring
  }
}
```

### Мониторинг сетевых запросов
```typescript
// Мониторинг сетевых запросов
export function useNetworkMonitoring() {
  const networkMetrics = ref({
    online: navigator.onLine,
    connectionType: 'unknown',
    downlink: 0,
    rtt: 0
  })
  
  const updateNetworkInfo = () => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      networkMetrics.value = {
        online: navigator.onLine,
        connectionType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0
      }
    }
  }
  
  const startMonitoring = () => {
    updateNetworkInfo()
    
    window.addEventListener('online', updateNetworkInfo)
    window.addEventListener('offline', updateNetworkInfo)
    
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      connection.addEventListener('change', updateNetworkInfo)
    }
    
    onUnmounted(() => {
      window.removeEventListener('online', updateNetworkInfo)
      window.removeEventListener('offline', updateNetworkInfo)
      
      if ('connection' in navigator) {
        const connection = (navigator as any).connection
        connection.removeEventListener('change', updateNetworkInfo)
      }
    })
  }
  
  return {
    networkMetrics,
    updateNetworkInfo,
    startMonitoring
  }
}
```

## Заключение

### Ключевые особенности архитектуры

1. **Модульность**: Каждый компонент, composable и утилита имеет четко определенную ответственность
2. **Переиспользуемость**: Универсальные компоненты (GenericForm, GenericList) могут быть использованы в любом контексте
3. **Типизация**: Полная типизация TypeScript обеспечивает безопасность разработки
4. **Производительность**: Оптимизации включают ленивую загрузку, виртуализацию и кэширование
5. **Адаптивность**: Полная поддержка мобильных устройств с автоматическим переключением между таблицами и карточками
6. **Доступность**: ARIA атрибуты и семантический HTML для улучшения доступности
7. **Тестируемость**: Комплексная система тестирования с unit, integration и e2e тестами

### Технологический стек

- **Vue 3.4+** с Composition API для реактивности
- **TypeScript 5.3+** для строгой типизации
- **Pinia 2.1+** для управления состоянием
- **Tailwind CSS 3.4+** для стилизации
- **DaisyUI 4.4+** для UI компонентов
- **Vite 5.0+** для быстрой разработки
- **Vitest** для unit тестирования
- **Playwright** для e2e тестирования

### Производительность

- **Ленивая загрузка** компонентов и изображений
- **Виртуализация** для больших списков
- **Кэширование** данных и вычислений
- **Оптимизация** сети и памяти
- **Мониторинг** производительности в реальном времени

### Безопасность

- **Валидация** данных на клиенте и сервере
- **Обработка ошибок** с централизованным мониторингом
- **Аутентификация** и авторизация
- **Защита** от XSS и CSRF атак

### Масштабируемость

- **Модульная архитектура** позволяет легко добавлять новые функции
- **Универсальные компоненты** сокращают дублирование кода
- **Composables** обеспечивают переиспользование логики
- **Stores** централизуют управление состоянием

### Поддержка

- **Документация** для всех компонентов и API
- **Тесты** обеспечивают стабильность
- **Мониторинг** помогает выявлять проблемы
- **Логирование** для отладки и анализа

Эта архитектура обеспечивает высокую производительность, масштабируемость и удобство разработки, делая ELOM современным и эффективным приложением для управления закупками.

