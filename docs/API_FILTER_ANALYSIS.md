# Анализ полей фильтрации API

## 📊 Поддерживаемые поля фильтрации по спискам

### 1. Materials (Материалы)
**Store**: `src/stores/materials.ts`
**Поддерживаемые поля**:
- `search` - универсальный поиск (УБРАТЬ)
- `name` - поиск по названию ✅
- `sku` - поиск по SKU ✅
- `category` - фильтр по категории ✅
- `default_unit` - фильтр по единице измерения ✅
- `ordering` - сортировка ✅

**Текущие фильтры**: ❌ Только `search` (универсальный) и `category`
**Нужно добавить**: `name`, `sku`, `default_unit`

### 2. Objects (Объекты)
**Store**: `src/stores/objects.ts`
**Поддерживаемые поля**:
- `search` - универсальный поиск (УБРАТЬ)
- `name` - поиск по названию ✅
- `is_active` - фильтр по активности ✅
- `ordering` - сортировка ✅

**Текущие фильтры**: ❌ Только `search` (универсальный) и `is_active`
**Нужно добавить**: `name`

### 3. Employees (Сотрудники)
**Store**: `src/stores/employees.ts`
**Поддерживаемые поля**:
- `search` - универсальный поиск (УБРАТЬ)
- `role` - фильтр по роли ✅
- `is_active` - фильтр по активности ✅
- `object` - фильтр по объекту ✅
- `ordering` - сортировка ✅

**Текущие фильтры**: ❌ Только `search` (универсальный)
**Нужно добавить**: `role`, `is_active`, `object`

### 4. Units (Единицы измерения)
**Store**: `src/stores/units.ts`
**Поддерживаемые поля**:
- `search` - универсальный поиск (УБРАТЬ)
- `code` - поиск по коду ✅
- `name` - поиск по названию ✅
- `ordering` - сортировка ✅

**Текущие фильтры**: ❌ Только `search` (универсальный)
**Нужно добавить**: `code`, `name`

### 5. Purchases (Закупки)
**Store**: `src/stores/purchases.ts`
**API Type**: `PurchaseListFilters`
**Поддерживаемые поля**:
- `date_after` - дата с ✅
- `date_before` - дата по ✅
- `object` - фильтр по объекту ✅
- `material` - фильтр по материалу ✅
- `responsible` - фильтр по ответственному ✅
- `search` - универсальный поиск (УБРАТЬ)
- `is_archived` - фильтр по архивности ✅
- `ordering` - сортировка ✅

**Текущие фильтры**: ✅ Уже правильно настроены (кроме `search`)

### 6. Stocks (Остатки)
**API Type**: `StockListFilters`
**Поддерживаемые поля**:
- `date_after` - дата с ✅
- `date_before` - дата по ✅
- `object` - фильтр по объекту ✅
- `material` - фильтр по материалу ✅
- `responsible` - фильтр по ответственному ✅
- `is_archived` - фильтр по архивности ✅

**Текущие фильтры**: ✅ Уже правильно настроены

### 7. Archive (Архив)
**Поддерживаемые поля**:
- `month` - фильтр по месяцу ✅
- `object` - фильтр по объекту ✅

**Текущие фильтры**: ✅ Уже правильно настроены

## 🔧 План исправлений

### Убрать универсальный поиск
- ❌ Materials: убрать `search`, добавить `name`, `sku`
- ❌ Objects: убрать `search`, добавить `name`
- ❌ Employees: убрать `search`, добавить конкретные поля
- ❌ Units: убрать `search`, добавить `code`, `name`
- ❌ Purchases: убрать `search` поле
- ✅ Stocks: уже без универсального поиска
- ✅ Archive: уже без универсального поиска

### Добавить недостающие фильтры
1. **Materials**: `name`, `sku`, `default_unit`
2. **Objects**: `name`
3. **Employees**: `role`, `is_active`, `object`
4. **Units**: `code`, `name`

### ID первая колонка
- ✅ Materials: ID первая колонка
- ✅ Objects: ID первая колонка
- ✅ Employees: ID первая колонка
- ✅ Units: ID первая колонка
- ❌ Purchases: НЕТ ID колонки - нужно добавить
- ❌ Stocks: НЕТ ID колонки - нужно добавить
- ❌ Archive: НЕТ ID колонки - нужно добавить

## 🎯 Итоговые изменения

### 1. Materials/List.vue
```vue
<!-- УБРАТЬ -->
<FilterField v-model="materialsStore.filters.search" type="text" label="Поиск" />

<!-- ДОБАВИТЬ -->
<FilterField v-model="materialsStore.filters.name" type="text" label="Название" />
<FilterField v-model="materialsStore.filters.sku" type="text" label="SKU" />
<FilterField v-model="materialsStore.filters.default_unit" type="select" label="Единица" />
```

### 2. Objects/List.vue
```vue
<!-- УБРАТЬ -->
<FilterField v-model="objectsStore.filters.search" type="text" label="Поиск" />

<!-- ДОБАВИТЬ -->
<FilterField v-model="objectsStore.filters.name" type="text" label="Название" />
```

### 3. Employees/List.vue
```vue
<!-- УБРАТЬ универсальный поиск -->
<!-- ДОБАВИТЬ -->
<FilterField v-model="employeesStore.filters.role" type="select" label="Роль" />
<FilterField v-model="employeesStore.filters.is_active" type="select" label="Статус" />
<FilterField v-model="employeesStore.filters.object" type="select" label="Объект" />
```

### 4. Units/List.vue
```vue
<!-- УБРАТЬ универсальный поиск -->
<!-- ДОБАВИТЬ -->
<FilterField v-model="unitsStore.filters.code" type="text" label="Код" />
<FilterField v-model="unitsStore.filters.name" type="text" label="Название" />
```

### 5. Добавить ID колонку
- Purchases: добавить ID как первую колонку
- Stocks: добавить ID как первую колонку  
- Archive: добавить ID как первую колонку

## ✅ Ожидаемый результат
- Убран универсальный поиск везде
- Добавлены конкретные поля фильтрации
- ID первая колонка во всех списках
- Сортировка по клику на заголовки работает
- Автоматические фильтры при вводе
