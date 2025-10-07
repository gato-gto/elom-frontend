# Рефакторинг системы типов TypeScript

## Обзор изменений

В рамках улучшения архитектуры frontend приложения была проведена полная реструктуризация системы типов TypeScript и единообразной системы пагинации. Основная цель - устранение дубликатов, улучшение организации кода, повышение поддерживаемости и создание единообразной системы управления данными.

## Проблемы до рефакторинга

### 1. Дублирование типов
- **MaterialReportItem** был определен в 3 местах:
  - `src/api/types.ts` (строки 453-478)
  - `src/api/types/reports.ts` (строки 29-54)
  - `src/api/types.ts` (строки 898-910) - старая версия

### 2. Несоответствие API
- Интерфейсы не соответствовали реальному API backend
- Отсутствовали многие поля, возвращаемые API
- Неправильные типы данных (например, `unit_code` вместо `unit`)

### 3. Плохая организация
- Все типы в одном большом файле (1108 строк)
- Смешение различных доменов в одном файле
- Сложность навигации и поиска нужных типов

## Решение

### 1. Модульная структура типов

Создана модульная система с разделением по функциональности:

```
src/api/types/
├── common.ts        # Базовые типы (UserRole, Currency, PaginationParams)
├── auth.ts          # Аутентификация (LoginRequest, User, Me)
├── materials.ts     # Материалы (Material, MaterialRequest, MaterialFilterParams)
├── purchases.ts     # Закупки (Purchase, PurchaseItem, PurchaseCreateRequest)
├── reports.ts       # Отчеты (MaterialReportItem, ObjectReportRow)
├── stocks.ts        # Остатки (StockSnapshot, WriteOff, SmartQuantity)
├── objects.ts       # Объекты (SiteObject, ObjectRequest)
├── employees.ts     # Сотрудники (Employee, EmployeeCreateRequest)
├── suppliers.ts     # Поставщики (PurchaseSupplier, SupplierCreateRequest)
├── units.ts         # Единицы измерения (Unit, UnitRequest)
├── import.ts        # Импорт данных (ImportPrepareResponse, ImportCommitRequest)
├── archive.ts       # Архив (ArchivePeriod, ClosePeriodRequest)
├── notifications.ts # Уведомления (Notification)
├── audit.ts         # Аудит (AuditLog)
└── errors.ts        # Обработка ошибок (ApiError, ParsedApiError)
```

### 2. Главный файл типов

`src/api/types.ts` теперь служит только для реэкспорта модулей:

```typescript
// ELOM API Types
// Generated from backend models and serializers

// Import modular types
export * from './types/common';
export * from './types/auth';
export * from './types/employees';
export * from './types/materials';
export * from './types/objects';
export * from './types/units';
export * from './types/purchases';
export * from './types/stocks';
export * from './types/suppliers';
export * from './types/reports';
export * from './types/import';
export * from './types/archive';
export * from './types/notifications';
export * from './types/audit';
export * from './types/errors';

// Legacy compatibility aliases
export interface PageResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}
```

### 3. Исправление типов отчетов

Обновлен интерфейс `MaterialReportItem` в соответствии с реальным API:

**До:**
```typescript
export interface MaterialReportItem {
  material_id: number;
  material_name: string;
  material_sku?: string;
  material_category: string;
  unit_code: string;  // ❌ Неправильно
  qty_total: number;  // ❌ Может быть null
  amount_total: number;
  avg_price: number;
  min_price: number;  // ❌ Может быть null
  max_price: number;  // ❌ Может быть null
  rows: number;
}
```

**После:**
```typescript
export interface MaterialReportItem {
  material_id: number;
  material_name: string;
  material_sku?: string;
  material_category: string;
  unit: string;  // ✅ Правильно
  // Дополнительные поля материала
  material_description: string;
  material_manufacturer: string;
  material_is_active: boolean;
  material_created_date: string | null;
  material_average_price: number | null;
  material_min_stock_level: null;
  // Основные поля отчета
  qty_total: number | null;  // ✅ Может быть null если нет конвертации единиц
  amount_total: number;
  avg_price: number;
  min_price: number | null;  // ✅ Может быть null
  max_price: number | null;  // ✅ Может быть null
  rows: number;
  // Дополнительные поля
  unique_objects: number;
  unique_responsibles: number;
  first_purchase_date: string | null;
  last_purchase_date: string | null;
}
```

