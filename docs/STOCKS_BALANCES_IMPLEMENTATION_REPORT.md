# Отчет о реализации остатков по объектам

**Дата:** 3 октября 2025  
**Версия:** 1.0  
**Статус:** Завершено

## Обзор

Реализована функциональность отображения текущих остатков материалов по объектам с возможностью просмотра приходов и расходов. Создан новый раздел "Остатки" в дополнение к существующему разделу "Движения".

## Проблема

Пользователь запросил:
> "В остатках должны быть видны актуально сколько осталось материала по объектам, например мы выбираем объект видим реальный остаток на текущий момент, а так же должна быть возможность видеть приход и расход остатков."

## Решение

### ✅ **1. Backend API Endpoint**

#### Новый endpoint: `/api/v1/stock/snapshots/by-objects/`

**Функциональность:**
- Получение остатков всех материалов по объектам
- Фильтрация по объекту и дате
- Расчет приходов и расходов
- Поддержка ролевой модели доступа

**Параметры:**
- `object_id` (опционально) - ID объекта для фильтрации
- `date` (опционально) - Дата расчета в формате YYYY-MM-DD

**Ответ:**
```json
{
  "date": "2025-10-03",
  "objects": [
    {
      "object_id": 1,
      "object_name": "Жилой дом Комфорт – Блок А",
      "object_address": "ул. Примерная, 123",
      "materials": [
        {
          "material_id": 1,
          "material_name": "Кабель ВВГ 3×2.5",
          "unit_code": "м",
          "current_balance": "10.000",
          "total_purchased": "12.000",
          "total_written_off": "2.000"
        }
      ],
      "total_materials": 1
    }
  ],
  "total_objects": 1
}
```

#### Реализация в `stock/views.py`:
```python
@action(detail=False, methods=["get"], url_path="by-objects")
def get_balances_by_objects(self, request):
    """Получить остатки по объектам"""
    # Проверка прав доступа
    # Парсинг параметров
    # Агрегация данных из StockSnapshot
    # Возврат структурированного ответа
```

### ✅ **2. Frontend Types**

#### Новые типы в `src/api/types/stocks.ts`:
```typescript
export interface MaterialBalance {
  material_id: number;
  material_name: string;
  unit_code: string;
  current_balance: string;
  total_purchased: string;
  total_written_off: string;
}

export interface ObjectBalance {
  object_id: number;
  object_name: string;
  object_address: string;
  materials: MaterialBalance[];
  total_materials: number;
}

export interface BalancesByObjectsResponse {
  date: string;
  objects: ObjectBalance[];
  total_objects: number;
}
```

### ✅ **3. API Endpoints Configuration**

#### Обновлен `src/api/endpoints.ts`:
```typescript
stockSnapshots: {
  list: join('/stock/snapshots/'),
  one: (id: number) => join(`/stock/snapshots/${id}/`),
  balance: join('/stock/snapshots/balance/'),
  byObjects: join('/stock/snapshots/by-objects/'), // ✅ Новый endpoint
  history: join('/stock/snapshots/history/'),
},
```

### ✅ **4. Frontend Component**

#### Новый компонент `src/pages/Stocks/Balances.vue`:

**Функциональность:**
- Отображение остатков по объектам
- Фильтрация по объекту и дате
- Показ приходов, расходов и текущих остатков
- Адаптивный дизайн
- Поддержка темной темы

**Ключевые особенности:**
- **Правильный импорт API**: `import api from '@/api/client'` (не деструктурированный)
- **Без @apply**: Использование классов напрямую в HTML
- **Умное форматирование**: Автоматическое форматирование количеств
- **Обработка ошибок**: Интеграция с `useErrorHandler`

**Структура компонента:**
```vue
<template>
  <div class="balances-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <!-- Header -->
    <!-- Filters -->
    <!-- Loading State -->
    <!-- Empty State -->
    <!-- Balances List -->
    <!-- Summary -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { useObjectsStore } from '@/stores/objects'
import { useMaterialsStore } from '@/stores/materials'
import { formatDate } from '@/utils/formatters'
import api from '@/api/client' // ✅ Правильный импорт
import { endpoints } from '@/api/endpoints'
import type { BalancesByObjectsResponse, ObjectBalance, MaterialBalance } from '@/api/types'
</script>
```

### ✅ **5. Router Configuration**

#### Обновлен `src/router/index.ts`:

