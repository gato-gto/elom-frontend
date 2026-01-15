# План оптимизации фронтенда ELOM

## 📋 Обзор

Этот документ содержит детальный план оптимизации фронтенда проекта ELOM. Все оптимизации спроектированы так, чтобы не создавать новые баги и сохранить существующую функциональность.

---

## 🎯 Приоритеты оптимизации

### Критичные (высокий приоритет)
1. Оптимизация производительности computed свойств и watch
2. Кеширование API запросов
3. Оптимизация роутинга и навигации

### Важные (средний приоритет)
4. Оптимизация бандла и code splitting
5. Улучшение работы с памятью
6. Оптимизация Tailwind CSS

### Желательные (низкий приоритет)
7. Рефакторинг дублирующегося кода
8. Улучшение типизации

---

## 🔧 Детальный план оптимизаций

### 0. Устранение дублирования кода (КРИТИЧНО) ⚠️ НОВОЕ

**Проблема:**
Обнаружено значительное дублирование кода в разных частях проекта:

1. **Форматирование дат** - дублируется в 5+ местах:
   - `useResponsiveTable.ts` - локальная `formatDate`
   - `export.ts` - прямое использование `toLocaleDateString`
   - `chartUtils.ts` - `formatDateTooltip`
   - `ByPeriod.vue` - прямое использование `toLocaleDateString`
   - Есть `formatDate` в `formatters.ts`, но не везде используется

2. **Форматирование чисел/валюты** - дублируется в 5+ местах:
   - `useResponsiveTable.ts` - `formatAmount` с `Intl.NumberFormat`
   - `export.ts` - прямое использование `Intl.NumberFormat`
   - `chartUtils.ts` - `formatCurrencyTooltip`, `formatNumberTooltip`
   - `calculations.ts` - прямое использование `Intl.NumberFormat`
   - Есть `formatCurrency` и `formatNumber` в `formatters.ts`, но не везде используется

3. **Логика статусов** - дублируется в 3+ местах:
   - `useResponsiveTable.ts` - `getStatusLabel`, `getStatusBadgeClass`
   - `PurchaseCard.vue` - локальные функции `getStatusLabel`, `getStatusBadgeClass`
   - `formatters.ts` - `getStatusText`, `getStatusClass` (но для boolean статусов)

4. **Обработка ошибок** - похожие паттерны в 30+ местах:
   - `error?.response?.data?.detail` повторяется везде
   - Есть `useErrorHandler`, но не везде используется

5. **Поиск по id** - дублируется в stores:
   - `base.ts` уже имеет `getById`, но в `tools.ts` и `toolIssues.ts` есть свои версии

**Решение:**

```typescript
// 1. Унифицировать форматирование - использовать только formatters.ts
// Удалить дублирующие функции из:
// - useResponsiveTable.ts (formatDate, formatAmount)
// - chartUtils.ts (formatDateTooltip, formatCurrencyTooltip, formatNumberTooltip)
// - export.ts (прямые вызовы toLocaleDateString)

// 2. Создать единую систему статусов
// src/utils/statusHelpers.ts
export function getStatusLabel(status: string | boolean | null | undefined): string {
  // Объединить логику из всех мест
}

export function getStatusBadgeClass(status: string | boolean | null | undefined): string {
  // Объединить логику из всех мест
}

// 3. Унифицировать обработку ошибок
// Использовать useErrorHandler везде вместо прямых try-catch с error?.response?.data?.detail

// 4. Удалить дублирующие getById из stores
// Использовать только base.ts версию
```

**Файлы для изменения:**
- `src/composables/useResponsiveTable.ts` - удалить formatDate, formatAmount
- `src/utils/chartUtils.ts` - использовать formatters.ts
- `src/utils/export.ts` - использовать formatters.ts
- `src/components/cards/PurchaseCard.vue` - использовать единые функции статусов
- Все файлы с прямым использованием `toLocaleDateString` и `Intl.NumberFormat`
- Создать `src/utils/statusHelpers.ts` для единой логики статусов

