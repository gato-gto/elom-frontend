# ELOM Frontend - Быстрая справка

## 🚀 Быстрый старт

### Установка и запуск
```bash
# Установка зависимостей
npm install

# Запуск dev сервера
npm run dev

# Сборка для продакшена
npm run build

# Предварительный просмотр
npm run preview
```

### Основные команды
```bash
npm run dev          # Разработка
npm run build        # Сборка
npm run preview      # Просмотр сборки
npm run test         # Тесты
npm run lint         # Линтинг
npm run lint:fix     # Автоисправление
```

## 📁 Структура проекта

### Ключевые директории
```
src/
├── api/           # API клиент и типы
├── components/    # Переиспользуемые компоненты
├── pages/         # Страницы приложения
├── stores/        # Pinia stores
├── composables/   # Композиционные функции
├── utils/         # Утилиты
└── styles/        # Стили
```

### Основные файлы
- `src/api/types.ts` - Все TypeScript типы
- `src/api/client.ts` - HTTP клиент
- `src/router/index.ts` - Маршруты
- `src/main.ts` - Точка входа

## 🔧 API интеграция

### Базовый URL
```typescript
const API_URL = 'http://localhost:8000/api/v1'
```

### Основные endpoints
```typescript
// Материалы
GET    /materials/
POST   /materials/
PUT    /materials/{id}/
DELETE /materials/{id}/

// Объекты
GET    /objects/
POST   /objects/
PUT    /objects/{id}/
DELETE /objects/{id}/

// Закупки
GET    /purchases/
POST   /purchases/
PUT    /purchases/{id}/
DELETE /purchases/{id}/

// Остатки
GET    /stock/snapshots/
POST   /stock/snapshots/
PUT    /stock/snapshots/{id}/
DELETE /stock/snapshots/{id}/

// Списания
GET    /writeoffs/
POST   /writeoffs/
PUT    /writeoffs/{id}/
DELETE /writeoffs/{id}/
```

### Типы данных
```typescript
// Основные типы
interface Material {
  id: number
  name: string
  sku?: string
  category?: number
  default_unit: number
  description?: string
  manufacturer?: string
  average_price?: string
  is_active: boolean
}

interface Object {
  id: number
  name: string
  address: string
  is_active: boolean
  lat?: string
  lng?: string
  responsible?: number
}

interface Purchase {
  id: number
  date: string
  object: number
  supplier: string
  invoice_number?: string
  vat_included: boolean
  currency: Currency
  responsible: number
  total_amount: string
  items: PurchaseItem[]
}
```

## 🎨 Компоненты

### Основные компоненты
```vue
<!-- Форма -->
<FormField
  v-model="value"
  label="Название"
  type="text"
  :error="errors.field"
  required
/>

<!-- Фильтры -->
<FilterPanel :columns="3">
  <FilterField
    v-model="filters.search"
    type="text"
    label="Поиск"
  />
</FilterPanel>

<!-- Заголовок списка -->
<ListHeader
  title="Материалы"
  subtitle="Управление материалами"
  :show-create="true"
  @create="handleCreate"
/>

<!-- Пагинация -->
<ModernPagination
  :current-page="page"
  :total-pages="totalPages"
  :total-items="count"
  :page-size="pageSize"
  @page-change="handlePageChange"
  @page-size-change="handlePageSizeChange"
/>
```

### Загрузка и скелетоны
```vue
<!-- Спиннер загрузки -->
<LoadingSpinner
  v-if="loading"
  size="lg"
  variant="primary"
  text="Загрузка данных..."
/>

<!-- Скелетон таблицы -->
<TableSkeleton
  v-if="loading && rows.length === 0"
  :rows="pageSize"
  :columns="5"
/>
```

## 🏪 Stores (Pinia)

### Основные stores
```typescript
// Материалы
const materialsStore = useMaterialsStore()
await materialsStore.fetchList()
await materialsStore.create(data)
await materialsStore.update(id, data)
await materialsStore.delete(id)

// Объекты
const objectsStore = useObjectsStore()
await objectsStore.fetchList()

// Закупки
const purchasesStore = usePurchasesStore()
await purchasesStore.fetchList()

// Остатки
const stockSnapshotsStore = useStockSnapshotsStore()
await stockSnapshotsStore.fetchList()
```

### Фильтрация и пагинация
```typescript
// Установка фильтров
materialsStore.setFilters({
  search: 'цемент',
  category: 1,
  is_active: true
})

// Пагинация
materialsStore.setPage(2)
materialsStore.setPageSize(50)
```

