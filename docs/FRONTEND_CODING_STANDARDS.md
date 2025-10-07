# Стандарты кодирования Frontend

**Дата:** 3 октября 2025  
**Версия:** 1.0  
**Статус:** Актуально

## Обзор

Документ описывает стандарты кодирования для frontend части проекта ELOM, включая правильные способы импорта, объявления stores, использования CSS классов и другие важные аспекты.

## 1. Импорт API

### ✅ **Правильный способ импорта API:**

```typescript
// ✅ Правильно - default import
import api from '@/api/client'

// Использование
const response = await api.get('/api/v1/endpoint')
```

### ❌ **Неправильный способ:**

```typescript
// ❌ Неправильно - деструктурированный импорт
import { api } from '@/api/client'
```

## 2. Объявление Pinia Stores

### ✅ **Правильное объявление stores:**

```typescript
// ✅ Правильно - без вызова функции
const objectsStore = useObjectsStore
const materialsStore = useMaterialsStore
const authStore = useAuthStore

// Использование
const objects = computed(() => objectsStore.items)
await objectsStore.fetchList()
```

### ❌ **Неправильное объявление:**

```typescript
// ❌ Неправильно - с вызовом функции
const objectsStore = useObjectsStore()
const materialsStore = useMaterialsStore()
const authStore = useAuthStore()
```

## 3. CSS Classes (без @apply)

### ✅ **Правильный подход - классы напрямую в HTML:**

```vue
<template>
  <!-- ✅ Правильно -->
  <div class="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <!-- content -->
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ✅ Можно использовать только для кастомных стилей */
.custom-component {
  /* кастомные стили */
}
</style>
```

### ❌ **Неправильный подход - @apply директивы:**

```vue
<template>
  <!-- ❌ Неправильно -->
  <div class="container">
    <!-- content -->
  </div>
</template>

<style scoped>
/* ❌ Не использовать @apply */
.container {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6;
}

.grid-container {
  @apply grid grid-cols-1 md:grid-cols-3 gap-4;
}
</style>
```

## 4. Импорт Composables

### ✅ **Правильный способ импорта composables:**

```typescript
// ✅ Правильно - деструктурированный импорт для composables
import { useErrorHandler } from '@/composables/useErrorHandler'
import { usePagination } from '@/composables/usePagination'
import { useFilters } from '@/composables/useFilters'

// Использование
const { handleLoadingError } = useErrorHandler()
const { pagination, updatePagination } = usePagination()
const { filters, updateFilters } = useFilters()
```

## 5. Импорт Types

### ✅ **Правильный способ импорта типов:**

```typescript
// ✅ Правильно - type import
import type { BalancesByObjectsResponse, ObjectBalance, MaterialBalance } from '@/api/types'
import type { GenericListConfig } from '@/types/generic'
import type { UserRole } from '@/api/types/common'
```

## 6. Импорт Utils

### ✅ **Правильный способ импорта утилит:**

```typescript
// ✅ Правильно - named import для утилит
import { formatDate } from '@/utils/formatters'
import { formatCurrency } from '@/utils/formatters'
import { exportToCSV, exportToExcel } from '@/utils/export'
```

## 7. Импорт Endpoints

### ✅ **Правильный способ импорта endpoints:**

```typescript
// ✅ Правильно - named import для endpoints
import { endpoints } from '@/api/endpoints'

// Использование
const response = await api.get(`${endpoints.stockSnapshots.byObjects}?${params}`)
```

## 8. Структура Vue компонента

### ✅ **Правильная структура:**

```vue
<template>
  <div class="component-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Заголовок
      </h1>
    </div>

    <!-- Content -->
    <div class="space-y-4">
      <!-- content -->
    </div>
  </div>
</template>

<script setup lang="ts">
// 1. Vue imports
import { ref, onMounted, computed } from 'vue'

// 2. Composables
import { useErrorHandler } from '@/composables/useErrorHandler'

// 3. Stores (без вызова функции)
const objectsStore = useObjectsStore
const materialsStore = useMaterialsStore

// 4. Utils
import { formatDate } from '@/utils/formatters'

// 5. API
import api from '@/api/client'
import { endpoints } from '@/api/endpoints'

// 6. Types
import type { SomeType } from '@/api/types'

// 7. State
const loading = ref(false)
const data = ref<SomeType[]>([])

// 8. Computed
const filteredData = computed(() => {
  return data.value.filter(item => item.active)
})

// 9. Methods
async function loadData() {
  loading.value = true
  try {
    const response = await api.get(endpoints.someEndpoint)
    data.value = response.data
  } catch (error) {
    await handleLoadingError(error, 'data')
  } finally {
    loading.value = false
  }
}

// 10. Lifecycle
onMounted(async () => {
  await loadData()
})
</script>

<style scoped>
/* Только кастомные стили, без @apply */
</style>
```