**Риски:** Средние - нужно тщательно протестировать, что все форматирование работает одинаково

**Ожидаемый эффект:**
- Уменьшение размера бандла на 5-10%
- Упрощение поддержки кода
- Единообразие форматирования по всему приложению

---

### 1. Оптимизация `useRouter.ts` (КРИТИЧНО)

**Проблема:**
- Множественные вызовы `router.getRoutes().find()` в computed свойствах
- Каждый computed пересчитывается при каждом изменении route, вызывая поиск по всем роутам

**Решение:**
```typescript
// Кешировать routes один раз
const routes = computed(() => router.getRoutes())
const routeMap = computed(() => {
  const map = new Map()
  routes.value.forEach(r => map.set(r.name, r))
  return map
})

// Использовать Map для O(1) поиска вместо O(n)
const routeRecord = computed(() => routeMap.value.get(route.name))
```

**Файлы для изменения:**
- `src/composables/useRouter.ts`

**Риски:** Минимальные - только оптимизация поиска

---

### 2. Оптимизация `useGenericForm.ts` (КРИТИЧНО)

**Проблема:**
- Deep watch на объекте `form` использует `JSON.stringify` для сравнения
- Это очень дорого для больших форм
- Watch срабатывает на каждое изменение любого поля

**Решение:**
```typescript
// Заменить deep watch на shallow watch с ручной проверкой изменений
// Использовать библиотеку для глубокого сравнения (например, fast-deep-equal)
// Или использовать watchEffect с более умной логикой

// Вариант 1: Использовать shallowRef для вложенных объектов
// Вариант 2: Использовать библиотеку fast-deep-equal
import { isEqual } from 'fast-deep-equal'

watch(
  form,
  (newForm, oldForm) => {
    if (!isEqual(newForm, oldForm)) {
      isDirty.value = true
    }
  },
  { deep: true }
)
```

**Файлы для изменения:**
- `src/composables/useGenericForm.ts`

**Риски:** Низкие - нужно протестировать работу isDirty флага

---

### 3. Кеширование API запросов (КРИТИЧНО)

**Проблема:**
- Нет кеширования повторяющихся запросов
- Одинаковые данные загружаются несколько раз
- Нет инвалидации кеша при изменениях

**Решение:**
```typescript
// Добавить простой кеш в base.ts
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 минут

const fetchList = async (params?: Record<string, any>): Promise<T[]> => {
  const cacheKey = JSON.stringify({ endpoint: config.endpoint.list, params })
  const cached = cache.get(cacheKey)
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    items.value = cached.data.results || cached.data
    return items.value
  }
  
  // ... существующий код загрузки ...
  
  // Сохранить в кеш
  cache.set(cacheKey, { data, timestamp: Date.now() })
  
  return items.value
}

// Инвалидация кеша при create/update/delete
const create = async (data: C): Promise<T> => {
  // ... существующий код ...
  cache.clear() // Очистить кеш при создании
  return newItem
}
```

**Файлы для изменения:**
- `src/stores/base.ts`

**Риски:** Средние - нужно убедиться, что кеш инвалидируется правильно

---

### 4. Оптимизация `useResponsiveTable.ts` (ВАЖНО)

**Проблема:**
- Слушатель `resize` срабатывает на каждое изменение размера окна
- Может вызывать множественные пересчеты

**Решение:**
```typescript
import { debounce } from '@/utils/debounce'

const checkMobile = debounce(() => {
  isMobile.value = window.innerWidth < 768
}, 150) // Debounce 150ms
```

**Файлы для изменения:**
- `src/composables/useResponsiveTable.ts`

**Риски:** Минимальные

---

### 5. Оптимизация Tailwind CSS safelist (ВАЖНО)

**Проблема:**
- Огромный safelist в `tailwind.config.js` увеличивает размер CSS бандла
- Многие классы могут не использоваться

**Решение:**
1. Удалить неиспользуемые классы из safelist
2. Использовать динамические классы через template literals только там, где необходимо
3. Проверить, какие классы реально используются динамически

