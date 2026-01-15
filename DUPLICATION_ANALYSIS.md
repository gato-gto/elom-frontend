# Анализ дублирования кода в проекте ELOM

## 📊 Обзор найденных дублирований

### 1. Форматирование дат (5+ мест)

**Дублирование:**
- `src/composables/useResponsiveTable.ts:45` - `formatDate` функция
- `src/utils/export.ts:177,216,233` - прямое использование `toLocaleDateString`
- `src/utils/chartUtils.ts:97` - `formatDateTooltip` функция
- `src/pages/Reports/ByPeriod.vue:387-388` - прямое использование `toLocaleDateString`
- `src/test/utils/export.test.ts:429` - прямое использование `toLocaleDateString`

**Решение:**
- Использовать только `formatDate` из `src/utils/formatters.ts`
- Удалить дублирующие функции
- Заменить все прямые вызовы `toLocaleDateString` на `formatDate`

**Файлы для изменения:**
- `src/composables/useResponsiveTable.ts` - удалить `formatDate`
- `src/utils/export.ts` - использовать `formatDate` из formatters
- `src/utils/chartUtils.ts` - использовать `formatDate` из formatters
- `src/pages/Reports/ByPeriod.vue` - использовать `formatDate` из formatters

---

### 2. Форматирование чисел и валюты (5+ мест)

**Дублирование:**
- `src/composables/useResponsiveTable.ts:39` - `formatAmount` с `Intl.NumberFormat`
- `src/utils/export.ts:243,250` - прямое использование `Intl.NumberFormat`
- `src/utils/chartUtils.ts:81,91` - `formatCurrencyTooltip`, `formatNumberTooltip`
- `src/utils/calculations.ts:30,42` - прямое использование `Intl.NumberFormat`
- `src/pages/Reports/ByPeriod.vue:441` - прямое использование `Intl.NumberFormat`

**Решение:**
- Использовать `formatCurrency` и `formatNumber` из `src/utils/formatters.ts`
- Удалить дублирующие функции
- Заменить все прямые вызовы `Intl.NumberFormat` на функции из formatters

**Файлы для изменения:**
- `src/composables/useResponsiveTable.ts` - удалить `formatAmount`
- `src/utils/export.ts` - использовать formatters
- `src/utils/chartUtils.ts` - использовать formatters
- `src/utils/calculations.ts` - использовать formatters
- `src/pages/Reports/ByPeriod.vue` - использовать formatters

---

### 3. Логика статусов (3+ места)

**Дублирование:**
- `src/composables/useResponsiveTable.ts:49-83` - `getStatusBadgeClass`, `getStatusLabel`
- `src/components/cards/PurchaseCard.vue:102-118` - локальные `getStatusLabel`, `getStatusBadgeClass`
- `src/utils/formatters.ts:134-155` - `getStatusClass`, `getStatusText` (но для boolean статусов)

**Проблема:**
- Разная логика для разных типов статусов (string vs boolean)
- Дублирование маппинга статусов на классы и тексты

**Решение:**
```typescript
// Создать src/utils/statusHelpers.ts
export function getStatusLabel(status: string | boolean | null | undefined): string {
  // Объединить всю логику из всех мест
  if (typeof status === 'boolean') {
    return status ? 'Активен' : 'Неактивен'
  }
  
  const statusMap: Record<string, string> = {
    'new': 'Новая',
    'completed': 'Завершена',
    'cancelled': 'Отменена',
    'active': 'Активный',
    'inactive': 'Неактивный',
    // ... все статусы
  }
  
  return statusMap[status as string] || status || '—'
}

export function getStatusBadgeClass(status: string | boolean | null | undefined): string {
  // Объединить всю логику из всех мест
  if (typeof status === 'boolean') {
    return status ? 'badge-success' : 'badge-error'
  }
  
  const classMap: Record<string, string> = {
    'new': 'badge-info',
    'completed': 'badge-success',
    'cancelled': 'badge-error',
    // ... все статусы
  }
  
  return classMap[status as string] || 'badge-neutral'
}
```

**Файлы для изменения:**
- Создать `src/utils/statusHelpers.ts`
- `src/composables/useResponsiveTable.ts` - использовать statusHelpers
- `src/components/cards/PurchaseCard.vue` - использовать statusHelpers
- `src/utils/formatters.ts` - объединить с statusHelpers или удалить дублирование

---

### 4. Обработка ошибок (30+ мест)

**Дублирование:**
- Паттерн `error?.response?.data?.detail` повторяется в 30+ файлах
- Есть `useErrorHandler`, но не везде используется

**Примеры:**
- `src/stores/base.ts:170,194,213,239,272`
- `src/stores/purchases.ts:53,70,105,158,179`
- `src/stores/materials.ts:73,99`
- И многие другие...