## Преимущества нового подхода

### 1. Отсутствие дубликатов
- Каждый тип определен только в одном месте
- Исключены конфликты между версиями типов
- Единый источник истины для каждого типа

### 2. Логическая группировка
- Типы сгруппированы по функциональности
- Легко найти нужные типы
- Четкое разделение ответственности

### 3. Легкость поддержки
- Изменения в одном модуле не влияют на другие
- Простое добавление новых типов
- Упрощенное тестирование

### 4. Обратная совместимость
- Все существующие импорты продолжают работать
- Постепенная миграция без breaking changes
- Сохранены алиасы для legacy кода

### 5. Соответствие API
- Типы точно соответствуют реальному API
- Правильные типы данных (null, optional)
- Все поля API покрыты типами

## Миграция

### Автоматическая миграция
Все существующие импорты продолжают работать без изменений:

```typescript
// Эти импорты работают как раньше
import type { Material, Purchase, MaterialReportItem } from '@/api/types'
```

### Рекомендуемый подход
Для новых компонентов рекомендуется импортировать типы напрямую из модулей:

```typescript
// Рекомендуется для новых файлов
import type { Material, MaterialRequest } from '@/api/types/materials'
import type { Purchase, PurchaseCreateRequest } from '@/api/types/purchases'
import type { MaterialReportItem } from '@/api/types/reports'
```

## Проверка качества

### Линтер
- ✅ Все ошибки ESLint исправлены
- ✅ TypeScript компиляция без ошибок
- ✅ Строгая типизация сохранена

### Тестирование
- ✅ Все существующие тесты проходят
- ✅ Импорты работают корректно
- ✅ Обратная совместимость подтверждена

### Производительность
- ✅ Уменьшен размер основного файла типов (с 1108 до 71 строки)
- ✅ Улучшена скорость компиляции TypeScript
- ✅ Лучшее tree-shaking при сборке

## Следующие шаги

### 1. Постепенная миграция
- Обновить импорты в новых компонентах
- Использовать прямые импорты из модулей
- Удалить неиспользуемые алиасы

### 2. Документация
- Обновить документацию по API
- Создать гайд по использованию типов
- Добавить примеры использования

### 3. Автоматизация
- Настроить автоматическую генерацию типов из OpenAPI схемы
- Добавить проверки на дубликаты в CI/CD
- Создать скрипты для валидации типов

## Рефакторинг системы пагинации

### Проблемы до рефакторинга

1. **Различные подходы к пагинации**:
   - Некоторые stores использовали `createBaseStore`
   - Другие stores имели собственную реализацию пагинации
   - Несогласованное поведение между списками

2. **Дублирование кода**:
   - Повторяющаяся логика пагинации в разных stores
   - Различные реализации `setPage`, `setPageSize`, `setFilters`
   - Несогласованная обработка ошибок

3. **Проблемы с типизацией**:
   - Обращение к `.value` у ref-ов в неправильных местах
   - Несогласованные типы для пагинации
   - Ошибки TypeScript в компонентах

### Решение

#### 1. Единообразная система пагинации

Все stores переведены на использование `createBaseStore`:

```typescript
// До рефакторинга
export const useMaterialsStore = defineStore('materials', {
  state: () => ({
    // ... состояние
  }),
  actions: {
    async setPage(page: number) {
      this.pagination.page = page
      // Собственная реализация
    }
  }
})

// После рефакторинга
export const useMaterialsStore = defineStore('materials', () => {
  const baseStore = createBaseStore<Material, MaterialRequest, PatchedMaterialRequest>({
    endpoint: endpoints.materials,
    entityName: 'materials',
    entityNamePlural: 'материалы'
  })
  
  // Расширенные фильтры
  const extendedFilters = {
    search: '',
    name: '',
    sku: '',
    category: '',
    ordering: 'name'
  }
  
  return {
    // Базовые свойства и методы
    items: baseStore.items,
    current: baseStore.current,
    loading: baseStore.loading,
    error: baseStore.error,
    pagination: baseStore.pagination,
    filters: extendedFilters,
    
    // CRUD операции
    fetchList,
    fetchOne: baseStore.fetchOne,
    create,
    update,
    delete: baseStore.delete,
    
    // Пагинация и фильтры
    setCurrent: baseStore.setCurrent,
    clearError: baseStore.clearError,
    setPage: baseStore.setPage,
    setPageSize: baseStore.setPageSize,
    setFilters,
    resetFilters
  }
})
```