**Файлы для изменения:**
- `tailwind.config.js`

**Риски:** Низкие - нужно проверить, что все классы отображаются правильно

---

### 6. Мемоизация computed свойств (ВАЖНО)

**Проблема:**
- Некоторые computed свойства могут пересчитываться чаще, чем нужно
- Особенно в компонентах со списками

**Решение:**
```typescript
// Использовать computed с явными зависимостями
const filteredItems = computed(() => {
  // Явно указать зависимости
  const items = props.items
  const filter = props.filter
  
  return items.filter(item => {
    // логика фильтрации
  })
})
```

**Файлы для проверки:**
- `src/components/GenericList.vue`
- `src/components/GenericForm.vue`
- Все компоненты со списками

**Риски:** Низкие

---

### 7. Оптимизация code splitting (ВАЖНО)

**Проблема:**
- Все страницы загружаются через lazy loading, но можно улучшить
- Можно группировать связанные страницы

**Решение:**
```typescript
// В router/index.ts уже есть webpackChunkName, но можно оптимизировать:
// Группировать связанные страницы в один чанк
const MaterialsList = () => import(/* webpackChunkName: "materials" */ '@/pages/Materials/List.vue')
const MaterialForm = () => import(/* webpackChunkName: "materials" */ '@/pages/Materials/MaterialForm.vue')
// Оба в одном чанке "materials" - хорошо

// Можно добавить preload для критичных страниц
```

**Файлы для изменения:**
- `src/router/index.ts`

**Риски:** Минимальные

---

### 8. Оптимизация работы с памятью (ВАЖНО)

**Проблема:**
- Возможные утечки памяти в watch и event listeners
- Нет очистки подписок в некоторых composables

**Решение:**
```typescript
// Убедиться, что все watch и event listeners очищаются в onUnmounted
// Проверить все composables на наличие cleanup логики

// Пример для useResponsiveTable (уже есть, но проверить все)
onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
```

**Файлы для проверки:**
- Все composables в `src/composables/`
- Все компоненты с watch и event listeners

**Риски:** Средние - нужно тщательно протестировать

---

### 9. Оптимизация работы с localStorage (ЖЕЛАТЕЛЬНО)

**Проблема:**
- Множественные обращения к localStorage
- JSON.stringify/parse на каждом обращении

**Решение:**
```typescript
// Создать утилиту для кеширования localStorage
const localStorageCache = new Map<string, any>()

export function getCachedLocalStorage(key: string) {
  if (localStorageCache.has(key)) {
    return localStorageCache.get(key)
  }
  
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null')
    localStorageCache.set(key, value)
    return value
  } catch {
    return null
  }
}

export function setCachedLocalStorage(key: string, value: any) {
  localStorageCache.set(key, value)
  localStorage.setItem(key, JSON.stringify(value))
}
```

**Файлы для изменения:**
- Создать `src/utils/localStorageCache.ts`
- Обновить использование localStorage в stores

**Риски:** Низкие

---

### 10. Оптимизация рендеринга списков (ЖЕЛАТЕЛЬНО)

**Проблема:**
- Большие списки рендерятся полностью
- Нет виртуализации для очень больших списков

**Решение:**
```typescript
// Для списков > 100 элементов использовать виртуализацию
// Можно использовать библиотеку vue-virtual-scroller или написать простую версию

// Пока что просто оптимизировать v-for с правильными :key
// Убедиться, что все v-for имеют уникальные стабильные ключи
```

**Файлы для проверки:**
- `src/components/GenericList.vue`
- Все компоненты со списками

**Риски:** Низкие - виртуализация только для очень больших списков

---

### 11. Оптимизация импортов (ЖЕЛАТЕЛЬНО)

**Проблема:**
- Возможны неоптимальные импорты (импорт всего модуля вместо нужных функций)

**Решение:**
```typescript
// Проверить все импорты на возможность tree-shaking
// Использовать named imports вместо default imports где возможно

// Плохо:
import * as utils from '@/utils'

// Хорошо:
import { formatDate, formatAmount } from '@/utils/formatters'
```