**Изменения:**
- Переименован существующий маршрут `/stocks` в "Движения"
- Добавлен новый маршрут `/stocks/balances` для "Остатки"
- Обновлены иконки и описания

```typescript
// Stocks routes
{
  path: '/stocks',
  name: 'StocksList',
  component: StocksList,
  meta: { 
    title: 'Движения', // ✅ Переименовано
    icon: 'warehouse',
    breadcrumb: 'Движения',
    description: 'Журнал движений материалов',
    category: 'inventory',
    order: 6,
    roles: ['admin', 'director', 'coordinator', 'site_manager', 'brigadier']
  }
},
{
  path: '/stocks/balances',
  name: 'StockBalances',
  component: StockBalances, // ✅ Новый компонент
  meta: { 
    title: 'Остатки',
    icon: 'inventory_2',
    breadcrumb: 'Остатки',
    description: 'Текущие остатки материалов по объектам',
    category: 'inventory',
    order: 7,
    roles: ['admin', 'director', 'coordinator', 'site_manager', 'brigadier', 'buyer']
  }
}
```

## Технические детали

### **API Integration**

**Правильный способ импорта:**
```typescript
// ✅ Правильно
import api from '@/api/client'

// ❌ Неправильно
import { api } from '@/api/client'
```

**Правильное объявление stores:**
```typescript
// ✅ Правильно
const objectsStore = useObjectsStore
const materialsStore = useMaterialsStore

// ❌ Неправильно
const objectsStore = useObjectsStore()
const materialsStore = useMaterialsStore()
```

**Использование:**
```typescript
const response = await api.get(`${endpoints.stockSnapshots.byObjects}?${params}`)
balances.value = response.data
```

### **CSS Classes (без @apply)**

**Правильный подход:**
```vue
<!-- ✅ Правильно -->
<div class="balances-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

<!-- ❌ Неправильно -->
<div class="balances-container">
```

```css
/* ❌ Не использовать */
.balances-container {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6;
}
```

### **Data Flow**

1. **Загрузка справочников**: Объекты и материалы
2. **API запрос**: Получение остатков по объектам
3. **Обработка данных**: Форматирование и группировка
4. **Отображение**: Структурированный список с фильтрами

### **Error Handling**

```typescript
const { handleLoadingError } = useErrorHandler()

try {
  const response = await api.get(`${endpoints.stockSnapshots.byObjects}?${params}`)
  balances.value = response.data
} catch (error) {
  await handleLoadingError(error, 'balances')
}
```

## Результат

### ✅ **Функциональность**

1. **Отображение остатков**: Текущие остатки материалов по объектам
2. **Приходы и расходы**: Детальная информация о движениях
3. **Фильтрация**: По объекту и дате
4. **Адаптивность**: Работает на всех устройствах
5. **Темная тема**: Поддержка светлой и темной темы

### ✅ **UI/UX**

- **Интуитивный интерфейс**: Понятная структура данных
- **Визуальное разделение**: Цветовое кодирование (зеленый - остатки, синий - приходы, красный - расходы)
- **Загрузочные состояния**: Индикаторы загрузки
- **Пустые состояния**: Информативные сообщения

### ✅ **Производительность**

- **Оптимизированные запросы**: Агрегация на уровне базы данных
- **Кэширование**: Использование существующих stores
- **Ленивая загрузка**: Компоненты загружаются по требованию

## Навигация

### **Меню**

Теперь в разделе "Инвентарь" доступны:
1. **Движения** (`/stocks`) - Журнал всех движений материалов
2. **Остатки** (`/stocks/balances`) - Текущие остатки по объектам

### **Права доступа**

- **Admin/Director**: Полный доступ ко всем объектам
- **Coordinator**: Доступ ко всем объектам для координации
- **Brigadier/Site Manager**: Доступ к назначенным объектам
- **Buyer**: Доступ к назначенным объектам (только просмотр остатков)

## Заключение

Функциональность остатков по объектам успешно реализована и интегрирована в существующую архитектуру системы. Пользователи теперь могут:

1. **Просматривать текущие остатки** материалов по объектам
2. **Анализировать приходы и расходы** для каждого материала
3. **Фильтровать данные** по объекту и дате
4. **Получать актуальную информацию** на любую дату

**Статус:** ✅ **ЗАВЕРШЕНО И ГОТОВО К ИСПОЛЬЗОВАНИЮ**

---

**ELOM** - система с полной функциональностью управления остатками! 🎯