## 🎯 Композиционные функции

### usePagination
```typescript
const { 
  currentPage, 
  totalPages, 
  goToPage, 
  goToNextPage,
  goToPreviousPage 
} = usePagination(pagination)
```

### useLoading
```typescript
const { 
  isLoading, 
  startLoading, 
  stopLoading,
  withLoading 
} = useLoading()

// Использование
await withLoading(async () => {
  await fetchData()
}, 'Загрузка данных...')
```

### useAnimations
```typescript
const { 
  loadingState, 
  setLoading, 
  getStaggerDelay,
  getAnimationClass 
} = useAnimations()
```

## 🎨 Стилизация

### Tailwind CSS классы
```css
/* Основные классы */
.container { @apply max-w-7xl mx-auto px-4 }
.btn { @apply px-4 py-2 rounded-lg font-medium }
.card { @apply bg-white rounded-lg shadow-sm border }

/* Темная тема */
:root.dark .card { @apply bg-gray-800 border-gray-700 }
```

### Анимации
```css
/* Анимации строк таблицы */
.table-row {
  animation: slideInUp 0.3s ease-out;
  animation-fill-mode: both;
}

/* Задержки для каскадной анимации */
.table-row:nth-child(1) { animation-delay: 0.05s; }
.table-row:nth-child(2) { animation-delay: 0.1s; }
```

## 🔐 Авторизация

### Токены
```typescript
// Получение токена
const token = localStorage.getItem('access_token')

// Заголовки запроса
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

### Роли пользователей
```typescript
type UserRole = 
  | "admin"        // Полный доступ
  | "director"     // Все объекты
  | "coordinator"  // Назначенные объекты
  | "brigadier"    // Назначенные объекты
  | "buyer"        // Назначенные объекты
  | "site_manager" // Назначенные объекты
```

## 📊 Отчеты

### Основные отчеты
- **По материалам** - `/reports/by-materials`
- **По объектам** - `/reports/by-objects`
- **По периодам** - `/reports/by-periods`
- **По ответственным** - `/reports/by-responsibles`

### Экспорт
```typescript
// Excel экспорт
const exportUrl = `/api/v1/reports/by-materials/?export=xlsx`

// PDF экспорт
const exportUrl = `/api/v1/reports/by-materials/?export=pdf`
```

## 🐛 Отладка

### Консольные команды
```javascript
// Проверка stores
console.log(useMaterialsStore())

// Проверка роутера
console.log(useRouter())

// Проверка токенов
console.log(localStorage.getItem('access_token'))
```

### Vue DevTools
- **Components** - Иерархия компонентов
- **Pinia** - Состояние stores
- **Router** - История навигации
- **Timeline** - Производительность

## 📱 Адаптивность

### Breakpoints
```css
/* Мобильные устройства */
@media (max-width: 640px) { }

/* Планшеты */
@media (max-width: 1024px) { }

/* Десктоп */
@media (min-width: 1025px) { }
```

### Мобильная навигация
```vue
<!-- Мобильное меню -->
<div class="lg:hidden">
  <button @click="toggleMobileMenu">
    <svg class="w-6 h-6">...</svg>
  </button>
</div>
```

## ⚡ Производительность

### Оптимизация
- **Lazy loading** - Ленивая загрузка компонентов
- **Debounce** - Задержка для поиска
- **Memoization** - Кэширование вычислений
- **Virtual scrolling** - Виртуализация списков

### Мониторинг
```typescript
// Измерение производительности
console.time('fetchData')
await fetchData()
console.timeEnd('fetchData')
```

## 🔧 Полезные утилиты

### Форматирование
```typescript
import { formatDate, formatCurrency, formatNumber } from '@/utils/formatters'

formatDate('2024-01-15')        // "15.01.2024"
formatCurrency(1000000)         // "1 000 000 UZS"
formatNumber(1234.567)          // "1 234.57"
```

### Debounce
```typescript
import { debounce } from '@/utils/debounce'

const debouncedSearch = debounce((query: string) => {
  // Поиск
}, 300)
```

## 📚 Дополнительные ресурсы

### Документация
- [Vue 3 Guide](https://vuejs.org/guide/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

### Полезные ссылки
- [Vue DevTools](https://devtools.vuejs.org/)
- [Vite Guide](https://vitejs.dev/guide/)
- [DaisyUI Components](https://daisyui.com/components/)
- [Vue Router Guide](https://router.vuejs.org/guide/)

---

**Готово к использованию!** 🚀