**Решение:**
- Использовать `useErrorHandler` везде
- Создать helper функцию для извлечения сообщения об ошибке:
```typescript
// src/utils/errorHandler.ts
export function getErrorMessage(error: any, defaultMessage: string): string {
  return error?.response?.data?.detail || 
         error?.response?.data?.message || 
         error?.message || 
         defaultMessage
}
```

**Файлы для изменения:**
- Все stores - использовать `useErrorHandler` или `getErrorMessage`
- Все компоненты с обработкой ошибок

---

### 5. Поиск по id в stores (3 места)

**Дублирование:**
- `src/stores/base.ts:113` - `getById` computed
- `src/stores/tools.ts:42` - локальный `getById`
- `src/stores/toolIssues.ts:42` - локальный `getById`

**Решение:**
- Все stores должны использовать `createBaseStore`, который уже имеет `getById`
- Удалить дублирующие функции из `tools.ts` и `toolIssues.ts`

**Файлы для изменения:**
- `src/stores/tools.ts` - удалить локальный `getById`, использовать из base
- `src/stores/toolIssues.ts` - удалить локальный `getById`, использовать из base

---

### 6. Поиск и фильтрация по id (9+ мест)

**Дублирование:**
- `items.value.find(item => item.id === id)` - 9+ мест
- `items.value.filter(item => item.id === id)` - несколько мест

**Решение:**
- Использовать `store.getById(id)` везде вместо прямого поиска
- Создать helper функции если нужна фильтрация:
```typescript
// src/utils/arrayHelpers.ts
export function findById<T extends { id: number }>(items: T[], id: number): T | undefined {
  return items.find(item => item.id === id)
}

export function filterByIds<T extends { id: number }>(items: T[], ids: number[]): T[] {
  return items.filter(item => ids.includes(item.id))
}
```

**Файлы для проверки:**
- Все файлы с `.find(item => item.id === id)`
- Все файлы с `.filter(item => item.id === id)`

---

## 📈 Ожидаемые результаты

### Размер бандла
- **Текущий:** ~X KB
- **После оптимизации:** ~X-5-10% KB
- **Экономия:** 5-10% за счет удаления дублирующего кода

### Поддерживаемость
- ✅ Единая точка изменения для форматирования
- ✅ Единая точка изменения для статусов
- ✅ Упрощение тестирования
- ✅ Меньше багов из-за рассинхронизации логики

### Производительность
- ✅ Меньше кода = меньше парсинга
- ✅ Лучшее tree-shaking
- ✅ Меньше дублирования в runtime

---

## ✅ План действий

### Шаг 1: Создать единые утилиты
- [ ] Создать `src/utils/statusHelpers.ts`
- [ ] Обновить `src/utils/errorHandler.ts` с helper функцией
- [ ] Создать `src/utils/arrayHelpers.ts` (если нужно)

### Шаг 2: Заменить форматирование
- [ ] Заменить все использования `toLocaleDateString` на `formatDate`
- [ ] Заменить все использования `Intl.NumberFormat` на функции из formatters
- [ ] Удалить дублирующие функции из `useResponsiveTable.ts`
- [ ] Удалить дублирующие функции из `chartUtils.ts`
- [ ] Обновить `export.ts`

### Шаг 3: Унифицировать статусы
- [ ] Заменить все локальные функции статусов на `statusHelpers`
- [ ] Обновить `useResponsiveTable.ts`
- [ ] Обновить все card компоненты
- [ ] Объединить логику из `formatters.ts`

### Шаг 4: Унифицировать обработку ошибок
- [ ] Заменить все `error?.response?.data?.detail` на `getErrorMessage`
- [ ] Использовать `useErrorHandler` где возможно

### Шаг 5: Удалить дублирование в stores
- [ ] Удалить локальные `getById` из `tools.ts` и `toolIssues.ts`
- [ ] Использовать только версию из `base.ts`

### Шаг 6: Тестирование
- [ ] Запустить все тесты
- [ ] Проверить форматирование во всех местах
- [ ] Проверить статусы во всех местах
- [ ] Проверить обработку ошибок

---

## ⚠️ Риски

1. **Изменение поведения форматирования**
   - Риск: Разные форматы в разных местах
   - Митигация: Тщательное тестирование всех мест форматирования

2. **Изменение логики статусов**
   - Риск: Разные статусы могут иметь разную логику
   - Митигация: Объединить все варианты, сохранить обратную совместимость

3. **Регрессии**
   - Риск: Что-то может сломаться при замене
   - Митигация: Постепенная замена, тестирование после каждого шага

---

**Дата создания:** 2024
**Статус:** Требует выполнения