**Файлы для проверки:**
- Все файлы с импортами

**Риски:** Минимальные

---

### 12. Оптимизация работы с формами (ЖЕЛАТЕЛЬНО)

**Проблема:**
- Валидация может выполняться слишком часто
- Можно оптимизировать проверку полей

**Решение:**
```typescript
// Debounce валидацию полей при onChange
// Валидировать только измененные поля, а не всю форму

const validateFieldDebounced = debounce((key: string) => {
  validateField(key)
}, 300)
```

**Файлы для изменения:**
- `src/composables/useGenericForm.ts`

**Риски:** Низкие

---

## 📝 Порядок выполнения

### Фаза 1: Критичные оптимизации (2-3 дня)
0. ✅ Устранение дублирования кода (НОВОЕ - приоритет!)
1. ✅ Оптимизация `useRouter.ts`
2. ✅ Оптимизация `useGenericForm.ts` (watch)
3. ✅ Кеширование API запросов
4. ✅ Оптимизация `useResponsiveTable.ts`

### Фаза 2: Важные оптимизации (2-3 дня)
5. ✅ Оптимизация Tailwind CSS safelist
6. ✅ Мемоизация computed свойств
7. ✅ Оптимизация code splitting
8. ✅ Оптимизация работы с памятью

### Фаза 3: Желательные оптимизации (1-2 дня)
9. ✅ Оптимизация работы с localStorage
10. ✅ Оптимизация рендеринга списков
11. ✅ Оптимизация импортов
12. ✅ Оптимизация работы с формами

---

## 🧪 Тестирование

После каждой оптимизации необходимо:

1. **Функциональное тестирование:**
   - Проверить, что все функции работают как раньше
   - Убедиться, что нет регрессий

2. **Производительность:**
   - Измерить время загрузки страниц
   - Проверить размер бандла
   - Проверить использование памяти

3. **E2E тесты:**
   - Запустить существующие E2E тесты
   - Убедиться, что все проходят

4. **Ручное тестирование:**
   - Проверить основные сценарии использования
   - Особое внимание на формы и списки

---

## 📊 Метрики для отслеживания

- **Размер бандла:** должен уменьшиться на 10-20%
- **Время первой загрузки:** должно уменьшиться на 15-25%
- **Время переключения между страницами:** должно уменьшиться на 20-30%
- **Использование памяти:** должно остаться на том же уровне или уменьшиться
- **Количество API запросов:** должно уменьшиться за счет кеширования

---

## ⚠️ Важные замечания

1. **Не создавать новые баги:**
   - Каждая оптимизация должна быть тщательно протестирована
   - Использовать feature flags если нужно
   - Делать изменения постепенно

2. **Сохранить обратную совместимость:**
   - Не менять публичные API без необходимости
   - Сохранить существующее поведение

3. **Документировать изменения:**
   - Комментировать сложные оптимизации
   - Обновлять документацию при необходимости

---

## 🔄 Откат изменений

Если оптимизация вызывает проблемы:
1. Немедленно откатить изменения через git
2. Задокументировать проблему
3. Найти альтернативное решение

---

## 📅 Временные рамки

- **Фаза 1:** 2-3 дня (добавлено устранение дублирования)
- **Фаза 2:** 2-3 дня  
- **Фаза 3:** 1-2 дня
- **Тестирование:** 1 день
- **Итого:** 6-9 дней

---

## ✅ Чеклист перед началом

- [ ] Создать резервную копию текущего кода (git branch)
- [ ] Убедиться, что все тесты проходят
- [ ] Измерить текущие метрики производительности
- [ ] Подготовить тестовые данные для проверки
- [ ] Настроить инструменты для профилирования

---

## 📚 Дополнительные ресурсы

- Vue 3 Performance Best Practices
- Pinia Best Practices
- Vite Optimization Guide
- Tailwind CSS Optimization

---

**Дата создания:** 2024
**Версия:** 1.0
**Статус:** Готов к выполнению