## 9. Обработка ошибок

### ✅ **Правильный способ обработки ошибок:**

```typescript
import { useErrorHandler } from '@/composables/useErrorHandler'

const { handleLoadingError } = useErrorHandler()

async function loadData() {
  try {
    const response = await api.get('/api/endpoint')
    data.value = response.data
  } catch (error) {
    await handleLoadingError(error, 'data')
  }
}
```

## 10. Использование Stores

### ✅ **Правильное использование stores:**

```typescript
// Объявление (без вызова функции)
const objectsStore = useObjectsStore
const materialsStore = useMaterialsStore

// Computed свойства
const objects = computed(() => objectsStore.items)
const materials = computed(() => materialsStore.items)

// Методы
async function loadData() {
  await Promise.all([
    objectsStore.fetchList({ page_size: 1000 } as any),
    materialsStore.fetchList({ page_size: 1000 } as any)
  ])
}
```

## 11. TypeScript типизация

### ✅ **Правильная типизация:**

```typescript
// Строгая типизация
const loading = ref<boolean>(false)
const data = ref<SomeType[]>([])
const selectedId = ref<number | ''>('')

// Типизация функций
function formatQuantity(quantity: string): string {
  const num = parseFloat(quantity)
  if (isNaN(num)) return '0'
  return num.toString()
}

// Типизация API ответов
interface ApiResponse {
  data: SomeType[]
  count: number
  next?: string
  previous?: string
}
```

## 12. Адаптивность и темы

### ✅ **Правильные классы для адаптивности:**

```vue
<template>
  <!-- Адаптивная сетка -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <!-- Карточки -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <!-- Контент с поддержкой темной темы -->
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Заголовок
      </h3>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Описание
      </p>
    </div>
  </div>
</template>
```

## 13. Форматирование кода

### ✅ **Правильное форматирование:**

```typescript
// Отступы: 2 пробела
// Максимальная длина строки: 100 символов
// Пустые строки между логическими блоками

// Импорты группируются и сортируются
import { ref, onMounted, computed } from 'vue'
import { useErrorHandler } from '@/composables/useErrorHandler'
import api from '@/api/client'
import type { SomeType } from '@/api/types'

// Объявления stores
const objectsStore = useObjectsStore
const materialsStore = useMaterialsStore

// State
const loading = ref(false)
const data = ref<SomeType[]>([])

// Computed
const filteredData = computed(() => {
  return data.value.filter(item => item.active)
})

// Methods
async function loadData() {
  // implementation
}

// Lifecycle
onMounted(async () => {
  await loadData()
})
```

## 14. Комментарии

### ✅ **Правильные комментарии:**

```typescript
// ✅ Хорошие комментарии
// Загружаем справочники для фильтров
await Promise.all([
  objectsStore.fetchList({ page_size: 1000 } as any),
  materialsStore.fetchList({ page_size: 1000 } as any)
])

// ✅ Объяснение сложной логики
// Форматируем количество с учетом знаков после запятой
function formatQuantity(quantity: string): string {
  const num = parseFloat(quantity)
  if (isNaN(num)) return '0'
  
  if (num % 1 === 0) {
    return num.toString()
  } else {
    return num.toFixed(3).replace(/\.?0+$/, '')
  }
}
```

### ❌ **Плохие комментарии:**

```typescript
// ❌ Очевидные комментарии
const loading = ref(false) // создаем переменную loading

// ❌ Комментарии на русском в коде
const data = ref([]) // данные
```

## 15. Проверка кода

### **Перед коммитом проверить:**

1. ✅ Все импорты корректны
2. ✅ Stores объявлены без вызова функции
3. ✅ Нет @apply директив в CSS
4. ✅ Классы Tailwind используются напрямую в HTML
5. ✅ TypeScript типы корректны
6. ✅ Обработка ошибок реализована
7. ✅ Код отформатирован
8. ✅ Комментарии на английском языке

## Заключение

Следование этим стандартам обеспечивает:

- **Консистентность** кода во всем проекте
- **Читаемость** и поддерживаемость
- **Производительность** и оптимизацию
- **Совместимость** с современными инструментами

**Статус:** ✅ **АКТУАЛЬНО И ОБЯЗАТЕЛЬНО К ИСПОЛЬЗОВАНИЮ**

---

**ELOM** - проект с высокими стандартами кодирования! 🎯