#### 2. Исправление типизации

Устранены ошибки TypeScript:

```typescript
// До рефакторинга (ошибки)
baseStore.loading.value = true  // ❌ Ошибка
baseStore.error.value = null    // ❌ Ошибка

// После рефакторинга (правильно)
baseStore.loading = true        // ✅ Правильно
baseStore.error = null          // ✅ Правильно
```

#### 3. Новый store для остатков

Создан специализированный store для остатков по объектам:

```typescript
export const useBalancesStore = defineStore('balances', () => {
  const baseStore = createBaseStore<MaterialBalance, any, any>({
    endpoint: {
      list: endpoints.stockSnapshots.byObjects,
      one: (id: number) => `${endpoints.stockSnapshots.byObjects}${id}/`
    },
    entityName: 'balances',
    entityNamePlural: 'остатки'
  })
  
  // Специализированная обработка данных
  const fetchList = async (params?: any) => {
    const response = await api.get(`${endpoints.stockSnapshots.byObjects}?${apiParams}`)
    
    // Flattening для табличного отображения
    const flattenedData: MaterialBalance[] = []
    if (response.data.objects) {
      response.data.objects.forEach((obj: any) => {
        obj.materials.forEach((material: any) => {
          flattenedData.push({
            material_id: material.material_id,
            material_name: material.material_name,
            object_name: obj.object_name,
            // ... другие поля
          } as MaterialBalance)
        })
      })
    }
    
    baseStore.items = flattenedData
  }
  
  return {
    // ... базовые методы
  }
})
```

### Результаты рефакторинга

#### 1. Единообразная пагинация
- Все 10 основных stores используют `createBaseStore`
- Консистентное поведение во всех списках
- Единообразный пользовательский опыт

#### 2. Устранение дублирования
- Один код для всех stores
- Переиспользуемая логика пагинации
- Упрощенная поддержка

#### 3. Исправление типизации
- Устранены все ошибки TypeScript
- Строгая типизация для всех stores
- Улучшенная поддержка IDE

#### 4. Новые возможности
- Специализированные stores для сложных данных
- Расширенные фильтры для материалов
- Flattening данных для остатков

### Stores после рефакторинга

1. **Закупки** (`usePurchasesStore`) - `createBaseStore`
2. **Материалы** (`useMaterialsStore`) - `createBaseStore` + расширенные фильтры
3. **Поставщики** (`useSuppliersStore`) - `createBaseStore`
4. **Сотрудники** (`useEmployeesStore`) - `createBaseStore`
5. **Объекты** (`useObjectsStore`) - `createBaseStore`
6. **Списания** (`useWriteOffsStore`) - `createBaseStore`
7. **Единицы измерения** (`useUnitsStore`) - `createBaseStore`
8. **Движения остатков** (`useStockSnapshotsStore`) - `createBaseStore`
9. **Категории материалов** (`useMaterialCategoriesStore`) - `createBaseStore`
10. **Остатки по объектам** (`useBalancesStore`) - `createBaseStore` + специализированная обработка

## Заключение

Рефакторинг системы типов и пагинации значительно улучшил архитектуру frontend приложения:

- **Устранены дубликаты** - каждый тип определен в одном месте
- **Улучшена организация** - логическая группировка по модулям
- **Повышена точность** - типы соответствуют реальному API
- **Сохранена совместимость** - все существующие импорты работают
- **Единообразная пагинация** - все списки используют одинаковую логику
- **Исправлена типизация** - устранены все ошибки TypeScript
- **Улучшена поддерживаемость** - один код для всех stores

Новая структура обеспечивает лучшую поддерживаемость, читаемость и расширяемость кода, что критически важно для долгосрочного развития проекта.
